/* Shared same-origin API client: real PostgreSQL, HttpOnly cookies, CSRF. */
window.TadaaApi=(()=>{
 let csrf='';
 // Respuestas GET en memoria (45 s): la navegación pinta al instante con lo último y se actualiza por detrás.
 // Cualquier cambio (POST/PUT/PATCH/DELETE) vacía la memoria para no mostrar datos viejos.
 const C=new Map(),NOCACHE=/\/auth\/|\/admin\/me|\/qr|\/guests\?|\/lookup/;
 async function call(url,method='GET',body=null,opts={}){
  if(method==='GET'&&!NOCACHE.test(url)){const hit=C.get(url),age=hit?Date.now()-hit.t:1e9;
   if(hit&&hit.data&&age<45000){if(age>8000&&!hit.p)hit.p=raw(url,method,body,opts).then(d=>{C.set(url,{t:Date.now(),data:d})}).catch(()=>{hit.p=null});return hit.data}
   if(hit&&hit.p&&!hit.data)return hit.p;
   const p=raw(url,method,body,opts).then(d=>{C.set(url,{t:Date.now(),data:d});return d}).catch(e=>{C.delete(url);throw e});C.set(url,{t:Date.now(),p});return p}
  if(method!=='GET')C.clear();
  return raw(url,method,body,opts)}
 function prefetch(url){if(!C.has(url))call(url).catch(()=>{})}
 async function raw(url,method='GET',body=null,{admin=false}={}){
  const headers={};if(body!==null)headers['Content-Type']='application/json';
  if(method!=='GET'&&method!=='HEAD'){if(!csrf&&!admin){await refresh()}if(csrf&&!admin)headers['x-tadaa-csrf']=csrf;if(admin){const x=await fetch('/api/admin/me',{credentials:'same-origin'}).then(r=>r.json());headers['x-csrf-token']=x.csrf||'';}}
  let r=await fetch(url,{method,credentials:'same-origin',headers,body:body===null?undefined:JSON.stringify(body)});
  let d=await r.json().catch(()=>({error:'Respuesta no válida'}));
  if(!r.ok)throw Error(d.error||`Error ${r.status}`);
  if(d.csrf)csrf=d.csrf;
  return d;
 }
 async function refresh(){const r=await fetch('/api/v2/auth/me',{credentials:'same-origin'});const d=await r.json();csrf=d.csrf||'';return d}
 return {call,prefetch,refresh,csrf:()=>csrf,clear:()=>C.clear()};
})();
