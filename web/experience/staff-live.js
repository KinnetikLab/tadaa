/* TADAA! Staff — escaneo de QR dinámico (boletera TADAA!) y verificación manual de compras
 * (boletera externa / pase provisional) con entrega de add-ons. */
(function(){
'use strict';
const $=id=>document.getElementById(id),api=window.TadaaApi;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let orgs=[],org=null,event=null,stream=null,detector=null,busy=false,lastCode='',lastAt=0;
const toast=t=>{const el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2600)};
const buzz=ok=>{try{navigator.vibrate?.(ok?60:[80,60,80])}catch{}};
const DEL={provisional:'Provisional',delivering:'En entrega',final:'Final'};

async function post(url,body){const csrf=api.csrf()||(await api.refresh()).csrf;const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-tadaa-csrf':csrf||''},body:JSON.stringify(body||{})});const d=await r.json().catch(()=>({}));return {ok:r.ok,status:r.status,d}}
const base=()=>`/api/v2/staff/${org.id}`;

function logLine(ok,text){const el=document.createElement('div');el.innerHTML=`<span>${esc(text)}</span><b class="${ok?'ok':'bad'}">${ok?'ADMITIDO':'RECHAZADO'} · ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</b>`;$('log').prepend(el);while($('log').children.length>12)$('log').lastChild.remove()}

async function validate(code){
 code=String(code||'').trim();if(!code||!event||busy)return;const now=Date.now();if(code===lastCode&&now-lastAt<4000)return;lastCode=code;lastAt=now;busy=true;
 const box=$('scanResult');
 try{const {ok,d}=await post(`${base()}/events/${event.id}/scan`,{qrPayload:code});const t=d.ticket||{};
  if(ok&&d.accepted){box.className='result show '+(t.golden?'gold':'ok');box.innerHTML=`<h2>${t.golden?'✦ GOLDEN · ':''}Adelante</h2><p><b>${esc(t.full_name||'Asistente')}</b> · ${esc(t.ticket_type||'General')}${t.seat_label?` · ${esc(t.section_name||'')} ${esc(t.row_label||'')} ${esc(t.seat_label)}`:''}</p><p>Folio ${esc(t.folio)}</p>${t.golden?`<p><b>Beneficio:</b> ${esc(t.golden_benefit?.title||'')}</p>`:''}${(d.addons||[]).map(a=>`<div class="addon-row"><span>${esc(a.quantity)}× ${esc(a.title)}</span>${a.delivered_at?'<b>✓ Entregado</b>':`<button class="btn sm ghost" style="color:inherit;border-color:currentColor" data-deliver="${a.id}">Entregar</button>`}</div>`).join('')}`;buzz(true);logLine(true,t.folio||'QR')}
  else{box.className='result show bad';box.innerHTML=`<h2>Alto</h2><p>${esc(d.error||'Boleto no válido')}</p>${t.folio?`<p>Folio ${esc(t.folio)}</p>`:''}`;buzz(false);logLine(false,t.folio||'QR')}
 }catch(e){box.className='result show bad';box.innerHTML=`<h2>Sin conexión</h2><p>${esc(e.message)}</p>`}
 finally{busy=false}
}

async function startCamera(){
 const off=$('camOff');
 if(!('BarcodeDetector' in window)){off.hidden=false;off.innerHTML='Este navegador no lee QR con la cámara.<br>Usa Chrome en Android o pega el código abajo.';return}
 try{detector=new window.BarcodeDetector({formats:['qr_code']});stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});const v=$('video');v.srcObject=stream;await v.play();loop()}
 catch(e){off.hidden=false;off.textContent='Permite el acceso a la cámara para escanear, o pega el código abajo.'}
}
async function loop(){if(!stream)return;try{if(!$('scan').hidden&&!busy){const codes=await detector.detect($('video'));if(codes[0]?.rawValue)await validate(codes[0].rawValue)}}catch{}setTimeout(loop,280)}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null}

