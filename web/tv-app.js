/* TADAA! Ticket vibrante — app web fiel a los mockups aprobados.
 * Renderiza las plantillas de design/mockups (tv-screens.js): escritorio (D*) ≥ 900 px, móvil (M*) < 900 px.
 * Los adaptadores (tv-adapters.js) conectan cada pantalla con la API real. */
(function(){
'use strict';
const SCREENS=window.TV_SCREENS||{};
const ROUTES={
 inicio:{D:'DHome',M:'Main'},explorar:{D:'DExplorar',M:'MExplorar'},evento:{D:'DEvento',M:'MEvento'},
 asientos:{M:'MAsientos'},addons:{M:'MAddons'},now:{D:'DRush',M:'MRush'},wallet:{D:'DWallet',M:'MWallet'},
 pase:{M:'MPase'},cuenta:{D:'DCuenta',M:'MCuenta'},logro:{M:'MLogro'},golden:{D:'DGolden',M:'MGolden'},baja:{M:'MBaja'},
 staff:{M:'MCheckin'},productor:{D:'DPartner'},empresa:{D:'DEmpresa'},admin:{D:'DAdmin'},pitch:{D:'DPitch'},membresia:{D:'RMembresia',M:'RMembresia'}
};
const EXTERNAL={};
const QS=new URLSearchParams(location.search),PREVIEW=QS.has('preview'),FORCE=QS.get('mode');
/* Vista previa (pitch deck): portales y pantallas personales con datos de muestra del diseño, sin sesión ni llamadas privadas. */
const SAMPLE=new Set(['DAdmin','DPartner','DEmpresa','MCheckin','DWallet','MWallet','MPase','DCuenta','MCuenta','DGolden','MGolden','MBaja','MLogro']);
const AUTH=new Set(['wallet','pase','cuenta','logro','golden','baja','productor','empresa','staff']);
const MOBILE_BP=900;
const $host=()=>document.getElementById('tv');

/* ───── motor de plantillas (subset del formato .dc) ───── */
class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(patch){Object.assign(this.state,typeof patch==='function'?patch(this.state):patch);schedule()}componentDidMount(){}componentWillUnmount(){}}
const HOLE=/\{\{([^}]+)\}\}/g,WHOLE=/^\s*\{\{([^}]+)\}\}\s*$/;
function lookup(expr,scope){expr=expr.trim();if(expr==='true')return true;if(expr==='false')return false;if(expr==='null')return null;if(/^-?\d+(\.\d+)?$/.test(expr))return Number(expr);if(/^(['"]).*\1$/.test(expr))return expr.slice(1,-1);let v=scope;for(const k of expr.split('.')){if(v==null)return undefined;v=v[k]}return v}
function proc(node,scope,out,item){
 if(node.nodeType===3){out.appendChild(document.createTextNode(node.nodeValue.replace(HOLE,(_,e)=>{const v=lookup(e,scope);return v==null?'':String(v)})));return}
 if(node.nodeType!==1)return;
 let tag=node.tagName.toLowerCase();let kids=node.childNodes;if(tag==='template'&&node.dataset&&node.dataset.sc){tag='sc-'+node.dataset.sc;kids=node.content?node.content.childNodes:node.childNodes}
 if(tag==='sc-if'){const m=(node.getAttribute('value')||'').match(WHOLE);if(m&&lookup(m[1],scope))for(const c of kids)proc(c,scope,out,item);return}
 if(tag==='sc-for'){const m=(node.getAttribute('list')||'').match(WHOLE),as=node.getAttribute('as')||'item',list=m?lookup(m[1],scope):[];(list||[]).forEach((it,i)=>{const s=Object.create(scope);s[as]=it;s.index=i;for(const c of kids)proc(c,s,out,it)});return}
 const el=node.namespaceURI==='http://www.w3.org/2000/svg'?document.createElementNS(node.namespaceURI,node.tagName):document.createElement(node.tagName);
 for(const a of node.attributes){if(a.name.startsWith('hint-'))continue;const w=a.value.match(WHOLE);
  if(/^on[a-z]/i.test(a.name)){const fn=w?lookup(w[1],scope):null;if(typeof fn==='function'){let ev=a.name.slice(2).toLowerCase();if(ev==='change'&&/input|textarea/i.test(tag))ev='input';(el.__tvH=el.__tvH||{})[ev]=fn;bindH(el,ev)}continue}
  let v=w?lookup(w[1],scope):a.value.replace(HOLE,(_,e)=>{const x=lookup(e,scope);return x==null?'':String(x)});
  if(v===false||v==null){if(a.name.startsWith('aria-'))el.setAttribute(a.name,'false');continue}
  if(v===true&&!a.name.startsWith('aria-'))v='';
  try{el.setAttribute(a.name,String(v))}catch{}
 }
 if(item)el.__tvItem=item;
 for(const c of node.childNodes)proc(c,scope,el,item);
 out.appendChild(el);
}

/* Manejadores: un solo listener por tipo que llama a la función vigente (sobrevive al morph). */
function bindH(el,ev){el.__tvB=el.__tvB||{};if(el.__tvB[ev])return;el.__tvB[ev]=true;el.addEventListener(ev,e=>{const fn=el.__tvH&&el.__tvH[ev];if(!fn)return;if(ev==='click'||ev==='submit')e.preventDefault();fn(e)})}
/* Morph: actualiza el DOM existente en lugar de reemplazarlo (sin parpadeos, conserva videos, foco y scroll). */
function syncAttrs(o,n){for(const a of [...o.attributes]){if(!n.hasAttribute(a.name))o.removeAttribute(a.name)}for(const a of n.attributes){if(o.getAttribute(a.name)!==a.value)o.setAttribute(a.name,a.value)}
 o.__tvItem=n.__tvItem;o.__tvH=n.__tvH;if(n.__tvH)for(const ev in n.__tvH)bindH(o,ev);
 if(o.tagName==='INPUT'||o.tagName==='TEXTAREA'){if(document.activeElement!==o&&o.value!==(n.getAttribute('value')||''))o.value=n.getAttribute('value')||''}}
function morph(oldP,newP){const oc=[...oldP.childNodes],nc=[...newP.childNodes];const len=Math.max(oc.length,nc.length);
 for(let i=0;i<len;i++){const o=oc[i],n=nc[i];if(!n){o.remove();continue}if(!o){oldP.appendChild(n);continue}
  if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName||(o.nodeType===1&&o.tagName==='VIDEO'&&o.getAttribute('src')!==n.getAttribute('src'))){oldP.replaceChild(n,o);continue}
  if(o.nodeType===3||o.nodeType===8){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;continue}
  if(o.nodeType===1){syncAttrs(o,n);morph(o,n)}}}
/* ───── estado de la vista ───── */
let cur=null,comp=null,tplNode=null,pending=false,mode=null,screenName=null;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;paint(false)})}
function compile(name){const sc=SCREENS[name];if(!sc)return null;const tpl=sc.tpl.replace(/<sc-(for|if)\b/g,'<template data-sc="$1"').replace(/<\/sc-(for|if)>/g,'</template>');const doc=new DOMParser().parseFromString('<body>'+tpl+'</body>','text/html');return {css:sc.css,node:doc.body.firstElementChild,code:sc.code}}
function makeComponent(name,code,params){let C=class extends DCLogic{renderVals(){return {}}};if(code.includes('class Component')){try{C=new Function('DCLogic',code+'\nreturn Component;')(DCLogic)}catch(e){console.error('[tv] plantilla',name,e)}}
 if(PREVIEW&&SAMPLE.has(name)&&!window.TVAdapters?.preview?.[name]){const B=C;C=class extends B{renderVals(){return {TVini:'TD',...super.renderVals()}}};return new C({route:cur,params})}
 const adapt=(window.TVAdapters||{})[name];if(adapt){try{C=adapt(C,TV)}catch(e){console.error('[tv] adaptador',name,e)}}
 const c=new C({route:cur,params});return c}
