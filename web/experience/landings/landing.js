/* TADAA! · Motor de landings de obras.
   Lee /api/v2/landings/:slug y arma la página con el tema, las secciones y la interacción firma de cada obra.
   ?s=<slug>  ·  &embed=1 (dentro de la presentación)  ·  &preview=1 (sin contador ni compra) */
(()=>{
'use strict';
const ICONS={"calendar":"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,48H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z","pin":"M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z","star":"M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z","ticket":"M232,104a8,8,0,0,0,8-8V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V96a8,8,0,0,0,8,8,24,24,0,0,1,0,48,8,8,0,0,0-8,8v32a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V160a8,8,0,0,0-8-8,24,24,0,0,1,0-48ZM32,167.2a40,40,0,0,0,0-78.4V64H88V192H32Z","clock":"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm56,112H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48a8,8,0,0,1,0,16Z","play":"M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z","pause":"M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z","next":"M208,40V216a8,8,0,0,1-16,0V146.77L72.43,221.55A15.95,15.95,0,0,1,48,208.12V47.88A15.95,15.95,0,0,1,72.43,34.45L192,109.23V40a8,8,0,0,1,16,0Z","plus":"M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z","minus":"M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128Z","x":"M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z","zoom":"M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM144,120H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h24a8,8,0,0,1,0,16Z","lightning":"M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z","music":"M212.92,17.71a7.89,7.89,0,0,0-6.86-1.46l-128,32A8,8,0,0,0,72,56V166.1A36,36,0,1,0,88,196V102.25l112-28V134.1A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.71Z","check":"M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z","sparkle":"M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z","heart":"M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z","arrow":"M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z","gift":"M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16h60a4,4,0,0,0,4-4V120H40V88h80v32h16V88h80v32H136v92a4,4,0,0,0,4,4h60a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM84.51,59a13.69,13.69,0,0,1-4.5-10A16.62,16.62,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92C109.71,70.39,94,67.43,84.51,59Zm87,0c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08,13.69,13.69,0,0,1,171.49,59Z","users":"M64.12,147.8a4,4,0,0,1-4,4.2H16a8,8,0,0,1-7.8-6.17,8.35,8.35,0,0,1,1.62-6.93A67.79,67.79,0,0,1,37,117.51a40,40,0,1,1,66.46-35.8,3.94,3.94,0,0,1-2.27,4.18A64.08,64.08,0,0,0,64,144C64,145.28,64,146.54,64.12,147.8Zm182-8.91A67.76,67.76,0,0,0,219,117.51a40,40,0,1,0-66.46-35.8,3.94,3.94,0,0,0,2.27,4.18A64.08,64.08,0,0,1,192,144c0,1.28,0,2.54-.12,3.8a4,4,0,0,0,4,4.2H240a8,8,0,0,0,7.8-6.17A8.33,8.33,0,0,0,246.17,138.89Zm-89,43.18a48,48,0,1,0-58.37,0A72.13,72.13,0,0,0,65.07,212,8,8,0,0,0,72,224H184a8,8,0,0,0,6.93-12A72.15,72.15,0,0,0,157.19,182.07Z","crown":"M239.75,90.81c0,.11,0,.21-.07.32L217,195a16,16,0,0,1-15.72,13H54.71A16,16,0,0,1,39,195L16.32,91.13c0-.11-.05-.21-.07-.32A16,16,0,0,1,44,77.39l33.67,36.29,35.8-80.29a1,1,0,0,0,0-.1,16,16,0,0,1,29.06,0,1,1,0,0,0,0,.1l35.8,80.29L212,77.39a16,16,0,0,1,27.71,13.42Z"};
const Q=new URLSearchParams(location.search);
const SLUG=(Q.get('s')||'').replace(/[^a-z0-9-]/g,'');
const EMBED=Q.get('embed')==='1';
const GUEST=(Q.get('para')||'').replace(/[<>]/g,'').trim().slice(0,60);
const PASES=Math.max(1,Math.min(6,parseInt(Q.get('pases'),10)||0));
const ROOT=new URL('../',location.href).href; // /experience/
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=p=>!p?'':/^(https?:|data:|\/)/.test(p)?p:ROOT+p;
const ic=(n,extra='')=>ICONS[n]?`<svg class="ic" viewBox="0 0 256 256" aria-hidden="true" ${extra}><path d="${ICONS[n]}"/></svg>`:'';
const money=n=>'$'+Math.round(n).toLocaleString('es-MX');
const mmss=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const LABELS={historia:'Historia',tacon:'El tacón',maquina:'Máquina del tiempo',camerino:'Camerino',personajes:'Personajes',canciones:'Canciones',galeria:'Galería',boletos:'Boletos',pases:'Mis pases',faq:'Preguntas'};
let C,toastT;

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2600)}

