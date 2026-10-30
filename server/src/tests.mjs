// All outbound checks use fixed official hosts and read-only GET requests.
// Never create charges, issue CFDIs, send SMS/email or create shipping labels.
import {INTEGRATIONS} from './catalog.mjs';
const basic=(a,b)=>'Basic '+Buffer.from(`${a}:${b}`).toString('base64');
async function get(url,headers={}){
 const res=await fetch(url,{method:'GET',headers:{'Accept':'application/json',...headers},signal:AbortSignal.timeout(10000),redirect:'error'});
 const body=(await res.text()).slice(0,10000);let obj={};try{obj=JSON.parse(body)}catch{}
 return {ok:res.ok,http:res.status,body:obj};
}
export async function checkConnection(id,record){
 if(!INTEGRATIONS[id])throw Error('Servicio no permitido');
 if(!record.configured)throw Error('Completa primero todos los campos obligatorios');
 const f=record.fields,mode=record.mode;
 let r;
 switch(id){
 case 'clip':{
  const now=new Date(),from=new Date(now.getTime()-24*3600000);
  const url='https://api.payclip.com/payments?'+new URLSearchParams({from:from.toISOString(),to:now.toISOString()});
  r=await get(url,{'Authorization':'Bearer '+f.apiKey});break;
 }
 case 'twilio':{
  if(!/^VA[a-fA-F0-9]{32}$/.test(f.verifyServiceSid||''))throw Error('Verify Service SID debe empezar con VA y contener 34 caracteres');
  r=await get('https://verify.twilio.com/v2/Services/'+encodeURIComponent(f.verifyServiceSid),{'Authorization':basic(f.apiKeySid,f.apiKeySecret)});break;
 }
 case 'resend':r=await get('https://api.resend.com/domains',{'Authorization':'Bearer '+f.apiKey});break;
 case 'googlemaps':{
  const url='https://maps.googleapis.com/maps/api/geocode/json?'+new URLSearchParams({components:'postal_code:06700|country:MX',key:f.apiKey});
  r=await get(url);if(r.ok&&r.body.status!=='OK')return {ok:false,message:'Google respondió '+String(r.body.status||'sin resultados')};break;
 }
 case 'facturama':{
  const host=mode==='live'?'api.facturama.mx':'apisandbox.facturama.mx';
  r=await get(`https://${host}/catalogs/PaymentForms`,{'Authorization':basic(f.username,f.password),'User-Agent':f.username});break;
 }
 case 'envia':{
  const host=mode==='live'?'queries.envia.com':'queries.test.envia.com';
  r=await get(`https://${host}/carrier?country_code=MX`,{'Authorization':'Bearer '+f.token});break;
 }
 default:return {ok:false,message:'Configuración guardada; este adaptador todavía no tiene prueba remota automatizada'};
 }
 return {ok:r.ok,message:r.ok?'Credencial aceptada por el servicio (consulta sin operaciones)':'Proveedor respondió HTTP '+r.http+'; revisa credenciales, permisos y ambiente'};
}
