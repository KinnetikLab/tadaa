/* TADAA! Ticket vibrante — movimiento: transiciones de vista, revelado escalonado, ripple,
   inclinación de boletos, contadores animados y rebote de steppers. Sin dependencias. */
(function(){
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEL='.show,.tv-card,.now-card,.tk,.zn,.box,.tile,.stats>*,.addon,.pr,.card,.similar a,.golden-note,.pajarito,.golden-cta,.feat-col,.tab-panel>*,.lp-step,.step';
let io=null;
function reveal(root){if(reduce||!('IntersectionObserver' in window))return;io=io||new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('tvm-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.06});
 const groups=new Map();(root||document).querySelectorAll(SEL).forEach(el=>{if(el.dataset.tvm)return;el.dataset.tvm='1';const p=el.parentElement;const i=groups.get(p)||0;groups.set(p,i+1);el.style.setProperty('--tvm-d',Math.min(i,8)*55+'ms');el.classList.add('tvm-r');const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('tvm-in')));else io.observe(el)})}
function countUp(root){if(reduce)return;(root||document).querySelectorAll('.stats b,.acct-stats b,.tile b,.kpi b').forEach(el=>{if(el.dataset.tvmc)return;el.dataset.tvmc='1';const raw=el.textContent.trim(),m=raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);if(!m)return;const target=Number(m[2].replace(/,/g,''));if(!isFinite(target)||target===0)return;const dec=(m[2].split('.')[1]||'').length,t0=performance.now(),dur=900;const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=m[1]+(target*e).toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec})+m[3];if(k<1)requestAnimationFrame(step);else el.textContent=raw};requestAnimationFrame(step)})}
function enhance(root){reveal(root);countUp(root)}
// Ripple
document.addEventListener('pointerdown',e=>{if(reduce)return;const b=e.target.closest('.tv-btn,.btn');if(!b||b.disabled)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),d=document.createElement('span');d.className='tvm-ripple';d.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.appendChild(d);setTimeout(()=>d.remove(),650)},{passive:true});
// Inclinación de boletos
if(!reduce&&matchMedia('(hover:hover)').matches){document.addEventListener('pointermove',e=>{const t=e.target.closest('.tk,.tv-ticket');document.querySelectorAll('.tvm-tilt').forEach(x=>{if(x!==t){x.style.transform='';x.classList.remove('tvm-tilt')}});if(!t)return;const r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.classList.add('tvm-tilt');t.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-3px)`},{passive:true})}
// Observa cambios: transiciones de vista, rebotes y QR
const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='childList'){const t=m.target;if(t.id==='view'&&m.addedNodes.length&&!reduce){t.classList.remove('tvm-enter');void t.offsetWidth;t.classList.add('tvm-enter')}m.addedNodes.forEach(n=>{if(n.nodeType===1)enhance(n.parentElement||n)});const host=t.nodeType===1?t:t.parentElement;if(host&&(/^ad-/.test(host.id)||host.hasAttribute('data-people')||host.hasAttribute('data-qr-tick'))){host.classList.remove('tvm-bump');void host.offsetWidth;host.classList.add('tvm-bump')}if(host&&host.hasAttribute&&host.hasAttribute('data-countdown')){host.classList.remove('tvm-tick');void host.offsetWidth;host.classList.add('tvm-tick')}}if(m.type==='attributes'&&m.target.matches?.('img.ticket-qr')){const i=m.target;i.classList.add('tvm-refresh');i.addEventListener('load',()=>i.classList.remove('tvm-refresh'),{once:true})}}});
function start(){enhance(document);mo.observe(document.body,{childList:true,subtree:true,characterData:false,attributes:true,attributeFilter:['src']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.TadaaMotion={enhance};
})();