/* ---------- tema ---------- */
function theme(t){
 const r=document.documentElement.style,c=t.colors||{},f=t.fonts||{};
 for(const k of['bg','surface','ink','muted','accent','accent2','gold','dark','onDark','line','glow'])if(c[k])r.setProperty('--'+k,c[k]);
 if(f.display)r.setProperty('--fd',`'${f.display}',Impact,sans-serif`);
 if(f.body)r.setProperty('--fb',`'${f.body}',system-ui,sans-serif`);
 if(f.mono)r.setProperty('--fm',`'${f.mono}',ui-monospace,monospace`);
 if(f.script)r.setProperty('--fs',`'${f.script}',cursive`);
 r.setProperty('--case',t.displayCase==='upper'?'uppercase':'none');
 if(t.skew)r.setProperty('--skew',t.skew+'deg');
 if(f.url&&/^https:\/\/fonts\.googleapis\.com\//.test(f.url)){const l=document.createElement('link');l.rel='stylesheet';l.href=f.url;document.head.append(l)}
 document.body.dataset.mode=t.mode||'light';
 const m=$('meta[name=theme-color]');if(m)m.content=c.dark||'#000';
}

/* ---------- secciones ---------- */
const head=(s,center)=>`<div class="head rv"${center?' style="margin-inline:auto;text-align:center"':''}>${s.kicker?`<span class="kick"><i></i>${esc(s.kicker)}</span>`:''}<h2>${esc(s.title)}</h2>${s.text?`<p class="lead"${center?' style="margin-inline:auto"':''}>${esc(s.text)}</p>`:''}</div>`;

function navHTML(){
 const h=C.hero||{};
 const brand=h.logo?`<img src="${src(h.logo)}" alt="${esc(C.title)}">`:esc(C.brand||h.title||C.title);
 return `<header class="nav" id="nav"><div class="wrap in"><a class="brand" href="#top">${brand}</a><nav class="links" aria-label="Secciones">${(C.nav||[]).map(id=>`<a href="#${id}" data-id="${id}">${esc(LABELS[id]||id)}</a>`).join('')}</nav>${C.mode==='invite'?`<a class="btn pri sm" href="#pases">${ic('ticket')}Mis pases</a>`:`<a class="btn pri sm" href="#boletos">${ic('ticket')}Boletos</a>`}</div></header>`;
}

function countdownHTML(h){
 if(!h.countdown||isNaN(Date.parse(h.countdown)))return '';
 return `<div class="cd a4" data-cd="${esc(h.countdown)}" role="timer" aria-label="${esc(h.countdownLabel||'Cuenta regresiva')}"><span class="lab">${esc(h.countdownLabel||'')}</span>${['Días','Horas','Min','Seg'].map(l=>`<div><b>00</b><span>${l}</span></div>`).join('')}</div>`;
}
const chips=h=>(h.chips||[]).length?`<div class="chips a3">${h.chips.map(c=>`<span class="chip${c.hot?' hot':''}">${ic(c.icon||'star')}${esc(c.t)}</span>`).join('')}</div>`:'';
const ctas=h=>(h.ctas||[]).length?`<div class="ctas a5">${h.ctas.map(c=>`<a class="btn ${c.primary?'pri':'gho'}" href="${esc(c.href||'#boletos')}">${c.primary?ic('ticket'):''}${esc(c.t)}</a>`).join('')}</div>`:'';

function heroHTML(){
 const h=C.hero||{},L=h.layout||'boots';
 if(L==='invite')return inviteHeroHTML(h);
 if(L==='poster')return `<section class="hero h-poster" id="top" style="padding-top:20px"><div class="glow"></div><div class="wrap">
  <div class="frame art-in" id="poster">${boltSVG('b1')}${boltSVG('b2')}<img src="${src(h.art)}" alt="${esc(h.title)}" fetchpriority="high"></div>
  <div class="copy"><span class="kick a1"><i></i>${esc(h.kicker)}</span>
  <h1 class="a2 skew"><span class="l1">${esc(h.title)}</span>${h.titleB?`<span class="l2"><em>${esc(h.titleB)}</em></span>`:''}</h1>
  <p class="sub a3">${esc(h.sub)}</p>${chips(h)}${countdownHTML(h)}${ctas(h)}</div></div></section>`;
 if(L==='frame')return `<section class="hero" id="top"><div class="glow"></div><div class="wrap h-frame">
  <div>${h.presenter?`<p class="presenter a1">${esc(h.presenter)}</p>`:''}<span class="kick a1"><i></i>${esc(h.kicker)}</span>
  <h1 class="a2">${esc(h.title)}${h.script?`<span class="script">${esc(h.script)}</span>`:''}</h1>
  <p class="sub a3">${esc(h.sub)}</p>${chips(h)}${countdownHTML(h)}${ctas(h)}</div>
  <div class="pframe art-in" id="pframe"><span class="lights"></span><img src="${src(h.art)}" alt="${esc(h.title)}" fetchpriority="high"></div></div></section>`;
 return `<section class="hero" id="top"><div class="glow"></div><div class="wrap h-boots">
  <div>${h.presenter?`<p class="presenter a1">${presenterHTML(h.presenter)}</p>`:''}
  ${h.logo?`<h1 class="a2" style="font-size:0;line-height:0"><img class="logo" id="hlogo" src="${src(h.logo)}" alt="${esc(C.title)}" fetchpriority="high"></h1>`:`<h1 class="a2">${esc(C.title)}</h1>`}
  ${h.kicker?`<span class="kick a2"><i></i>${esc(h.kicker)}</span>`:''}
  <p class="sub a3"><b style="color:var(--ink)">${esc(h.title)}</b> ${esc(h.sub)}</p>${chips(h)}${countdownHTML(h)}${ctas(h)}</div>
  <div class="art3d art-in" id="art3d" role="button" tabindex="0" aria-label="Lanzar brillos"><img src="${src(h.art)}" alt="" draggable="false">${h.badge?`<span class="badge" id="badge"><span><b>${esc(h.badge.big)}</b>${esc(h.badge.small)}</span></span>`:''}</div>
 </div></section>`;
}
function presenterHTML(p){const m=String(p).match(/^(.*?)\s+(presenta.*)$/i);return m?`<b>${esc(m[1])}</b> ${esc(m[2])}`:esc(p)}
function boltSVG(cls){return `<svg class="bolt ${cls}" viewBox="0 0 64 120" aria-hidden="true"><path d="M38 0 6 66h22L18 120l40-74H34L46 0Z" fill="#fff"/><path d="M38 0 6 66h22L18 120l40-74H34L46 0Z" fill="none" stroke="var(--glow)" stroke-width="3"/></svg>`}


/* ---------- invitación (función de prensa, F&F, estreno) ---------- */
const guestName=()=>GUEST||((C.invite||{}).guest)||'Invitado';
const firstName=()=>GUEST?GUEST.split(/\s+/)[0]:'';
function inviteHeroHTML(h){const iv=C.invite||{};const fn=firstName();
 return `<section class="hero h-invite" id="top"><div class="beams" aria-hidden="true"><i></i><i></i></div><div class="floorglow" aria-hidden="true"></div>
 <div class="wrap inv-grid">
  <div class="inv-copy">${h.presenter?`<p class="presenter a1">${presenterHTML(h.presenter)}</p>`:''}
   <span class="pass-pill a1">${ic('ticket')}${esc(h.kicker||iv.event||'Invitación')}</span>
   ${h.logo?`<img class="logo a2" id="hlogo" src="${src(h.logo)}" alt="${esc(C.title)}" fetchpriority="high">`:''}
   <h1 class="a3">${fn?`<span class="who">${esc(fn)},</span> `:''}${esc(h.title||'Estás en la lista.')}</h1>
   <p class="sub a3">${esc(h.sub||'')}</p>
   <ul class="meta a4">${[iv.dateLabel&&['calendar',iv.dateLabel],iv.time&&['clock',iv.time+' h'],iv.venue&&['pin',iv.venue]].filter(Boolean).map(([i,t])=>`<li>${ic(i)}${esc(t)}</li>`).join('')}</ul>
   ${countdownHTML(h)}${ctas(h)}</div>
  <div class="art3d art-in" id="art3d" role="button" tabindex="0" aria-label="Lanzar confeti"><img src="${src(h.art)}" alt="" draggable="false">${h.badge?`<span class="badge" id="badge"><span><b>${esc(h.badge.big)}</b>${esc(h.badge.small)}</span></span>`:''}</div>
 </div></section>`}
function walletHTML(){const iv=C.invite;if(!iv)return '';const n=PASES||iv.passes||1,g=guestName(),f=firstName()||g.split(/\s+/)[0];
 const passes=Array.from({length:n},(_,k)=>({n:k+1,name:k===0?g:'Acompañante de '+f}));
 return `<section id="pases" class="dark wallet-sec"><div class="wrap wal-grid">
  <div>${head({kicker:iv.kicker||'Tu wallet',title:iv.title||'Tus pases',text:iv.text})}
   <ul class="idet rv">${(iv.details||[]).map(d=>`<li>${ic(d.icon||'star')}<span>${esc(d.t)}</span></li>`).join('')}</ul>
   <div class="ctas rv"><button class="btn pri" id="ics">${ic('calendar')}Agregar al calendario</button><a class="btn gho" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((iv.venue||'')+' Ciudad de México')}">${ic('pin')}Cómo llegar</a></div>
  </div>
  <div class="wallet rv" id="wallet" role="list" aria-label="Pases">${passes.map((p,k)=>`<article class="pass" role="listitem" tabindex="0" data-k="${k}" aria-label="Pase ${p.n} de ${n}: ${esc(p.name)}">
   <header class="ph"><img src="${src((C.hero||{}).logo)}" alt="${esc(C.title)}"><span><small>${esc(iv.event||'Invitación')}</small><b>Pase ${p.n} de ${n}</b></span></header>
   <div class="pb"><div class="pr"><span><small>Invitado</small><b>${esc(p.name)}</b></span><span class="r"><small>Zona</small><b>${esc(iv.zone||'General')}</b></span></div>
    <div class="pr"><span><small>Fecha</small><b>${esc(iv.dateShort||'')}</b></span><span><small>Función</small><b>${esc(iv.time||'')}</b></span><span class="r"><small>Acceso</small><b>${esc(iv.doors||'')}</b></span></div>
    <div class="qrbox"><div class="qr"><img alt="Código QR del pase ${p.n}" data-g="${esc(p.name)}" data-n="${p.n}"></div>
     <div class="qrmeta"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" class="rt"/><circle cx="24" cy="24" r="20" class="rp" data-ring/></svg><span>QR dinámico<br><b data-left>60</b> s para renovarse</span></div></div>
    <p class="pfoot">${ic('sparkle')}${esc(iv.dress||'Personal e intransferible')}</p></div></article>`).join('')}</div>
 </div></section>`}
function wireWallet(){const w=$('#wallet');if(!w)return;const ps=$$('.pass',w);let act=0;
 const lay=()=>{const full=ps[act].offsetHeight;let j=0;ps.forEach((p,k)=>{if(k===act){p.style.transform='translateY(0) scale(1)';p.style.zIndex=20;p.classList.add('on');p.setAttribute('aria-expanded','true')}else{p.style.transform=`translateY(${full+18+j*16}px) scale(${.95-j*.03})`;p.style.zIndex=10-j;p.classList.remove('on');p.setAttribute('aria-expanded','false');j++}});w.style.height=(full+18+Math.max(0,ps.length-1)*16+70)+'px'};
 ps.forEach((p,k)=>{const sel=()=>{if(k===act)return;act=k;lay()};p.addEventListener('click',sel);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sel()}})});
 const imgs=$$('img[data-n]',w),rings=$$('[data-ring]',w),lefts=$$('[data-left]',w);let lastM=-1;
 const qsrc=(im,m)=>'/api/v2/landings/'+SLUG+'/invite-qr?n='+im.dataset.n+'&g='+encodeURIComponent(im.dataset.g)+'&m='+m;
 const tick=()=>{const now=Date.now(),m=Math.floor(now/60000),left=60-Math.floor(now/1000)%60;
  lefts.forEach(e=>e.textContent=left);rings.forEach(r=>r.style.strokeDashoffset=String(126*(1-left/60)));
  if(m!==lastM){lastM=m;imgs.forEach(im=>{const pre=new Image();pre.onload=()=>{im.src=pre.src;if(!RM&&lastM>=0)im.animate([{transform:'rotateY(90deg)',opacity:.3},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.2,1.2,.4,1)'})};pre.src=qsrc(im,m)})}};
 tick();setInterval(tick,1000);requestAnimationFrame(lay);addEventListener('resize',lay);
 const ics=$('#ics');if(ics)ics.addEventListener('click',downloadICS);
}
function downloadICS(){const iv=C.invite||{};const f=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');if(!iv.start)return;
 const end=iv.end||new Date(Date.parse(iv.start)+2.5*3600e3).toISOString();
 const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TADAA!//Invitacion//ES','BEGIN:VEVENT','UID:'+SLUG+'-'+Date.parse(iv.start)+'@tadaa','DTSTAMP:'+f(Date.now()),'DTSTART:'+f(iv.start),'DTEND:'+f(end),'SUMMARY:'+(iv.event||C.title),'LOCATION:'+(iv.venue||''),'DESCRIPTION:Tus pases están en '+location.href.split('#')[0].replace(/\n/g,''),'END:VEVENT','END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));a.download=SLUG+'.ics';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Listo: abre el archivo para guardarlo en tu calendario')}

const marqueeHTML=()=>{const m=C.marquee||[];if(!m.length)return '';const one=m.map(t=>`<span>${esc(t)}<i>✦</i></span>`).join('');return `<div class="marquee" aria-hidden="true"><div class="tr">${one}${one}</div></div>`};
const statsHTML=()=>(C.stats||[]).length?`<div class="stats"><div class="wrap g">${C.stats.map(s=>`<div class="rv"><b><span data-count="${Number(s.n)||0}">0</span>${s.s?`<em>${esc(s.s)}</em>`:''}</b><span>${esc(s.l)}</span></div>`).join('')}</div></div>`:'';

function storyHTML(){
 const s=C.story;if(!s)return '';const ch=s.chapters||[];
 const imgs=[s.img,s.img2].filter(Boolean);
 return `<section id="historia"><div class="wrap">${head(s)}<div class="story">
  <div class="imgs${imgs.length>1?'':' tall'} rv">${imgs.map(i=>`<figure><img src="${src(i)}" alt="" loading="lazy" data-par></figure>`).join('')}</div>
  <div class="rv">${ch.length>1?`<div class="tabs" role="tablist" aria-label="Capítulos">${ch.map((c,i)=>`<button class="tab" role="tab" aria-selected="${i===0}" data-ch="${i}">${s.tabsAsEras?ic('clock'):''} ${esc(c.tab)}</button>`).join('')}</div>`:''}
  <div class="chap" id="chap" role="tabpanel" aria-live="polite"></div>
  ${(s.facts||[]).length?`<div class="facts">${s.facts.map(f=>`<div><b>${esc(f.n)}</b><span>${esc(f.l)}</span></div>`).join('')}</div>`:''}</div>
 </div>${s.quote?`<div class="quote rv"><blockquote class="skew">“${esc(s.quote)}”</blockquote>${s.quoteBy?`<cite>${esc(s.quoteBy)}</cite>`:''}</div>`:''}</div></section>`;
}

function signatureHTML(){
 const s=C.signature,kind=(C.theme||{}).signature;if(!s)return '';
 const id=s.id||(kind==='heel'?'tacon':'firma');
 if(kind==='timemachine'){const d=s.destinations||[];const now=new Date();const fmt=x=>x.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}).toUpperCase().replace(',','');
  return `<section class="sig" id="${id}"><div class="wrap">${head(s)}<div class="machine rv">
  <div class="pic"><img src="${src(s.img)}" alt="El DeLorean" id="tmImg" loading="lazy"></div>
  <div class="circuits">
   <div class="tc r"><small>DESTINATION TIME</small><div id="tcD">${esc(d[1]?.date||'NOV 05 1955')} · ${esc(d[1]?.h||'01:21')}</div></div>
   <div class="tc g"><small>PRESENT TIME</small><div id="tcP">${fmt(now)} · ${now.toTimeString().slice(0,5)}</div></div>
   <div class="tc a"><small>LAST TIME DEPARTED</small><div id="tcL">OCT 26 1985 · 01:20</div></div>
   <div class="dests" role="group" aria-label="Año destino">${d.map((x,i)=>`<button class="dest" aria-pressed="${i===1}" data-d="${i}">${esc(x.y)}</button>`).join('')}</div>
   <div class="speed"><b id="mph">0</b><span>MPH</span></div><div class="sbar"><i id="sbar"></i></div>
   <button class="btn pri hold" id="hold">${ic('lightning')}Mantén presionado para acelerar</button>
   <p class="smsg" id="smsg" aria-live="polite"></p></div></div></div></section>`}
 if(kind==='transform'){const st=s.steps||[];
  return `<section class="sig" id="${id}"><div class="wrap">${head(s,true)}<div class="rv">
  <div class="ba" id="ba"><img src="${src(s.before)}" alt="${esc(s.beforeLabel||'Antes')}" loading="lazy"><img class="after" src="${src(s.after)}" alt="${esc(s.afterLabel||'Después')}" loading="lazy">
   <span class="tg l">${esc(s.beforeLabel||'Antes')}</span><span class="tg r">${esc(s.afterLabel||'Después')}</span>
   <span class="line"></span><span class="knob">${ic('sparkle')}</span>
   <input type="range" min="0" max="100" value="12" aria-label="Transformación de ${esc(s.beforeLabel)} a ${esc(s.afterLabel)}" id="baR"></div>
  <p class="ba-step" id="baStep" aria-live="polite">${esc(st[0]||'')}</p></div></div></section>`}
 const v=s.verdicts||[];
 return `<section class="sig" id="${id}"><div class="wrap sig-grid">
  <div>${head(s)}<div class="meter rv"><label for="heel"><span>Altura del tacón</span><output id="heelOut">0″</output></label>
   <input class="big" type="range" id="heel" min="0" max="${Math.max(1,v.length-1)}" step="1" value="0">
   <p class="verdict" id="verdict" aria-live="polite">${esc(v[0]||'')}</p></div></div>
  <div class="stage-box rv"><span class="floor"></span><img src="${src(s.img)}" alt="" id="heelImg" loading="lazy"></div></div></section>`;
}

function charactersHTML(){
 const s=C.characters;if(!s)return '';
 return `<section id="personajes" class="${s.dark?'dark':''}"><div class="wrap">${head(s)}<div class="cards">${(s.cards||[]).map((c,i)=>`<article class="card rv" style="transition-delay:${i*40}ms">
  ${c.img?`<div class="ph"><img src="${src(c.img)}" alt="${esc(c.name)}" loading="lazy" style="object-position:${esc(c.pos||'50% 20%')}"></div>`:''}
  <div class="bd">${c.img?'':`<div class="mono">${esc(c.name.replace(/[«»"]/g,'').split(/\s+/).map(w=>w[0]).slice(0,2).join(''))}</div>`}
  <span class="role">${esc(c.role)}</span><h3>${esc(c.name)}</h3><p>${esc(c.text)}</p>
  ${c.more?`<div class="more" id="m${i}"><div><p>${esc(c.more)}</p></div></div><button class="tg" aria-expanded="false" aria-controls="m${i}">Leer más</button>`:''}
  ${c.quote?`<p class="q">“${esc(c.quote)}”</p>`:''}</div></article>`).join('')}</div></div></section>`;
}

function songsHTML(){
 const s=C.songs;if(!s)return '';const t=s.tracks||[];
 return `<section id="canciones" class="${s.dark?'dark':''}"><div class="wrap">${head(s)}<div class="songs">
  <div class="tracks rv">${t.map((x,i)=>`<button class="trk" data-t="${i}"><span class="pi">${ic('play')}</span><span><b>${esc(x.t)}</b><small>${esc(x.who)}${x.act?' · '+esc(x.act):''}</small></span><span class="t">${mmss(x.dur||200)}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></button>`).join('')}</div>
  <aside class="panel rv" id="panel" aria-live="polite"><div class="disc">${s.disc?`<img src="${src(s.disc)}" alt="">`:''}</div>
   <span class="kick"><i></i><span id="pWho">${esc(t[0]?.who||'')}</span></span><h3 id="pT">${esc(t[0]?.t||'')}</h3><p id="pD">${esc(t[0]?.d||'')}</p>
   <div class="pbar" id="pbar" role="slider" aria-label="Progreso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i id="pfill"></i></div>
   <div class="pr"><span id="pCur">0:00</span><span id="pDur">${mmss(t[0]?.dur||200)}</span></div>
   <div class="pctl"><button class="btn gho sm" id="pPrev" aria-label="Anterior">${ic('next','style="transform:scaleX(-1)"')}</button><button class="btn pri play" id="pPlay" aria-label="Reproducir">${ic('play')}</button><button class="btn gho sm" id="pNext" aria-label="Siguiente">${ic('next')}</button></div>
   ${s.credit?`<p class="credit">${esc(s.credit)}</p>`:''}</aside></div></div></section>`;
}

function galleryHTML(){
 const s=C.gallery;if(!s||!(s.images||[]).length)return '';
 return `<section id="galeria"><div class="wrap">${head(s)}<div class="gal rv">${s.images.map((g,i)=>`<button data-g="${i}" aria-label="Ver ${esc(g.cap||'foto')}"><img src="${src(g.src)}" alt="${esc(g.cap||'')}" loading="lazy"><span>${esc(g.cap||'')}</span></button>`).join('')}</div></div></section>`;
}

function tadaaHTML(){
 if(C.tadaa===false||!C.tickets)return '';const z=(C.tickets.zones||[]).map(x=>x.price).filter(Boolean);const lo=z.length?Math.min(...z):0;
 return `<section class="tadaa" id="tadaa"><div class="wrap">${head({kicker:'Se vende con TADAA!',title:'Así llega tu público',text:'La obra aparece en la cartelera de TADAA! para miles de colaboradores con convenio. Ellos compran en un toque y reciben su boleto digital en la Wallet.'})}
 <div class="tgrid">
  <div class="tcard rv"><span class="pill">Preventa para miembros</span><div class="tclock" id="tclock"><span>48</span><span>00</span><span>00</span></div><p>Los miembros entran 48 horas antes que el público general. Se llena la primera semana y se genera conversación.</p></div>
  <div class="tcard rv"><span class="pill">Tarifa de convenio</span><b class="big">${money(lo*.85)} <s style="font-size:22px">${money(lo)}</s></b><p>Desde, en la zona más accesible. El descuento sale de la membresía, no del productor.</p></div>
  <div class="tcard rv"><span class="pill">Boleto en la Wallet</span><b class="big" style="display:flex;align-items:center;gap:10px">${ic('ticket','style="width:44px;height:44px"')}QR</b><p>Acceso con QR dinámico, pases Family &amp; Friends y check-in del staff desde el celular.</p></div>
 </div></div></section>`;
}

function ticketsHTML(){
 const s=C.tickets;if(!s)return '';
 return `<section id="boletos"><div class="wrap">${head({kicker:s.kicker,title:s.title,text:s.venue?s.venue:''})}
 <div class="days rv" role="group" aria-label="Día">${(s.days||[]).map((d,i)=>`<button class="day" aria-pressed="${i===0}" data-day="${i}"><small>${esc(d.dow)}</small><b>${esc(d.day)}</b><span>${esc(d.mon)} · ${d.times.length} ${d.times.length>1?'funciones':'función'}</span></button>`).join('')}</div>
 <div class="tbox rv"><div class="l"><p class="lbl">Horario</p><div class="pills" id="tTimes" role="group" aria-label="Horario"></div>
  <p class="lbl">Zona</p><div class="pills" id="tZones" role="group" aria-label="Zona">${(s.zones||[]).map((z,i)=>`<button class="pl" aria-pressed="${i===1||(s.zones.length===1)}" data-z="${i}">${esc(z.name)} · ${money(z.price)}</button>`).join('')}</div>
  <p class="lbl">Boletos</p><div class="qty"><button id="qm" aria-label="Quitar uno">${ic('minus')}</button><b id="qv" aria-live="polite">2</b><button id="qp" aria-label="Agregar uno">${ic('plus')}</button></div></div>
  <div class="r"><span class="live"><i></i>Disponibilidad en vivo con TADAA!</span><div class="sum" id="sum"></div>
  <button class="btn gold" id="buy" style="width:100%;margin-top:18px">${ic('ticket')}<span id="buyT">Apartar lugares</span></button>
  ${s.note?`<p class="tnote">${esc(s.note)}</p>`:''}</div></div></div></section>`;
}

const faqHTML=()=>(C.faq||[]).length?`<section id="faq"><div class="wrap">${head({kicker:'Antes de ir',title:'Preguntas frecuentes'})}<div class="faq">${C.faq.map((f,i)=>`<div class="fq rv"><button aria-expanded="false" aria-controls="fa${i}">${esc(f.q)}${ic('plus')}</button><div class="a" id="fa${i}"><div><p>${esc(f.a)}</p></div></div></div>`).join('')}</div></div></section>`:'';
const ctaHTML=()=>C.cta?`<section class="cta"><div class="wrap rv"><h2 class="skew">${esc(C.cta.title)}</h2><p>${esc(C.cta.text)}</p><a class="btn" href="#boletos" id="ctaBtn">${ic('sparkle')}Quiero mis boletos</a></div></section>`:'';
const footHTML=()=>`<footer><div class="wrap">${esc(C.footer||C.title)}</div></footer>`;

function render(){
 const map=C.mode==='invite'?{historia:storyHTML,personajes:charactersHTML,canciones:songsHTML,pases:walletHTML}:{historia:storyHTML,personajes:charactersHTML,canciones:songsHTML,boletos:()=>tadaaHTML()+ticketsHTML()};
 const sigId=(C.signature||{}).id||((C.theme||{}).signature==='heel'?'tacon':'firma');map[sigId]=signatureHTML;
 const done=new Set();let body='';
 for(const id of(C.nav||[])){if((id==='boletos'||id==='pases')&&!done.has('galeria')){body+=galleryHTML();done.add('galeria')}if(map[id]&&!done.has(id)){body+=map[id]();done.add(id)}}
 for(const[id,fn]of Object.entries(map))if(!done.has(id)){if((id==='boletos'||id==='pases')&&!done.has('galeria')){body+=galleryHTML();done.add('galeria')}body+=fn();done.add(id)}
 if(!done.has('galeria'))body+=galleryHTML();
 $('#app').innerHTML=navHTML()+`<main>${heroHTML()}${marqueeHTML()}${statsHTML()}${body}${faqHTML()}${ctaHTML()}</main>`+footHTML();
 document.title=`${C.title} · TADAA!`;
}

/* ---------- partículas de ambiente ---------- */
function ambient(kind){
 const cv=$('#ambient');if(!cv||RM||!kind)return;const x=cv.getContext('2d');let W,H,dpr,P=[],raf,bolts=0;
 const col=getComputedStyle(document.documentElement);const gold=col.getPropertyValue('--gold').trim(),acc=col.getPropertyValue('--accent').trim(),glow=col.getPropertyValue('--glow').trim()||gold;
 const size=()=>{dpr=Math.min(2,devicePixelRatio||1);W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px'};
 size();addEventListener('resize',size);
 const n=kind==='stars'?120:kind==='feathers'?16:46;
 for(let i=0;i<n;i++)P.push({x:Math.random(),y:Math.random(),r:Math.random(),p:Math.random()*6.28,s:.3+Math.random()*.7,rot:Math.random()*6.28});
 let shoot=null;
 const feather=(px,py,s,rot,a)=>{x.save();x.translate(px,py);x.rotate(rot);x.globalAlpha=a;x.strokeStyle=acc;x.fillStyle=acc+'33';x.lineWidth=1.2*dpr;const L=26*s*dpr;
  x.beginPath();x.moveTo(0,-L);x.quadraticCurveTo(L*.45,-L*.2,0,L);x.quadraticCurveTo(-L*.45,-L*.2,0,-L);x.fill();x.beginPath();x.moveTo(0,-L);x.lineTo(0,L*1.15);x.stroke();x.restore()};
 const star=(px,py,r,a,c)=>{x.globalAlpha=a;x.fillStyle=c;x.beginPath();x.moveTo(px,py-r);x.quadraticCurveTo(px,py,px+r,py);x.quadraticCurveTo(px,py,px,py+r);x.quadraticCurveTo(px,py,px-r,py);x.quadraticCurveTo(px,py,px,py-r);x.fill()};
 const tick=t=>{x.clearRect(0,0,W,H);const sc=scrollY*.15*dpr;
  for(const q of P){q.p+=.02*q.s;
   if(kind==='stars'){const a=.25+.6*Math.abs(Math.sin(q.p));x.globalAlpha=a;x.fillStyle=q.r>.85?glow:'#fff';x.beginPath();x.arc(q.x*W,((q.y*H-sc*q.s)%H+H)%H,(q.r*1.4+.3)*dpr,0,6.28);x.fill()}
   else if(kind==='feathers'){q.y+=.0006*q.s;q.x+=Math.sin(q.p*.6)*.0007;q.rot+=Math.sin(q.p)*.01;if(q.y>1.08){q.y=-.08;q.x=Math.random()}feather(q.x*W,q.y*H,q.s,q.rot+Math.sin(q.p)*.5,.35)}
   else{const a=Math.max(0,Math.sin(q.p))*.75;star(q.x*W,((q.y*H-sc*q.s*.6)%H+H)%H,(2+q.r*5)*dpr*a,a,q.r>.6?gold:acc)}}
  if(kind==='stars'){if(!shoot&&Math.random()<.004)shoot={x:Math.random()*W*.7,y:Math.random()*H*.4,l:0};
   if(shoot){shoot.l+=14*dpr;x.globalAlpha=Math.max(0,1-shoot.l/(500*dpr));x.strokeStyle='#fff';x.lineWidth=2*dpr;x.beginPath();x.moveTo(shoot.x+shoot.l,shoot.y+shoot.l*.4);x.lineTo(shoot.x+shoot.l-80*dpr,shoot.y+shoot.l*.4-32*dpr);x.stroke();if(shoot.l>500*dpr)shoot=null}}
  x.globalAlpha=1;raf=requestAnimationFrame(tick)};
 raf=requestAnimationFrame(tick);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(tick)});
}

/* ---------- confeti de papel y listones ----------
   Papelitos que giran en 3D (se ven por el frente y por el revés) y listones que ondean al caer.
   Cañonazo al entrar, lluvia mientras la portada está en pantalla y ráfagas al tocar. */
const CF={cv:null,x:null,P:[],R:[],raf:0,rain:0,dpr:1,t0:0,cols:null,acc:null};
function cfColors(){if(CF.cols)return;const t=(C&&C.theme&&C.theme.confetti)||{},cs=getComputedStyle(document.documentElement);
 CF.cols=(t.colors&&t.colors.length?t.colors:[cs.getPropertyValue('--accent'),cs.getPropertyValue('--accent2'),cs.getPropertyValue('--gold')]).map(s=>String(s).trim());CF.acc=(t.accents||[]).map(s=>String(s).trim())}
function cfSize(){if(!CF.cv){CF.cv=$('#fx');CF.x=CF.cv.getContext('2d')}CF.dpr=Math.min(2,devicePixelRatio||1);CF.cv.width=innerWidth*CF.dpr;CF.cv.height=innerHeight*CF.dpr;CF.cv.style.width=innerWidth+'px';CF.cv.style.height=innerHeight+'px'}
const shade=(hex,k)=>{const m=String(hex).match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);if(!m)return hex;return '#'+[1,2,3].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(m[i],16)*k))).toString(16).padStart(2,'0')).join('')};
function cfPick(){return CF.acc.length&&Math.random()<.1?CF.acc[Math.random()*CF.acc.length|0]:CF.cols[Math.random()*CF.cols.length|0]}
function cfPaper(x,y,vx,vy){const c=cfPick(),d=CF.dpr;CF.P.push({x,y,vx,vy,w:(7+Math.random()*7)*d,h:(4+Math.random()*4)*d,a:Math.random()*6.28,va:(Math.random()-.5)*.2,f:Math.random()*6.28,vf:.08+Math.random()*.12,sw:Math.random()*6.28,c,b:shade(c,.62)})}
function cfRibbon(x,y,vx,vy){const c=cfPick(),d=CF.dpr,n=9,pts=[];for(let i=0;i<n;i++)pts.push({x,y:y-i*6*d});CF.R.push({pts,vx,vy,ph:Math.random()*6.28,c,b:shade(c,.6),w:(5+Math.random()*3)*d,life:1})}
function cfSpawnBurst(px,py,n,spread,power,dir=-Math.PI/2){const d=CF.dpr;for(let i=0;i<n;i++){const a=dir+(Math.random()-.5)*spread,v=(power*.55+Math.random()*power*.45)*d;
  (i%11===0?cfRibbon:cfPaper)(px*d,py*d,Math.cos(a)*v,Math.sin(a)*v)}if(!CF.raf){CF.t0=CF.t0||performance.now();CF.raf=requestAnimationFrame(cfTick)}}
