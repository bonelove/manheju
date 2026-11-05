// 管理员后台逻辑
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#modeHint').textContent = ManjuData.isLive ? '正式模式：数据保存在 Supabase 云端，换电脑登录也能继续管理。' : '演示模式：还没有配置 Supabase，修改只保存在本机浏览器。按操作手册配置后自动变正式模式。';
let cache={stores:[],roomTypes:[],roomMedia:[],availableRooms:[],priceSheets:[]};
let curStoreForTypes='', curStoreForRooms='';

// 邮件回调：#access_token=...&type=recovery / invite
(async()=>{ if(location.hash.includes('type=recovery')||location.hash.includes('type=invite')||location.hash.includes('type=signup')){ $('#recoveryBox').style.display='block'; $('#loginBox').style.display='none'; } })();
$('#setPwBtn').onclick=async()=>{ try{ await ManjuData.setPasswordFromRecovery($('#newPw').value); $('#recoveryMsg').innerHTML='<span class="ok">密码已设置，请用新密码登录。</span>'; $('#recoveryBox').style.display='none'; $('#loginBox').style.display='block'; history.replaceState(null,'',location.pathname); }catch(e){ $('#recoveryMsg').innerHTML='<span class="err">'+esc(e.message)+'</span>'; } };

$('#loginBtn').onclick=async()=>{ $('#loginMsg').textContent='登录中…'; try{ const u=await ManjuData.adminSignIn($('#email').value.trim(), $('#password').value); showPanel(u); }catch(e){ $('#loginMsg').innerHTML='<span class="err">'+esc(e.message)+'</span>'; } };
$('#forgotBtn').onclick=async()=>{ const em=$('#email').value.trim(); if(!em.includes('@')){ $('#loginMsg').innerHTML='<span class="err">先在上面填管理员邮箱，再点这个按钮。</span>'; return; } try{ await ManjuData.sendPasswordReset(em); $('#loginMsg').innerHTML='<span class="ok">已发送，请去邮箱点链接回来设置密码（演示模式除外）。</span>'; }catch(e){ $('#loginMsg').innerHTML='<span class="err">'+esc(e.message)+'</span>'; } };
$('#logoutBtn').onclick=async()=>{ await ManjuData.adminSignOut(); location.reload(); };

async function showPanel(user){ $('#loginBox').style.display='none'; $('#panel').style.display='block'; $('#who').textContent=user.email||''; await reloadAll(); }
async function reloadAll(){ cache.stores=await ManjuData.adminList('stores'); cache.roomTypes=await ManjuData.adminList('room_types'); try{cache.roomMedia=await ManjuData.adminList('room_media')}catch(e){} try{cache.availableRooms=await ManjuData.adminList('available_rooms')}catch(e){} renderStores(); renderTypes(); renderRooms(); renderSheets(); }
ManjuData.adminSession().then(u=>{ if(u) showPanel(u); });

