// 数据层 v3：客户页面只读与网站同域托管的数据快照（js/demo-data.js），完全不请求海外服务器。
// 背景：Supabase 在巴黎，国内没开 VPN 的手机连不上，门店页会整页加载失败（2026-11-06 实测）。
// 快照由发布流程从数据库导出，与网站一起部署；管理员功能仍走 Supabase REST/Auth/Storage。
// 演示模式（config 没填 Supabase）= localStorage 示例数据，逻辑不变。
(function(){
  const cfg = window.MANHEJU_CONFIG || {};
  const isLive = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const BASE = (cfg.apiBase || cfg.supabaseUrl || "").replace(/\/$/,"");
  const ANON = cfg.supabaseAnonKey || "";

  // ---------- 基础请求（带超时与重试） ----------
  function fetchTimeout(url, opts, ms){
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(), ms || 12000);
    return fetch(url, Object.assign({}, opts, { signal: ctl.signal })).finally(()=>clearTimeout(t));
  }
  async function req(url, opts, retries){
    let lastErr;
    for(let i=0; i<=(retries==null?1:retries); i++){
      try{
        const r = await fetchTimeout(url, opts);
        if(!r.ok){
          let msg = "请求失败（" + r.status + "）";
          try{ const j = await r.json(); msg = j.msg || j.message || j.error_description || j.error || msg; }catch(e){}
          const err = new Error(msg); err.status = r.status; throw err;
        }
        if(r.status === 204) return null;
        const txt = await r.text();
        return txt ? JSON.parse(txt) : null;
      }catch(e){
        lastErr = e;
        if(e.status && e.status < 500) throw e; // 4xx 不重试
        if(i < (retries==null?1:retries)) await new Promise(res=>setTimeout(res, 700));
      }
    }
    throw lastErr;
  }
  const pubHeaders = () => ({ "apikey": ANON, "Authorization": "Bearer " + ANON });

  // ---------- 管理员会话（localStorage 保存令牌） ----------
  const SES_KEY = "manheju_admin_session_v2";
  function getSession(){ try{ return JSON.parse(localStorage.getItem(SES_KEY)); }catch(e){ return null; } }
  function setSession(s){ if(s) localStorage.setItem(SES_KEY, JSON.stringify(s)); else localStorage.removeItem(SES_KEY); }
  async function refreshSession(){
    const s = getSession(); if(!s || !s.refresh_token) return null;
    try{
      const j = await req(BASE + "/auth/v1/token?grant_type=refresh_token", {
        method:"POST", headers:{ "apikey": ANON, "Content-Type":"application/json" },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      }, 0);
      const ns = { access_token:j.access_token, refresh_token:j.refresh_token, user:j.user, expires_at: Date.now() + (j.expires_in||3600)*1000 };
      setSession(ns); return ns;
    }catch(e){ setSession(null); return null; }
  }
  async function adminToken(){
    let s = getSession();
    if(s && s.expires_at && s.expires_at - Date.now() > 60000) return s.access_token;
    if(s && s.refresh_token){ const ns = await refreshSession(); if(ns) return ns.access_token; }
    return s ? s.access_token : null;
  }
  async function adminHeaders(){
    const t = await adminToken();
    return { "apikey": ANON, "Authorization": "Bearer " + (t || ANON), "Content-Type":"application/json" };
  }
  async function rest(table, query, opts){
    opts = opts || {};
    const url = BASE + "/rest/v1/" + table + (query ? "?" + query : "");
    try{
      return await req(url, { method: opts.method||"GET", headers: opts.admin ? await adminHeaders() : pubHeaders(), body: opts.body }, opts.retries);
    }catch(e){
      if(opts.admin && e.status === 401){ // 令牌过期：刷新一次再试
        const ns = await refreshSession();
        if(ns) return await req(url, { method: opts.method||"GET", headers: await adminHeaders(), body: opts.body }, 0);
      }
      throw e;
    }
  }
  const qs = obj => Object.entries(obj).map(([k,v])=> k + "=" + encodeURIComponent(v)).join("&");

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

  // 客户页面数据源：与网站同域托管的快照（window.MANHEJU_DEMO_DB，直读全局对象，
  // 不经过 localStorage，避免老访客被旧种子数据挡住更新）。
  function snapshotDB(){
    const d = window.MANHEJU_DEMO_DB || {};
    return { stores: d.stores||[], roomTypes: d.roomTypes||[], roomMedia: d.roomMedia||[], availableRooms: d.availableRooms||[], priceSheets: d.priceSheets||[] };
  }

  const api = {
    isLive, STATUS_LABEL,

    // ===== 客户前端（公开读取，只读同域快照，零海外请求）=====
    async listPublicStores(){
      return snapshotDB().stores.filter(s=>s.is_active).sort(bySort);
    },
    async getPublicStoreBySlug(slug){
      return snapshotDB().stores.find(s=>s.slug===slug && s.is_active) || null;
    },
    async listPublicRoomTypes(storeId){
      return snapshotDB().roomTypes.filter(t=>t.store_id===storeId && t.is_active).sort(bySort);
    },
    async listMediaForTypes(typeIds){
      if(!typeIds.length) return {};
      const out={}; snapshotDB().roomMedia.filter(m=>typeIds.includes(m.room_type_id)).sort(bySort).forEach(m=>{(out[m.room_type_id]=out[m.room_type_id]||[]).push(m)}); return out;
    },
    async listPublicRooms(storeId){
      return snapshotDB().availableRooms.filter(r=>r.store_id===storeId && r.is_public && r.status==="available").sort(bySort);
    },

    // ===== 管理员 =====
    async adminSignIn(email, password){
      if(!isLive){ if(!email.includes("@")||password.length<6) throw new Error("演示模式：请输入邮箱，密码至少6位（任意即可）"); sessionStorage.setItem("manheju_demo_admin", email); return {email}; }
      const j = await req(BASE + "/auth/v1/token?grant_type=password", {
        method:"POST", headers:{ "apikey": ANON, "Content-Type":"application/json" },
        body: JSON.stringify({ email, password })
      }, 0);
      setSession({ access_token:j.access_token, refresh_token:j.refresh_token, user:j.user, expires_at: Date.now() + (j.expires_in||3600)*1000 });
      const rows = await rest("admin_users", qs({ select:"user_id", user_id:"eq."+j.user.id }), { admin:true });
      if(!rows || !rows.length){ setSession(null); throw new Error("该账号不在管理员白名单中，请联系负责人把你的用户ID加入 admin_users 表。"); }
      return j.user;
    },
    async adminSession(){
      if(!isLive){ const e = sessionStorage.getItem("manheju_demo_admin"); return e?{email:e}:null; }
      const s = getSession(); if(!s) return null;
      if(s.expires_at && s.expires_at - Date.now() > 60000) return s.user;
      const ns = await refreshSession(); return ns ? ns.user : null;
    },
    async adminSignOut(){
      if(!isLive){ sessionStorage.removeItem("manheju_demo_admin"); return; }
      const s = getSession();
      if(s) { try{ await req(BASE + "/auth/v1/logout", { method:"POST", headers:{ "apikey": ANON, "Authorization":"Bearer " + s.access_token } }, 0); }catch(e){} }
      setSession(null);
    },
    async sendPasswordReset(email){
      if(!isLive){ alert("演示模式：正式版会通过 Supabase 给 "+email+" 发一封设置/重置密码邮件。配置 Supabase 后此功能真实生效。"); return; }
      const redirectTo = (cfg.siteBaseUrl || (location.origin + location.pathname.replace(/[^/]*$/,""))) + "/admin.html";
      await req(BASE + "/auth/v1/recover?redirect_to=" + encodeURIComponent(redirectTo), {
        method:"POST", headers:{ "apikey": ANON, "Content-Type":"application/json" },
        body: JSON.stringify({ email })
      }, 0);
    },
    async setPasswordFromRecovery(newPassword){
      if(!isLive) throw new Error("演示模式不支持邮件回调");
      const h = new URLSearchParams((location.hash || "").replace(/^#/, ""));
      const token = h.get("access_token");
      if(!token) throw new Error("链接里缺少验证令牌，请重新点邮件里的链接进来。");
      await req(BASE + "/auth/v1/user", {
        method:"PUT", headers:{ "apikey": ANON, "Authorization":"Bearer " + token, "Content-Type":"application/json" },
        body: JSON.stringify({ password: newPassword })
      }, 0);
    },
    // CRUD 通用
    async adminList(table){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ return [...(demoDB()[map[table]]||[])].sort(bySort); }
      return await rest(table, "select=*&order=sort_order.asc", { admin:true }) || [];
    },
    async adminUpsert(table, row){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ const db=demoDB(); const arr=db[map[table]]; if(!row.id) row.id=uid(); const i=arr.findIndex(x=>x.id===row.id); if(i>=0) arr[i]={...arr[i],...row}; else arr.push(row); saveDemo(db); return row; }
      const headers = await adminHeaders(); headers["Prefer"] = "return=representation";
      if(row.id){
        const data = await req(BASE + "/rest/v1/" + table + "?id=eq." + encodeURIComponent(row.id), { method:"PATCH", headers, body: JSON.stringify(row) }, 0);
        return Array.isArray(data) ? data[0] : data;
      }
      const payload = { ...row }; delete payload.id;
      const data = await req(BASE + "/rest/v1/" + table, { method:"POST", headers, body: JSON.stringify(payload) }, 0);
      return Array.isArray(data) ? data[0] : data;
    },
    async adminDelete(table, id){
      const map = { stores:"stores", room_types:"roomTypes", room_media:"roomMedia", available_rooms:"availableRooms", price_sheets:"priceSheets" };
      if(!isLive){ const db=demoDB();
        if(table==="stores"){ db.roomTypes.filter(t=>t.store_id===id).forEach(t=>{ db.roomMedia=db.roomMedia.filter(m=>m.room_type_id!==t.id); }); db.roomTypes=db.roomTypes.filter(t=>t.store_id!==id); db.availableRooms=db.availableRooms.filter(r=>r.store_id!==id); }
        if(table==="room_types"){ db.roomMedia=db.roomMedia.filter(m=>m.room_type_id!==id); }
        db[map[table]] = db[map[table]].filter(x=>x.id!==id); saveDemo(db); return; }
      await rest(table, "id=eq." + encodeURIComponent(id), { admin:true, method:"DELETE" });
    },
    async uploadFile(bucket, file, folder){
      if(!isLive){
        return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; if(file.size>3*1024*1024 && file.type.startsWith("video")){ res(URL.createObjectURL(file)); } else r.readAsDataURL(file); });
      }
      const t = await adminToken();
      const path = (folder||"uploads") + "/" + Date.now() + "-" + Math.random().toString(36).slice(2,8) + "-" + file.name.replace(/[^\w.\-]/g,"_");
      const r = await fetchTimeout(BASE + "/storage/v1/object/" + bucket + "/" + path, {
        method:"POST",
        headers:{ "apikey": ANON, "Authorization":"Bearer " + (t || ANON), "Content-Type": file.type || "application/octet-stream" },
        body: file
      }, 60000);
      if(!r.ok){ let msg = "上传失败（" + r.status + "）"; try{ const j = await r.json(); msg = j.message || j.error || msg; }catch(e){} throw new Error(msg); }
      if(bucket === "price-sheets"){
        const j = await req(BASE + "/storage/v1/object/sign/" + bucket + "/" + path, {
          method:"POST", headers: await adminHeaders(), body: JSON.stringify({ expiresIn: 3600 })
        }, 0);
        return BASE + "/storage/v1" + j.signedURL + "|" + path;
      }
      return BASE + "/storage/v1/object/public/" + bucket + "/" + path;
    },
    shareLink(slug){
      const base = cfg.siteBaseUrl || (location.origin + location.pathname.replace(/(index|admin|store)\.html.*$/,"").replace(/\/$/,""));
      return base + "/store.html?store=" + encodeURIComponent(slug);
    }
  };
  window.ManjuData = api;
})();