function paint(first){const host=$host();if(!tplNode)return;let vals={};try{vals=comp?comp.renderVals():{}}catch(e){console.error('[tv] renderVals',screenName,e)}
 const prevRoot=host.firstElementChild;const keep=[...(prevRoot?.querySelectorAll('[data-tv-scroll]')||[])].map(e=>[e.scrollLeft,e.scrollTop]);
 const frag=document.createDocumentFragment();proc(tplNode,vals,frag,null);if(first||!host.firstElementChild)host.replaceChildren(frag);else morph(host,frag);layout();
 [...host.querySelectorAll('[data-tv-scroll]')].forEach((e,i)=>{if(keep[i]){e.scrollLeft=keep[i][0];e.scrollTop=keep[i][1]}});
 host.querySelectorAll('video').forEach(v=>{v.muted=true;v.playsInline=true;if(v.paused)v.play?.().catch(()=>{})});
 try{comp?.afterPaint?.(host.firstElementChild,first)}catch(e){console.error(e)}
 if(first)window.TadaaMotion?.enhance?.(host)}

/* ───── maquetación: escritorio fluido, móvil escalado a lo ancho ───── */
function layout(){const host=$host(),root=host.firstElementChild;if(!root)return;const vw=document.documentElement.clientWidth;const isM=screenName&&screenName[0]==='M'||screenName==='Main';
 document.body.dataset.tvMode=isM?(mode==='M'?'m':'m-desk'):(mode==='M'?'d-mob':'d');
 host.style.zoom='';root.style.removeProperty('height');
 if(isM){const w=mode==='M'?vw:Math.min(430,vw);const z=w/390;host.style.zoom=String(z);root.style.width='390px';root.style.height='auto';root.style.minHeight=Math.ceil((mode==='M'?innerHeight:Math.max(844,innerHeight-40))/z)+'px';root.style.overflow='hidden';root.style.position='relative';
  [...root.children].forEach(c=>{const s=c.style;if(s.position==='absolute'&&s.bottom!==''&&s.top===''&&mode==='M'){const L=parseFloat(s.left)||0,R=parseFloat(s.right);s.position='fixed';s.zIndex=s.zIndex||'30';s.left=L+'px';if(!isNaN(R)){s.width=(390-L-R)+'px';s.right='auto'}else if(!s.width)s.width=(390-L)+'px';s.bottom='calc('+(s.bottom||'0px')+' + env(safe-area-inset-bottom))'}});
 }else{root.style.width='100%';root.style.minHeight='100vh';if((mode==='M'||FORCE==='d')&&screenName[0]!=='R'&&screenName!=='DPitch'){const z=vw/1280;if(z<1){host.style.zoom=String(z);root.style.minHeight=Math.ceil(innerHeight/z)+'px'}}}
 root.querySelectorAll('*').forEach(e=>{const cs=e.style;if((cs.overflowX==='auto'||cs.overflow==='auto'||cs.overflowX==='scroll')&&!e.hasAttribute('data-tv-scroll'))e.setAttribute('data-tv-scroll','')})}