function cfTick(now){const x=CF.x,d=CF.dpr,W=CF.cv.width,H=CF.cv.height;x.clearRect(0,0,W,H);
 if(CF.rain){const age=(now-CF.t0)/1000,every=age<6?3:age<14?7:14;if((now/16|0)%every===0&&CF.P.length<260)cfPaper(Math.random()*W,-20*d,(Math.random()-.5)*1.2*d,(1+Math.random())*d);if(Math.random()<.012&&CF.R.length<10)cfRibbon(Math.random()*W,-30*d,0,1.5*d)}
 CF.P=CF.P.filter(p=>p.y<H+40*d);
 for(const p of CF.P){p.vy=Math.min(p.vy+.16*d,(2.2+Math.sin(p.f)*.6)*d);p.vx*=.985;p.sw+=.04;p.x+=p.vx+Math.sin(p.sw)*.7*d;p.y+=p.vy;p.a+=p.va;p.f+=p.vf;
  const s=Math.cos(p.f);x.save();x.translate(p.x,p.y);x.rotate(p.a);x.scale(1,s);x.fillStyle=s>0?p.c:p.b;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore()}
 CF.R=CF.R.filter(r=>r.pts[r.pts.length-1].y<H+60*d);
 for(const r of CF.R){r.vy=Math.min(r.vy+.14*d,2.6*d);r.vx*=.98;r.ph+=.12;const h=r.pts[0];h.x+=r.vx+Math.sin(r.ph)*1.6*d;h.y+=r.vy;
  for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,seg=6*d;b.x=a.x+dx/L*seg;b.y=a.y+dy/L*seg}
  for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],tw=Math.sin(r.ph+i*.8);x.strokeStyle=tw>0?r.c:r.b;x.lineWidth=Math.max(1,r.w*Math.abs(tw));x.lineCap='round';x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}
 CF.raf=(CF.P.length||CF.R.length||CF.rain)?requestAnimationFrame(cfTick):0;if(!CF.raf)x.clearRect(0,0,W,H)}
