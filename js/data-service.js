// 数据层：所有页面只通过这里读写数据。以后迁移 CloudBase 只改这个文件。
// 模式：config 里没填 Supabase 时 = 演示模式(localStorage)；填了 = 正式模式(Supabase)
(function(){
  const cfg = window.MANHEJU_CONFIG || {};
  const isLive = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  let clientPromise = null;
  function getClient(){
    if(!isLive) return Promise.resolve(null);
    if(!clientPromise){
      clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
        .then(m => m.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
    }
    return clientPromise;
  }
  // ---- demo db ----
  const LS_KEY = "manheju_demo_db_v1";
  function demoDB(){
    try{ const raw = localStorage.getItem(LS_KEY); if(raw) return JSON.parse(raw); }catch(e){}
    const seed = JSON.parse(JSON.stringify(window.MANHEJU_DEMO_DB));
    localStorage.setItem(LS_KEY, JSON.stringify(seed)); return seed;
  }
  function saveDemo(db){ localStorage.setItem(LS_KEY, JSON.stringify(db)); }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const bySort = (a,b)=>(a.sort_order||0)-(b.sort_order||0);

  const STATUS_LABEL = { available:"可租", reserved:"已预订", rented:"已出租", maintenance:"维修中" };

  const api = {
    isLive, STATUS_LABEL,
    async supabase(){ return getClient(); },

    // ===== 客户前端（公开读取）=====
    async listPublicStores(){
      if(!isLive){ return demoDB().stores.filter(s=>s.is_active).sort(bySort); }
      const sb = await getClient();
      const { data, error } = await sb.from("stores").select("*").eq("is_active", true).order("sort_order");
      if(error) throw error; return data||[];
    },
    async getPublicStoreBySlug(slug){
      if(!isLive){ return demoDB().stores.find(s=>s.slug===slug && s.is_active) || null; }
      const sb = await getClient();
      const { data, error } = await sb.from("stores").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if(error) throw error; return data;
    },
    async listPublicRoomTypes(storeId){
      if(!isLive){ return demoDB().roomTypes.filter(t=>t.store_id===storeId && t.is_active).sort(bySort); }
      const sb = await getClient();
      const { data, error } = await sb.from("room_types").select("*").eq("store_id", storeId).eq("is_active", true).order("sort_order");
      if(error) throw error; return data||[];
    },
    async listMediaForTypes(typeIds){
      if(!typeIds.length) return {};
      if(!isLive){ const out={}; demoDB().roomMedia.filter(m=>typeIds.includes(m.room_type_id)).sort(bySort).forEach(m=>{(out[m.room_type_id]=out[m.room_type_id]||[]).push(m)}); return out; }
      const sb = await getClient();
      const { data, error } = await sb.from("room_media").select("*").in("room_type_id", typeIds).order("sort_order");
      if(error) throw error; const out={}; (data||[]).forEach(m=>{(out[m.room_type_id]=out[m.room_type_id]||[]).push(m)}); return out;
    },
    async listPublicRooms(storeId){
      if(!isLive){ return demoDB().availableRooms.filter(r=>r.store_id===storeId && r.is_public && r.status==="available").sort(bySort); }
      const sb = await getClient();
      const { data, error } = await sb.from("available_rooms").select("*, room_types(name)").eq("store_id", storeId).eq("is_public", true).eq("status","available").order("sort_order");
      if(error) throw error;
      return (data||[]).map(r=>({...r, type_label: r.type_label || (r.room_types && r.room_types.name) || ""}));
    },

    // ===== 管理员 =====
    async adminSignIn(email, password){
      if(!isLive){ if(!email.includes("@")||password.length<6) throw new Error("演示模式：请输入邮箱，密码至少6位（任意即可）"); sessionStorage.setItem("manheju_demo_admin", email); return {email}; }
      const sb = await getClient();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if(error) throw error;
      const { data: rows } = await sb.from("admin_users").select("user_id").eq("user_id", data.user.id);
      if(!rows || !rows.length){ await sb.auth.signOut(); throw new Error("该账号不在管理员白名单中，请联系负责人把你的用户ID加入 admin_users 表。"); }
      return data.user;
    },
    async adminSession(){
      if(!isLive){ const e = sessionStorage.getItem("manheju_demo_admin"); return e?{email:e}:null; }
      const sb = await getClient(); const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null;
    },
    async adminSignOut(){ if(!isLive){ sessionStorage.removeItem("manheju_demo_admin"); return; } const sb=await getClient(); await sb.auth.signOut(); },
    async sendPasswordReset(email){
      if(!isLive){ alert("演示模式：正式版会通过 Supabase 给 "+email+" 发一封设置/重置密码邮件。配置 Supabase 后此功能真实生效。"); return; }
      const sb = await getClient();
      const redirectTo = (cfg.siteBaseUrl||location.origin+location.pathname.replace(/[^/]*$/,"")) + "admin.html";
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if(error) throw error;
    },
    async setPasswordFromRecovery(newPassword){
      const sb = await getClient(); if(!sb) throw new Error("演示模式不支持邮件回调");
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if(error) throw error;
    },
    // CRUD 通用
    async adminList(table){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ return [...(demoDB()[map[table]]||[])].sort(bySort); }
      const sb = await getClient(); const { data, error } = await sb.from(table).select("*").order("sort_order", { ascending:true });
      if(error) throw error; return data||[];
    },
    async adminUpsert(table, row){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ const db=demoDB(); const arr=db[map[table]]; if(!row.id) row.id=uid(); const i=arr.findIndex(x=>x.id===row.id); if(i>=0) arr[i]={...arr[i],...row}; else arr.push(row); saveDemo(db); return row; }
      const sb = await getClient(); const payload={...row}; if(!payload.id) delete payload.id;
      const { data, error } = await sb.from(table).upsert(payload).select().single(); if(error) throw error; return data;
    },
    async adminDelete(table, id){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ const db=demoDB();
        if(table==="stores"){ db.roomTypes.filter(t=>t.store_id===id).forEach(t=>{ db.roomMedia=db.roomMedia.filter(m=>m.room_type_id!==t.id); }); db.roomTypes=db.roomTypes.filter(t=>t.store_id!==id); db.availableRooms=db.availableRooms.filter(r=>r.store_id!==id); }
        if(table==="room_types"){ db.roomMedia=db.roomMedia.filter(m=>m.room_type_id!==id); }
        db[map[table]] = db[map[table]].filter(x=>x.id!==id); saveDemo(db); return; }
      const sb = await getClient(); const { error } = await sb.from(table).delete().eq("id", id); if(error) throw error;
    },
    async uploadFile(bucket, file, folder){
      if(!isLive){
        return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; if(file.size>3*1024*1024 && file.type.startsWith("video")){ res(URL.createObjectURL(file)); } else r.readAsDataURL(file); });
      }
      const sb = await getClient(); const path = (folder||"uploads")+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+file.name.replace(/[^\w.\-]/g,"_");
      const { error } = await sb.storage.from(bucket).upload(path, file, { upsert:false }); if(error) throw error;
      if(bucket==="price-sheets"){ const { data } = await sb.storage.from(bucket).createSignedUrl(path, 3600); return data.signedUrl + "|" + path; }
      const { data } = sb.storage.from(bucket).getPublicUrl(path); return data.publicUrl;
    },
    shareLink(slug){
      const base = cfg.siteBaseUrl || (location.origin + location.pathname.replace(/(index|admin|store)\.html.*$/,"").replace(/\/$/,""));
      return base + "/store.html?store=" + encodeURIComponent(slug);
    }
  };
  window.ManjuData = api;
})();
