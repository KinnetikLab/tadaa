(()=>{
'use strict';
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)],api=window.TadaaApi;
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=x=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format((Number(x)||0)/100);
let shows=[],sampleMode=false,state={cat:'',q:'',tab:'hoy'};
const hd=$('#hd');addEventListener('scroll',()=>hd?.classList.toggle('scrolled',scrollY>25),{passive:true});
const bg=$('#burger'),nv=$('#nav');bg.onclick=()=>{bg.classList.toggle('open');nv.classList.toggle('open')};$$('#nav a').forEach(a=>a.onclick=()=>{bg.classList.remove('open');nv.classList.remove('open')});
// El preloader inicia en index.html, independiente del catálogo y la API.
document.body.classList.remove('lock');document.body.classList.add('ready');
/* Stage spotlights. Canvas ornamental only; no hidden state. */
const cv=$('#stage'),ctx=cv?.getContext('2d'),bc=$('#beams'),bctx=bc?.getContext('2d');let w=0,h=0,active=true;const resize=()=>{if(!cv)return;w=cv.clientWidth;h=cv.clientHeight;cv.width=w;cv.height=h;bc.width=Math.max(1,Math.round(w/5));bc.height=Math.max(1,Math.round(h/5))};addEventListener('resize',resize);resize();
new IntersectionObserver(e=>active=e[0].isIntersecting).observe($('.hero'));
if(ctx&&bctx&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const lights=[0.2,0.5,0.8];function frame(ms){requestAnimationFrame(frame);if(!active||document.hidden)return;const t=ms/1000;bctx.clearRect(0,0,bc.width,bc.height);ctx.clearRect(0,0,w,h);lights.forEach((l,i)=>{const x=w*(l+Math.sin(t*.25+i)*.055),color=i===1?'214,255,53':'255,255,245';const g=ctx.createRadialGradient(x,h*.34,5,x,h*.34,w*.56);g.addColorStop(0,`rgba(${color},.16)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(x,-25);ctx.rotate(Math.sin(t*.22+i)*.19+(i-1)*.2);const b=ctx.createLinearGradient(0,0,0,h);b.addColorStop(0,`rgba(${color},.20)`);b.addColorStop(.6,`rgba(${color},.025)`);b.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=b;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(w*.22,h);ctx.lineTo(-w*.22,h);ctx.closePath();ctx.fill();ctx.restore()});ctx.fillStyle='#030303';for(let i=0;i<w;i+=34){const y=h-29-Math.sin(i*.18+t*.4)*5;ctx.beginPath();ctx.arc(i,y,13,0,7);ctx.fill();ctx.fillRect(i-14,y,28,45)}}requestAnimationFrame(frame)}
/* Marquee */const words=['Conciertos','Teatro','Cultura','Planes','Familia','Experiencias'];$('#mq').innerHTML=[...words,...words,...words,...words].map(x=>`<span>${x}</span>`).join('');
function poster(x){const img=x.poster_url?`<img src="${escape(x.poster_url)}" alt="" onerror="this.remove()">`:'';const d=x.metadata?.schedule_label||(x.starts_at?new Date(x.starts_at).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Mexico_City'}):'Consultar programación');return `<article class="show" tabindex="0" data-id="${escape(x.id)}" data-slug="${escape(x.slug||x.id)}" style="--a:#516c34;--b:#0e140b"><div class="art">${img}</div><div class="glow"></div><div class="shade"></div><div class="show-in"><div class="badges"><span class="pill">${escape(x.metadata?.category||'Experiencias')}</span>${x.metadata?.is_demo_content?'<span class="off">DEMO EDITORIAL</span>':x.picks?'<span class="off">TADAA! Picks</span>':''}</div><h3>${escape(x.title)}</h3><div class="sub2">${escape(x.venue||'Sede por anunciar')}</div><div class="when">${d}</div><div class="foot"><div class="price"><small>${x.sample?'Precio ficticio':'Precio de referencia'}</small><b>${x.from_price_minor==null?'Consultar':money(x.from_price_minor)}</b></div><span class="go">↗</span></div></div></article>`}
function sampleTab(item){
 if(!sampleMode) return true;
 const diff=Math.round((new Date(item.starts_at).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/86400000);
 return state.tab==='hoy'?diff===0:state.tab==='manana'?diff===1:diff>1;
}
function filtered(){return shows.filter(s=>(!state.cat||s.metadata?.category===state.cat)&&(!state.q||(s.title+' '+(s.venue||'')).toLowerCase().includes(state.q))&&(state.q||state.cat||sampleTab(s)))}
function render(){
 const results=filtered();
 $('#rail').innerHTML=results.map(poster).join('');
 $('#none').classList.toggle('on',!!shows.length&&!results.length);
 if(!results.length&&shows.length){$('#none').innerHTML='<b>No hay experiencias en este filtro.</b>Prueba con otro día o categoría.'}
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
 sampleMode=real.length===0;
 shows=sampleMode?window.TadaaSamples.list():real;
 if(sampleMode)$('#none').innerHTML='<b>Contenido de muestra</b>Estos eventos son ficticios. Publica tus eventos desde el administrador para sustituirlos.';
 render();
}
load();
function openSample(id){
 const item=shows.find(x=>x.id===id&&x.sample);
 if(!item)return;
 const modal=$('#sampleDialog'),content=$('#sampleDialogContent');
 const date=new Date(item.starts_at).toLocaleString('es-MX',{dateStyle:'full',timeStyle:'short'});
 content.innerHTML=`<button class="sample-close" aria-label="Cerrar" data-sample-close>×</button><img src="${escape(item.hero_url)}" alt="Arte ilustrativo de ${escape(item.title)}"><div class="sample-details"><div class="sample-tag">EVENTO FICTICIO · VISTA DE MUESTRA</div><h2>${escape(item.title)}</h2><p>${escape(item.details)}</p><p><strong>${escape(item.venue)}</strong><br>${escape(date)}</p><p>Esta ficha permite probar el diseño y la navegación. No hay disponibilidad real, reservas ni cobros asociados.</p><a class="btn" href="login.html">Explorar mi cuenta ↗</a></div>`;
 modal.hidden=false;document.body.style.overflow='hidden';content.querySelector('[data-sample-close]').focus();
}
function closeSample(){const modal=$('#sampleDialog');modal.hidden=true;document.body.style.overflow=''}
$('#sampleDialog')?.addEventListener('click',e=>{if(e.target.id==='sampleDialog'||e.target.closest('[data-sample-close]'))closeSample()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeSample()});
function openCard(c){if(!c)return;const item=shows.find(x=>String(x.id)===String(c.dataset.id));if(item?.sample){openSample(item.id);return;}location.href='event.html?slug='+encodeURIComponent(c.dataset.slug||item?.slug||c.dataset.id)}$('#rail').onclick=e=>openCard(e.target.closest('[data-id]'));$('#rail').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-id]')){e.preventDefault();openCard(e.target)}};
$('#sf').onsubmit=e=>{e.preventDefault();state.q=$('#sq').value.trim().toLowerCase();state.tab=$('#sd')?.value||'hoy';render();$('#hoy').scrollIntoView({behavior:'smooth'})};
$('#tabs').onclick=e=>{if(e.target.classList.contains('tab')){state.cat='';state.q='';state.tab=e.target.dataset.t;$('#sq').value='';render()}};
$('#catgrid').onclick=e=>{const b=e.target.closest('[data-c]');if(b){state.cat=b.dataset.c;state.q='';render();$('#hoy').scrollIntoView({behavior:'smooth'})}};
$('#filtc').onclick=()=>{state.cat='';state.q='';render()};$('#nx').onclick=()=>$('#rail').scrollBy({left:660,behavior:'smooth'});$('#pv').onclick=()=>$('#rail').scrollBy({left:-660,behavior:'smooth'});
$('#cd').textContent='en un solo lugar';
const TXT='Hay noches que no se planean. Se sienten. Cuando se apagan las luces y empieza la música, nadie recuerda qué tan tarde compraste. Solo que estuviste ahí.';const HL=['noches','sienten.','luces','música,','ahí.'];$('#mt').innerHTML=TXT.split(' ').map(x=>`<span class="w${HL.includes(x)?' hl':''}">${x}</span>`).join(' ');
const mw=$$('#mt .w'),ms=$('#mani'),ma=$('#ma');function mani(){const r=ms.getBoundingClientRect(),n=Math.max(0,Math.min(1,-r.top/(r.height-innerHeight)));mw.forEach((el,i)=>{const t=Math.min(1,Math.max(0,n*mw.length*1.1-i));el.style.opacity=.13+.87*t;el.classList.toggle('lit',t>.9)});ma.classList.toggle('on',n>.9)}addEventListener('scroll',mani,{passive:true});mani();
const steps=$$('.step'),scr=$$('.sc');const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const id=e.target.dataset.s;steps.forEach(x=>x.classList.toggle('on',x.dataset.s===id));scr.forEach(x=>x.classList.toggle('on',x.dataset.s===id));}}),{rootMargin:'-42% 0px -42% 0px'});steps.forEach(e=>so.observe(e));
const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');reveal.unobserve(e.target)}}),{threshold:.12});$$('.rv').forEach(e=>reveal.observe(e));
$('#fc').onclick=e=>e.target.closest('button')?.classList.toggle('on');$('#af').onsubmit=async e=>{e.preventDefault();const email=$('#em').value.trim();try{await api.call('/api/v2/alerts','POST',{email,interests:$$('#fc button.on').map(x=>x.textContent),consent:true});$('#fm').textContent='¡Listo! Hemos registrado tus intereses.';$('#em').value=''}catch(err){$('#fm').textContent=err.message}};
})();
