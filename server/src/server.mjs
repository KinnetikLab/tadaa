import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
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
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.ico':'image/x-icon','.mp3':'audio/mpeg','.woff2':'font/woff2','.woff':'font/woff','.mjs':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
// Archivos de texto comprimidos en memoria (brotli/gzip), invalidados por tamaño y fecha.
const zcache=new Map(),ZIP=new Set(['.html','.js','.css','.svg','.json','.mjs','.txt']);
const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data))};
const ipOf=req=>String(req.socket.remoteAddress||'local');
function corsGuard(req){const origin=req.headers.origin;return !origin||origin===PUBLIC_ORIGIN;}
function reqSecure(req){return req.socket.encrypted||req.headers['x-forwarded-proto']==='https';}
async function body(req){let count=0;const chunks=[];for await(const chunk of req){count+=chunk.length;if(count>20_000)throw new Error('JSON supera el tamaño permitido');chunks.push(chunk)}const str=Buffer.concat(chunks).toString('utf8');return str?JSON.parse(str):{}}
async function request(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
 const u=new URL(req.url,'http://local');const pathname=u.pathname;
 // El sitio vive en la raíz. /experience/* quedó de la versión anterior: redirige permanente a la misma ruta sin el prefijo.
 if(pathname==='/experience'||pathname.startsWith('/experience/')){res.writeHead(301,{'Location':(pathname.slice(11)||'/')+(u.search||''),'Cache-Control':'public, max-age=86400'});res.end();return}
 // Páginas de gestión anteriores: todo vive ahora dentro de la app (Studio, portal de productores, app de staff).
 const legacy={'/admin.html':'/#admin','/presentaciones.html':'/#admin/presentaciones','/partner.html':'/#productor','/staff.html':'/#staff','/app.html':'/#cuenta','/inicio-clasico.html':'/','/evento-clasico.html':'/#explorar','/event.html':'/#explorar'};
 if(Object.prototype.hasOwnProperty.call(legacy,pathname)){res.writeHead(301,{'Location':legacy[pathname],'Cache-Control':'no-store'});res.end();return}
 // Enlaces cortos para compartir: /obra/<slug> abre la landing de la obra; /p/<slug> abre la presentación personalizada.
 {const m=pathname.match(/^\/(obra|p)\/([a-z0-9-]{2,80})\/?$/);if(m){res.writeHead(302,{'Location':m[1]==='obra'?'/landings/?s='+m[2]+(u.search?'&'+u.search.slice(1):''):'/#pitch/'+m[2],'Cache-Control':'no-store'});res.end();return}}

 if(pathname.startsWith('/api/')){
  if(process.env.NODE_ENV==='production'&&!reqSecure(req))return send(res,403,{error:'HTTPS obligatorio'});
  if(!corsGuard(req))return send(res,403,{error:'Origen no autorizado'});
  try{
   if(await platformRequest(req,res,pathname,u))return;
   if(pathname==='/api/public/status'&&req.method==='GET'){const database=await databaseStatus();return send(res,200,{server:true,version:'3.0.0-beta.1',configuredServices:'private',database,ordersMode:'postgresql',checkoutMode:'clip-checkout-v2-or-internal-test',realPayments:false});}
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
 let file=decodeURIComponent(pathname);
 if(file==='/')file='/index.html';
 // Never expose files outside the web directory.
 if(file.includes('\0')){res.writeHead(400);return res.end()}
 let target=path.resolve(root,'.'+file);
 if(!target.startsWith(root+path.sep)&&target!==path.join(root,'index.html')){res.writeHead(403);return res.end()}
 let st;try{st=fs.statSync(target)}catch{res.writeHead(404);return res.end()}
 if(st.isDirectory()){if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'+(u.search||'')});return res.end()}target=path.join(target,'index.html');try{st=fs.statSync(target)}catch{res.writeHead(404);return res.end()}}
 if(!st.isFile()){res.writeHead(404);return res.end()}
 const type=types[path.extname(target)]||'application/octet-stream';
 const ext=path.extname(target),etag='"'+st.size.toString(36)+'-'+Math.floor(st.mtimeMs).toString(36)+'"';
 res.setHeader('Content-Type',type);res.setHeader('ETag',etag);res.setHeader('Vary','Accept-Encoding');
 // HTML, JS y CSS se revalidan con ETag (304 instantáneo si no cambiaron); fuentes inmutables; imágenes y audio un día.
 res.setHeader('Cache-Control',['.html','.js','.css','.mjs','.json'].includes(ext)?'no-cache':['.woff2','.woff'].includes(ext)?'public, max-age=31536000, immutable':'public, max-age=86400');
 if(req.headers['if-none-match']===etag){res.writeHead(304);return res.end()}
 const ae=String(req.headers['accept-encoding']||''),enc=ZIP.has(ext)&&st.size>1024?(/\bbr\b/.test(ae)?'br':/\bgzip\b/.test(ae)?'gzip':''):'';
 if(enc){const key=target+'|'+etag+'|'+enc;let buf=zcache.get(key);
  if(!buf){const raw=fs.readFileSync(target);buf=enc==='br'?zlib.brotliCompressSync(raw,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:9,[zlib.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}):zlib.gzipSync(raw,{level:9});if(zcache.size>400)zcache.clear();zcache.set(key,buf)}
  res.writeHead(200,{'Content-Encoding':enc,'Content-Length':buf.length});return res.end(req.method==='HEAD'?undefined:buf)}
 res.setHeader('Accept-Ranges','bytes');
 // Rangos (audio y video en Safari/iOS los exigen para reproducir).
 const rg=/^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range||''));
 if(rg&&(rg[1]||rg[2])){let a=rg[1]?Number(rg[1]):Math.max(0,st.size-Number(rg[2])),z=rg[1]&&rg[2]?Math.min(Number(rg[2]),st.size-1):st.size-1;
  if(a>z||a>=st.size){res.writeHead(416,{'Content-Range':'bytes */'+st.size});return res.end()}
  res.writeHead(206,{'Content-Range':`bytes ${a}-${z}/${st.size}`,'Content-Length':z-a+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(target,{start:a,end:z}).pipe(res)}
 res.setHeader('Content-Length',st.size);
 if(req.method==='HEAD'){res.writeHead(200);return res.end()}
 fs.createReadStream(target).pipe(res);
}
http.createServer((req,res)=>{request(req,res).catch(e=>{console.error('Error:',e.name);if(!res.headersSent)send(res,500,{error:'Error de servidor'})})}).listen(PORT,'0.0.0.0',()=>console.log('TADAA! Beta2 core en puerto '+PORT));
