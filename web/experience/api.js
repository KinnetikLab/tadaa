/* Shared same-origin API client: real PostgreSQL, HttpOnly cookies, CSRF. */
window.TadaaApi=(()=>{
 let csrf='';
 async function call(url,method='GET',body=null,{admin=false}={}){
  const headers={};if(body!==null)headers['Content-Type']='application/json';
  if(method!=='GET'&&method!=='HEAD'){if(!csrf&&!admin){await refresh()}if(csrf&&!admin)headers['x-tadaa-csrf']=csrf;if(admin){const x=await fetch('/api/admin/me',{credentials:'same-origin'}).then(r=>r.json());headers['x-csrf-token']=x.csrf||'';}}
  let r=await fetch(url,{method,credentials:'same-origin',headers,body:body===null?undefined:JSON.stringify(body)});
  let d=await r.json().catch(()=>({error:'Respuesta no válida'}));
  if(!r.ok)throw Error(d.error||`Error ${r.status}`);
  if(d.csrf)csrf=d.csrf;
  return d;
 }
 async function refresh(){const r=await fetch('/api/v2/auth/me',{credentials:'same-origin'});const d=await r.json();csrf=d.csrf||'';return d}
 return {call,refresh,csrf:()=>csrf};
})();