function burst(cx,cy,n=80){if(RM)return;cfColors();cfSize();cfSpawnBurst(cx,cy,n,Math.PI*1.1,15)}
const burstAt=el=>{const r=el.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2)};
function confettiIntro(){const t=((C.theme||{}).confetti);if(!t||RM)return;cfColors();cfSize();addEventListener('resize',cfSize);
 if(t.intro!==false){const H=innerHeight,W=innerWidth;setTimeout(()=>{cfSpawnBurst(0,H,120,.6,24,-Math.PI/3.2);cfSpawnBurst(W,H,120,.6,24,-Math.PI+Math.PI/3.2)},350);setTimeout(()=>cfSpawnBurst(W/2,H*.15,60,Math.PI*2,9),900)}
 if(t.rain!==false){CF.rain=1;CF.t0=performance.now();const hero=$('.hero');if(hero)new IntersectionObserver(es=>{CF.rain=es[0].isIntersecting?1:0;if(CF.rain&&!CF.raf)CF.raf=requestAnimationFrame(cfTick)},{threshold:.15}).observe(hero);if(!CF.raf)CF.raf=requestAnimationFrame(cfTick)}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(CF.raf);CF.raf=0}else if(CF.P.length||CF.rain)CF.raf=requestAnimationFrame(cfTick)})}