function orderCard(o){const tickets=o.tickets||[],valid=tickets.filter(t=>t.status==='valid').length;
 return `<article class="card" data-order="${o.id}"><div class="row"><div><h3>${esc(o.buyer_name||'Sin nombre')}</h3><small>${esc(o.folio)} · ${esc(o.buyer_email||'')}</small></div><b>${o.quantity} ${o.quantity===1?'acceso':'accesos'}</b></div>
 <div class="chips">${tickets.map(t=>`<span class="chip ${t.status!=='valid'?'used':t.delivery_status==='final'?'final':t.delivery_status==='delivering'?'deliv':'prov'}">${t.status!=='valid'?'Usado':DEL[t.delivery_status]||'Final'}</span>`).join('')}${tickets.some(t=>t.golden)?'<span class="chip gold">Golden</span>':''}${o.now_campaign_id?'<span class="chip now">Now!</span>':''}${tickets.find(t=>t.external_reference)?`<span class="chip">Boletera: ${esc(tickets.find(t=>t.external_reference).external_reference)}</span>`:''}</div>
 ${valid?`<div class="row"><div class="counter"><button data-dec>−</button><b data-people>${valid}</b><button data-inc data-max="${valid}">+</button></div><button class="btn" data-access="${o.id}">Dar acceso</button></div>`:'<p style="color:#AEB6D6;margin:6px 0 0">Todos los accesos ya se usaron.</p>'}
 ${(o.addons||[]).map(a=>`<div class="row"><span>${esc(a.quantity)}× ${esc(a.title)}</span>${a.delivered_at?'<span class="chip final">✓ Entregado</span>':`<button class="btn sm ghost" data-deliver="${a.id}">Entregar</button>`}</div>`).join('')}</article>`}
async function lookup(){const q=$('q').value.trim();if(q.length<3)return toast('Escribe al menos 3 caracteres');try{const r=await api.call(`${base()}/events/${event.id}/lookup?q=${encodeURIComponent(q)}`);$('orders').innerHTML=r.orders.length?r.orders.map(orderCard).join(''):'<div class="empty">Sin compras con ese dato para este evento.</div>'}catch(e){toast(e.message)}}

document.addEventListener('click',async e=>{
 const m=e.target.closest('[data-mode]');if(m){document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b===m));const scan=m.dataset.mode==='scan';$('scan').hidden=!scan;$('verify').hidden=scan;if(scan)startCamera();else stopCamera();return}
 const card=e.target.closest('[data-order]');
 if(e.target.closest('[data-inc],[data-dec]')&&card){const el=card.querySelector('[data-people]'),max=Number(card.querySelector('[data-inc]').dataset.max);el.textContent=Math.max(1,Math.min(max,Number(el.textContent)+(e.target.closest('[data-inc]')?1:-1)));return}
 const acc=e.target.closest('[data-access]');if(acc){const people=Number(card.querySelector('[data-people]').textContent);const {ok,d}=await post(`${base()}/events/${event.id}/orders/${acc.dataset.access}/access`,{people});if(ok){buzz(true);toast(`Acceso a ${d.admitted} ${d.admitted===1?'persona':'personas'}`);lookup()}else{buzz(false);toast(d.error||'No se pudo registrar')}return}
 const del=e.target.closest('[data-deliver]');if(del){const {ok,d}=await post(`${base()}/order-addons/${del.dataset.deliver}/deliver`);if(ok){del.outerHTML='<b>✓ Entregado</b>';toast(`${d.addon.title} entregado`)}else toast(d.error||'No se pudo marcar');return}
});
$('qrGo').onclick=()=>{validate($('qrManual').value);$('qrManual').value=''};
$('qGo').onclick=lookup;$('q').onkeydown=e=>{if(e.key==='Enter')lookup()};
$('event').onchange=()=>{const [o,ev]=$('event').value.split('|');org=orgs.find(x=>x.id===o);event=(org?.events||[]).find(x=>x.id===ev);$('orders').innerHTML='';$('scanResult').className='result'};

(async()=>{
 const me=await api.refresh().catch(()=>({}));if(!me.authenticated){location.href='login.html?next=staff.html';return}
 try{const r=await api.call('/api/v2/staff/me');orgs=r.organizations||[];}catch(e){toast(e.message)}
 const opts=orgs.flatMap(o=>(o.events||[]).map(ev=>`<option value="${o.id}|${ev.id}">${esc(ev.title)} · ${esc(o.name)}${ev.ticketing_mode==='tadaa'?'':' · externa'}</option>`));
 if(!opts.length){$('event').innerHTML='<option>Sin eventos asignados</option>';$('scan').innerHTML=$('verify').innerHTML='<div class="empty">Tu cuenta no tiene eventos publicados como staff. Pide a tu productor que te agregue a su organización.</div>';return}
 $('event').innerHTML=opts.join('');$('event').onchange();
 if(event?.ticketing_mode!=='tadaa')document.querySelector('[data-mode="verify"]').click();else startCamera();
})();
})();