$$('.tabs button').forEach(b=>b.onclick=()=>{ $$('.tabs button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); ['stores','types','rooms','sheets'].forEach(t=>$('#tab-'+t).style.display = t===b.dataset.tab?'block':'none'); });

// ---------- 门店 ----------
function renderStores(){
  const el=$('#tab-stores');
  el.innerHTML=`<div class="card"><h2>新增 / 编辑门店</h2><form id="storeForm"><input type="hidden" name="id">
  <div class="grid"><div><label>门店名称*</label><input name="name" required></div><div><label>英文短链接 slug*（如 qiaokou-changan，只能英文小写和-）</label><input name="slug" required pattern="[a-z0-9\-]+"></div>
  <div><label>起租价（元/月）*</label><input name="starting_price" type="number" required></div><div><label>排序</label><input name="sort_order" type="number" value="0"></div>
  <div><label>地址</label><input name="address"></div><div><label>最近地铁/交通</label><input name="transit_name"></div>
  <div><label>距离说明</label><input name="transit_distance"></div><div><label>附近地标</label><input name="landmark"></div></div>
  <label>门店简介</label><textarea name="summary"></textarea>
  <label>首页优势标签（用逗号分隔，最多显示4个，如：精装,拎包入住,地铁100米,通勤方便）</label><input name="highlights" placeholder="精装,拎包入住,交通便利">
  <label>代表图网址（也可先留空，在房型里传图）</label><input name="cover_url">
  <label><input type="checkbox" name="is_active" checked style="width:auto"> 对客户显示（启用）</label>
  <div class="row" style="margin-top:10px"><button>保存门店</button><button type="button" class="ghost" onclick="document.getElementById('storeForm').reset()">清空</button></div></form></div>
  <div class="card"><h2>门店列表（${cache.stores.length}）</h2>${cache.stores.map(s=>`<div class="row" style="border-bottom:1px solid var(--line,#eee);padding:10px 0"><span class="grow"><b>${esc(s.name)}</b> · ${esc(s.starting_price)}元起 · ${s.is_active?'<span class="ok">已启用</span>':'<span class="err">已停用</span>'}<br><span class="hint">${esc(ManjuData.shareLink(s.slug))}</span></span>
  <button class="small ghost" onclick="copyLink('${esc(s.slug)}')">复制链接</button><button class="small ghost" onclick="editStore('${s.id}')">编辑</button><button class="small danger" onclick="delStore('${s.id}','${esc(s.name)}')">删除</button></div>`).join('')||'<p class="hint">还没有门店</p>'}</div>`;
  $('#storeForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target); const row={id:f.get('id')||undefined,name:f.get('name'),slug:f.get('slug'),starting_price:+f.get('starting_price'),address:f.get('address'),transit_name:f.get('transit_name'),transit_distance:f.get('transit_distance'),landmark:f.get('landmark'),summary:f.get('summary'),highlights:String(f.get('highlights')||'').split(/[,，]/).map(x=>x.trim()).filter(Boolean),cover_url:f.get('cover_url'),sort_order:+f.get('sort_order')||0,is_active:f.get('is_active')==='on'}; try{ await ManjuData.adminUpsert('stores',row); e.target.reset(); await reloadAll(); alert('门店已保存'); }catch(err){ alert('保存失败：'+err.message); } };
}
window.copyLink=async slug=>{ const link=ManjuData.shareLink(slug); try{ await navigator.clipboard.writeText(link); alert('已复制：\n'+link); }catch(e){ prompt('复制这条链接：',link); } };
window.editStore=id=>{ const s=cache.stores.find(x=>x.id===id); const f=$('#storeForm'); Object.keys(s).forEach(k=>{ const inp=f.elements[k]; if(!inp) return; if(inp.type==='checkbox') inp.checked=!!s[k]; else inp.value=Array.isArray(s[k])?s[k].join(','):(s[k]??''); }); window.scrollTo({top:0,behavior:'smooth'}); };
window.delStore=async(id,name)=>{ if(!confirm(`确定删除门店「${name}」吗？它的房型、图片视频和空房记录会一起删除，不能恢复。`)) return; if(!confirm('再确认一次：真的删除？')) return; await ManjuData.adminDelete('stores',id); await reloadAll(); };

// ---------- 房型 ----------
function renderTypes(){
  if(!curStoreForTypes && cache.stores.length) curStoreForTypes=cache.stores[0].id;
  const types=cache.roomTypes.filter(t=>t.store_id===curStoreForTypes);
  $('#tab-types').innerHTML=`<div class="card"><label>先选择门店</label><select id="typeStoreSel">${cache.stores.map(s=>`<option value="${s.id}" ${s.id===curStoreForTypes?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  <h2>新增 / 编辑房型</h2><form id="typeForm"><input type="hidden" name="id">
  <div class="grid"><div><label>房型名称*</label><input name="name" required placeholder="如 精装单间 / 一房一厅"></div><div><label>排序</label><input name="sort_order" type="number" value="0"></div></div>
  <label>简介</label><textarea name="summary"></textarea>
  <label>亮点标签（用逗号分隔）</label><input name="highlights" placeholder="独立卫浴,家具家电齐全,拎包入住">
  <label>封面图</label><input type="file" id="typeCoverFile" accept="image/*"><input name="cover_url" placeholder="或粘贴图片网址">
  <label><input type="checkbox" name="is_active" checked style="width:auto"> 对客户显示</label>
  <div class="row" style="margin-top:10px"><button>保存房型</button></div></form></div>
  ${types.map(t=>{ const ms=cache.roomMedia.filter(m=>m.room_type_id===t.id); return `<div class="card"><div class="row"><span class="grow"><b>${esc(t.name)}</b> ${t.is_active?'':'（已停用）'}<br><span class="hint">${esc(t.summary||'')}</span></span><button class="small ghost" onclick="editType('${t.id}')">编辑</button><button class="small danger" onclick="delType('${t.id}')">删除</button></div>
  <div class="row" style="margin-top:10px">${ms.map(m=>`<span>${m.media_type==='video'?`<video src="${esc(m.media_url)}" style="width:96px;height:72px;object-fit:cover;border-radius:8px" controls></video>`:`<img class="thumb" src="${esc(m.media_url)}">`}<br><button class="small ghost" onclick="moveMedia('${m.id}',-1)">↑前移</button> <button class="small ghost" onclick="moveMedia('${m.id}',1)">↓后移</button> <button class="small danger" onclick="delMedia('${m.id}')">删</button></span>`).join('')}</div>
  <label>给这个房型上传图片 / 视频（可多选，视频建议10–30MB的压缩版）</label><input type="file" id="up-${t.id}" accept="image/*,video/*" multiple><button class="small" onclick="uploadMedia('${t.id}')">上传所选文件</button></div>`}).join('')}`;
  $('#typeStoreSel').onchange=e=>{ curStoreForTypes=e.target.value; renderTypes(); };
  $('#typeForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target); let cover=f.get('cover_url'); const file=$('#typeCoverFile').files[0]; try{ if(file) cover=await ManjuData.uploadFile('listing-images',file,'covers'); const row={id:f.get('id')||undefined,store_id:curStoreForTypes,name:f.get('name'),summary:f.get('summary'),highlights:String(f.get('highlights')||'').split(/[,，]/).map(x=>x.trim()).filter(Boolean),cover_url:cover,sort_order:+f.get('sort_order')||0,is_active:f.get('is_active')==='on'}; await ManjuData.adminUpsert('room_types',row); e.target.reset(); await reloadAll(); alert('房型已保存'); }catch(err){ alert('失败：'+err.message); } };
}
window.editType=id=>{ const t=cache.roomTypes.find(x=>x.id===id); const f=$('#typeForm'); f.elements.id.value=t.id; f.elements.name.value=t.name||''; f.elements.summary.value=t.summary||''; f.elements.highlights.value=(Array.isArray(t.highlights)?t.highlights.join(','):t.highlights||''); f.elements.cover_url.value=t.cover_url||''; f.elements.sort_order.value=t.sort_order||0; f.elements.is_active.checked=!!t.is_active; window.scrollTo({top:0,behavior:'smooth'}); };
window.delType=async id=>{ if(!confirm('删除这个房型及其图片视频？')) return; await ManjuData.adminDelete('room_types',id); await reloadAll(); };
window.uploadMedia=async typeId=>{ const inp=document.getElementById('up-'+typeId); if(!inp.files.length){ alert('先选择文件'); return; } let order=cache.roomMedia.filter(m=>m.room_type_id===typeId).length+1; for(const file of inp.files){ const url=await ManjuData.uploadFile('listing-images',file,'room-types'); await ManjuData.adminUpsert('room_media',{room_type_id:typeId,media_type:file.type.startsWith('video')?'video':'image',media_url:url,sort_order:order++}); } await reloadAll(); alert('上传完成'); };
window.delMedia=async id=>{ if(!confirm('删除这张图/视频？')) return; await ManjuData.adminDelete('room_media',id); await reloadAll(); };
window.moveMedia=async(id,dir)=>{ const m=cache.roomMedia.find(x=>x.id===id); m.sort_order=(m.sort_order||0)+dir; await ManjuData.adminUpsert('room_media',m); await reloadAll(); };

// ---------- 空房 ----------
const STATUS={available:'可租',reserved:'已预订',rented:'已出租',maintenance:'维修中'};
function parseStatus(v){ v=String(v||'').trim(); if(STATUS[v]) return v; if(v.includes('预')) return 'reserved'; if(v.includes('出租')||v.includes('已租')) return 'rented'; if(v.includes('维修')) return 'maintenance'; return 'available'; }
function renderRooms(){
  if(!curStoreForRooms && cache.stores.length) curStoreForRooms=cache.stores[0].id;
  const rooms=cache.availableRooms.filter(r=>r.store_id===curStoreForRooms);
  const types=cache.roomTypes.filter(t=>t.store_id===curStoreForRooms);
  $('#tab-rooms').innerHTML=`<div class="card"><label>选择门店</label><select id="roomStoreSel">${cache.stores.map(s=>`<option value="${s.id}" ${s.id===curStoreForRooms?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  <h2>新增 / 编辑房源</h2><form id="roomForm"><input type="hidden" name="id"><div class="grid">
  <div><label>房号*</label><input name="room_number" required></div>
  <div><label>房型</label><select name="room_type_id"><option value="">（不关联）</option>${types.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
  <div><label>月租（元）*</label><input name="rent" type="number" required></div>
  <div><label>管理费（元）</label><input name="management_fee" type="number" value="150"></div>
  <div><label>状态</label><select name="status">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
  <div><label>排序</label><input name="sort_order" type="number" value="0"></div></div>
  <label>公开备注</label><input name="public_note" placeholder="如 样板间 / 采光好"><label><input type="checkbox" name="is_public" checked style="width:auto"> 公开（客户可见还需状态为可租）</label>
  <div class="row" style="margin-top:10px"><button>保存房源</button></div></form></div>
  <div class="card"><h2>批量导入（从 Excel / WPS 复制多行粘贴）</h2><p class="hint">列顺序：房号、房型、月租、管理费、状态、公开备注。每行一条，直接从表格复制粘贴即可。</p><textarea id="bulkText" placeholder="207&#9;单间&#9;1250&#9;150&#9;可租&#9;样板间"></textarea><div class="row" style="margin-top:10px"><button id="bulkBtn">导入这些房源</button></div><p id="bulkMsg"></p></div>
  <div class="card"><h2>本店房源（${rooms.length}）</h2><div style="overflow-x:auto"><table><tr><th>房号</th><th>户型</th><th>月租</th><th>管理费</th><th>状态</th><th>备注</th><th>公开</th><th></th></tr>
  ${rooms.map(r=>`<tr><td>${esc(r.room_number)}</td><td>${esc(r.type_label||(types.find(t=>t.id===r.room_type_id)||{}).name||'')}</td><td>${esc(r.rent)}</td><td>${esc(r.management_fee)}</td><td>${STATUS[r.status]||r.status}</td><td>${esc(r.public_note||'')}</td><td>${r.is_public?'是':'否'}</td><td><button class="small ghost" onclick="editRoom('${r.id}')">编辑</button> <button class="small danger" onclick="delRoom('${r.id}')">删</button></td></tr>`).join('')}</table></div></div>`;
  $('#roomStoreSel').onchange=e=>{ curStoreForRooms=e.target.value; renderRooms(); };
  $('#roomForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target); const tid=f.get('room_type_id')||null; const t=types.find(x=>x.id===tid); const row={id:f.get('id')||undefined,store_id:curStoreForRooms,room_type_id:tid,room_number:f.get('room_number'),rent:+f.get('rent'),management_fee:+f.get('management_fee')||150,status:f.get('status'),public_note:f.get('public_note'),sort_order:+f.get('sort_order')||0,is_public:f.get('is_public')==='on',type_label:t?t.name:''}; try{ await ManjuData.adminUpsert('available_rooms',row); e.target.reset(); e.target.elements.management_fee.value=150; await reloadAll(); }catch(err){ alert('失败：'+err.message); } };
  $('#bulkBtn').onclick=async()=>{ const lines=$('#bulkText').value.split(/\n/).map(x=>x.trim()).filter(Boolean); let ok=0,fail=0; for(const line of lines){ const c=line.split(/\t|,/).map(x=>x.trim()); if(c.length<3){ fail++; continue; } const t=types.find(x=>x.name===c[1]); try{ await ManjuData.adminUpsert('available_rooms',{store_id:curStoreForRooms,room_type_id:t?t.id:null,type_label:c[1]||'',room_number:c[0],rent:+String(c[2]).replace(/[^\d.]/g,''),management_fee:+String(c[3]||150).replace(/[^\d.]/g,'')||150,status:parseStatus(c[4]),public_note:c[5]||'',is_public:true,sort_order:ok}); ok++; }catch(e){ fail++; } } $('#bulkMsg').textContent=`导入完成：成功 ${ok} 条，失败 ${fail} 条`; await reloadAll(); };
}
window.editRoom=id=>{ const r=cache.availableRooms.find(x=>x.id===id); const f=$('#roomForm'); ['id','room_number','rent','management_fee','status','public_note','sort_order'].forEach(k=>{ if(f.elements[k]) f.elements[k].value=r[k]??''; }); if(f.elements.room_type_id) f.elements.room_type_id.value=r.room_type_id||''; f.elements.is_public.checked=!!r.is_public; window.scrollTo({top:0,behavior:'smooth'}); };
window.delRoom=async id=>{ if(!confirm('删除这条房源？')) return; await ManjuData.adminDelete('available_rooms',id); await reloadAll(); };

// ---------- 价格表 ----------
function renderSheets(){
  $('#tab-sheets').innerHTML=`<div class="card"><h2>原始价格表归档（仅管理员可见）</h2><p class="hint">上传微信群里用的空房表/价格表截图存档。客户看不到这里，只看整理后的实时空房表。正式模式需先在 Supabase 建好 price_sheets 表和 price-sheets 存储桶（见手册）。</p>
  <input type="file" id="sheetFile" accept="image/*"><div class="row" style="margin-top:10px"><button id="sheetBtn">上传归档</button></div><p id="sheetMsg"></p>
  <div>${(cache.priceSheets||[]).map(s=>`<div class="row" style="padding:8px 0;border-bottom:1px solid #eee"><span class="grow">${esc(s.file_name||s.media_url||'价格表')}</span><button class="small danger" onclick="delSheet('${s.id}')">删除记录</button></div>`).join('')}</div></div>`;
  const btn=$('#sheetBtn'); if(btn) btn.onclick=async()=>{ const f=$('#sheetFile').files[0]; if(!f){ alert('先选择截图'); return; } try{ const url=await ManjuData.uploadFile('price-sheets',f,'sheets'); if(ManjuData.isLive){ await ManjuData.adminUpsert('price_sheets',{file_name:f.name,storage_path:String(url).split('|')[1]||'',sort_order:0}); } else { const db=JSON.parse(localStorage.getItem('manheju_demo_db_v1')); db.priceSheets.push({id:Date.now().toString(36),file_name:f.name,media_url:url,sort_order:0}); localStorage.setItem('manheju_demo_db_v1',JSON.stringify(db)); cache.priceSheets=db.priceSheets; } $('#sheetMsg').innerHTML='<span class="ok">已归档</span>'; await reloadAll(); }catch(e){ $('#sheetMsg').innerHTML='<span class="err">上传失败：'+esc(e.message)+'（演示模式可忽略，正式模式请先建桶/表）</span>'; } };
}
window.delSheet=async id=>{ if(!confirm('删除这条归档记录？')) return; try{ await ManjuData.adminDelete('price_sheets',id);}catch(e){ const db=JSON.parse(localStorage.getItem('manheju_demo_db_v1')); db.priceSheets=db.priceSheets.filter(x=>x.id!==id); localStorage.setItem('manheju_demo_db_v1',JSON.stringify(db)); } await reloadAll(); };
