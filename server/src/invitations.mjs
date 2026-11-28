/* TADAA! — Micrositios e invitaciones.
 * Productores: solicitar un micrositio (agenda una videollamada de 30 min) y gestionar campañas de invitación
 * (función de prensa, F&F, estreno) para particulares, patrocinadores y empresas (por lista o por sorteo).
 * Público: abrir la invitación (wallet con pases y QR dinámico) y canjear un código de sorteo.
 * Staff: validar el QR del pase o dar acceso por nombre.
 */
import crypto from 'node:crypto';

const SECRET=()=>process.env.QR_SECRET||process.env.SESSION_SECRET||'tadaa-invite';
const KINDS=['particular','patrocinador','empresa'];
const CODE_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const newToken=()=>crypto.randomBytes(12).toString('base64url');
export function newCode(rand=n=>crypto.randomInt(n)){let s='';for(let i=0;i<8;i++)s+=CODE_ABC[rand(CODE_ABC.length)];return 'TD-'+s.slice(0,4)+'-'+s.slice(4)}
export function slugify(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
// QR del pase: id del pase + minuto + firma. Cambia cada minuto; se acepta el minuto actual y los dos anteriores.
export function passPayload(passId,minute=Math.floor(Date.now()/60000)){const sig=crypto.createHmac('sha256',SECRET()).update(passId+'|'+minute).digest('base64url').slice(0,12);return `TADAA|INV|${passId}|${minute}|${sig}`}
export function verifyPass(payload,now=Date.now()){const m=String(payload||'').trim().match(/^TADAA\|INV\|([0-9a-f-]{36})\|(\d+)\|([\w-]{12})$/i);if(!m)return null;const minute=Number(m[2]),cur=Math.floor(now/60000);if(minute>cur+1||minute<cur-2)return {expired:true};
 const want=crypto.createHmac('sha256',SECRET()).update(m[1]+'|'+minute).digest('base64url').slice(0,12);if(!crypto.timingSafeEqual(Buffer.from(want),Buffer.from(m[3])))return null;return {passId:m[1].toLowerCase()}}
export function inviteLink(siteUrl,token){const base=siteUrl||'/';return base+(base.includes('?')?'&':'?')+'inv='+encodeURIComponent(token)}
export function icsFor({title,start,minutes=30,url,description}){const f=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const end=new Date(+new Date(start)+minutes*60000);
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TADAA!//Micrositios//ES','BEGIN:VEVENT','UID:'+crypto.randomUUID()+'@tadaa','DTSTAMP:'+f(Date.now()),'DTSTART:'+f(start),'DTEND:'+f(end),'SUMMARY:'+title,'LOCATION:'+url,'DESCRIPTION:'+String(description||'').replace(/\n/g,'\\n')+'\\n'+url,'END:VEVENT','END:VCALENDAR'].join('\r\n')}

const redeemHits=new Map();
function redeemLimited(ip){const now=Date.now(),a=(redeemHits.get(ip)||[]).filter(t=>now-t<600000);a.push(now);redeemHits.set(ip,a);return a.length>12}

async function siteFor(p,slug){if(!slug)return null;const r=await p.query(`SELECT slug,config->>'page' page FROM show_landings WHERE slug=$1 AND status<>'archived'`,[slug]);if(!r.rowCount)return null;const pg=r.rows[0].page;return pg&&/^[a-z0-9/_-]+\/?$/i.test(pg)?'/'+pg:'/landings/?s='+slug}

async function campaignOf(p,org,id,uuid,invalid){if(!uuid(id))throw invalid('Campaña inválida');const r=await p.query('SELECT * FROM invite_campaigns WHERE id=$1 AND organization_id=$2',[id,org]);if(!r.rowCount)throw invalid('Campaña no encontrada',404);return r.rows[0]}
async function makePasses(c,invId,n,first,rest){for(let i=1;i<=n;i++)await c.query('INSERT INTO invitation_passes(invitation_id,n,holder_name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[invId,i,i===1?first:(rest||null)])}

export async function invitationsRequest(req,res,url,parts,ctx,{producerUser,staffUser,ownEvent}){
 const {getPool,response,invalid,reqBody,clean,uuid,audit}=ctx;const p=getPool();const M=req.method;

 // ───── Productor ─────
 if(parts[2]==='orgs'&&uuid(parts[3])&&parts[4]==='producer'){const org=parts[3];
  if(parts[5]==='minisite-requests'&&parts.length===6&&M==='GET'){await producerUser(req,ctx,org);const r=await p.query('SELECT * FROM minisite_requests WHERE organization_id=$1 ORDER BY slot DESC LIMIT 50',[org]);return response(res,200,{requests:r.rows}),true}
  if(parts[5]==='minisite-requests'&&parts.length===6&&M==='POST'){const s=await producerUser(req,ctx,org),d=await reqBody(req);const production=clean(d.production,120);if(!production)throw invalid('Escribe el nombre de la producción');
   const slot=new Date(d.slot);if(Number.isNaN(+slot))throw invalid('Elige fecha y hora para la videollamada');if(+slot<Date.now()+30*60000)throw invalid('Elige un horario con al menos 30 minutos de anticipación');if(+slot>Date.now()+90*86400000)throw invalid('Elige un horario dentro de los próximos 90 días');
   const meet='https://meet.jit.si/TADAA-'+(slugify(production)||'micrositio')+'-'+crypto.randomBytes(3).toString('hex');
   const r=await p.query(`INSERT INTO minisite_requests(organization_id,requested_by,production,contact_phone,notes,slot,meet_url) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[org,s.user_id,production,clean(d.phone,40)||null,clean(d.notes,800)||null,slot.toISOString(),meet]);
   await audit(s.user_id,'producer.minisite.request','organization',org,{production});
   return response(res,201,{request:r.rows[0],ics:icsFor({title:'TADAA! · Micrositio de '+production,start:slot,url:meet,description:'Videollamada de 30 minutos para platicar el micrositio de '+production+'.'})}),true}

  if(parts[5]==='invites'&&parts.length===6&&M==='GET'){await producerUser(req,ctx,org);const [c,l]=await Promise.all([
    p.query(`SELECT c.*,(SELECT count(*)::int FROM invitations i WHERE i.campaign_id=c.id AND i.parent_id IS NULL AND i.status<>'cancelada') invitations,
      (SELECT count(*)::int FROM invitation_passes ps JOIN invitations i ON i.id=ps.invitation_id WHERE i.campaign_id=c.id AND i.status<>'cancelada') passes,
      (SELECT count(*)::int FROM invitation_passes ps JOIN invitations i ON i.id=ps.invitation_id WHERE i.campaign_id=c.id AND ps.checked_in_at IS NOT NULL) inside
      FROM invite_campaigns c WHERE c.organization_id=$1 ORDER BY c.created_at DESC`,[org]),
    p.query(`SELECT slug,title FROM show_landings WHERE status<>'archived' ORDER BY title`)]);
   return response(res,200,{campaigns:c.rows,minisites:l.rows}),true}
  if(parts[5]==='invites'&&parts[6]==='campaigns'&&parts.length===7&&M==='POST'){const s=await producerUser(req,ctx,org),d=await reqBody(req);const title=clean(d.title,120);if(!title)throw invalid('Ponle nombre a la campaña (ej. Función de prensa)');
   const slug=clean(d.landingSlug,80);const site=await siteFor(p,slug);if(!site)throw invalid('Elige el micrositio de la producción');let ev=null;if(d.eventId){ev=(await ownEvent(ctx,org,d.eventId)).id}
   const starts=d.startsAt?new Date(d.startsAt):null;if(starts&&Number.isNaN(+starts))throw invalid('Fecha inválida');
   const r=await p.query(`INSERT INTO invite_campaigns(organization_id,event_id,landing_slug,site_url,title,starts_at,venue,doors,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[org,ev,slug,site,title,starts?starts.toISOString():null,clean(d.venue,120)||null,clean(d.doors,40)||null,s.user_id]);
   await audit(s.user_id,'producer.invites.campaign','organization',org,{title});return response(res,201,{campaign:r.rows[0]}),true}
  if(parts[5]==='invites'&&parts[6]==='campaigns'&&uuid(parts[7])&&parts.length===8&&M==='GET'){await producerUser(req,ctx,org);const camp=await campaignOf(p,org,parts[7],uuid,invalid);
   const r=await p.query(`SELECT i.id,i.parent_id,i.token,i.kind,i.assign,i.guest_name,i.company,i.email,i.phone,i.tickets,i.code,i.status,i.sent_via,i.sent_at,i.opened_at,i.redeemed_at,i.created_at,
      (SELECT count(*)::int FROM invitation_passes ps WHERE ps.invitation_id=i.id AND ps.checked_in_at IS NOT NULL) inside
      FROM invitations i LEFT JOIN invitations pa ON pa.id=i.parent_id WHERE i.campaign_id=$1 ORDER BY COALESCE(pa.created_at,i.created_at) DESC,i.parent_id NULLS FIRST,i.created_at`,[camp.id]);
   return response(res,200,{campaign:camp,invitations:r.rows.map(x=>({...x,link:x.status==='codigo'||(x.kind==='empresa'&&!x.parent_id)?null:inviteLink(camp.site_url,x.token)}))}),true}
  if(parts[5]==='invites'&&parts[6]==='campaigns'&&uuid(parts[7])&&parts[8]==='invitations'&&M==='POST'){const s=await producerUser(req,ctx,org),camp=await campaignOf(p,org,parts[7],uuid,invalid),d=await reqBody(req);
   const items=Array.isArray(d.items)?d.items.slice(0,500):[];if(!items.length)throw invalid('No hay invitaciones para crear');
   const c=await p.connect();let made=0,codes=0;const errors=[];
   try{await c.query('BEGIN');
    for(const [ix,it] of items.entries()){const kind=KINDS.includes(it.kind)?it.kind:'particular',name=clean(it.guestName,120),company=clean(it.company,120),email=clean(it.email,254).toLowerCase()||null,phone=clean(it.phone,30).replace(/[^\d+]/g,'')||null;
     const n=Math.trunc(Number(it.tickets));const row=ix+1;
     if(!(n>=1&&n<=200)){errors.push(`Fila ${row}: el número de boletos debe ser entre 1 y 200`);continue}
     if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){errors.push(`Fila ${row}: correo inválido`);continue}
     if(kind==='empresa'){if(!company){errors.push(`Fila ${row}: falta el nombre de la empresa`);continue}const assign=it.assign==='sorteo'?'sorteo':'lista';
      const holders=(Array.isArray(it.holders)?it.holders:String(it.holders||'').split(/[\n;|]+/)).map(x=>clean(x,120)).filter(Boolean);
      if(assign==='lista'&&holders.length!==n){errors.push(`Fila ${row}: la lista de ${company} tiene ${holders.length} nombres y son ${n} boletos`);continue}
      const par=await c.query(`INSERT INTO invitations(campaign_id,token,kind,assign,guest_name,company,email,phone,tickets) VALUES($1,$2,'empresa',$3,$4,$5,$6,$7,$8) RETURNING id`,[camp.id,newToken(),assign,name||null,company,email,phone,n]);made++;
      for(let k=0;k<n;k++){if(assign==='lista'){const ch=await c.query(`INSERT INTO invitations(campaign_id,parent_id,token,kind,assign,guest_name,company,tickets) VALUES($1,$2,$3,'empresa','lista',$4,$5,1) RETURNING id`,[camp.id,par.rows[0].id,newToken(),holders[k],company]);await makePasses(c,ch.rows[0].id,1,holders[k])}
       else{let ok=false;for(let t=0;t<5&&!ok;t++){const r=await c.query(`INSERT INTO invitations(campaign_id,parent_id,token,kind,assign,company,tickets,code,status) VALUES($1,$2,$3,'empresa','sorteo',$4,1,$5,'codigo') ON CONFLICT(code) DO NOTHING RETURNING id`,[camp.id,par.rows[0].id,newToken(),company,newCode()]);ok=r.rowCount>0}codes++}}
      continue}
     const who=name||company;if(!who){errors.push(`Fila ${row}: falta el nombre de la persona o del patrocinador`);continue}
     const inv=await c.query(`INSERT INTO invitations(campaign_id,token,kind,guest_name,company,email,phone,tickets) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[camp.id,newToken(),kind,name||null,company||null,email,phone,n]);
     await makePasses(c,inv.rows[0].id,n,who,kind==='patrocinador'?null:'Acompañante de '+who.split(/\s+/)[0]);made++}
    if(errors.length&&!made){await c.query('ROLLBACK');throw invalid(errors.slice(0,5).join(' · '))}
    await c.query('COMMIT')}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
   await audit(s.user_id,'producer.invites.create','organization',org,{campaign:camp.id,made,codes});return response(res,201,{created:made,codes,errors}),true}
  if(parts[5]==='invites'&&parts[6]==='invitations'&&uuid(parts[7])&&['sent','cancel'].includes(parts[8])&&M==='POST'){const s=await producerUser(req,ctx,org),d=await reqBody(req);const via=['whatsapp','correo','enlace'].includes(d.via)?d.via:'enlace';
   const sql=parts[8]==='sent'?`UPDATE invitations i SET status=CASE WHEN i.status='pendiente' THEN 'enviada' ELSE i.status END,sent_via=$3,sent_at=COALESCE(i.sent_at,now()) FROM invite_campaigns c WHERE i.id=$1 AND c.id=i.campaign_id AND c.organization_id=$2 AND i.status<>'cancelada' RETURNING i.id`
    :`UPDATE invitations i SET status='cancelada' FROM invite_campaigns c WHERE (i.id=$1 OR i.parent_id=$1) AND c.id=i.campaign_id AND c.organization_id=$2 AND $3::text IS NOT NULL RETURNING i.id`;
   const r=await p.query(sql,[parts[7],org,via]);if(!r.rowCount)throw invalid('Invitación no encontrada',404);await audit(s.user_id,'producer.invites.'+parts[8],'invitation',parts[7],{via});return response(res,200,{ok:true}),true}
 }

 // ───── Público: invitación y canje ─────
 if(parts[2]==='invites'&&parts[3]==='redeem'&&parts.length===4&&M==='POST'){const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0];if(redeemLimited(ip))throw invalid('Demasiados intentos. Espera unos minutos.',429);
  const d=await reqBody(req);const code=clean(d.code,20).toUpperCase().replace(/\s/g,''),name=clean(d.name,120);if(!/^TD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code))throw invalid('Revisa tu código: tiene la forma TD-XXXX-XXXX');if(name.length<3)throw invalid('Escribe tu nombre completo, como aparece en tu identificación');
  const c=await p.connect();try{await c.query('BEGIN');const r=await c.query(`SELECT i.id,i.token,i.status,c.site_url FROM invitations i JOIN invite_campaigns c ON c.id=i.campaign_id WHERE i.code=$1 FOR UPDATE OF i`,[code]);
   if(!r.rowCount){await c.query('ROLLBACK');throw invalid('Ese código no existe',404)}const x=r.rows[0];
   if(x.status==='cancelada'){await c.query('ROLLBACK');throw invalid('Ese código fue cancelado',410)}
   if(x.status!=='codigo'){await c.query('ROLLBACK');throw invalid('Ese código ya se canjeó',409)}
   await c.query(`UPDATE invitations SET guest_name=$2,status='canjeada',redeemed_at=now() WHERE id=$1`,[x.id,name]);await makePasses(c,x.id,1,name);await c.query('COMMIT');
   return response(res,200,{token:x.token,link:inviteLink(x.site_url,x.token)}),true}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}}
 if(parts[2]==='invites'&&parts[3]&&parts.length===4&&M==='GET'){const tok=clean(parts[3],40);if(!/^[\w-]{8,40}$/.test(tok))throw invalid('Invitación no encontrada',404);
  const r=await p.query(`SELECT i.id,i.kind,i.guest_name,i.company,i.tickets,i.status,i.parent_id,i.assign,c.title,c.starts_at,c.venue,c.doors,c.landing_slug,c.site_url FROM invitations i JOIN invite_campaigns c ON c.id=i.campaign_id WHERE i.token=$1`,[tok]);
  const x=r.rows[0];if(!x||x.status==='codigo')throw invalid('Invitación no encontrada',404);if(x.status==='cancelada')throw invalid('Esta invitación fue cancelada',410);
  if(x.kind==='empresa'&&!x.parent_id)throw invalid('Esta es la invitación general de la empresa; cada colaborador recibe la suya',404);
  if(!['canjeada'].includes(x.status))await p.query(`UPDATE invitations SET opened_at=COALESCE(opened_at,now()),status=CASE WHEN status IN('pendiente','enviada') THEN 'abierta' ELSE status END WHERE id=$1`,[x.id]);
  const ps=await p.query('SELECT id,n,holder_name,checked_in_at FROM invitation_passes WHERE invitation_id=$1 ORDER BY n',[x.id]);
  return response(res,200,{invitation:{guest:x.guest_name||x.company,company:x.company,kind:x.kind,tickets:x.tickets},campaign:{title:x.title,starts_at:x.starts_at,venue:x.venue,doors:x.doors,landing_slug:x.landing_slug},passes:ps.rows.map(z=>({n:z.n,holder:z.holder_name,used:!!z.checked_in_at}))}),true}
 if(parts[2]==='invites'&&parts[3]&&parts[4]==='passes'&&/^\d{1,3}$/.test(parts[5]||'')&&parts[6]==='qr'&&M==='GET'){const tok=clean(parts[3],40);
  const r=await p.query(`SELECT ps.id FROM invitation_passes ps JOIN invitations i ON i.id=ps.invitation_id WHERE i.token=$1 AND ps.n=$2 AND i.status NOT IN('cancelada','codigo')`,[tok,Number(parts[5])]);if(!r.rowCount)throw invalid('Pase no encontrado',404);
  const {default:QR}=await import('qrcode');const svg=await QR.toString(passPayload(r.rows[0].id),{type:'svg',margin:1,errorCorrectionLevel:'M',color:{dark:'#08091A',light:'#FFFFFF'}});
  res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(svg);return true}

 // ───── Staff: QR del pase y acceso por nombre ─────
 if(parts[2]==='staff'&&uuid(parts[3])&&parts[4]==='events'&&uuid(parts[5])){const org=parts[3];
  const scope=`c.organization_id=$1 AND (c.event_id=$2 OR c.event_id IS NULL) AND i.status NOT IN('cancelada','codigo')`;
  const checkin=async(s,passId,method)=>{const r=await p.query(`UPDATE invitation_passes ps SET checked_in_at=now(),checked_in_by=$3,method=$4 FROM invitations i JOIN invite_campaigns c ON c.id=i.campaign_id
     WHERE ps.id=$5 AND i.id=ps.invitation_id AND ${scope} AND ps.checked_in_at IS NULL RETURNING ps.n,ps.holder_name,i.guest_name,i.company,i.kind,c.title`,[org,parts[5],s.user_id,method,passId]);
   if(r.rowCount)return {accepted:true,pass:r.rows[0]};
   const q=await p.query(`SELECT ps.checked_in_at,ps.holder_name FROM invitation_passes ps JOIN invitations i ON i.id=ps.invitation_id JOIN invite_campaigns c ON c.id=i.campaign_id WHERE ps.id=$3 AND ${scope}`,[org,parts[5],passId]);
   if(!q.rowCount)throw invalid('Ese pase no es de este evento',409);return {accepted:false,error:'Este pase ya ingresó a las '+new Date(q.rows[0].checked_in_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',timeZone:'America/Mexico_City'}),holder:q.rows[0].holder_name}};
  if(parts[6]==='guests'&&parts.length===7&&M==='GET'){await staffUser(req,ctx,org);await ownEvent(ctx,org,parts[5]);const q=clean(url.searchParams.get('q'),80).toLowerCase();if(q.length<2)return response(res,200,{guests:[]}),true;
   const r=await p.query(`SELECT ps.id,ps.n,ps.holder_name,ps.checked_in_at,i.guest_name,i.company,i.kind,i.tickets,c.title FROM invitation_passes ps JOIN invitations i ON i.id=ps.invitation_id JOIN invite_campaigns c ON c.id=i.campaign_id
     WHERE ${scope} AND (lower(COALESCE(ps.holder_name,'')) LIKE '%'||$3||'%' OR lower(COALESCE(i.guest_name,'')) LIKE '%'||$3||'%' OR lower(COALESCE(i.company,'')) LIKE '%'||$3||'%') ORDER BY ps.checked_in_at NULLS FIRST,i.guest_name,ps.n LIMIT 40`,[org,parts[5],q]);
   return response(res,200,{guests:r.rows}),true}
  if(parts[6]==='guests'&&uuid(parts[7])&&parts[8]==='checkin'&&M==='POST'){const s=await staffUser(req,ctx,org);await ownEvent(ctx,org,parts[5]);const out=await checkin(s,parts[7],'nombre');await audit(s.user_id,'staff.invite.name','invitation_pass',parts[7]);return response(res,out.accepted?200:409,out),true}
  if(parts[6]==='invite-scan'&&M==='POST'){const s=await staffUser(req,ctx,org);await ownEvent(ctx,org,parts[5]);const d=await reqBody(req);const v=verifyPass(clean(d.qrPayload,300));
   if(!v)throw invalid('QR de invitación inválido');if(v.expired)return response(res,409,{accepted:false,error:'QR vencido: pide al invitado que abra su invitación de nuevo'}),true;
   const out=await checkin(s,v.passId,'qr');return response(res,out.accepted?200:409,out),true}
 }
 return false;
}
