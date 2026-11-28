/* TADAA! v0.6 - secure integration admin frontend.
 * API credentials are NEVER saved in localStorage, sessionStorage, the static demo data,
 * or exported JSON. The server must be running for actual credential management.
 */
(()=>{'use strict';
const S={mode:'checking',auth:false,csrf:'',catalog:window.TADAA_INTEGRATIONS_CATALOG||[],items:{},infrastructure:{},selected:'clip',loading:false,message:'',error:false,audit:[]};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const refreshUI=()=>{if(location.hash.startsWith('#/admin')&&typeof window.TADAA_RENDER==='function')window.TADAA_RENDER()};
async function api(url,opts={}){
 const res=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts,headers:{'Accept':'application/json',...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.method&&opts.method!=='GET'&&S.csrf?{'X-CSRF-Token':S.csrf}:{}),...(opts.headers||{})}});
 const data=await res.json().catch(()=>({error:'Respuesta inesperada del servidor'}));
 if(res.status===401){S.auth=false;S.csrf='';refreshUI();throw Error(data.error||'Tu sesión expiró')}
 if(!res.ok)throw Error(data.error||`Error ${res.status}`);return data;
}
async function init(){
 try{const p=await fetch('/api/public/status',{cache:'no-store'});if(!p.ok)throw Error('no server');const data=await p.json();if(!data.server)throw Error('not server');S.mode='server';
  const me=await api('/api/admin/me');S.auth=!!me.authenticated;S.csrf=me.csrf||'';
  if(S.auth)await load();
 }catch{S.mode='preview';S.auth=false}refreshUI();}
