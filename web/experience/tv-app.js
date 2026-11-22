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
 staff:{M:'MCheckin'},productor:{D:'DPartner'},empresa:{D:'DEmpresa'},admin:{D:'DAdmin'}
};
const EXTERNAL={pitch:'partner.html',staff:'staff.html',productor:'app.html#/empresa',empresa:'app.html#/empresa',admin:'admin.html'};
const AUTH=new Set(['wallet','pase','cuenta','logro','golden','baja']);
const MOBILE_BP=900;
const $host=()=>document.getElementById('tv');

/* ───── motor de plantillas (subset del formato .dc) ───── */
class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(patch){Object.assign(this.state,typeof patch==='function'?patch(this.state):patch);schedule()}componentDidMount(){}componentWillUnmount(){}}
const HOLE=/\{\{([^}]+)\}\}/g,WHOLE=/^\s*\{\{([^}]+)\}\}\s*$/;
function lookup(expr,scope){expr=expr.trim();if(expr==='true')return true;if(expr==='false')return false;if(expr==='null')return null;if(/^-?\d+(\.\d+)?$/.test(expr))return Number(expr);if(/^(['"]).*\1$/.test(expr))return expr.slice(1,-1);let v=scope;for(const k of expr.split('.')){if(v==null)return undefined;v=v[k]}return v}
function proc(node,scope,out,item){
 if(node.nodeType===3){out.appendChild(document.createTextNode(node.nodeValue.replace(HOLE,(_,e)=>{const v=lookup(e,scope);return v==null?'':String(v)})));return}
 if(node.nodeType!==1)return;
 const tag=node.tagName.toLowerCase();
 if(tag==='sc-if'){const m=(node.getAttribute('value')||'').match(WHOLE);if(m&&lookup(m[1],scope))for(const c of node.childNodes)proc(c,scope,out,item);return}
 if(tag==='sc-for'){const m=(node.getAttribute('list')||'').match(WHOLE),as=node.getAttribute('as')||'item',list=m?lookup(m[1],scope):[];(list||[]).forEach((it,i)=>{const s=Object.create(scope);s[as]=it;s.index=i;for(const c of node.childNodes)proc(c,s,out,it)});return}
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
function compile(name){const sc=SCREENS[name];if(!sc)return null;const doc=new DOMParser().parseFromString('<body>'+sc.tpl+'</body>','text/html');return {css:sc.css,node:doc.body.firstElementChild,code:sc.code}}
function makeComponent(name,code,params){let C=class extends DCLogic{renderVals(){return {}}};if(code.includes('class Component')){try{C=new Function('DCLogic',code+'\nreturn Component;')(DCLogic)}catch(e){console.error('[tv] plantilla',name,e)}}
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
 }else{root.style.width='100%';if(mode==='M'){const z=vw/1280;if(z<1)host.style.zoom=String(z)}}
 root.querySelectorAll('*').forEach(e=>{const cs=e.style;if((cs.overflowX==='auto'||cs.overflow==='auto'||cs.overflowX==='scroll')&&!e.hasAttribute('data-tv-scroll'))e.setAttribute('data-tv-scroll','')})}

/* ───── enrutador ───── */
function parseHash(){const h=decodeURIComponent(location.hash.replace(/^#\/?/,''));const [r,...rest]=h.split('/');return {route:ROUTES[r]?r:(r?r:'inicio'),params:rest}}
async function go(route,params=[],{replace=false}={}){
 if(EXTERNAL[route]&&!(ROUTES[route]&&route!=='staff'&&route!=='productor'&&route!=='empresa'&&route!=='admin')){location.href=EXTERNAL[route];return}
 if(!ROUTES[route])route='inicio';
 const hash='#'+[route,...params].map(encodeURIComponent).join('/');
 if(location.hash!==hash){(replace?history.replaceState:history.pushState).call(history,null,'',hash)}
 await show(route,params)}
async function show(route,params){
 mode=document.documentElement.clientWidth<MOBILE_BP?'M':'D';
 if(AUTH.has(route)){await TV.session();if(!TV.user){location.href='login.html?next='+encodeURIComponent('index.html#'+[route,...params].join('/'));return}}
 const def=ROUTES[route];const name=def[mode]||def.D||def.M;
 try{await (window.TVAdapters?.load?.[name]||(()=>null))(TV,params)}catch(e){console.warn('[tv] datos',name,e)}
 comp?.componentWillUnmount?.();comp=null;cur=route;screenName=name;
 const c=compile(name);if(!c){$host().textContent='Pantalla no disponible';return}
 document.getElementById('tv-css').textContent=c.css;tplNode=c.node;comp=makeComponent(name,c.code,params);
 const host=$host();host.classList.remove('tv-enter');void host.offsetWidth;host.classList.add('tv-enter');
 paint(true);comp?.componentDidMount?.();document.body.classList.add('tv-ready');window.scrollTo({top:0,behavior:'instant'});
 document.title=(TV.titles[route]||'TADAA!')+' · TADAA!'}

/* enlaces internos */
document.addEventListener('click',e=>{const a=e.target.closest('[data-tv-link]');if(!a||e.defaultPrevented&&!a.hasAttribute('data-tv-link'))return;const route=a.getAttribute('data-tv-link');
 let el=a,item=null;while(el&&el!==document.body){if(el.__tvItem){item=el.__tvItem;break}el=el.parentElement}
 e.preventDefault();const params=item&&(item.slug||item.id)&&['evento','pase','golden'].includes(route)?[item.slug||item.id]:(['evento','addons','asientos'].includes(route)&&TV.currentEvent?[TV.currentEvent]:[]);
 if(route==='staff'||route==='productor'||route==='empresa'||route==='admin'||route==='pitch'){location.href=EXTERNAL[route];return}
 go(route,params)});
addEventListener('popstate',()=>{const {route,params}=parseHash();show(route,params)});
let lastMode=null;addEventListener('resize',()=>{const m=document.documentElement.clientWidth<MOBILE_BP?'M':'D';if(cur&&m!==mode){const {route,params}=parseHash();show(route,params)}else layout()});

/* ───── datos compartidos ───── */
const api=window.TadaaApi;
const TV=window.TV={
 user:null,_s:null,events:[],eventsLoaded:false,detail:{},tickets:[],account:null,now:[],paymentMode:'internal_test',currentEvent:null,
 titles:{inicio:'¿Qué plan hay hoy?',explorar:'Cartelera',evento:'Evento',now:'Now!',wallet:'Mi Wallet',pase:'Mi pase',cuenta:'Mi cuenta',golden:'Golden Ticket',addons:'Add-ons',asientos:'Asientos',baja:'Un pajarito nos contó…'},
 api,go,rerender:()=>schedule(),
 async session(){if(this._s)return this._s;this._s=api.refresh().then(r=>{this.user=r.authenticated?r.user:null;return r}).catch(()=>({}));return this._s},
 async catalog(){if(this.eventsLoaded)return this.events;try{const r=await api.call('/api/v2/catalog');this.events=(r.events||r.items||[]).filter(e=>!e.sample)}catch{this.events=[]}this.eventsLoaded=true;return this.events},
 async event(id){if(!id)return null;if(this.detail[id])return this.detail[id];try{this.detail[id]=await api.call('/api/v2/events/'+encodeURIComponent(id))}catch{this.detail[id]=null}return this.detail[id]},
 async loadTickets(){try{this.tickets=(await api.call('/api/v2/tickets')).tickets||[]}catch{this.tickets=[]}return this.tickets},
 async loadAccount(){try{this.account=await api.call('/api/v2/me/account')}catch{this.account=null}return this.account},
 async loadNow(){try{this.now=(await api.call('/api/v2/now')).campaigns||[]}catch{this.now=[]}return this.now},
 async loadPaymentMode(){try{this.paymentMode=(await api.call('/api/v2/payment-mode')).mode||'internal_test'}catch{}return this.paymentMode},
 toast(msg,kind){let t=document.getElementById('tv-toast');if(!t){t=document.createElement('div');t.id='tv-toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.className='on '+(kind||'');clearTimeout(t._h);t._h=setTimeout(()=>t.className='',3200)},
 money:m=>'$'+Math.round(Number(m||0)/100).toLocaleString('en-US'),
 requireLogin(next){location.href='login.html?next='+encodeURIComponent(next||('index.html'+location.hash))}
};

/* arranque */
(async()=>{await TV.session();const {route,params}=parseHash();await go(route,params,{replace:true})})();
})();
