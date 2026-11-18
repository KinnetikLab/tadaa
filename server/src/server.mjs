import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {INTEGRATIONS,sanitizedCatalog,sanitizedRecord,validateFields} from './catalog.mjs';
import {readVault,saveVault,writeAudit,auditRecent} from './vault.mjs';
import {verifyPassword,isRateLimited,failedLogin,successfulLogin,createSession,currentSession,clearSession,csrfMatches} from './auth.mjs';
import {checkConnection} from './tests.mjs';
import {databaseStatus} from './db.mjs';
import {platformRequest} from './platform.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../web');
const PUBLIC_ORIGIN=process.env.PUBLIC_ORIGIN||'http://localhost:3000';
if(process.env.NODE_ENV==='production'&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(PUBLIC_ORIGIN))throw Error('PUBLIC_ORIGIN debe tener HTTPS en producción');
const PORT=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.ico':'image/x-icon'};
const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data))};
const ipOf=req=>String(req.socket.remoteAddress||'local');
function corsGuard(req){const origin=req.headers.origin;return !origin||origin===PUBLIC_ORIGIN;}
function reqSecure(req){return req.socket.encrypted||req.headers['x-forwarded-proto']==='https';}
async function body(req){let count=0;const chunks=[];for await(const chunk of req){count+=chunk.length;if(count>20_000)throw new Error('JSON supera el tamaño permitido');chunks.push(chunk)}const str=Buffer.concat(chunks).toString('utf8');return str?JSON.parse(str):{}}
async function request(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 const u=new URL(req.url,'http://local');const pathname=u.pathname;
 if(pathname.startsWith('/api/')){
  if(process.env.NODE_ENV==='production'&&!reqSecure(req))return send(res,403,{error:'HTTPS obligatorio'});
  if(!corsGuard(req))return send(res,403,{error:'Origen no autorizado'});
  try{
   if(await platformRequest(req,res,pathname,u))return;
   if(pathname==='/api/public/status'&&req.method==='GET'){const database=await databaseStatus();return send(res,200,{server:true,version:'2.0.0-beta.1',configuredServices:'private',database,ordersMode:'postgresql',checkoutMode:'sandbox-interno',realPayments:false});}
   if(pathname==='/api/admin/login'&&req.method==='POST'){
    const ip=ipOf(req);if(isRateLimited(ip))return send(res,429,{error:'Demasiados intentos. Intenta más tarde.'});
    const d=await body(req);if(!verifyPassword(d.password)){failedLogin(ip);return send(res,401,{error:'Contraseña incorrecta'})}
    successfulLogin(ip);const s=createSession(res);writeAudit({action:'admin.login'});return send(res,200,{authenticated:true,...s});
   }
   const s=currentSession(req);if(pathname==='/api/admin/me'&&req.method==='GET')return send(res,200,{authenticated:!!s,csrf:s?.csrf||null});
   if(!s)return send(res,401,{error:'Inicia sesión como administrador'});
   if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&!csrfMatches(req,s))return send(res,403,{error:'CSRF inválido'});
   if(pathname==='/api/admin/logout'&&req.method==='POST'){clearSession(req,res);writeAudit({action:'admin.logout'});return send(res,200,{ok:true})}
   if(pathname==='/api/admin/audit'&&req.method==='GET')return send(res,200,{items:auditRecent(40)});
   if(pathname==='/api/admin/integrations'&&req.method==='GET'){
    const db=readVault();return send(res,200,{catalog:sanitizedCatalog(),items:Object.fromEntries(Object.keys(INTEGRATIONS).map(id=>[id,sanitizedRecord(id,db.integrations[id])])),infrastructure:{...(await databaseStatus()),storageReady:false,paymentsReady:false}});
   }
   const match=pathname.match(/^\/api\/admin\/integrations\/([a-z0-9_-]+)(?:\/(test))?$/);
   if(match){const [,id,test]=match;if(!INTEGRATIONS[id])return send(res,404,{error:'Proveedor desconocido'});
    const db=readVault();db.integrations ||= {};
    if(req.method==='PUT'&&!test){const input=await body(req);if(!['test','live'].includes(input.mode))return send(res,400,{error:'Ambiente inválido'});
     const prev=db.integrations[id]||{},validated=validateFields(id,input.fields||{},prev.fields||{});
     const update={fields:validated.fields,configured:validated.configured,mode:INTEGRATIONS[id].mode?input.mode:'test',updatedAt:new Date().toISOString(),testedAt:null,testStatus:'untested',testMessage:''};
     db.integrations[id]=update;saveVault(db);writeAudit({action:'integration.saved',provider:id,configured:validated.configured});return send(res,200,{item:sanitizedRecord(id,update),missing:validated.missing});
    }
    if(req.method==='POST'&&test){const v=db.integrations[id];if(!v?.configured)return send(res,400,{error:'Completa los campos antes de probar'});
     let result;try{result=await checkConnection(id,v)}catch(e){result={ok:false,message:'La consulta no pudo completarse. Revisa el servicio o la configuración.'}}
     v.testedAt=new Date().toISOString();v.testStatus=result.ok?'passed':'failed';v.testMessage=result.message;saveVault(db);writeAudit({action:'integration.tested',provider:id,ok:result.ok});return send(res,200,{item:sanitizedRecord(id,v)});
    }
    if(req.method==='DELETE'&&!test){delete db.integrations[id];saveVault(db);writeAudit({action:'integration.cleared',provider:id});return send(res,200,{item:sanitizedRecord(id)});}
   }
   return send(res,404,{error:'Ruta no encontrada'});
  }catch(e){if(e instanceof SyntaxError)return send(res,400,{error:'JSON incorrecto'});if(e.message?.includes('no permitido')||e.message?.includes('incorrecto')||e.message?.includes('inválido')||e.message?.includes('Código postal'))return send(res,400,{error:e.message});console.error('Error API:',e.name);return send(res,500,{error:'Error interno. Consulta los logs del servidor.'});}
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 let file=pathname==='/'?'/experience/index.html':decodeURIComponent(pathname);
 if(pathname==='/experience/'||pathname==='/experience')file='/experience/index.html';
 // Never expose files outside the web directory.
 if(file.includes('\0')){res.writeHead(400);return res.end()}
 const target=path.resolve(root,'.'+file);
 if(!target.startsWith(root+path.sep)&&target!==path.join(root,'index.html')){res.writeHead(403);return res.end()}
 let st;try{st=fs.statSync(target)}catch{res.writeHead(404);return res.end()}
 if(!st.isFile()){res.writeHead(404);return res.end()}
 const type=types[path.extname(target)]||'application/octet-stream';
 res.setHeader('Content-Type',type);res.setHeader('Cache-Control',path.extname(target)==='.html'?'no-store':'public, max-age=3600');
 if(req.method==='HEAD'){res.writeHead(200);return res.end()}
 fs.createReadStream(target).pipe(res);
}
http.createServer((req,res)=>{request(req,res).catch(e=>{console.error('Error:',e.name);if(!res.headersSent)send(res,500,{error:'Error de servidor'})})}).listen(PORT,'0.0.0.0',()=>console.log('TADAA! Beta2 core en puerto '+PORT));
