(()=>{'use strict';
const root=document.getElementById('event');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format((Number(x)||0)/100);
const params=new URLSearchParams(location.search),slug=params.get('slug');
const dateLabel=x=>x?new Date(x).toLocaleString('es-MX',{dateStyle:'full',timeStyle:'short',timeZone:'America/Mexico_City'}):'Consultar programación vigente';
const safeUrl=u=>{if(!u||!String(u).trim())return '';try{const x=new URL(u,location.origin);return x.protocol==='https:'||x.origin===location.origin?x.href:''}catch{return ''}};
const ICON_NOW='<svg viewBox="0 0 24 24" fill="#0B0A1C" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
const ICON_GOLD='<svg viewBox="0 0 24 24" fill="none" stroke="#2A1A00" stroke-width="2.2" aria-hidden="true"><path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/></svg>';
let state={zone:0,qty:2,tab:'sin'},ev=null,types=[],similar=[];

function icons(m,big){
 const out=[];
 if(m.now_enabled)out.push(`<span class="tv-ic now" title="Now! disponible" role="img" aria-label="Now! disponible">${ICON_NOW}</span>`);
 if(m.golden_enabled)out.push(`<span class="tv-ic gold" title="Golden Ticket activo" role="img" aria-label="Golden Ticket activo">${ICON_GOLD}</span>`);
 if(m.tadaa_original)out.push('<span class="tv-ic orig" title="TADAA! Original" role="img" aria-label="TADAA! Original">t!</span>');
 return out.length?`<div class="tv-icons${big?' lg':''}">${out.join('')}</div>`:'';
}
function title(e,m){
 const logo=safeUrl(m.logo_url||'');
 return logo?`<h1 class="ev-title" style="margin:0"><img class="tv-logo-img" src="${esc(logo)}" alt="${esc(e.title)}"></h1>`:`<h1 class="ev-title">${esc(e.title)}</h1>`;
}
function panes(e,m){
 const cast=Array.isArray(m.cast)?m.cast:[],crew=Array.isArray(m.crew)?m.crew:[],reviews=Array.isArray(m.reviews)?m.reviews:[],tags=Array.isArray(m.tags)?m.tags:[];
 const stars=n=>'★★★★★'.slice(0,Math.max(0,Math.min(5,Math.round(Number(n)||0))))+'☆☆☆☆☆'.slice(0,5-Math.max(0,Math.min(5,Math.round(Number(n)||0))));
 return {
  sin:`<div class="pane"><p style="margin:0">${esc(e.description||'Pronto compartiremos la sinopsis de este evento.')}</p></div>`,
  rep:`<div class="pane">${cast.length?`<div class="cast">${cast.map(c=>`<div><div class="av">${c.photo_url&&safeUrl(c.photo_url)?`<img src="${esc(safeUrl(c.photo_url))}" alt="">`:esc(String(c.name||'?').trim()[0]||'?')}</div><b>${esc(c.name)}</b><div style="font-size:12px;color:#4A5068">${esc(c.role||'')}</div></div>`).join('')}</div>`:'<p class="empty">El reparto se anunciará pronto.</p>'}${crew.length?`<div class="facts" style="margin-top:18px">${crew.map(c=>`<div><small>${esc(c.role)}</small><b>${esc(c.name)}</b></div>`).join('')}</div>`:''}</div>`,
  info:`<div class="pane"><div class="facts"><div><small>Sede</small><b>${esc(e.venue||'Por confirmar')}</b></div><div><small>Función / temporada</small><b>${esc(m.schedule_label||dateLabel(e.starts_at))}</b></div><div><small>Duración</small><b>${esc(m.duration||'Por confirmar')}</b></div><div><small>Clasificación</small><b>${esc(m.rating||'Por confirmar')}</b></div></div>${tags.length?`<div class="tags">${tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div>`:''}${e.venue?`<p style="margin:16px 0 0"><a class="tv-btn dark" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue)}">Cómo llegar ↗</a></p>`:''}</div>`,
  res:`<div class="pane" style="display:flex;flex-wrap:wrap;gap:24px">${m.tadaa_rating?`<div style="flex:0 1 200px"><div class="tv-eyebrow" style="color:#1238FF">Calificación TADAA!</div><div class="score">${esc(m.tadaa_rating)}</div><small style="color:#4A5068">De asistentes verificados</small></div>`:''}<div style="flex:1 1 320px">${reviews.length?`<div class="reviews">${reviews.map(r=>`<div class="review"><span style="color:#D6FF35">${stars(r.stars)}</span><p>${esc(r.quote)}</p><span>${esc(r.source)}</span></div>`).join('')}</div>`:'<p class="empty">Aún no hay reseñas. Después de la función podrás calificar tu experiencia.</p>'}</div></div>`
 };
}
let extra={addons:[],golden:null,now:[]};
function render(){
 const e=ev,m=e.metadata||{},img=safeUrl(e.hero_url||e.poster_url||'')||'img/tv/blue-wide.webp';
 const tadaa=e.ticketing_mode==='tadaa',z=types[state.zone];
 const p=panes(e,m),tabs=[['sin','Sinopsis'],['rep','Reparto y producción'],['info','Info del evento'],['res','Reseñas']];
 const source=safeUrl(m.source_url||e.ticket_url||'');
 const total=z?money(Number(z.price_minor)*state.qty):'Consultar';
 root.innerHTML=`<section class="ev-hero"><img class="bg" src="${esc(img)}" alt="">
  <div class="wrap"><div class="ev-top"><a class="ev-logo-brand" href="index.html">tadaa<b>!</b></a><nav class="ev-nav" aria-label="Principal"><a href="index.html">Inicio</a><a class="on" href="index.html#hoy">Cartelera</a><a href="app.html#/boletos">Mi Wallet</a></nav><a class="tv-btn" href="app.html">Mi TADAA!</a></div>
  <div class="ev-head">${icons(m,true)}${title(e,m)}
   <div style="display:flex;flex-wrap:wrap;gap:8px"><span class="tv-tag lime">${esc((m.category||'Experiencia').toUpperCase())}</span><span class="tv-tag white">${tadaa?'TADAA! TICKETS · BOLETO FINAL':'BOLETERA EXTERNA · PASE PROVISIONAL'}</span>${m.rating?`<span class="tv-tag" style="background:rgba(255,255,255,.16)">${esc(String(m.rating).toUpperCase())}</span>`:''}</div>
   <div class="ev-pills"><span>${esc(m.schedule_label||dateLabel(e.starts_at))}</span><span>${esc(e.venue||'Sede por confirmar')}</span>${m.tadaa_rating?`<span>★ ${esc(m.tadaa_rating)} TADAA!</span>`:''}</div></div></div></section>
 <div class="wrap ev-body">
  <div class="ev-main">
   <section style="display:flex;flex-direction:column;gap:14px"><h2 class="h2">Precios por zona</h2>
    <div class="zones" role="radiogroup" aria-label="Zona">${types.length?types.map((t,i)=>`<button class="zone ${i===state.zone?'on':''}" role="radio" aria-checked="${i===state.zone}" data-zone="${i}"><b class="n">${esc(t.section_name||t.name)}</b><small>${esc(t.description||'')}</small><span class="p">${money(t.price_minor)}</span></button>`).join(''):'<p class="empty" style="padding:16px">Los precios se publicarán pronto.</p>'}</div></section>
   <section class="panel"><div class="tabs" role="tablist" aria-label="Información del evento">${tabs.map(([id,l])=>`<button role="tab" aria-selected="${state.tab===id}" class="${state.tab===id?'on':''}" data-tab="${id}">${l}</button>`).join('')}</div>${p[state.tab]}</section>
  </div>
  <aside class="ev-aside" aria-label="Tus boletos">
   <div class="book"><div class="tv-eyebrow" style="color:#1238FF">Haz tu plan</div><h2 style="margin:6px 0 6px;font:800 28px var(--tv-display)">Tus boletos</h2>
    <div class="row"><span>Zona</span><b>${esc(z?(z.section_name||z.name):'Por definir')}</b></div>
    <div class="row" style="padding:8px 8px 8px 16px"><span>Boletos</span><span style="display:flex;align-items:center;gap:6px"><button data-qty="-1" aria-label="Restar boleto" style="width:44px;height:44px;border:0;border-radius:50%;background:#fff;font-size:20px;cursor:pointer">−</button><b style="min-width:24px;text-align:center;font:800 18px var(--tv-display);color:#08091A">${state.qty}</b><button data-qty="1" aria-label="Sumar boleto" style="width:44px;height:44px;border:0;border-radius:50%;background:#08091A;color:#fff;font-size:20px;cursor:pointer">+</button></span></div>
    <div class="tv-perf" style="--tv-notch:#EEF1F7;margin:20px -22px 0"></div>
    <div class="total"><span style="font-size:13px;color:#4A5068">Total estimado</span><b>${total}</b></div>
    ${tadaa?`<a class="tv-btn" style="width:100%;margin-top:14px" href="app.html#/evento/${encodeURIComponent(e.id)}">${e.seating_mode==='reserved'||e.has_seats?'Elegir asientos':'Elegir boletos'} →</a>`:`<a class="tv-btn" style="width:100%;margin-top:14px" href="app.html#/evento/${encodeURIComponent(e.id)}">Solicitar con TADAA! →</a>${source?`<a class="tv-btn ghost" style="width:100%;margin-top:10px;color:#08091A;border-color:#D5DBEA" target="_blank" rel="noopener noreferrer" href="${esc(source)}">Ver fuente oficial ↗</a>`:''}`}
    ${extra.golden||m.golden_enabled?`<div class="golden-note"><b>1/${esc(extra.golden?.odds||100)}</b><span>Tu boleto puede convertirse en <b style="font:inherit;font-weight:800">Golden Ticket</b>${extra.golden?.benefit_title?': '+esc(extra.golden.benefit_title):m.golden_benefit?': '+esc(m.golden_benefit):''}.</span></div>`:''}${extra.now.map(n=>`<a class="now-note" href="app.html#/now"><b>Now!</b><span>${esc(n.ticket_type)} a ${money(n.price_minor)} · ${n.state==='open'?'¡abierto para registrados!':'regístrate antes de que abra'} · ${n.signups} registrados</span></a>`).join('')}${extra.addons.length&&tadaa?`<div class="addons-note"><b>Agrega a tu plan</b>${extra.addons.map(a=>`<div class="row"><span>${esc(a.title)}</span><b>${a.available>0?money(a.price_minor):'Agotado'}</b></div>`).join('')}<small>Se eligen al comprar en Mi TADAA! y se entregan en el evento.</small></div>`:''}
   </div>
   <div class="before"><h3>${tadaa?'Antes de comprar':'Antes de solicitar'}</h3>${tadaa?'• Tus lugares se apartan mientras pagas con Clip.<br>• Recibes tu boleto final con QR dinámico en Mi Wallet; las capturas no sirven.':'• Sin pago ahora: confirmamos disponibilidad con el proveedor.<br>• Recibes un pase provisional de seguimiento; el acceso son los boletos oficiales que entrega el proveedor.'}</div>
  </aside>
 </div>
 ${similar.length?`<section class="wrap"><h2 class="h2" style="margin-bottom:18px">También te puede gustar</h2><div class="similar">${similar.map(s=>`<a class="tv-card" href="event.html?slug=${encodeURIComponent(s.slug||s.id)}">${s.poster_url&&safeUrl(s.poster_url)?`<img src="${esc(safeUrl(s.poster_url))}" alt="" loading="lazy">`:''}<span class="tv-price tv-tag lime">${s.from_price_minor==null?'Consultar':'Desde '+money(s.from_price_minor)}</span><div class="tv-body">${icons(s.metadata||{},false)}<h3>${esc(s.title)}</h3><div class="tv-meta"><span>${esc(s.venue||'')}</span></div></div></a>`).join('')}</div></section>`:''}`;
}
root.addEventListener('click',e=>{
 const z=e.target.closest('[data-zone]');if(z){state.zone=Number(z.dataset.zone);render();return}
 const t=e.target.closest('[data-tab]');if(t){state.tab=t.dataset.tab;render();return}
 const q=e.target.closest('[data-qty]');if(q){const max=Math.max(1,Number(types[state.zone]?.max_per_order)||8);state.qty=Math.max(1,Math.min(max,state.qty+Number(q.dataset.qty)));render()}
});
async function load(){
 if(!slug){root.innerHTML='<div class="wrap" style="padding-top:40px"><p>No se indicó un evento.</p></div>';return}
 try{
  const data=await TadaaApi.call('/api/v2/events/'+encodeURIComponent(slug));
  ev=data.event;document.title=ev.title+' · TADAA!';
  types=(Array.isArray(data.ticketTypes)?data.ticketTypes:[]).filter(t=>t&&!t.now&&t.price_minor!=null&&(t.name||t.section_name));extra={addons:data.addons||[],golden:data.golden||null,now:data.now||[]};
  render();
  try{const cat=await TadaaApi.call('/api/v2/catalog');const list=Array.isArray(cat.events)?cat.events:[];const c=ev.metadata?.category;similar=list.filter(x=>x.id!==ev.id&&(!c||x.metadata?.category===c)).slice(0,4);if(similar.length<4)similar=similar.concat(list.filter(x=>x.id!==ev.id&&!similar.includes(x)).slice(0,4-similar.length));render()}catch{}
 }catch(err){root.innerHTML=`<div class="wrap" style="padding-top:40px"><div class="before"><h3>No pudimos cargar esta ficha.</h3><p>${esc(err.message)}</p><a class="tv-btn" href="index.html">Volver a cartelera</a></div></div>`}
}
load();
})();