async function load(){const d=await api('/api/admin/integrations');S.catalog=d.catalog;S.items=d.items;S.infrastructure=d.infrastructure;}
function guard(){
 if(S.mode==='checking')return `<section class="integrations-gate"><div class="int-login-card"><h2>Preparando administrador seguro…</h2><p>Comprobando si hay un servidor para proteger la configuración.</p></div></section>`;
 if(S.mode!=='server'||S.auth)return null;
 return `<section class="integrations-gate"><div class="int-login-card"><div class="int-eyebrow">TADAA! / ADMINISTRACIÓN SEGURA</div><h1>Acceso a la consola</h1><p>Esta v0.6 requiere autenticación del administrador para modificar integraciones. Las claves solo se guardan cifradas en el servidor.</p><form id="integrationLoginForm" class="int-form"><label for="adminPwd">Contraseña de administrador</label><input id="adminPwd" name="password" type="password" autocomplete="current-password" required minlength="14" placeholder="Tu contraseña de administrador"/><button class="btn" type="submit">Entrar al administrador</button></form><div id="integrationLoginFeedback" class="int-feedback">${S.message?esc(S.message):'Si todavía no has configurado el servidor, consulta docs/INSTALACION_MAC_XCLOUD_V06.md.'}</div></div></section>`;
}
function statusLabel(rec){if(!rec?.configured)return 'Sin configurar';if(rec?.testStatus==='passed')return 'Conexión comprobada';if(rec?.testStatus==='failed')return 'Revisar credenciales';return 'Guardada · sin probar';}
function statusClass(rec){if(!rec?.configured)return 'idle';if(rec.testStatus==='passed')return 'ok';if(rec.testStatus==='failed')return 'err';return 'pending';}
function fieldMarkup(f,rec,disabled){const v=rec?.values?.[f.key]??'';const saved=rec?.saved?.[f.key];
 const help=f.help?`<small>${esc(f.help)}</small>`:'';const isSecret=f.type==='secret';const extra=isSecret?(saved?'<span class="int-saved">✓ Clave guardada (oculta)</span>':'<span class="int-required">No configurada</span>'):'';
 const input=f.type==='select'?`<select name="${esc(f.key)}" ${disabled?'disabled':''} class="form-select">${f.options.map(x=>`<option value="${esc(x)}" ${v===x?'selected':''}>${esc(x)}</option>`).join('')}</select>`:`<input name="${esc(f.key)}" class="form-input" type="${isSecret?'password':f.type==='email'?'email':'text'}" ${isSecret?'autocomplete="new-password" spellcheck="false"':''} value="${isSecret?'':esc(v)}" placeholder="${isSecret?(saved?'Dejar vacío para conservar clave':'Introducir clave en servidor seguro'):''}" ${disabled?'disabled':''} ${f.required&&!isSecret?'required':''}/>`;
 return `<div class="field int-field"><label class="form-label">${esc(f.label)}${f.required?' *':''}</label>${input}${extra}${help}</div>`;
}
function render(){
 const d=S.catalog;const selected=d.find(p=>p.id===S.selected)||d[0];if(!selected)return '<div class="admin-section">No hay catálogo de integraciones disponible.</div>';
 const rec=S.items[selected.id]||{},disabled=S.mode!=='server'||!S.auth;
 const connected=d.filter(p=>S.items[p.id]?.testStatus==='passed').length;
 const configured=d.filter(p=>S.items[p.id]?.configured).length;
 return `<div class="admin-section int-overview"><div class="int-eyebrow">INTEGRACIONES · VERSION 0.6</div><h3>Conecta tus servicios sin editar el código</h3><p>Guarda credenciales cifradas y verifica permisos con pruebas de lectura. <strong>Estas pruebas no envían SMS, facturas, boletos ni cargos de tarjeta; algunas consultas a proveedores pueden generar consumo facturable de API.</strong> El checkout y el registro siguen en modo demo hasta conectar sus flujos reales.</p>
 ${S.mode==='preview'?`<div class="int-warning"><strong>Vista previa estática:</strong> puedes explorar los formularios, pero no escribir ni guardar credenciales. Abre el proyecto con el servidor Node.js para habilitarlos.</div>`:''}
 <div class="int-stats"><div><strong>${d.length}</strong><span>Servicios previstos</span></div><div><strong>${configured}</strong><span>Con credenciales guardadas</span></div><div><strong>${connected}</strong><span>Conexión comprobada</span></div><div><strong>0</strong><span>Flujos productivos habilitados</span></div></div></div>
 <div class="int-layout"><div class="int-list">${d.map(p=>{const r=S.items[p.id];return `<button type="button" class="int-provider ${p.id===selected.id?'selected':''}" data-int-action="select" data-provider="${p.id}"><span class="int-provider-top"><strong>${esc(p.name)}</strong><span class="int-pill ${statusClass(r)}">${statusLabel(r)}</span></span><small>${esc(p.category)}</small></button>`}).join('')}</div>
 <div class="admin-section int-details"><div class="int-service-top"><div><div class="int-eyebrow">${esc(selected.category)}</div><h3>${esc(selected.name)}</h3></div><span class="int-pill ${statusClass(rec)}">${statusLabel(rec)}</span></div><p>${esc(selected.summary)}</p><div class="int-info-line"><span>Prueba disponible</span><b>${esc(selected.test)}</b></div><form id="integrationSettingsForm" data-provider="${esc(selected.id)}" class="int-form">
 ${selected.mode?`<div class="field"><label class="form-label">Ambiente</label><select name="mode" ${disabled?'disabled':''} class="form-select"><option value="test" ${rec.mode!=='live'?'selected':''}>Pruebas / Sandbox</option><option value="live" ${rec.mode==='live'?'selected':''}>Producción (requiere aprobación y pruebas)</option></select></div>`:`<input type="hidden" name="mode" value="test"/>`}
 <div class="form-grid int-fields">${selected.fields.map(f=>fieldMarkup(f,rec,disabled)).join('')}</div>
 <div class="int-footer"><button type="submit" class="btn" ${disabled||S.loading?'disabled':''}>${S.loading?'Guardando…':'Guardar credenciales de forma segura'}</button><button type="button" class="btn black" data-int-action="test" data-provider="${esc(selected.id)}" ${disabled||S.loading||!rec.configured||!rec.canTest?'disabled':''}>Probar conexión (sin operaciones)</button><button type="button" class="btn outline" data-int-action="clear" data-provider="${esc(selected.id)}" ${disabled||S.loading||!rec.configured?'disabled':''}>Quitar configuración</button></div>
 </form><div class="int-feedback ${S.error?'error':'ok'}" role="status">${esc(S.message||rec.testMessage||'Las claves guardadas nunca se vuelven a mostrar. Puedes reemplazarlas ingresando otras nuevas.')}</div><p class="int-link"><a href="${esc(selected.docs)}" target="_blank" rel="noopener noreferrer">Documentación oficial del proveedor ↗</a></p></div></div>
 <div class="admin-section"><h3>Infraestructura y checklist de producción</h3><div class="int-infra"><div><b>Servidor Node.js</b><span>${S.mode==='server'?'Disponible':'No activo en HTML offline'}</span></div><div><b>Bóveda cifrada AES-256-GCM</b><span>${S.mode==='server'?'Operativa':'Requiere Node + variables xCloud'}</span></div><div><b>PostgreSQL</b><span>${S.infrastructure.dbEnvConfigured?'URL de conexión configurada; falta migraciones':'Falta DATABASE_URL y tablas de usuarios/pedidos'}</span></div><div><b>Registro, Wallet y pedidos compartidos</b><span>No conectado: todavía son datos locales de demostración</span></div><div><b>Clip y webhooks</b><span>Guardar/testear credencial no habilita cobros ni webhooks</span></div><div><b>App Expo</b><span>Claves de firma iOS/Android se gestionan en EAS, NO en este formulario</span></div></div></div>
 ${S.mode==='server'&&S.auth?`<div class="int-footer"><button class="btn outline sm" data-int-action="audit">Ver últimos cambios de configuración</button><button class="btn outline sm" data-int-action="logout">Cerrar sesión segura</button></div>${S.audit.length?`<div class="admin-section"><h3>Registro de actividad</h3><div class="int-audit">${S.audit.map(e=>`<div>${esc(e.time)} · ${esc(e.action)} ${e.provider?'· '+esc(e.provider):''}</div>`).join('')}</div></div>`:''}`:''}`;
}
async function update(){S.loading=true;S.message='';S.error=false;refreshUI();}
async function submit(form){const id=form.dataset.provider;const p=S.catalog.find(x=>x.id===id);if(!p)return;const fd=new FormData(form);const fields={};for(const f of p.fields){if(fd.has(f.key))fields[f.key]=String(fd.get(f.key)||'').trim()}
 const mode=String(fd.get('mode')||'test');if(mode==='live'&&!confirm('Vas a guardar credenciales en modo PRODUCCIÓN. Esto NO activa cobros ni envíos hasta que se complete el backend. ¿Continuar?'))return;
 S.loading=true;S.error=false;S.message='Guardando…';
 try{const r=await api('/api/admin/integrations/'+id,{method:'PUT',body:JSON.stringify({mode,fields})});S.items[id]=r.item;S.message=r.missing?.length?'Guardado parcial. Falta: '+r.missing.join(', '):'Configuración guardada cifrada. Usa Probar conexión para validar permisos.'}
 catch(e){S.error=true;S.message=e.message}finally{S.loading=false;refreshUI()}
}
async function login(form){const password=String(new FormData(form).get('password')||'');S.message='Verificando acceso…';try{const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password})});S.auth=true;S.csrf=r.csrf||'';S.message='';await load();refreshUI()}catch(e){S.error=true;S.message=e.message;refreshUI()}}
async function action(kind,id){
 if(kind==='select'){S.selected=id;S.message='';S.error=false;refreshUI();return}
 if(kind==='logout'){try{await api('/api/admin/logout',{method:'POST',body:'{}'})}catch{}S.auth=false;S.csrf='';S.items={};S.message='Sesión cerrada.';refreshUI();return}
 if(kind==='audit'){try{S.audit=(await api('/api/admin/audit')).items||[];S.message='Actividad cargada.'}catch(e){S.message=e.message;S.error=true}refreshUI();return}
 if(kind==='clear'&&!confirm('¿Eliminar las credenciales de '+id+'? Esta operación no se puede deshacer.'))return;
 if(!['test','clear'].includes(kind))return;
 S.loading=true;S.error=false;S.message=kind==='test'?'Consultando al proveedor sin ejecutar operaciones…':'Eliminando configuración…';refreshUI();
 try{const d=kind==='test'?await api('/api/admin/integrations/'+id+'/test',{method:'POST',body:'{}'}):await api('/api/admin/integrations/'+id,{method:'DELETE'});S.items[id]=d.item;S.message=kind==='test'?d.item.testMessage:'Credenciales eliminadas.';S.error=kind==='test'&&d.item.testStatus!=='passed'}catch(e){S.message=e.message;S.error=true}finally{S.loading=false;refreshUI()}
}
document.addEventListener('submit',e=>{if(e.target?.id==='integrationSettingsForm'){e.preventDefault();submit(e.target)}if(e.target?.id==='integrationLoginForm'){e.preventDefault();login(e.target)}},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-int-action]');if(!b)return;e.preventDefault();action(b.dataset.intAction,b.dataset.provider)},true);
window.TADAA_INTEGRATIONS={guard,render,logoutButton:()=>S.mode==='server'&&S.auth?'<button class="admin-item" data-int-action="logout">⇥ Cerrar sesión</button>':'',state:S};
init();
})();
