(()=>{'use strict';
const root=document.getElementById('event');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),slug=params.get('slug');
const dateLabel=x=>x?new Date(x).toLocaleString('es-MX',{dateStyle:'full',timeStyle:'short',timeZone:'America/Mexico_City'}):'Consultar programación vigente';
async function load(){
 if(!slug){root.innerHTML='<p>No se indicó una obra.</p>';return}
 try{
  const data=await TadaaApi.call('/api/v2/events/'+encodeURIComponent(slug));
  const e=data.event,m=e.metadata||{},img=e.poster_url||'/experience/img/catalogo/el-rey-leon.svg';
  const schedule=m.schedule_label||dateLabel(e.starts_at);
  const source=m.source_url||e.ticket_url||'https://www.ticketmaster.com.mx/';
  root.innerHTML=`<section class="hero">
   <div><img src="${esc(img)}" alt="Arte editorial de muestra para ${esc(e.title)}"><p class="muted" style="font-size:11px;margin:8px 4px">Arte editorial original de TADAA! · No es el cartel oficial de la producción.</p></div>
   <div><div class="kicker">${esc(m.category||'Teatro')} · Ciudad de México</div><h1>${esc(e.title)}</h1><p class="muted">${esc(e.description||'Consulta la información oficial de esta producción.')}</p>
   <div class="meta"><div><small>Recinto</small><b>${esc(e.venue||'Por confirmar')}</b></div><div><small>Función / temporada</small><b>${esc(schedule)}</b></div><div><small>Precio y disponibilidad</small><b>Consultar con la fuente oficial</b></div></div>
   <div class="actions"><a class="btn" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Consultar información oficial ↗</a><a class="btn ghost" href="login.html">Crear cuenta TADAA!</a></div>
   <div class="notice"><b>Información transparente:</b> esta ficha es una selección editorial de TADAA!. No representa una alianza con la productora ni confirma inventario, descuento o venta de boletos por TADAA!. Los horarios, precios y disponibilidad deben confirmarse en la fuente enlazada.</div></div>
  </section>`;
 }catch(err){root.innerHTML=`<section class="notice"><b>No pudimos cargar esta ficha.</b><p>${esc(err.message)}</p><a class="btn ghost" href="index.html">Volver a cartelera</a></section>`}
}
load();
})();