/* ---------- interacción ---------- */
function wireNav(){
 const nav=$('#nav'),prog=$('#prog');let tk=false;
 const on=()=>{tk=false;const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;nav.classList.toggle('solid',y>40);prog.style.width=(h>0?y/h*100:0)+'%';
  $$('[data-par]').forEach(im=>{const r=im.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;im.style.transform=`translateY(${((r.top+r.height/2)/innerHeight-.5)*-24}px) scale(1.08)`})};
 addEventListener('scroll',()=>{if(!tk){tk=true;requestAnimationFrame(on)}},{passive:true});on();
 const links=$$('.links a');const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.dataset.id===e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
 links.forEach(a=>{const s=document.getElementById(a.dataset.id);if(s)io.observe(s)});
}
function wireReveal(){
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('on');io.unobserve(e.target);$$('[data-count]',e.target).forEach(count)}),{rootMargin:'0px 0px -8% 0px'});
 $$('.rv').forEach(el=>io.observe(el));
}
function count(el){const to=+el.dataset.count;if(RM||to<=0){el.textContent=to;return}const big=to>=1000,t0=performance.now(),D=big?1400:1000;
 const step=t=>{const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,4);el.textContent=Math.round(big?to-(1-e)*Math.min(to,60):to*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function wireCountdown(){
 $$('[data-cd]').forEach(el=>{const T=Date.parse(el.dataset.cd),bs=$$('b',el);
  const up=()=>{let s=Math.max(0,Math.floor((T-Date.now())/1e3));const v=[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0'));
   bs.forEach((b,i)=>{if(b.textContent!==v[i]){b.textContent=v[i];if(!RM){b.classList.remove('flip');void b.offsetWidth;b.classList.add('flip')}}})};up();setInterval(up,1000)});
 const tc=$('#tclock');if(tc){let s=48*3600-1;setInterval(()=>{s=s>0?s-1:48*3600;const v=[Math.floor(s/3600),Math.floor(s%3600/60),s%60];$$('span',tc).forEach((e,i)=>e.textContent=String(v[i]).padStart(2,'0'))},1000)}
}
function wireHero(){
 const hero=$('.hero');if(!hero)return;
 hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');hero.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')});
 const tilt=(el,amt,img)=>{if(!el||RM)return;let raf=0,tx=0,ty=0,cx=0,cy=0;
  const loop=()=>{cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;(img||el).style.transform=`perspective(900px) rotateY(${cx*amt}deg) rotateX(${-cy*amt*.6}deg) translate3d(${cx*10}px,${cy*6}px,0)`;raf=Math.abs(tx-cx)+Math.abs(ty-cy)>.001?requestAnimationFrame(loop):0};
  hero.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width)));ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height)));if(!raf)raf=requestAnimationFrame(loop)});
  hero.addEventListener('pointerleave',()=>{tx=ty=0;if(!raf)raf=requestAnimationFrame(loop)})};
 const a=$('#art3d');if(a){tilt(a,10,$('img',a));const go=()=>{burstAt(a);toast('¡Everybody say yeah!')};a.addEventListener('click',go);a.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})}
 const b=$('#badge');if(b)b.addEventListener('click',e=>{e.stopPropagation();burstAt(b)});
 tilt($('#pframe'),8);
 const po=$('#poster');if(po){const img=$('img',po);requestAnimationFrame(()=>img.style.transform='scale(1)');
  if(!RM){const strike=()=>{$$('.bolt',po).forEach((bl,i)=>setTimeout(()=>{bl.classList.remove('strike');void bl.offsetWidth;bl.classList.add('strike')},i*220));setTimeout(strike,5200+Math.random()*3000)};setTimeout(strike,1400)}}
}
function wireStory(){
 const s=C.story;if(!s)return;const ch=s.chapters||[],box=$('#chap');let cur=0;
 const show=(i,dir)=>{cur=i;const c=ch[i]||{};box.innerHTML=`<h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>`;if(dir&&!RM){box.style.setProperty('--d',dir);box.classList.remove('swap');void box.offsetWidth;box.classList.add('swap')}$$('.tab').forEach((t,j)=>t.setAttribute('aria-selected',j===i))};
 show(0);$$('.tab').forEach(t=>t.addEventListener('click',()=>{const i=+t.dataset.ch;if(i!==cur)show(i,i>cur?1:-1)}));
 const tl=$('.tabs');if(tl)tl.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const i=(cur+(e.key==='ArrowRight'?1:-1)+ch.length)%ch.length;show(i,e.key==='ArrowRight'?1:-1);$$('.tab')[i].focus()});
}
function wireSignature(){
 const kind=(C.theme||{}).signature,s=C.signature||{};
 if(kind==='heel'&&$('#heel')){const r=$('#heel'),v=s.verdicts||[],img=$('#heelImg'),out=$('#heelOut'),vd=$('#verdict');let last=0;
  const up=()=>{const n=+r.value,max=+r.max;r.style.setProperty('--v',(n/max*100)+'%');out.textContent=n+'″';vd.textContent=v[n]||'';
   img.style.transform=`translateY(${-n*.9}%) rotate(${-n*1.1}deg) scale(${1+n*.006})`;
   if(n===max&&last!==max){burstAt(img);toast('Eso es una bota de Lola')}last=n};r.addEventListener('input',up);up()}
 if(kind==='transform'&&$('#baR')){const r=$('#baR'),ba=$('#ba'),st=s.steps||[],p=$('#baStep');let lastI=0,done=false;
  const up=()=>{const n=+r.value;ba.style.setProperty('--p',n+'%');const i=Math.min(st.length-1,Math.floor(n/100*st.length));if(i!==lastI){lastI=i;p.textContent=st[i]||'';if(!RM)p.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(0,0,.2,1)'})}
   if(n>=98&&!done){done=true;burstAt(ba)}if(n<80)done=false};r.addEventListener('input',up);up();
  // pista inicial: el control se asoma solo una vez cuando la sección entra
  if(!RM){const io=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;io.disconnect();let t0=performance.now();const a=t=>{const k=Math.min(1,(t-t0)/1400),e=Math.sin(k*Math.PI);r.value=12+e*30;up();if(k<1)requestAnimationFrame(a)};requestAnimationFrame(a)},{threshold:.5});io.observe(ba)}}
 if(kind==='timemachine'&&$('#hold')){const d=s.destinations||[];let dest=1,mph=0,holding=false,raf=0,jumped=false;
  const D=$('#tcD'),P=$('#tcP'),L=$('#tcL'),mphE=$('#mph'),bar=$('#sbar'),msg=$('#smsg'),img=$('#tmImg'),hold=$('#hold');
  const led=el=>{if(RM)return;el.classList.remove('chg');void el.offsetWidth;el.classList.add('chg')};
  $$('.dest').forEach(b=>b.addEventListener('click',()=>{dest=+b.dataset.d;$$('.dest').forEach(x=>x.setAttribute('aria-pressed',x===b));D.textContent=`${d[dest].date} · ${d[dest].h}`;led(D);msg.textContent=`Destino programado: ${d[dest].y}.`}));
  const loop=()=>{mph=holding?Math.min(88,mph+(mph<60?1.1:.55)):Math.max(0,mph-2.4);mphE.textContent=Math.round(mph);bar.style.width=(mph/88*100)+'%';
   img.style.transform=`scale(${1+mph/88*.08}) translateX(${holding?(Math.random()-.5)*mph/30:0}px)`;img.style.filter=mph>70?`drop-shadow(0 0 ${mph-60}px var(--glow)) saturate(1.3)`:'';
   if(mph>=88&&!jumped){jumped=true;travel()}if(mph<40)jumped=false;raf=(holding||mph>0)?requestAnimationFrame(loop):0};
  const travel=()=>{L.textContent=P.textContent;P.textContent=`${d[dest].date} · ${d[dest].h}`;led(L);led(P);msg.textContent=`¡88 MPH! Bienvenido a ${d[dest].y}.`;
   if(!RM){const f=$('#flash');f.animate([{opacity:0},{opacity:1,offset:.15},{opacity:0}],{duration:900,easing:'ease-out'});document.body.classList.remove('shake');void document.body.offsetWidth;document.body.classList.add('shake')}
   burstAt(img);holding=false;hold.blur()};
  const start=e=>{e.preventDefault();holding=true;msg.textContent='Acelerando…';if(!raf)raf=requestAnimationFrame(loop)},stop=()=>{if(holding&&mph<88)msg.textContent=mph>10?`Llegaste a ${Math.round(mph)} mph. Necesitas 88.`:'';holding=false};
  hold.addEventListener('pointerdown',start);addEventListener('pointerup',stop);hold.addEventListener('pointercancel',stop);
  hold.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)start(e)});hold.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')stop()})}
}
function wireCards(){
 $$('.card').forEach(c=>{
  const t=$('.tg',c);if(t)t.addEventListener('click',()=>{const o=c.classList.toggle('open');t.setAttribute('aria-expanded',o);t.textContent=o?'Leer menos':'Leer más'});
  if(RM||matchMedia('(hover:none)').matches)return;
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transition='transform .1s ease-out,box-shadow .2s';c.style.transform=`perspective(800px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`});
  c.addEventListener('pointerleave',()=>{c.style.transition='';c.style.transform=''})});
}
function wireSongs(){
 const t=(C.songs||{}).tracks||[];if(!t.length)return;let cur=0,pos=0,playing=false,last=0,raf=0;
 const P=$('#panel'),btns=$$('.trk'),fill=$('#pfill'),bar=$('#pbar'),play=$('#pPlay');
 const paint=()=>{const d=t[cur].dur||200;fill.style.width=(pos/d*100)+'%';$('#pCur').textContent=mmss(pos);bar.setAttribute('aria-valuenow',Math.round(pos/d*100))};
 const sel=i=>{cur=(i+t.length)%t.length;pos=0;const x=t[cur];$('#pT').textContent=x.t;$('#pWho').textContent=x.who;$('#pD').textContent=x.d||'';$('#pDur').textContent=mmss(x.dur||200);
  btns.forEach((b,j)=>{b.setAttribute('aria-current',j===cur);b.classList.toggle('playing',j===cur&&playing)});paint();
  if(!RM)$('h3',P).animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(0,0,.2,1)'})};
 const setPlay=v=>{playing=v;P.classList.toggle('playing',v);play.innerHTML=ic(v?'pause':'play');play.setAttribute('aria-label',v?'Pausar':'Reproducir');btns.forEach((b,j)=>b.classList.toggle('playing',j===cur&&v));
  if(v){last=performance.now();if(!raf)raf=requestAnimationFrame(loop)}};
 const loop=n=>{if(!playing){raf=0;return}pos+=(n-last)/1000*4;last=n;if(pos>=(t[cur].dur||200)){sel(cur+1)}paint();raf=requestAnimationFrame(loop)};
 btns.forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.t;if(i===cur){setPlay(!playing)}else{sel(i);setPlay(true)}}));
 play.addEventListener('click',()=>setPlay(!playing));$('#pNext').addEventListener('click',()=>{sel(cur+1);if(playing)setPlay(true)});$('#pPrev').addEventListener('click',()=>{sel(cur-1);if(playing)setPlay(true)});
 bar.addEventListener('click',e=>{const r=bar.getBoundingClientRect();pos=(e.clientX-r.left)/r.width*(t[cur].dur||200);paint()});
 bar.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){pos=Math.max(0,Math.min(t[cur].dur||200,pos+(e.key==='ArrowRight'?10:-10)));paint()}});
 sel(0);
}
function wireGallery(){
 const g=((C.gallery||{}).images)||[];if(!g.length)return;let i=0,opener=null;
 const lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Galería');lb.hidden=true;
 lb.innerHTML=`<figure><img alt=""><figcaption style="margin-top:10px;font-weight:700"></figcaption></figure><button class="x" aria-label="Cerrar">${ic('x')}</button>${g.length>1?`<button class="nv p" aria-label="Anterior">${ic('next','style="transform:scaleX(-1)"')}</button><button class="nv n" aria-label="Siguiente">${ic('next')}</button>`:''}`;
 document.body.append(lb);const im=$('img',lb),cap=$('figcaption',lb);
 const show=k=>{i=(k+g.length)%g.length;im.src=src(g[i].src);im.alt=g[i].cap||'';cap.textContent=g[i].cap||''};
 const open=k=>{opener=document.activeElement;show(k);lb.hidden=false;requestAnimationFrame(()=>lb.classList.add('open'));$('.x',lb).focus();document.body.style.overflow='hidden'};
 const close=()=>{lb.classList.remove('open');document.body.style.overflow='';setTimeout(()=>{lb.hidden=true},250);opener&&opener.focus()};
 $$('[data-g]').forEach(b=>b.addEventListener('click',()=>open(+b.dataset.g)));
 lb.addEventListener('click',e=>{if(e.target===lb)close()});$('.x',lb).addEventListener('click',close);
 $('.nv.p',lb)?.addEventListener('click',()=>show(i-1));$('.nv.n',lb)?.addEventListener('click',()=>show(i+1));
 addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1)});
}
function wireTickets(){
 const s=C.tickets;if(!s)return;const days=s.days||[],zones=s.zones||[];let day=0,time=0,zone=zones.length>1?1:0,qty=2,shown=0;
 const times=$('#tTimes'),sum=$('#sum'),qv=$('#qv');
 const paintTimes=()=>{times.innerHTML=(days[day]?.times||[]).map((t,i)=>`<button class="pl" aria-pressed="${i===time}" data-tm="${i}">${ic('clock')} ${esc(t)}</button>`).join('');
  $$('[data-tm]',times).forEach(b=>b.addEventListener('click',()=>{time=+b.dataset.tm;paintTimes();paintSum()}))};
 const paintSum=()=>{const d=days[day]||{},z=zones[zone]||{price:0},sub=z.price*qty,fee=Math.round(sub*.08);
  sum.innerHTML=`<div><span>Función</span><b>${esc(d.dow||'')} ${esc(d.day||'')} ${esc(d.mon||'')} · ${esc((d.times||[])[time]||'')}</b></div><div><span>${esc(z.name||'')} × ${qty}</span><b>${money(sub)}</b></div><div><span>Cargo por servicio</span><b>${money(fee)}</b></div><div class="tot"><span>Total</span><b id="tot">${money(shown)}</b></div>`;
  const to=sub+fee,from=shown,t0=performance.now(),el=$('#tot');if(RM){shown=to;el.textContent=money(to);return}
  const step=n=>{const k=Math.min(1,(n-t0)/420),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;el.textContent=money(shown);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)};
 $$('[data-day]').forEach(b=>b.addEventListener('click',()=>{day=+b.dataset.day;time=0;$$('[data-day]').forEach(x=>x.setAttribute('aria-pressed',x===b));paintTimes();paintSum()}));
 $$('[data-z]').forEach(b=>b.addEventListener('click',()=>{zone=+b.dataset.z;$$('[data-z]').forEach(x=>x.setAttribute('aria-pressed',x===b));paintSum()}));
 const bump=()=>{qv.textContent=qty;if(!RM){qv.classList.remove('bump');void qv.offsetWidth;qv.classList.add('bump')}paintSum()};
 $('#qm').addEventListener('click',()=>{if(qty>1){qty--;bump()}});$('#qp').addEventListener('click',()=>{if(qty<10){qty++;bump()}else toast('Máximo 10 boletos por compra')});
 const buy=$('#buy');if(s.eventSlug){$('#buyT').textContent='Comprar en TADAA!'}
 buy.addEventListener('click',()=>{if(s.eventSlug&&!EMBED){location.href=ROOT+'#evento/'+encodeURIComponent(s.eventSlug);return}burstAt(buy);toast(s.eventSlug?'En la plataforma esto abre la compra en TADAA!':'Lugares apartados (demostración). En la versión final la compra se hace en TADAA!')});
 paintTimes();paintSum();
}
function wireFaq(){$$('.fq button').forEach(b=>b.addEventListener('click',()=>{const f=b.parentElement,o=f.classList.toggle('open');b.setAttribute('aria-expanded',o)}))}
function wireCta(){const b=$('#ctaBtn');if(b)b.addEventListener('click',()=>burstAt(b))}

