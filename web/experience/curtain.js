/* TADAA! — El telón se utiliza exclusivamente al pulsar "Iniciar sesión".
   El resto de navegación usa fade breve; la entrada normal no muestra preloader. */
(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const KEY='tadaa-auth-fade-arrival-v1';
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 let busy=false;
 function setArrival(){try{sessionStorage.setItem(KEY,'1')}catch{}}
 function takeArrival(){try{const yes=sessionStorage.getItem(KEY)==='1';sessionStorage.removeItem(KEY);return yes}catch{return false}}
 function makeVeil(){
  const el=document.createElement('div');el.className='tadaa-veil';el.setAttribute('aria-hidden','true');document.body.appendChild(el);return el;
 }
 function makeCurtain(){
  const el=document.createElement('div');el.className='curtain open';el.setAttribute('aria-hidden','true');
  const letters=[...'tadaa!'].map((ch,i)=>`<span class="letter${ch==='!'?' bang':''}" style="--i:${i}" aria-hidden="true">${ch}</span>`).join('');
  el.innerHTML=`<div class="seam"></div><div class="cp l"></div><div class="cp r"></div><div class="cw"><span class="logo" aria-label="tadaa!">${letters}</span><small>DESCUBRE · RESERVA · VIVE</small></div>`;
  document.body.appendChild(el);return el;
 }
 async function enter(){
  // Solo reproduce fade de llegada si la página anterior lo solicitó.
  if(reduced||!takeArrival())return;
  const veil=makeVeil();veil.classList.add('visible');await paint();await wait(70);veil.classList.remove('visible');await wait(340);veil.remove();
 }
 async function loginTransition(url){
  if(busy)return;
  if(reduced){location.assign(url);return;}
  busy=true;
  const veil=makeVeil();await paint();veil.classList.add('visible');await wait(260);
  const stage=makeCurtain();await paint();veil.remove();
  stage.classList.remove('open'); // los paños se cierran sobre la pantalla
  await wait(1100);
  stage.classList.add('brand-visible'); // ahora aparece el logo y saltan sus letras
  await wait(1550);
  stage.classList.add('settled');
  location.assign(url); // el login entra sin reproducir otro telón
 }
 async function exitTo(url,options={}){
  if(busy)return;
  if(reduced){location.assign(url);return;}
  if(options.fadeOnly){
   busy=true;setArrival();const veil=makeVeil();await paint();veil.classList.add('visible');await wait(260);location.assign(url);return;
  }
  location.assign(url);
 }
 async function view(render){
  if(typeof render!=='function')return;
  if(reduced){render();return;}
  if(busy)return;
  busy=true;const veil=makeVeil();veil.classList.add('view-veil');await paint();veil.classList.add('visible');await wait(150);
  try{render()}finally{await paint();veil.classList.remove('visible');await wait(230);veil.remove();busy=false}
 }
 window.Curtain={enter,exitTo,view,loginTransition,get transitioning(){return busy}};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname===location.pathname)return;
  event.preventDefault();
  if(link.hasAttribute('data-curtain-login'))loginTransition(url.href);
  else exitTo(url.href,{fadeOnly:true});
 });
})();