/* ───── coreografía de páginas (principios Apple / Disney): resortes críticamente amortiguados,
   salida ease-in corta, entrada por roles (cabecera, títulos, medios, tarjetas, botones), dirección según navegación ───── */
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_LINEAR=window.CSS&&CSS.supports&&CSS.supports('animation-timing-function','linear(0, 1)');
const springs={};
function spring(damping=1,response=.4){const key=damping+'|'+response;if(springs[key])return springs[key];const w=2*Math.PI/response,z=damping,wd=w*Math.sqrt(Math.max(0,1-z*z));
 const x=t=>z>=1?1-Math.exp(-w*t)*(1+w*t):1-Math.exp(-z*w*t)*(Math.cos(wd*t)+(z*w/wd)*Math.sin(wd*t));
 let T=0;for(let t=0;t<3;t+=.004){if(Math.abs(1-x(t))>.002)T=t}T=Math.max(.2,T+.004);
 const pts=[];const N=36;for(let k=0;k<=N;k++)pts.push(+x(T*k/N).toFixed(4));pts[N]=1;
 return springs[key]={easing:HAS_LINEAR?'linear('+pts.join(', ')+')':'cubic-bezier(.2,.8,.2,1)',duration:Math.round(T*1000)}}
let navDir=1;
const LEAF=/^(H1|H2|H3|H4|P|IMG|VIDEO|BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|NAV|HEADER|ASIDE|ARTICLE|LI|TABLE|FORM|IFRAME|SVG)$/;
function pickRole(el,r,vw){const t=el.tagName;if(t==='HEADER'||t==='NAV'&&r.top<140)return 'chrome';if(t==='H1'||(t==='H2'&&r.height>40))return 'title';if(t==='IMG'||t==='VIDEO'||t==='IFRAME')return r.width>220?'media':'pop';if(t==='ASIDE')return 'side';
 if((t==='BUTTON'||t==='A'||t==='INPUT'||t==='SELECT')&&r.height<72&&r.width<420)return 'pop';return 'card'}