/* ---------- arranque ---------- */
async function boot(){
 if(EMBED)document.body.classList.add('embed');
 if(!SLUG)return fail('Falta indicar la obra. Abre esta página con ?s=nombre-de-la-obra.');
 let r;try{r=await fetch('/api/v2/landings/'+SLUG,{credentials:'same-origin'})}catch{return fail('No pudimos conectar con TADAA!. Revisa tu conexión y recarga la página.')}
 if(!r.ok)return fail(r.status===404?'Esta landing no existe o ya no está publicada.':'No pudimos cargar la landing. Recarga la página en un momento.');
 const j=await r.json();C=Object.assign({title:j.landing.title},j.landing.config||{});
 theme(C.theme||{});document.body.classList.toggle('inv',C.mode==='invite');render();
 document.body.classList.remove('boot-hide');document.body.classList.add('in-a');
 ambient((C.theme||{}).particles);confettiIntro();wireWallet();
 $$('a[href="#calendario"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();downloadICS()}));wireNav();wireReveal();wireCountdown();wireHero();wireStory();wireSignature();wireCards();wireSongs();wireGallery();wireTickets();wireFaq();wireCta();
 if(location.hash){const t=document.getElementById(location.hash.slice(1));if(t)setTimeout(()=>t.scrollIntoView(),60)}
}
function fail(msg){document.body.classList.remove('boot-hide');$('#app').innerHTML=`<div style="min-height:100svh;display:grid;place-items:center;padding:24px;text-align:center"><div><h1 style="font:800 34px/1.1 system-ui;margin:0 0 10px">No encontramos esta obra</h1><p style="color:#666;max-width:46ch;margin:0 auto 18px">${esc(msg)}</p><a class="btn pri" href="${ROOT}">Ir a TADAA!</a></div></div>`}
boot();
})();
