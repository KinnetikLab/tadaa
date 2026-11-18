/* TADAA v6: un solo preloader en la página de DESTINO.
 * Salida: solo fade negro. Entrada: cerrar telón -> logo -> abrir.
 */
(function(){
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 let busy=false, queued=null, bootStarted=false;
 const FADE_KEY='tadaa-fade-auth-v7';
 function takeFade(){try{const x=sessionStorage.getItem(FADE_KEY)==='1';sessionStorage.removeItem(FADE_KEY);return x}catch{return false}}
 function setFade(){try{sessionStorage.setItem(FADE_KEY,'1')}catch{}}
 function veil(active=false,internal=false){
  const el=document.createElement('div');
  el.className='tadaa-veil'+(active?' visible':'')+(internal?' view-veil':'');
  el.setAttribute('aria-hidden','true');document.body.appendChild(el);return el;
 }
 function curtain(){
  const el=document.createElement('div');el.className='curtain open';el.setAttribute('aria-hidden','true');
  const letters=[...'tadaa!'].map((ch,i)=>`<span class="letter${ch==='!'?' bang':''}" style="--i:${i}" aria-hidden="true">${ch}</span>`).join('');
  el.innerHTML=`<div class="seam"></div><div class="cp l"></div><div class="cp r"></div><div class="cw"><span class="logo" aria-label="tadaa!">${letters}</span><small>PREPARANDO LA FUNCIÓN</small></div>`;
  document.body.appendChild(el);return el;
 }
 async function enter({onOpen,preload=false}={}){
  if(bootStarted)return;bootStarted=true;
  if(reduce){onOpen?.();return;}
  if(takeFade()){
   busy=true;const black=veil(true);
   onOpen?.();await paint();
   await wait(90);black.classList.remove('visible');
   await wait(320);black.remove();busy=false;return;
  }
  busy=true;
  // Fondo tapado durante la preparación. La cortina empieza abierta y sin letras.
  const black=veil(true),scene=curtain();
  black.style.zIndex='240'; // el telón debe verse al cerrarse, sobre un fondo negro
  await paint();
  scene.classList.remove('open');
  await wait(1090); // espera cierre completo sin mostrar logo
  await wait(285); // deja ver reflectores
  scene.classList.add('brand-visible');
  // Espera breve, pero sin barra falsa de carga.
  if(preload&&document.readyState!=='complete'){
   await Promise.race([new Promise(resolve=>addEventListener('load',resolve,{once:true})),wait(1100)]);
  }
  await wait(1660); // una ola completa de saltos
  scene.classList.add('settled');
  onOpen?.();
  await paint();black.classList.remove('visible');scene.classList.add('open');
  await wait(1110);
  scene.remove();black.remove();busy=false;
 }
 async function exitTo(url,options={}){
  if(busy)return;
  if(reduce){location.assign(url);return;}
  if(options.fadeOnly)setFade();
  busy=true;
  const black=veil();
  await paint();black.classList.add('visible');
  await wait(300);
  // No crear cortina al salir: evita duplicar el preloader al cambiar de documento.
  location.assign(url);
 }
 async function view(render){
  if(typeof render!=='function')return;
  if(reduce){render();return;}
  if(busy){queued=render;return;}
  busy=true;const black=veil(false,true);
  await paint();black.classList.add('visible');
  await wait(180);
  try{render();}finally{
   await paint();black.classList.remove('visible');await wait(230);black.remove();busy=false;
   if(queued){const next=queued;queued=null;view(next);}
  }
 }
 window.Curtain={load:options=>enter({...options,preload:true}),enter,exitTo,view,get transitioning(){return busy}};
 // Capturar enlaces ENTRE archivos una sola vez. Enlaces internos por hash conservan su router.
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href]');
  if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||a.target==='_blank'||a.hasAttribute('download'))return;
  const url=new URL(a.href,location.href);
  if(url.origin!==location.origin||url.pathname===location.pathname||!/(?:^|\/)(?:index|login|app)\.html$/.test(url.pathname))return;
  event.preventDefault();exitTo(url.href,{fadeOnly: /(?:^|\/)(?:login|app)\.html$/.test(url.pathname) && /(?:^|\/)(?:login|app)\.html$/.test(location.pathname)});
 });
})();