/* Transición tipo app (push): la página anterior queda como capa fantasma y se desliza/desvanece,
   la nueva entra desde el lado de la navegación con un resorte; dentro, pocos bloques clave suben con
   escalonado corto (≤30 ms). Nunca hay pantalla vacía entre páginas. */
let ghost=null;
function snapshot(host){if(REDUCE||!host.firstElementChild)return;dropGhost();const g=document.createElement('div');g.setAttribute('aria-hidden','true');g.style.cssText='position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;contain:strict';
 const st=document.createElement('style');st.textContent=document.getElementById('tv-css').textContent;g.appendChild(st);
 const c=host.cloneNode(true);c.removeAttribute('id');c.style.position='absolute';c.style.left='0';c.style.right='0';c.style.top=(-window.scrollY)+'px';c.style.margin='0 auto';
 c.querySelectorAll('video').forEach(v=>{v.removeAttribute('autoplay');v.pause?.()});c.querySelectorAll('iframe').forEach(f=>f.remove());g.appendChild(c);document.body.appendChild(g);
 const r=host.getBoundingClientRect();c.style.width=r.width+'px';c.style.left=r.left+'px';c.style.right='auto';
 ghost={g,c};host.style.visibility='hidden'}
function dropGhost(){if(ghost){ghost.g.remove();ghost=null}}
function choreograph(host,first){host.style.visibility='';host.style.opacity='';const root=host.firstElementChild;if(!root){dropGhost();return}
 if(REDUCE){dropGhost();root.animate([{opacity:0,offset:0},{opacity:1}],{duration:180,easing:'ease-out'});return}
 const S=spring(1,.26),dir=navDir;
 if(ghost){const {g,c}=ghost;ghost=null;c.animate([{transform:'none',opacity:1},{transform:'translateX('+(-40*dir)+'px)',opacity:0}],{duration:150,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished.then(()=>g.remove(),()=>g.remove());
  root.animate([{opacity:0,offset:0},{opacity:1}],{duration:140,easing:'cubic-bezier(0,0,.2,1)'});root.animate([{transform:'translateX('+(36*dir)+'px)'},{transform:'none'}],{duration:S.duration,easing:S.easing})}
 else root.animate([{opacity:0,transform:'translateY(16px)',offset:0},{opacity:1,transform:'none'}],{duration:S.duration,easing:S.easing});
 const vh=innerHeight,picks=[];
 root.querySelectorAll('h1, h2, [data-tv-link], aside, article, section > div > a').forEach(el=>{if(picks.length>=14)return;const r=el.getBoundingClientRect();if(r.width<120||r.height<40||r.top>vh||r.bottom<0)return;if(picks.some(p=>p.contains(el)||el.contains(p)))return;picks.push(el)});
 picks.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top).forEach((el,k)=>{const o={duration:S.duration,delay:(first?40:0)+k*16,easing:S.easing,fill:'backwards'};try{el.animate([{opacity:0,offset:0}],{...o,duration:160,easing:'cubic-bezier(0,0,.2,1)'});el.animate([{transform:'translateY(12px)'},{transform:'none'}],{...o,composite:'add'})}catch{}});
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);const o={duration:S.duration,easing:S.easing,fill:'backwards'};try{e.target.animate([{opacity:0,offset:0}],{...o,duration:200,easing:'cubic-bezier(0,0,.2,1)'});e.target.animate([{transform:'translateY(16px)'},{transform:'none'}],{...o,composite:'add'})}catch{}}),{rootMargin:'0px 0px -8% 0px'});
 root.querySelectorAll('section, aside, article, h2, [data-tv-link]').forEach(el=>{const r=el.getBoundingClientRect();if(r.top>vh&&r.height>40)io.observe(el)})}

