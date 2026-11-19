(()=>{
'use strict';
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)],api=window.TadaaApi;
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format((Number(x)||0)/100);
let shows=[],sampleMode=false,state={cat:'',q:'',tab:'hoy'};
const hd=$('#hd');addEventListener('scroll',()=>hd?.classList.toggle('scrolled',scrollY>25),{passive:true});
const bg=$('#burger'),nv=$('#nav');bg.onclick=()=>{bg.classList.toggle('open');nv.classList.toggle('open')};$$('#nav a').forEach(a=>a.onclick=()=>{bg.classList.remove('open');nv.classList.remove('open')});
// El preloader inicia en index.html, independiente del catálogo y la API.
document.body.classList.remove('lock');document.body.classList.add('ready');Curtain.enter();
/* Stage spotlights. Canvas ornamental only; no hidden state. */
const cv=$('#stage'),ctx=cv?.getContext('2d'),bc=$('#beams'),bctx=bc?.getContext('2d');let w=0,h=0,active=true;const resize=()=>{if(!cv)return;w=cv.clientWidth;h=cv.clientHeight;cv.width=w;cv.height=h;bc.width=Math.max(1,Math.round(w/5));bc.height=Math.max(1,Math.round(h/5))};addEventListener('resize',resize);resize();
new IntersectionObserver(e=>active=e[0].isIntersecting).observe($('.hero'));
if(ctx&&bctx&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const lights=[0.2,0.5,0.8];function frame(ms){requestAnimationFrame(frame);if(!active||document.hidden)return;const t=ms/1000;bctx.clearRect(0,0,bc.width,bc.height);ctx.clearRect(0,0,w,h);lights.forEach((l,i)=>{const x=w*(l+Math.sin(t*.25+i)*.055),color=i===1?'214,255,53':'255,255,245';const g=ctx.createRadialGradient(x,h*.34,5,x,h*.34,w*.56);g.addColorStop(0,`rgba(${color},.16)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(x,-25);ctx.rotate(Math.sin(t*.22+i)*.19+(i-1)*.2);const b=ctx.createLinearGradient(0,0,0,h);b.addColorStop(0,`rgba(${color},.20)`);b.addColorStop(.6,`rgba(${color},.025)`);b.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=b;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(w*.22,h);ctx.lineTo(-w*.22,h);ctx.closePath();ctx.fill();ctx.restore()});ctx.fillStyle='#030303';for(let i=0;i<w;i+=34){const y=h-29-Math.sin(i*.18+t*.4)*5;ctx.beginPath();ctx.arc(i,y,13,0,7);ctx.fill();ctx.fillRect(i-14,y,28,45)}}requestAnimationFrame(frame)}
/* Marquee */const words=['Conciertos','Teatro','Cultura','Planes','Familia','Experiencias'];$('#mq').innerHTML=[...words,...words,...words,...words].map(x=>`<span>${x}</span>`).join('');
function poster(x){
 const img=x.poster_url?`<img src="${escape(x.poster_url)}" alt="" loading="lazy" onerror="this.remove()">`:'';
 const d=x.metadata?.schedule_label||(x.starts_at?new Date(x.starts_at).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Mexico_City'}):'Consultar programación');
 const price=x.from_price_minor==null?'Consultar':money(x.from_price_minor);
 const priceLabel=x.from_price_minor==null?'Precio en fuente oficial':'Desde';
 return `<article class="show" tabindex="0" role="button" data-id="${escape(x.id)}" data-slug="${escape(x.slug||x.id)}" style="--a:#516c34;--b:#0e140b"><div class="art">${img}</div><div class="glow"></div><div class="shade"></div><div class="show-in"><div class="badges"><span class="pill">${escape(x.metadata?.category||'Experiencias')}</span>${x.picks?'<span class="off">TADAA! Picks</span>':''}</div><h3>${escape(x.title)}</h3><div class="sub2">${escape(x.venue||'Sede por anunciar')}</div><div class="when">${escape(d)}</div><div class="foot"><div class="price"><small>${priceLabel}</small><b>${price}</b></div><span class="go">↗</span></div></div></article>`
}
function sampleTab(item){
 if(!sampleMode) return true;
 const diff=Math.round((new Date(item.starts_at).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/86400000);
 return state.tab==='hoy'?diff===0:state.tab==='manana'?diff===1:diff>1;
}
function filtered(){return shows.filter(s=>(!state.cat||s.metadata?.category===state.cat)&&(!state.q||(s.title+' '+(s.venue||'')).toLowerCase().includes(state.q))&&(state.q||state.cat||sampleTab(s)))}
function render(){
 const results=filtered();
 $('#rail').innerHTML=results.map(poster).join('');
 $('#none').classList.toggle('on',!results.length);
 if(!results.length&&shows.length){$('#none').innerHTML='<b>No hay experiencias en este filtro.</b>Prueba con otro día o categoría.'}
 else if(!shows.length){$('#none').innerHTML='<b>No pudimos cargar la cartelera.</b>Intenta recargar en unos momentos.'}
 if($('#liveCount'))$('#liveCount').textContent=shows.length;
 const countLabel=$('#liveCountLabel'); if(countLabel)countLabel.textContent=sampleMode?'experiencias de muestra':'experiencias publicadas';
 const note=$('#sampleNote');if(note)note.hidden=!sampleMode;
 const filter=$('#filt');if(filter)filter.classList.toggle('on',!!(state.q||state.cat));
 const filterLabel=$('#filtx');if(filterLabel)filterLabel.textContent=state.q||state.cat;
 $$('#tabs .tab').forEach(b=>b.classList.toggle('on',!state.q&&!state.cat&&b.dataset.t===state.tab));
}
async function load(){
 let real=[];
 try{const result=await Promise.race([api.call('/api/v2/catalog'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tiempo de espera agotado')),6500))]);real=Array.isArray(result.events)?result.events:[]}catch(e){console.warn('TADAA! catálogo remoto no disponible; mostrando únicamente ejemplos ilustrativos.');}
 const localSamples=window.TadaaSamples?.list?.()||[];
 sampleMode=real.length===0&&localSamples.length>0;
 shows=real.length?real:localSamples;
 if(sampleMode)$('#none').innerHTML='<b>Contenido ilustrativo</b>Estas fichas sirven para explorar el diseño; no tienen disponibilidad ni boletos asociados.';
 render();
}
load();
function closeEventModal(){
 const modal=$('#eventDialog');
 if(!modal)return;
 modal.hidden=true;modal.setAttribute('aria-hidden','true');
 document.body.style.overflow='';
}
function safeExternal(url){
 try{const u=new URL(url,location.origin);return u.protocol==='https:'?u.href:''}catch{return ''}
}
function listItems(value){
 if(!Array.isArray(value))return '';
 return value.map(x=>`<li>${escape(typeof x==='string'?x:(x.name||x.title||''))}</li>`).join('');
}
function renderEventModal(item,detail=null){
 const e=detail?.event||item||{},content=$('#eventDialogContent');
 const hero=e.hero_url||e.poster_url||item?.hero_url||item?.poster_url||'';
 const category=e.metadata?.category||item?.metadata?.category||'Experiencias';
 const schedule=e.metadata?.schedule_label||(e.starts_at?new Date(e.starts_at).toLocaleString('es-MX',{dateStyle:'full',timeStyle:'short',timeZone:'America/Mexico_City'}):'Consulta la programación oficial');
 const source=safeExternal(e.ticket_url||e.metadata?.source_url||item?.ticket_url||item?.source_url);
 const maps=safeExternal(e.maps_url||item?.maps_url);
 const spotify=safeExternal(e.spotify_url||item?.spotify_url);
 const credits=e.credits||item?.credits||[];
 const instructions=e.instructions||item?.instructions||[];
 const isLocalSample=!!item?.sample;
 const editorial=!!e.metadata?.is_demo_content||isLocalSample;
 const description=e.description||e.details||item?.description||item?.details||'Consulta la información de la producción en su fuente oficial.';
 const price=e.from_price_minor??item?.from_price_minor;
 content.innerHTML=`
  <div class="event-modal-hero">${hero?`<img src="${escape(hero)}" alt="Imagen de ${escape(e.title||item?.title)}" onerror="this.remove()">`:''}</div>
  <div class="event-modal-body">
   <div class="event-modal-kicker">${escape(category.toUpperCase())} · CIUDAD DE MÉXICO</div>
   <h2 id="eventDialogTitle">${escape(e.title||item?.title||'Experiencia')}</h2>
   <div class="event-modal-meta"><span>⌖ ${escape(e.venue||item?.venue||'Sede por anunciar')}</span><span>◷ ${escape(schedule)}</span>${price!=null?`<span>${escape(money(price))}</span>`:''}</div>
   <p>${escape(description)}</p>
   <div class="event-modal-columns">
    <div class="event-modal-info"><h3>Información de la experiencia</h3>
     <ul>${listItems(instructions)||'<li>Consulta la fuente oficial para confirmar horarios, acceso y condiciones.</li>'}</ul>
     ${credits.length?`<h3 style="margin-top:18px">Créditos</h3><ul>${listItems(credits)}</ul>`:''}
    </div>
    <div class="event-modal-info"><h3>Consulta y planea tu visita</h3>
     <p>Revisa la programación vigente y los detalles directamente con el recinto o la boletera responsable.</p>
     <div class="event-modal-actions">${source?`<a class="btn" href="${escape(source)}" target="_blank" rel="noopener noreferrer">Consultar fuente oficial ↗</a>`:''}${maps?`<a class="btn ghost" href="${escape(maps)}" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a>`:''}${spotify?`<a class="btn ghost" href="${escape(spotify)}" target="_blank" rel="noopener noreferrer">Escuchar en Spotify ↗</a>`:''}
      <a class="btn ghost" href="login.html?register=1" data-curtain-login>Iniciar sesión para guardar</a>
     </div>
    </div>
   </div>
   <p class="event-modal-note">${editorial?'Ficha informativa de TADAA!; el arte es editorial y no sustituye el material oficial.':'Información de la producción.'} TADAA! no confirma disponibilidad ni vende entradas para esta producción desde esta ficha. Los precios y funciones deben verificarse en la fuente oficial.</p>
  </div>`;
 const modal=$('#eventDialog');modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';modal.querySelector('[data-event-close]')?.focus();
}
async function openEvent(id){
 const item=shows.find(x=>String(x.id)===String(id));
 if(!item)return;
 if(item.sample){renderEventModal(item,null);return;}
 try{
  const detail=await api.call('/api/v2/events/'+encodeURIComponent(item.slug||item.id));
  renderEventModal(item,detail);
 }catch(err){
  renderEventModal({...item,description:item.description||'No fue posible cargar todos los detalles en este momento.'},null);
 }
}
$('#eventDialog')?.addEventListener('click',e=>{if(e.target.matches('[data-event-close]'))closeEventModal()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeEventModal()});
async function openCard(c){if(!c)return;await openEvent(c.dataset.id)}
$('#rail').onclick=e=>openCard(e.target.closest('[data-id]'));
$('#rail').onkeydown=e=>{const c=e.target.closest('[data-id]');if((e.key==='Enter'||e.key===' ')&&c){e.preventDefault();openCard(c)}};

$('#sf').onsubmit=e=>{e.preventDefault();state.q=$('#sq').value.trim().toLowerCase();state.tab=$('#sd')?.value||'hoy';render();$('#hoy').scrollIntoView({behavior:'smooth'})};
$('#tabs').onclick=e=>{if(e.target.classList.contains('tab')){state.cat='';state.q='';state.tab=e.target.dataset.t;$('#sq').value='';render()}};
$('#catgrid').onclick=e=>{const b=e.target.closest('[data-c]');if(b){state.cat=b.dataset.c;state.q='';render();$('#hoy').scrollIntoView({behavior:'smooth'})}};
$('#filtc').onclick=()=>{state.cat='';state.q='';render()};$('#nx').onclick=()=>$('#rail').scrollBy({left:660,behavior:'smooth'});$('#pv').onclick=()=>$('#rail').scrollBy({left:-660,behavior:'smooth'});
$('#cd').textContent='en un solo lugar';
const steps=$$('.step'),scr=$$('.sc');const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const id=e.target.dataset.s;steps.forEach(x=>x.classList.toggle('on',x.dataset.s===id));scr.forEach(x=>x.classList.toggle('on',x.dataset.s===id));}}),{rootMargin:'-42% 0px -42% 0px'});steps.forEach(e=>so.observe(e));
const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');reveal.unobserve(e.target)}}),{threshold:.12});$$('.rv').forEach(e=>reveal.observe(e));
$('#fc').onclick=e=>e.target.closest('button')?.classList.toggle('on');$('#af').onsubmit=async e=>{e.preventDefault();const email=$('#em').value.trim();try{await api.call('/api/v2/alerts','POST',{email,interests:$$('#fc button.on').map(x=>x.textContent),consent:true});$('#fm').textContent='¡Listo! Hemos registrado tus intereses.';$('#em').value=''}catch(err){$('#fm').textContent=err.message}};
})();