/* ───── enrutador ───── */
function parseHash(){const h=decodeURIComponent(location.hash.replace(/^#\/?/,''));const [r,...rest]=h.split('/');return {route:ROUTES[r]?r:(r?r:'inicio'),params:rest}}
async function go(route,params=[],{replace=false}={}){
 if(!ROUTES[route])route='inicio';
 const hash='#'+[route,...params].map(encodeURIComponent).join('/');
 if(location.hash!==hash){(replace?history.replaceState:history.pushState).call(history,null,'',hash)}
 await show(route,params)}
let navTok=0;
async function show(route,params){
 const tok=++navTok;
 mode=FORCE==='d'?'D':FORCE==='m'?'M':document.documentElement.clientWidth<MOBILE_BP?'M':'D';
 if(AUTH.has(route)&&!PREVIEW){await TV.session();if(!TV.user){location.href='login.html?next='+encodeURIComponent('index.html#'+[route,...params].join('/'));return}}
 const def=ROUTES[route];const name=def[mode]||def.D||def.M;
 snapshot($host());
 if(PREVIEW&&window.TVAdapters?.preview?.[name]){try{window.TVAdapters.preview[name]()}catch(e){console.warn(e)}}else if(!(PREVIEW&&SAMPLE.has(name)))try{await (window.TVAdapters?.load?.[name]||(()=>null))(TV,params)}catch(e){console.warn('[tv] datos',name,e)}
 if(tok!==navTok)return;
 comp?.componentWillUnmount?.();comp=null;cur=route;screenName=name;
 const c=compile(name);if(!c){dropGhost();$host().style.visibility='';$host().textContent='Pantalla no disponible';return}
 document.getElementById('tv-css').textContent=c.css;tplNode=c.node;comp=makeComponent(name,c.code,params);
 const host=$host();
 window.scrollTo({top:0,behavior:'instant'});paint(true);comp?.componentDidMount?.();const firstLoad=!document.body.classList.contains('tv-ready');document.body.classList.add('tv-ready');
 if(firstLoad){choreograph(host,true)}else choreograph(host,false);navDir=1;
 document.title=(TV.titles[route]||'TADAA!')+' · TADAA!'}

/* enlaces internos */
document.addEventListener('click',e=>{const a=e.target.closest('[data-tv-link]');if(!a||e.defaultPrevented&&!a.hasAttribute('data-tv-link'))return;const route=a.getAttribute('data-tv-link');
 let el=a,item=null;while(el&&el!==document.body){if(el.__tvItem){item=el.__tvItem;break}el=el.parentElement}
 e.preventDefault();const params=item&&(item.slug||item.id)&&['evento','pase','golden'].includes(route)?[item.slug||item.id]:(['evento','addons','asientos'].includes(route)&&TV.currentEvent?[TV.currentEvent]:[]);
 go(route,params)});
addEventListener('popstate',()=>{navDir=-1;const {route,params}=parseHash();show(route,params)});
let lastMode=null;addEventListener('resize',()=>{const m=document.documentElement.clientWidth<MOBILE_BP?'M':'D';if(cur&&m!==mode){const {route,params}=parseHash();show(route,params)}else layout()});

/* ───── datos compartidos ───── */
const api=window.TadaaApi;
const TV=window.TV={
 user:null,_s:null,events:[],eventsLoaded:false,detail:{},tickets:[],account:null,now:[],paymentMode:'internal_test',currentEvent:null,
 titles:{inicio:'¿Qué plan hay hoy?',explorar:'Cartelera',evento:'Evento',now:'Now!',wallet:'Mi Wallet',pase:'Mi pase',cuenta:'Mi cuenta',golden:'Golden Ticket',addons:'Add-ons',asientos:'Asientos',baja:'Un pajarito nos contó…',admin:'Studio',productor:'Portal de productores',empresa:'Portal de empresas',staff:'Staff · Check-in',pitch:'Pitch',membresia:'Membresía'},
 api,go,rerender:()=>schedule(),
 async session(){if(this._s)return this._s;this._s=api.refresh().then(r=>{this.user=r.authenticated?r.user:null;return r}).catch(()=>({})).then(r=>{document.body.classList.toggle('tv-auth',!!this.user);document.body.classList.toggle('tv-guest',!this.user);return r});return this._s},
 async catalog(){if(this.eventsLoaded)return this.events;try{const r=await api.call('/api/v2/catalog');this.events=(r.events||r.items||[]).filter(e=>!e.sample)}catch{this.events=[]}this.eventsLoaded=true;return this.events},
 async event(id){if(!id)return null;if(this.detail[id])return this.detail[id];try{this.detail[id]=await api.call('/api/v2/events/'+encodeURIComponent(id))}catch{this.detail[id]=null}return this.detail[id]},
 async loadTickets(){try{this.tickets=(await api.call('/api/v2/tickets')).tickets||[]}catch{this.tickets=[]}return this.tickets},
 async loadAccount(){try{this.account=await api.call('/api/v2/me/account')}catch{this.account=null}return this.account},
 async loadNow(){try{this.now=(await api.call('/api/v2/now')).campaigns||[]}catch{this.now=[]}return this.now},
 async loadPaymentMode(){try{this.paymentMode=(await api.call('/api/v2/payment-mode')).mode||'internal_test'}catch{}return this.paymentMode},
 toast(msg,kind){let t=document.getElementById('tv-toast');if(!t){t=document.createElement('div');t.id='tv-toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.className='on '+(kind||'');clearTimeout(t._h);t._h=setTimeout(()=>t.className='',3200)},
 money:m=>'$'+Math.round(Number(m||0)/100).toLocaleString('en-US'),
 requireLogin(next){location.href='login.html?next='+encodeURIComponent(next||('index.html'+location.hash))},
 /* Sin sesión: en vez de mandar al login, invitamos a unirse con las dos formas de acceso. */
 join(next,why){next=next||('index.html'+location.hash);const q=m=>'login.html?register=1&mode='+m+'&next='+encodeURIComponent(next);
  const ov=document.createElement('div');ov.className='tv-modal tv-join';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Únete a TADAA!');
  ov.innerHTML=`<div class="tv-modal-card"><img src="img/tv/logo-tadaa.png" alt="TADAA!" class="tj-logo"><h2>Únete a TADAA!</h2><p>${why||'Para comprar boletos y entrar a Now! necesitas una cuenta TADAA!. Elige cómo quieres entrar.'}</p>
   <a class="tj-opt" href="${q('company')}"><span class="tj-ic"><svg viewBox="0 0 256 256"><path d="M239.73,208H224V96a16,16,0,0,0-16-16H164a4,4,0,0,0-4,4V208H144V32.41a16.43,16.43,0,0,0-6.16-13,16,16,0,0,0-18.72-.69L39.12,72A16,16,0,0,0,32,85.34V208H16.27A8.18,8.18,0,0,0,8,215.47,8,8,0,0,0,16,224H240a8,8,0,0,0,8-8.53A8.18,8.18,0,0,0,239.73,208ZM76,184a8,8,0,0,1-8.53,8A8.18,8.18,0,0,1,60,183.72V168.27A8.19,8.19,0,0,1,67.47,160,8,8,0,0,1,76,168Zm0-56a8,8,0,0,1-8.53,8A8.19,8.19,0,0,1,60,127.72V112.27A8.19,8.19,0,0,1,67.47,104,8,8,0,0,1,76,112Zm40,56a8,8,0,0,1-8.53,8,8.18,8.18,0,0,1-7.47-8.26V168.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Zm0-56a8,8,0,0,1-8.53,8,8.19,8.19,0,0,1-7.47-8.26V112.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Z"/></svg></span><span><b>Por convenio de tu empresa</b><small>Si tu empresa tiene convenio, tu acceso no te cuesta. Necesitas tu número de colaborador.</small></span></a>
   <a class="tj-opt hot" href="${q('membership')}"><span class="tj-ic"><svg viewBox="0 0 256 256"><path d="M239.75,90.81c0,.11,0,.21-.07.32L217,195a16,16,0,0,1-15.72,13H54.71A16,16,0,0,1,39,195L16.32,91.13c0-.11-.05-.21-.07-.32A16,16,0,0,1,44,77.39l33.67,36.29,35.8-80.29a1,1,0,0,0,0-.1,16,16,0,0,1,29.06,0,1,1,0,0,0,0,.1l35.8,80.29L212,77.39a16,16,0,0,1,27.71,13.42Z"/></svg></span><span><b>Con tu membresía · $50 al mes</b><small>Precios de socio, Now! de tercera llamada, Golden Tickets y tu Wallet.</small></span></a>
   <p class="tj-in">¿Ya tienes cuenta? <a href="login.html?next=${encodeURIComponent(next)}">Inicia sesión</a></p><button class="tj-x" aria-label="Cerrar">×</button></div>`;
  document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('on'));const close=()=>{ov.classList.add('out');ov.classList.remove('on');setTimeout(()=>ov.remove(),200);removeEventListener('keydown',key)};const key=e=>{if(e.key==='Escape')close()};addEventListener('keydown',key);
  ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.tj-x'))close()});ov.querySelector('.tj-opt').focus()}
};

/* arranque */
(async()=>{await TV.session();const {route,params}=parseHash();await go(route,params,{replace:true})})();
})();
