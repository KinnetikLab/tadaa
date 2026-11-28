/* TADAA Beta 3: boletaje propio, membresías, convenios y operación de productores.
 * Todas las operaciones comerciales se persisten en PostgreSQL. Pago REAL deshabilitado
 * hasta instalar y verificar gateway/webhooks con autorizaciones del proveedor.
 */
import crypto from 'node:crypto';
import {getPool} from './db.mjs';
import {currentSession} from './auth.mjs';
import {readVault,saveVault,writeAudit} from './vault.mjs';
import {featureRequest,nowGate,prepareAddons,saveAddons,issueTicket,membershipQuote,consumeMembershipOffer,employeeExit,linkEmployeeByRfc,eventPublicExtras,normalizeRfc,validRfc} from './features.mjs';
import {isClipCheckoutPaid,clampMembershipPromoDays,validSeatSelection,clipAmountFromMinor} from './ticketing-rules.mjs';
const COOKIE=process.env.NODE_ENV==='production'?'__Host-tadaa_user':'tadaa_user';
const secure=process.env.NODE_ENV==='production';
const key=process.env.TADAA_SESSION_SECRET||'';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const lim=new Map();
const stamp=()=>new Date().toISOString();
const response=(res,code,obj,headers={})=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(obj))};
const invalid=(msg,code=400)=>Object.assign(new Error(msg),{httpCode:code});
const reqBody=async req=>{let total=0;let chunks=[];for await(const c of req){total+=c.length;if(total>1100000)throw invalid('Solicitud supera 1 MB',413);chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw invalid('JSON inválido')}};
const clean=(x,max=255)=>String(x??'').trim().slice(0,max);
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(x||''));
const isEmail=x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)&&x.length<255;
const pathSafe=x=>/^[a-z0-9][a-z0-9-]{1,89}$/.test(String(x));
const random=()=>crypto.randomBytes(32).toString('base64url');
function limiter(req,tag,limit=12){const ip=req.socket.remoteAddress||'unknown',name=tag+ip,t=Date.now();const v=lim.get(name)||{count:0,until:t+600000};if(t>v.until){v.count=0;v.until=t+600000}v.count++;lim.set(name,v);if(v.count>limit)throw invalid('Demasiados intentos. Intenta de nuevo en unos minutos.',429)}
function passwordHash(pass){const salt=crypto.randomBytes(16);const h=crypto.scryptSync(pass,salt,64);return 'scrypt:'+salt.toString('hex')+':'+h.toString('hex')}
function checkPassword(pass,stored){if(!stored||!stored.startsWith('scrypt:'))return false;try{const[,s,h]=stored.split(':'),a=crypto.scryptSync(pass,Buffer.from(s,'hex'),64),b=Buffer.from(h,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}catch{return false}}
const nowPlus=ms=>new Date(Date.now()+ms);
async function session(req){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));const token=cookie?.slice(COOKIE.length+1);if(!token||token.length>110)return null;const pool=getPool();const r=await pool.query(`SELECT s.id,s.csrf_token,u.id user_id,u.email,u.full_name,u.status FROM user_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()`,[hash(token)]);return r.rows[0]||null}
const mutation=req=>['POST','PUT','PATCH','DELETE'].includes(req.method);
function requireCSRF(req,s){if(mutation(req)&&String(req.headers['x-tadaa-csrf']||'')!==s?.csrf_token)throw invalid('Token de seguridad inválido',403)}
async function requireUser(req){const s=await session(req);if(!s)throw invalid('Inicia sesión',401);if(s.status!=='active')throw invalid('Cuenta deshabilitada',403);requireCSRF(req,s);return s}
function requireAdmin(req){const a=currentSession(req);if(!a)throw invalid('Inicia sesión en el administrador',401);if(mutation(req)&&req.headers['x-csrf-token']!==a.csrf)throw invalid('CSRF administrativo inválido',403);return a}
async function canManage(userId,org){const r=await getPool().query(`SELECT 1 FROM organization_members WHERE user_id=$1 AND organization_id=$2 AND role IN ('owner','admin','manager')`,[userId,org]);return r.rowCount>0}
async function organizationManager(req,org){const s=await requireUser(req);if(!uuid(org)||!(await canManage(s.user_id,org)))throw invalid('No tienes permiso sobre esa organización',403);return s}
async function audit(actor,action,entity,id,details={}){await getPool().query('INSERT INTO audit_actions(actor,action,entity,entity_id,details) VALUES($1,$2,$3,$4,$5)',[actor,action,entity,String(id),JSON.stringify(details)]);}
const tokenFor=(id,exp=Date.now()+75000)=>{const msg=JSON.stringify({id,exp});return Buffer.from(msg).toString('base64url')+'.'+crypto.createHmac('sha256',key).update(msg).digest('base64url')};
const verifiedTicket=tok=>{try{const[a,sig]=tok.split('.'),msg=Buffer.from(a,'base64url').toString('utf8'),h=crypto.createHmac('sha256',key).update(msg).digest('base64url');if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(h)))return null;const p=JSON.parse(msg);return p.exp>Date.now()&&uuid(p.id)?p.id:null}catch{return null}};
async function me(req,res){const s=await session(req);if(!s)return response(res,200,{authenticated:false});const p=await getPool().query(`SELECT u.id,u.email,u.full_name,p.given_name,p.middle_names,p.paternal_surname,p.maternal_surname,p.interests,p.address,p.rfc FROM app_users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=$1`,[s.user_id]);const orgs=await getPool().query(`SELECT o.id,o.name,o.slug,m.role,(SELECT kind FROM partner_agreements a WHERE a.organization_id=o.id ORDER BY created_at DESC LIMIT 1) kind FROM organizations o JOIN organization_members m ON m.organization_id=o.id WHERE m.user_id=$1`,[s.user_id]);const eligible=await eligibility(s.user_id);return response(res,200,{authenticated:true,csrf:s.csrf_token,user:p.rows[0],organizations:orgs.rows,eligibility:eligible})}
async function eligibility(uid){const r=await getPool().query(`SELECT
 EXISTS(SELECT 1 FROM memberships WHERE user_id=$1 AND status='active' AND current_period_end>now())
 OR EXISTS(SELECT 1 FROM membership_entitlements WHERE user_id=$1 AND status='active' AND starts_at<=now() AND ends_at>now()) member,
 EXISTS(SELECT 1 FROM company_employees e JOIN partner_agreements a ON a.organization_id=e.organization_id WHERE e.claimed_by=$1 AND e.active AND e.approved_at IS NOT NULL AND a.status='active' AND (a.ends_at IS NULL OR a.ends_at>now())) company,
 (SELECT max(current_period_end) FROM memberships WHERE user_id=$1 AND status='active' AND current_period_end>now()) membership_until,
 (SELECT max(ends_at) FROM membership_entitlements WHERE user_id=$1 AND status='active' AND starts_at<=now() AND ends_at>now()) entitlement_until`,[uid]);return r.rows[0]||{member:false,company:false}}
async function issueSession(res,userId){const token=random(),csrf=random();await getPool().query('INSERT INTO user_sessions(user_id,token_hash,csrf_token,expires_at) VALUES($1,$2,$3,$4)',[userId,hash(token),csrf,nowPlus(14*24*3600000)]);res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secure?'; Secure':''}`);return csrf}
function validPerson(d){const name=clean(d.fullName||[d.givenName,d.middleNames,d.paternalSurname,d.maternalSurname].filter(Boolean).join(' '),120);const email=clean(d.email,254).toLowerCase();if(!isEmail(email)||name.length<3||typeof d.password!=='string'||d.password.length<12||d.password.length>128)throw invalid('Indica nombre, correo válido y contraseña de al menos 12 caracteres');return {name,email};}
async function register(req,res){limiter(req,'register',6);const d=await reqBody(req),{name,email}=validPerson(d);if(d.confirmPassword!==undefined&&d.password!==d.confirmPassword)throw invalid('Las contraseñas no coinciden');if(!['company','membership'].includes(d.accessMode))throw invalid('Elige convenio o membresía');if(d.acceptTerms!==true)throw invalid('Debes aceptar los términos');const rfc=d.rfc?normalizeRfc(d.rfc):null;if(rfc&&!validRfc(rfc))throw invalid('RFC inválido: revisa los 12 o 13 caracteres');const p=getPool(),c=await p.connect();try{await c.query('BEGIN');if(rfc){const dup=await c.query('SELECT 1 FROM user_profiles WHERE upper(rfc)=$1',[rfc]);if(dup.rowCount)throw invalid('Ya existe una cuenta TADAA! con ese RFC. Inicia sesión: tus beneficios se reactivan en la misma cuenta.',409)}let e=null;if(d.accessMode==='company'){
  if(!uuid(d.organizationId)||!clean(d.employeeCode,64)||!clean(d.givenName,60))throw invalid('Empresa, nombre y número de colaborador obligatorios');
  const r=await c.query(`SELECT e.id,e.given_name,e.claimed_by FROM company_employees e JOIN partner_agreements a ON a.organization_id=e.organization_id WHERE e.organization_id=$1 AND e.employee_code=$2 AND e.active=true AND a.status='active' AND (a.ends_at IS NULL OR a.ends_at>now()) FOR UPDATE OF e`,[d.organizationId,clean(d.employeeCode,64)]);e=r.rows[0];if(!e||e.claimed_by||e.given_name.toLowerCase().trim()!==clean(d.givenName,60).toLowerCase())throw invalid('No pudimos validar el registro del convenio; solicita revisión a tu empresa',400);
 }
 const u=await c.query(`INSERT INTO app_users(email,full_name,password_hash,status) VALUES($1,$2,$3,'active') RETURNING id`,[email,name,passwordHash(d.password)]),id=u.rows[0].id;
 await c.query(`INSERT INTO user_profiles(user_id,given_name,middle_names,paternal_surname,maternal_surname,address,interests,rfc) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,clean(d.givenName,60),clean(d.middleNames,80),clean(d.paternalSurname,70),clean(d.maternalSurname,70),JSON.stringify(d.address||{}),Array.isArray(d.interests)?d.interests.slice(0,15).map(x=>clean(x,40)):[],rfc]);
 if(e)await c.query('UPDATE company_employees SET claimed_by=$1,approved_at=NULL,updated_at=now() WHERE id=$2',[id,e.id]);
 if(d.accessMode==='membership')await c.query(`INSERT INTO memberships(user_id,rfc) VALUES($1,$2)`,[id,rfc]);
 await c.query('COMMIT');const csrf=await issueSession(res,id);return response(res,201,{ok:true,csrf,accessMode:d.accessMode,needsCompanyApproval:!!e,membershipPaymentRequired:!e});
 }catch(err){await c.query('ROLLBACK');throw err}finally{c.release()}}
async function login(req,res){limiter(req,'login',12);const d=await reqBody(req),p=getPool();const r=await p.query('SELECT id,password_hash,status FROM app_users WHERE email=$1',[clean(d.email,254).toLowerCase()]);const user=r.rows[0];if(!user||!checkPassword(String(d.password||''),user.password_hash)||user.status!=='active')throw invalid('Correo o contraseña incorrectos',401);const csrf=await issueSession(res,user.id);return response(res,200,{ok:true,csrf})}
async function publicCatalog(res,q){const p=getPool();const term=clean(q.get('q'),80);const cat=clean(q.get('category'),40);const r=await p.query(`SELECT e.id,e.title,e.slug,e.description,e.starts_at,e.ends_at,e.currency,e.metadata,e.ticketing_mode,e.membership_promo_enabled,e.membership_promo_days,
 v.name venue,ex.poster_url,ex.hero_url,ex.ticket_url,ex.mobile_url,ex.spotify_url,ex.maps_url,ex.picks,ex.credits,ex.instructions,
 (SELECT min(price_minor) FROM ticket_types tt WHERE tt.event_id=e.id AND (tt.sales_start IS NULL OR tt.sales_start<=now()) AND (tt.sales_end IS NULL OR tt.sales_end>now())) from_price_minor
 FROM events e LEFT JOIN venues v ON v.id=e.venue_id LEFT JOIN event_extras ex ON ex.event_id=e.id
 WHERE e.status='published' AND ($1='' OR e.title ILIKE '%'||$1||'%') AND ($2='' OR e.metadata->>'category'=$2)
 ORDER BY ex.picks DESC NULLS LAST,e.starts_at ASC NULLS LAST LIMIT 100`,[term,cat]);return response(res,200,{events:r.rows})}
async function eventDetail(res,id){const p=getPool();const e=await p.query(`SELECT e.*,v.name venue,ex.* FROM events e LEFT JOIN venues v ON v.id=e.venue_id LEFT JOIN event_extras ex ON ex.event_id=e.id WHERE (e.id::text=$1 OR e.slug=$1) AND e.status='published'`,[id]);if(!e.rowCount)throw invalid('Evento no encontrado',404);const t=await p.query(`SELECT id,name,description,price_minor,service_fee_minor,quantity_total,quantity_reserved,
 GREATEST(quantity_total-quantity_reserved,0) available,member_only,max_per_order,sales_start,sales_end
 FROM ticket_types WHERE event_id=$1 AND (sales_start IS NULL OR sales_start<=now()) AND (sales_end IS NULL OR sales_end>now()) ORDER BY price_minor`,[e.rows[0].id]);const seats=e.rows[0].ticketing_mode==='tadaa'?(await p.query(`SELECT id,section_name,row_label,seat_label,price_minor FROM event_seats WHERE event_id=$1 AND status='available' ORDER BY section_name,row_label,seat_label LIMIT 500`,[e.rows[0].id])).rows:[];const extras=await eventPublicExtras(p,e.rows[0].id);const nowTypes=new Set(extras.now.map(x=>x.ticket_type_id));return response(res,200,{event:e.rows[0],ticketTypes:t.rows.map(x=>({...x,now:nowTypes.has(x.id)})),seats,...extras})}
async function expirePendingReservations(){
 const pool=getPool(),c=await pool.connect();try{
 await c.query('BEGIN');
 const r=await c.query(`SELECT r.id reservation_id,o.id order_id FROM reservations r JOIN orders o ON o.reservation_id=r.id WHERE r.status='pending' AND r.expires_at<=now() AND o.status='pending' ORDER BY r.expires_at LIMIT 100 FOR UPDATE OF r,o SKIP LOCKED`);
 for(const v of r.rows){const items=await c.query('SELECT id,ticket_type_id,quantity FROM order_items WHERE order_id=$1',[v.order_id]);for(const item of items.rows){if(item.ticket_type_id)await c.query('UPDATE ticket_types SET quantity_reserved=GREATEST(0,quantity_reserved-$1) WHERE id=$2',[item.quantity,item.ticket_type_id]);await c.query(`UPDATE event_seats SET status='available' WHERE id IN (SELECT seat_id FROM order_item_seats WHERE order_item_id=$1) AND status='held'`,[item.id])}await c.query(`UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1`,[v.order_id]);await c.query(`UPDATE reservations SET status='expired',updated_at=now() WHERE id=$1`,[v.reservation_id])}
 const merch=await c.query(`SELECT mo.id merch_id,mo.order_id FROM merch_orders mo JOIN orders o ON o.id=mo.order_id WHERE mo.status='pending' AND mo.expires_at<=now() AND o.status='pending' ORDER BY mo.expires_at LIMIT 100 FOR UPDATE OF mo,o SKIP LOCKED`);
 for(const v of merch.rows){const items=await c.query('SELECT product_id,quantity FROM merch_order_items WHERE order_id=$1',[v.merch_id]);for(const item of items.rows)await c.query(`UPDATE merch_products SET reserved_stock=GREATEST(0,reserved_stock-$1) WHERE id=$2`,[item.quantity,item.product_id]);await c.query(`UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1`,[v.order_id]);await c.query(`UPDATE merch_orders SET status='cancelled' WHERE id=$1`,[v.merch_id]);}
 await c.query('COMMIT');return r.rows.length+merch.rows.length;
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function createOrder(req,res){await expirePendingReservations();const s=await requireUser(req);const d=await reqBody(req);if(!uuid(d.ticketTypeId)||!Number.isInteger(d.quantity)||d.quantity<1||d.quantity>8)throw invalid('Selecciona un tipo de boleto y 1–8 lugares');const el=await eligibility(s.user_id);
 const p=getPool(),c=await p.connect();try{await c.query('BEGIN');const rows=await c.query(`SELECT t.*,e.status,e.ticketing_mode FROM ticket_types t JOIN events e ON e.id=t.event_id WHERE t.id=$1 FOR UPDATE OF t`,[d.ticketTypeId]);const t=rows.rows[0];if(d.idempotencyKey!==undefined&&!/^[a-zA-Z0-9_-]{12,100}$/.test(String(d.idempotencyKey)))throw invalid('Clave de operación inválida');if(d.idempotencyKey)await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[s.user_id+':'+d.idempotencyKey]);if(d.idempotencyKey){const existing=await c.query('SELECT id,total_minor,status FROM orders WHERE user_id=$1 AND idempotency_key=$2',[s.user_id,d.idempotencyKey]);if(existing.rowCount){await c.query('COMMIT');return response(res,200,{orderId:existing.rows[0].id,amountMinor:Number(existing.rows[0].total_minor),currency:'MXN',paymentMode:'test',existing:true})}}if(!t||t.status!=='published'||t.quantity_reserved+d.quantity>t.quantity_total)throw invalid('No hay disponibilidad para esa cantidad',409);if(t.member_only&&!el.member&&!el.company)throw invalid('Este tipo de boleto requiere membresía o convenio activo',403);if(d.quantity>t.max_per_order)throw invalid('Superaste el máximo de boletos por pedido',400);if(t.sales_start&&new Date(t.sales_start)>new Date()||t.sales_end&&new Date(t.sales_end)<=new Date())throw invalid('La venta de este boleto no está abierta',409);
 const nowSale=await nowGate(c,{userId:s.user_id,ticketType:t,quantity:d.quantity,invalid});const addonLines=await prepareAddons(c,{eventId:t.event_id,addons:d.addons,invalid});const unitPrice=nowSale?nowSale.unitPriceMinor:Number(t.price_minor);
 await c.query('UPDATE ticket_types SET quantity_reserved=quantity_reserved+$1 WHERE id=$2',[d.quantity,t.id]);
 let seatRows=[];if(d.seatIds!==undefined){if(!validSeatSelection(d.seatIds,d.quantity,uuid))throw invalid('Selecciona exactamente un asiento único por boleto');const sr=await c.query(`SELECT id,price_minor FROM event_seats WHERE event_id=$1 AND ticket_type_id=$2 AND id=ANY($3::uuid[]) AND status='available' FOR UPDATE`,[t.event_id,t.id,d.seatIds]);if(sr.rowCount!==d.quantity)throw invalid('Uno o más asientos ya no están disponibles',409);if(sr.rows.some(x=>x.price_minor!==null&&Number(x.price_minor)!==Number(t.price_minor)))throw invalid('El precio de uno o más asientos no coincide con el tipo de boleto.',409);seatRows=sr.rows;await c.query(`UPDATE event_seats SET status='held' WHERE id=ANY($1::uuid[])`,[d.seatIds]);}
 const r=await c.query(`INSERT INTO reservations(user_id,event_id,status,expires_at) VALUES($1,$2,'pending',now()+interval '15 minutes') RETURNING id`,[s.user_id,t.event_id]);
 const addonsMinor=addonLines.reduce((a,l)=>a+l.totalMinor,0),subtotal=unitPrice*d.quantity+addonsMinor,fees=Number(t.service_fee_minor||0)*d.quantity,amount=subtotal+fees;
 const o=await c.query(`INSERT INTO orders(user_id,reservation_id,total_minor,subtotal_minor,fees_minor,source,metadata,idempotency_key) VALUES($1,$2,$3,$4,$5,'tadaa',$6,$7) RETURNING id`,[s.user_id,r.rows[0].id,amount,subtotal,fees,JSON.stringify({ticketingMode:t.ticketing_mode,...(nowSale?{nowCampaignId:nowSale.campaignId}:{}),...(addonLines.length?{addons:addonLines.length}:{})}),d.idempotencyKey||null]);
 const oi=await c.query('INSERT INTO order_items(order_id,ticket_type_id,description,quantity,unit_price_minor,total_minor) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[o.rows[0].id,t.id,(nowSale?'Now! · ':'')+t.name,d.quantity,unitPrice,unitPrice*d.quantity]);await saveAddons(c,o.rows[0].id,addonLines);if(seatRows.length)for(const seat of seatRows)await c.query(`INSERT INTO order_item_seats(order_item_id,seat_id) VALUES($1,$2)`,[oi.rows[0].id,seat.id]);
 await c.query('COMMIT');return response(res,201,{orderId:o.rows[0].id,amountMinor:amount,currency:'MXN',paymentMode:'test',now:!!nowSale,addons:addonLines});
 }catch(err){await c.query('ROLLBACK');throw err}finally{c.release()}}
async function membershipOrder(req,res){const s=await requireUser(req);const access=await eligibility(s.user_id);if(access.member||access.company)throw invalid('Ya tienes acceso activo a TADAA!',409);const p=getPool(),c=await p.connect();try{await c.query('BEGIN');let m=await c.query(`SELECT id FROM memberships WHERE user_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,[s.user_id]);if(!m.rowCount)m=await c.query(`INSERT INTO memberships(user_id,source,rfc) VALUES($1,'individual',(SELECT rfc FROM user_profiles WHERE user_id=$1)) RETURNING id`,[s.user_id]);const quote=await membershipQuote(c,s.user_id);const o=await c.query(`INSERT INTO orders(user_id,total_minor,subtotal_minor,source,metadata) VALUES($1,$2,$2,'membership',jsonb_build_object('membership','individual_monthly','offerId',$3::text,'discountPct',$4::int)) RETURNING id`,[s.user_id,quote.priceMinor,quote.offerId,quote.discountPct]);await c.query(`INSERT INTO order_items(order_id,description,quantity,unit_price_minor,total_minor) VALUES($1,$2,1,$3,$3)`,[o.rows[0].id,quote.discountPct?'Membresía TADAA! mensual · '+quote.discountPct+'% off':'Membresía TADAA! mensual',quote.priceMinor]);await c.query('UPDATE memberships SET last_order_id=$1 WHERE id=$2',[o.rows[0].id,m.rows[0].id]);await c.query('COMMIT');return response(res,201,{orderId:o.rows[0].id,amountMinor:quote.priceMinor,discountPct:quote.discountPct,currency:'MXN',paymentMode:'test',realPayments:false});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
async function grantTicketMembership(c,userId,orderId,eventId,days){
 const safeDays=clampMembershipPromoDays(days);
 const r=await c.query(`INSERT INTO membership_entitlements(user_id,source,related_order_id,event_id,starts_at,ends_at,status,metadata)
 VALUES($1,'ticket_purchase',$2,$3,
 GREATEST(now(),COALESCE((SELECT max(current_period_end) FROM memberships WHERE user_id=$1 AND status='active' AND current_period_end>now()),now()),
 COALESCE((SELECT max(ends_at) FROM membership_entitlements WHERE user_id=$1 AND status='active' AND ends_at>now()),now())),
 GREATEST(now(),COALESCE((SELECT max(current_period_end) FROM memberships WHERE user_id=$1 AND status='active' AND current_period_end>now()),now()),
 COALESCE((SELECT max(ends_at) FROM membership_entitlements WHERE user_id=$1 AND status='active' AND ends_at>now()),now())) + make_interval(days=>$4),
 'active',jsonb_build_object('benefit','ticket_purchase_membership','days',$4)) ON CONFLICT(related_order_id) DO NOTHING RETURNING id,starts_at,ends_at`,[userId,orderId,eventId,safeDays]);
 if(!r.rowCount)return null;
 const ent=r.rows[0];
 for(const d of [7,3,1])if(safeDays>d){await c.query(`INSERT INTO membership_notices(entitlement_id,user_id,notice_key,scheduled_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`,[ent.id,userId,'expires_'+d+'d',new Date(new Date(ent.ends_at).getTime()-d*86400000)]);}
 await c.query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'membership_granted','¡Tu compra incluye TADAA!','Recibiste '+$2+' días de acceso a beneficios TADAA!.','/app.html#/membresia')`,[userId,safeDays]);
 return ent;
}
async function membershipSummary(req,res){
 const s=await requireUser(req),p=getPool();
 const r=await p.query(`SELECT id,source,status,current_period_start starts_at,current_period_end ends_at,auto_renew_authorized,cancel_at_period_end,price_minor,currency FROM memberships WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,[s.user_id]);
 const e=await p.query(`SELECT id,source,starts_at,ends_at,status,event_id FROM membership_entitlements WHERE user_id=$1 AND status='active' AND ends_at>now() ORDER BY ends_at DESC`,[s.user_id]);
 const access=await eligibility(s.user_id);
 return response(res,200,{membership:r.rows[0]||null,entitlements:e.rows,eligibility:access,recurringBillingReady:false});
}
async function setRenewalPreference(req,res){
 const s=await requireUser(req),d=await reqBody(req);
 if(typeof d.authorize!=='boolean')throw invalid('Indica si autorizas o retiras la preferencia de renovación');
 const r=await getPool().query(`UPDATE memberships SET auto_renew_authorized=$1,updated_at=now() WHERE user_id=$2 AND status='active' AND current_period_end>now() RETURNING id`,[d.authorize,s.user_id]);
 if(!r.rowCount)throw invalid('No hay una membresía individual activa para modificar esta preferencia',409);
 return response(res,200,{ok:true,authorized:d.authorize,automaticChargeReady:false,note:'Esta preferencia no genera cargos. La renovación recurrente solo se activará cuando exista una suscripción recurrente aprobada e integrada con el proveedor de pagos.'});
}
async function refundRequest(req,res,orderId){
 const s=await requireUser(req),d=await reqBody(req),reason=clean(d.reason,1000);
 if(reason.length<8)throw invalid('Describe brevemente el motivo de la solicitud');
 const p=getPool(),c=await p.connect();
 try{await c.query('BEGIN');const o=await c.query(`SELECT id,total_minor,status FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,[orderId,s.user_id]);if(!o.rowCount||o.rows[0].status!=='paid')throw invalid('Solo puedes solicitar devolución de un pedido pagado',409);
 const r=await c.query(`INSERT INTO ticket_refund_requests(order_id,user_id,reason,requested_amount_minor) VALUES($1,$2,$3,$4) RETURNING id,status`,[orderId,s.user_id,reason,o.rows[0].total_minor]);await c.query('COMMIT');return response(res,201,{ok:true,refundRequest:r.rows[0],note:'Solicitud recibida; no se ha realizado una devolución bancaria.'});}
 catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function notificationList(req,res){
 const s=await requireUser(req);
 const due=await getPool().query(`SELECT id,entitlement_id,user_id,notice_key,scheduled_at FROM membership_notices WHERE user_id=$1 AND delivered_at IS NULL AND scheduled_at<=now() ORDER BY scheduled_at`,[s.user_id]);
 for(const n of due.rows){const days=Number(n.notice_key.match(/(\d+)d/)?.[1]||0);await getPool().query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url,membership_notice_id) VALUES($1,'membership_expiring','Tu acceso TADAA! está por terminar',$2,'/app.html#/membresia',$3) ON CONFLICT(membership_notice_id) WHERE membership_notice_id IS NOT NULL DO NOTHING`,[s.user_id,days?`Tu beneficio termina en ${days} días.`:'Tu beneficio está por terminar.',n.id]);await getPool().query('UPDATE membership_notices SET delivered_at=now() WHERE id=$1',[n.id]);}
 const r=await getPool().query(`SELECT id,kind,title,message,action_url,read_at,created_at FROM user_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,[s.user_id]);
 return response(res,200,{notifications:r.rows});
}
async function producerOverview(req,res,org){
 const s=await organizationManager(req,org),p=getPool();
 const kind=await p.query(`SELECT 1 FROM partner_agreements WHERE organization_id=$1 AND kind='producer' AND status='active'`,[org]);
 if(!kind.rowCount)throw invalid('La organización no tiene convenio de productor activo',403);
 const [events,sales,tickets,settlements]=await Promise.all([
 p.query(`SELECT id,title,slug,status,starts_at,ticketing_mode FROM events WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100`,[org]),
 p.query(`SELECT e.id event_id,e.title,count(DISTINCT o.id)::int orders,COALESCE(sum(o.total_minor),0)::bigint gross_minor FROM events e LEFT JOIN reservations r ON r.event_id=e.id LEFT JOIN orders o ON o.reservation_id=r.id AND o.status='paid' WHERE e.organization_id=$1 GROUP BY e.id,e.title ORDER BY e.title`,[org]),
 p.query(`SELECT count(*)::int issued,count(*) FILTER(WHERE t.status='used')::int checked_in FROM tickets t JOIN order_items oi ON oi.id=t.order_item_id JOIN orders o ON o.id=oi.order_id JOIN reservations r ON r.id=o.reservation_id JOIN events e ON e.id=r.event_id WHERE e.organization_id=$1`,[org]),
 p.query(`SELECT id,period_start,period_end,gross_minor,platform_fee_minor,refund_minor,net_minor,status,currency FROM producer_settlements WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 30`,[org])
 ]);
 return response(res,200,{organizationId:org,events:events.rows,sales:sales.rows,tickets:tickets.rows[0]||{issued:0,checked_in:0},settlements:settlements.rows});
}
async function producerTicketType(req,res,org,eventId){
 const s=await organizationManager(req,org),d=await reqBody(req);
 const agreement=await getPool().query(`SELECT 1 FROM partner_agreements WHERE organization_id=$1 AND kind='producer' AND status='active'`,[org]);if(!agreement.rowCount)throw invalid('La organización no tiene convenio de productor activo',403);
 const event=await getPool().query(`SELECT id FROM events WHERE id=$1 AND organization_id=$2 AND status='draft' AND ticketing_mode='tadaa'`,[eventId,org]);
 if(!event.rowCount)throw invalid('Solo puedes configurar boletos de tus eventos en borrador',403);
 const price=Number(d.priceMinor),stock=Number(d.stock);
 if(!clean(d.name,90)||!Number.isSafeInteger(price)||price<0||!Number.isInteger(stock)||stock<0)throw invalid('Nombre, precio en centavos y cupo válidos requeridos');
 const r=await getPool().query(`INSERT INTO ticket_types(event_id,name,description,price_minor,quantity_total,member_only,service_fee_minor,max_per_order,section_name)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,[eventId,clean(d.name,90),clean(d.description,300),price,stock,d.memberOnly===true,Math.max(0,Number(d.serviceFeeMinor)||0),Math.max(1,Math.min(20,Number(d.maxPerOrder)||8)),clean(d.sectionName,80)]);
 await audit(s.user_id,'producer.ticket_type.create','event',eventId,{ticketTypeId:r.rows[0].id});
 return response(res,201,{ticketTypeId:r.rows[0].id});
}
async function producerCheckin(req,res,org,eventId){
 const s=await organizationManager(req,org),d=await reqBody(req),id=verifiedTicket(clean(d.qrPayload,3000));
 if(!id)throw invalid('Código QR inválido o vencido',403);
 const c=await getPool().connect();
 try{await c.query('BEGIN');const r=await c.query(`SELECT t.id,t.status FROM tickets t JOIN order_items oi ON oi.id=t.order_item_id JOIN orders o ON o.id=oi.order_id JOIN reservations re ON re.id=o.reservation_id JOIN events e ON e.id=re.event_id WHERE t.id=$1 AND e.id=$2 AND e.organization_id=$3 FOR UPDATE OF t`,[id,eventId,org]);if(!r.rowCount||r.rows[0].status!=='valid')throw invalid('Boleto no válido, de otro evento o ya utilizado',409);await c.query(`UPDATE tickets SET status='used',used_at=now() WHERE id=$1`,[id]);await c.query(`INSERT INTO ticket_scans(ticket_id,scanned_by,result) VALUES($1,$2,'accepted')`,[id,s.user_id]);await c.query('COMMIT');return response(res,200,{ok:true,accepted:true,ticketId:id});}
 catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function adminRefunds(req,res,refundId){
 const admin=requireAdmin(req);
 if(req.method==='GET'){const r=await getPool().query(`SELECT rr.*,o.total_minor,o.status order_status,u.email FROM ticket_refund_requests rr JOIN orders o ON o.id=rr.order_id JOIN app_users u ON u.id=rr.user_id ORDER BY rr.created_at DESC LIMIT 100`);return response(res,200,{refunds:r.rows})}
 const d=await reqBody(req);if(!['under_review','approved_pending_provider','rejected'].includes(d.status))throw invalid('Estado de revisión inválido');
 const r=await getPool().query(`UPDATE ticket_refund_requests SET status=$1,reviewed_by=NULL,reviewed_at=now(),updated_at=now() WHERE id=$2 RETURNING id,status`,[d.status,refundId]);if(!r.rowCount)throw invalid('Solicitud no encontrada',404);
 writeAudit({action:'refund.review',id:refundId,status:d.status});
 return response(res,200,{ok:true,refund:r.rows[0],note:'La devolución bancaria no se ejecuta automáticamente; requiere el proveedor y su referencia.'});
}
async function adminTicketing(req,res){
 requireAdmin(req);
 const p=getPool();
 const [sales,refunds,settlements]=await Promise.all([
 p.query(`SELECT count(*)::int orders,COALESCE(sum(total_minor),0)::bigint gross_minor FROM orders WHERE status='paid' AND source='tadaa'`),
 p.query(`SELECT count(*)::int requests FROM ticket_refund_requests WHERE status IN('requested','under_review','approved_pending_provider')`),
 p.query(`SELECT count(*)::int count,COALESCE(sum(net_minor),0)::bigint net_minor FROM producer_settlements WHERE status IN('draft','approved')`)
 ]);
 return response(res,200,{sales:sales.rows[0],refunds:refunds.rows[0],settlements:settlements.rows[0],realPayments:false});
}
async function sandboxPay(req,res){if(process.env.TADAA_PRIVATE_BETA!=='true')throw invalid('Pago de prueba restringido al entorno Beta privado',403);await expirePendingReservations();const s=await requireUser(req),d=await reqBody(req);if(!uuid(d.orderId))throw invalid('Pedido inválido');const vault=readVault();if(vault.platformPayments?.mode==='live')throw invalid('Cobro real bloqueado: falta integrar y certificar Clip, webhooks y reembolsos',503);const p=getPool(),c=await p.connect();try{await c.query('BEGIN');const r=await c.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[d.orderId,s.user_id]);const o=r.rows[0];if(!o)throw invalid('Pedido no encontrado',404);if(o.status==='paid'){await c.query('COMMIT');return response(res,200,{ok:true,alreadyPaid:true})}if(o.status!=='pending')throw invalid('Este pedido ya no puede pagarse',409);
 let promo=null,eventInfo=null;
 if(o.reservation_id){const re=await c.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE',[o.reservation_id]);if(re.rows[0]?.expires_at && new Date(re.rows[0].expires_at)<new Date())throw invalid('Reserva vencida: libera y vuelve a solicitar lugares',409);const ev=await c.query(`SELECT id,ticketing_mode,membership_promo_enabled,membership_promo_days,starts_at,ends_at FROM events WHERE id=$1`,[re.rows[0].event_id]);eventInfo=ev.rows[0]||null;}
 await c.query(`UPDATE orders SET status='paid',updated_at=now() WHERE id=$1`,[o.id]);await c.query(`INSERT INTO payments(order_id,provider,status,amount_minor,idempotency_key,provider_reference) VALUES($1,'sandbox-interno','approved',$2,$3,$4)`,[o.id,o.total_minor,'test-'+o.id,'TEST-'+o.id]);
 if(o.reservation_id){await c.query(`UPDATE reservations SET status='confirmed',updated_at=now() WHERE id=$1`,[o.reservation_id]);const items=await c.query('SELECT id,quantity FROM order_items WHERE order_id=$1',[o.id]);for(const i of items.rows){const seats=await c.query(`SELECT seat_id FROM order_item_seats WHERE order_item_id=$1 ORDER BY seat_id`,[i.id]);if(seats.rowCount){for(const seat of seats.rows){await issueTicket(c,{itemId:i.id,userId:s.user_id,seatId:seat.seat_id,eventId:eventInfo?.id});await c.query(`UPDATE event_seats SET status='sold' WHERE id=$1`,[seat.seat_id]);}}else{for(let j=0;j<i.quantity;j++)await issueTicket(c,{itemId:i.id,userId:s.user_id,eventId:eventInfo?.id});}}
  if(eventInfo?.ticketing_mode==='tadaa'&&eventInfo.membership_promo_enabled){promo=await grantTicketMembership(c,s.user_id,o.id,eventInfo.id,eventInfo.membership_promo_days||30);}if(eventInfo?.ticketing_mode==='tadaa')await grantCashback(c,s.user_id,o.id,eventInfo.id,o.total_minor);
 }else if(o.source==='membership'){const mr=await c.query(`UPDATE memberships SET status='active',source='individual',current_period_start=now(),current_period_end=now()+interval '1 month',auto_renew_authorized=false,updated_at=now() WHERE id=(SELECT id FROM memberships WHERE user_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1) RETURNING id,current_period_end`,[s.user_id]);await consumeMembershipOffer(c,o.id);if(mr.rowCount){for(const d of [7,3,1])await c.query(`INSERT INTO membership_notices(membership_id,user_id,notice_key,scheduled_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`,[mr.rows[0].id,s.user_id,'expires_'+d+'d',new Date(new Date(mr.rows[0].current_period_end).getTime()-d*86400000)]);}await c.query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'membership_activated','Tu membresía TADAA! está activa','Tu periodo de membresía de prueba está activo durante un mes. No se programó ningún cobro automático.','/app.html#/membresia')`,[s.user_id]);}
 else if(o.source==='merch'){const mo=await c.query(`SELECT id FROM merch_orders WHERE order_id=$1 FOR UPDATE`,[o.id]);if(!mo.rowCount)throw invalid('Pedido de merchandising no encontrado',404);const items=await c.query(`SELECT product_id,quantity FROM merch_order_items WHERE order_id=$1`,[mo.rows[0].id]);for(const item of items.rows)await c.query(`UPDATE merch_products SET reserved_stock=GREATEST(0,reserved_stock-$1),stock=GREATEST(0,stock-$1) WHERE id=$2`,[item.quantity,item.product_id]);await c.query(`UPDATE merch_orders SET status='paid' WHERE id=$1`,[mo.rows[0].id]);}
 else throw invalid('Tipo de pedido no soportado para pago',409);
 await c.query('COMMIT');return response(res,200,{ok:true,mode:'simulador_interno',membershipPromo:promo?{days:eventInfo.membership_promo_days,startsAt:promo.starts_at,endsAt:promo.ends_at}:null,realPayments:false,note:'Transacción de prueba: no hubo cargo bancario'});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
async function listOrders(s,res){await expirePendingReservations();const p=getPool();const o=await p.query(`SELECT o.id,o.status,o.total_minor,o.created_at,o.reservation_id,p.provider,p.status payment_status,p.provider_reference FROM orders o LEFT JOIN LATERAL(SELECT provider,status,provider_reference FROM payments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1)p ON true WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 60`,[s.user_id]);return response(res,200,{orders:o.rows})}
async function ticketList(s,res){const r=await getPool().query(`SELECT t.id,t.status,t.created_at,t.used_at,t.seat_id,t.delivery_status,t.external_reference,t.golden,t.golden_benefit,t.golden_revealed_at,es.section_name,es.row_label,es.seat_label,o.id order_id,oi.description ticket_type,e.id event_id,e.slug event_slug,e.title,e.starts_at,e.ticketing_mode,e.metadata->>'logo_url' logo_url,v.name venue,(SELECT json_agg(json_build_object('id',x.id,'title',x.title,'quantity',x.quantity,'delivered_at',x.delivered_at)) FROM order_addons x WHERE x.order_id=o.id) addons FROM tickets t JOIN order_items oi ON oi.id=t.order_item_id JOIN orders o ON o.id=oi.order_id JOIN reservations r ON r.id=o.reservation_id JOIN events e ON e.id=r.event_id LEFT JOIN venues v ON v.id=e.venue_id LEFT JOIN event_seats es ON es.id=t.seat_id WHERE t.owner_user_id=$1 ORDER BY t.created_at DESC`,[s.user_id]);return response(res,200,{tickets:r.rows.map(x=>({...x,qrPayload:x.status==='valid'&&x.delivery_status==='final'&&x.ticketing_mode==='tadaa'?tokenFor(x.id):null,qrExpiresInSeconds:60,environment:'test'}))})}
async function companyImport(req,res,org){const s=await organizationManager(req,org),d=await reqBody(req),kind=d.kind; if(!['altas','bajas'].includes(kind))throw invalid('Selecciona altas o bajas');const filename=clean(d.filename,120),csv=String(d.csv||'');if(csv.length>900000)throw invalid('Archivo demasiado grande');let rows;
 if(d.xlsxBase64){
   if(String(d.xlsxBase64).length>920000||!filename.toLowerCase().endsWith('.xlsx'))throw invalid('Archivo Excel demasiado grande o formato no permitido');
   const {default:ExcelJS}=await import('exceljs');const wb=new ExcelJS.Workbook();await wb.xlsx.load(Buffer.from(d.xlsxBase64,'base64'));
   const sheet=wb.worksheets[0];if(!sheet)throw invalid('Hoja de Excel vacía');
   rows=[];sheet.eachRow({includeEmpty:false},r=>rows.push(r.values.slice(1).map(x=>typeof x==='object'?String(x?.text||x?.result||''):String(x??''))));
   if(rows.length>5001)throw invalid('Máximo 5,000 registros por archivo');
 }else{
   // Parser CSV con comillas y comas escapadas (RFC4180).
   rows=[];let cur=[],field='',quote=false;
   const raw=csv.replace(/^\ufeff/,'');
   for(let i=0;i<raw.length;i++){const ch=raw[i];if(quote){if(ch==='"'&&raw[i+1]==='"'){field+='"';i++}else if(ch==='"')quote=false;else field+=ch}else if(ch==='"'){quote=true}else if(ch===','){cur.push(field);field=''}else if(ch==='\n'){cur.push(field.replace(/\r$/,''));if(cur.some(x=>x.trim()))rows.push(cur);cur=[];field=''}else{field+=ch}}cur.push(field.replace(/\r$/,''));if(cur.some(x=>x.trim()))rows.push(cur);
 }
 if(rows.length<2||rows.length>5001)throw invalid('Archivo debe contener encabezados y máximo 5000 registros');
 const header=rows.shift().map(x=>x.trim().toLowerCase());const lines=rows;
const idIdx=header.findIndex(x=>['employee_code','id','numero_colaborador','numero','id_colaborador'].includes(x));const nameIdx=header.findIndex(x=>['given_name','nombre','primer_nombre','nombre_pila'].includes(x));if(idIdx<0||(kind==='altas'&&nameIdx<0))throw invalid('Incluye employee_code y given_name (solo altas)');const rfcIdx=header.findIndex(x=>['rfc','r.f.c.'].includes(x));const seen=new Set(),records=[],errors=[];for(const [i,fields] of lines.entries()){const code=clean(fields[idIdx],64),name=kind==='altas'?clean(fields[nameIdx],80):'',rfc=rfcIdx>=0?normalizeRfc(fields[rfcIdx]):'';if(rfc&&!validRfc(rfc)){errors.push({row:i+2,reason:'RFC inválido'});continue}if(!code||!/^[-_a-z0-9.]{1,64}$/i.test(code)||(kind==='altas'&&!name)||seen.has(code.toLowerCase())){errors.push({row:i+2,reason:'ID duplicado o campos inválidos'});continue}seen.add(code.toLowerCase());records.push(rfc?{code,name,rfc}:{code,name})}if(!records.length)throw invalid('No hay registros válidos');const summary={total:lines.length,valid:records.length,rejected:errors.length,errors:errors.slice(0,20)};const r=await getPool().query(`INSERT INTO employee_import_batches(organization_id,uploaded_by,kind,original_filename,records,summary) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[org,s.user_id,kind,filename,JSON.stringify(records),JSON.stringify(summary)]);return response(res,201,{batchId:r.rows[0].id,summary,status:'pending',requiresConfirmation:true})}
async function confirmImport(req,res,org,batchId){const s=await organizationManager(req,org),d=await reqBody(req);if(d.confirm!==true||clean(d.confirmText,64)!=='CONFIRMAR')throw invalid('Debes confirmar expresamente la modificación');const p=getPool(),c=await p.connect();try{await c.query('BEGIN');const r=await c.query(`SELECT * FROM employee_import_batches WHERE id=$1 AND organization_id=$2 FOR UPDATE`,[batchId,org]);const b=r.rows[0];if(!b||b.status!=='pending')throw invalid('Lote no encontrado o ya procesado',409);let changes=0,relinked=0,offers=0;for(const it of b.records){if(b.kind==='altas'){await c.query(`INSERT INTO company_employees(organization_id,employee_code,given_name,rfc,active) VALUES($1,$2,$3,$4,true) ON CONFLICT(organization_id,employee_code) DO UPDATE SET given_name=EXCLUDED.given_name,rfc=COALESCE(EXCLUDED.rfc,company_employees.rfc),active=true,deactivated_at=NULL,approved_at=CASE WHEN company_employees.active THEN company_employees.approved_at ELSE NULL END,updated_at=now()`,[org,it.code,it.name,it.rfc||null]);if(it.rfc&&await linkEmployeeByRfc(c,{orgId:org,code:it.code,rfc:it.rfc}))relinked++;changes++}else{const x=await c.query(`UPDATE company_employees SET active=false,approved_at=NULL,deactivated_at=now(),updated_at=now() WHERE organization_id=$1 AND employee_code=$2 AND active=true RETURNING *`,[org,it.code]);changes+=x.rowCount;for(const emp of x.rows)if(await employeeExit(c,{orgId:org,employee:emp}))offers++}}
 await c.query('UPDATE employee_import_batches SET status=$1,confirmed_by=$2,confirmed_at=now() WHERE id=$3',['applied',s.user_id,b.id]);await c.query('COMMIT');await audit(s.user_id,'employee_import.'+b.kind,'organization',org,{batchId,changes,relinked,offers});return response(res,200,{ok:true,changes,relinked,exitOffers:offers});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
async function companyApprove(req,res,org,employeeId){const s=await organizationManager(req,org);const r=await getPool().query(`UPDATE company_employees SET approved_at=now(),updated_at=now() WHERE id=$1 AND organization_id=$2 AND active=true AND claimed_by IS NOT NULL RETURNING id`,[employeeId,org]);if(!r.rowCount)throw invalid('No hay registro pendiente',404);await audit(s.user_id,'employee.approved','employee',employeeId);return response(res,200,{ok:true})}
async function adminAddPartner(req,res){requireAdmin(req);const d=await reqBody(req),name=clean(d.name,140),slug=clean(d.slug,90);if(name.length<2||!pathSafe(slug)||!['company','producer','institution'].includes(d.kind))throw invalid('Empresa, slug y tipo obligatorios');const c=await getPool().connect();try{await c.query('BEGIN');const o=await c.query('INSERT INTO organizations(name,slug) VALUES($1,$2) RETURNING id',[name,slug]);await c.query(`INSERT INTO partner_agreements(organization_id,kind,status,starts_at) VALUES($1,$2,'active',now())`,[o.rows[0].id,d.kind]);if(d.ownerEmail){const u=await c.query('SELECT id FROM app_users WHERE email=$1',[clean(d.ownerEmail,254).toLowerCase()]);if(u.rowCount)await c.query(`INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,'manager') ON CONFLICT DO NOTHING`,[o.rows[0].id,u.rows[0].id])}await c.query('COMMIT');writeAudit({action:'beta2.partner.create',slug});return response(res,201,{organization:o.rows[0]});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
async function adminEvent(req,res){requireAdmin(req);const d=await reqBody(req);if(clean(d.title,140).length<3||!pathSafe(clean(d.slug,90)))throw invalid('Nombre y slug requeridos');const ticketingMode=d.ticketingMode==='tadaa'?'tadaa':'external';const promoEnabled=ticketingMode==='tadaa'&&d.membershipPromoEnabled===true;const promoDays=Math.max(1,Math.min(90,Number(d.membershipPromoDays)||30));const r=await getPool().query(`INSERT INTO events(title,slug,description,status,starts_at,ends_at,organization_id,venue_id,metadata,ticketing_mode,membership_promo_enabled,membership_promo_days) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,[clean(d.title,140),clean(d.slug,90),clean(d.description,3000),d.publish===true?'published':'draft',d.startsAt||null,d.endsAt||null,uuid(d.organizationId)?d.organizationId:null,uuid(d.venueId)?d.venueId:null,JSON.stringify({category:clean(d.category,40)}),ticketingMode,promoEnabled,promoDays]);const e=r.rows[0];await getPool().query(`INSERT INTO event_extras(event_id,poster_url,hero_url,picks,instructions,credits,spotify_url,maps_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[e.id,clean(d.posterUrl,500),clean(d.heroUrl,500),d.picks===true,JSON.stringify(Array.isArray(d.instructions)?d.instructions:[]),JSON.stringify(Array.isArray(d.credits)?d.credits:[]),clean(d.spotifyUrl,500),clean(d.mapsUrl,500)]);writeAudit({action:'beta2.event.create',id:e.id});return response(res,201,{eventId:e.id})}
async function adminTicketType(req,res){requireAdmin(req);const d=await reqBody(req);if(!uuid(d.eventId)||!Number.isSafeInteger(d.priceMinor)||d.priceMinor<0||!Number.isInteger(d.stock)||d.stock<0)throw invalid('Evento, precio en centavos y cupo requeridos');const ev=await getPool().query(`SELECT ticketing_mode FROM events WHERE id=$1`,[d.eventId]);if(!ev.rowCount||ev.rows[0].ticketing_mode!=='tadaa')throw invalid('Configura primero el evento como boletera TADAA!');const r=await getPool().query(`INSERT INTO ticket_types(event_id,name,description,price_minor,quantity_total,member_only,service_fee_minor,max_per_order,section_name,sales_start,sales_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,[d.eventId,clean(d.name,90),clean(d.description,300),d.priceMinor,d.stock,d.memberOnly===true,Math.max(0,Number(d.serviceFeeMinor)||0),Math.max(1,Math.min(20,Number(d.maxPerOrder)||8)),clean(d.sectionName,80),d.salesStart||null,d.salesEnd||null]);return response(res,201,{ticketTypeId:r.rows[0].id})}
async function adminCreateSeats(req,res,eventId){
 requireAdmin(req);const d=await reqBody(req);if(!uuid(eventId)||!Array.isArray(d.seats)||d.seats.length<1||d.seats.length>500)throw invalid('Evento y entre 1 y 500 asientos requeridos');
 const event=await getPool().query('SELECT id,ticketing_mode,venue_id FROM events WHERE id=$1',[eventId]);if(!event.rowCount||event.rows[0].ticketing_mode!=='tadaa')throw invalid('El evento debe utilizar TADAA! Tickets');
 const c=await getPool().connect();try{await c.query('BEGIN');let added=0;for(const seat of d.seats){const section=clean(seat.section,80),row=clean(seat.row,20),label=clean(seat.label,20);if(!section||!label)throw invalid('Cada asiento requiere sección y número');const ticketTypeId=uuid(seat.ticketTypeId)?seat.ticketTypeId:null;const price=seat.priceMinor===undefined?null:Number(seat.priceMinor);if(price!==null&&(!Number.isSafeInteger(price)||price<0))throw invalid('Precio de asiento inválido');const r=await c.query(`INSERT INTO event_seats(event_id,ticket_type_id,section_name,row_label,seat_label,price_minor) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(event_id,section_name,row_label,seat_label) DO NOTHING`,[eventId,ticketTypeId,section,row,label,price]);added+=r.rowCount;}await c.query('COMMIT');return response(res,201,{ok:true,created:added,total:d.seats.length});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function adminCreateSettlement(req,res){
 requireAdmin(req);const d=await reqBody(req);if(!uuid(d.organizationId)||!Number.isFinite(Date.parse(d.periodStart))||!Number.isFinite(Date.parse(d.periodEnd))||new Date(d.periodEnd)<=new Date(d.periodStart))throw invalid('Organización y periodo válido requeridos');
 const bps=Math.max(0,Math.min(3000,Number(process.env.TADAA_PLATFORM_FEE_BPS)||0));
 const r=await getPool().query(`SELECT COALESCE(sum(o.total_minor),0)::bigint gross,COALESCE(sum(o.fees_minor),0)::bigint customer_fees
 FROM orders o JOIN reservations re ON re.id=o.reservation_id JOIN events e ON e.id=re.event_id
 WHERE e.organization_id=$1 AND o.status='paid' AND o.created_at >= $2 AND o.created_at < $3`,[d.organizationId,new Date(d.periodStart),new Date(d.periodEnd)]);
 const gross=Number(r.rows[0].gross),fee=Math.round(gross*bps/10000),net=Math.max(0,gross-fee);
 const s=await getPool().query(`INSERT INTO producer_settlements(organization_id,period_start,period_end,gross_minor,platform_fee_minor,net_minor,status) VALUES($1,$2,$3,$4,$5,$6,'draft') RETURNING *`,[d.organizationId,new Date(d.periodStart),new Date(d.periodEnd),gross,fee,net]);
 return response(res,201,{settlement:s.rows[0],feeBasisPoints:bps,feeConfigured:bps>0,note:'Liquidación preliminar. No se ha transferido dinero al productor.'});
}
async function grantCashback(c,userId,orderId,eventId,grossMinor){
 const rule=await c.query(`SELECT id,rate_bps,max_cashback_minor FROM cashback_rules WHERE status='active' AND (event_id IS NULL OR event_id=$1) AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) ORDER BY event_id NULLS LAST,created_at DESC LIMIT 1`,[eventId]);
 if(!rule.rowCount)return null;
 let amount=Math.floor(Number(grossMinor)*Number(rule.rows[0].rate_bps)/10000);
 if(rule.rows[0].max_cashback_minor!==null)amount=Math.min(amount,Number(rule.rows[0].max_cashback_minor));
 if(amount<=0)return null;
 const ins=await c.query(`INSERT INTO reward_ledger(user_id,order_id,event_id,rule_id,amount_minor,available_at)
 VALUES($1,$2,$3,$4,$5,COALESCE((SELECT ends_at FROM events WHERE id=$3),now()+interval '1 day'))
 ON CONFLICT(order_id) DO NOTHING RETURNING id,amount_minor,available_at`,[userId,orderId,eventId,rule.rows[0].id,amount]);
 if(ins.rowCount)await c.query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'cashback_pending','¡Generaste cashback!',$2,'/app.html#/wallet')`,[userId,`Generaste ${amount} centavos de cashback. Estará disponible cuando termine el evento.`]);
 return ins.rows[0]||null;
}
async function walletSummary(req,res){
 const s=await requireUser(req),p=getPool();
 const [tx,rewards]=await Promise.all([
 p.query(`SELECT COALESCE(sum(CASE WHEN type IN('credit','refund','adjustment') THEN amount_minor ELSE -amount_minor END),0)::bigint balance_minor FROM wallet_transactions WHERE wallet_id=(SELECT id FROM wallet_accounts WHERE user_id=$1)`,[s.user_id]),
 p.query(`SELECT COALESCE(sum(amount_minor) FILTER(WHERE status='available' OR (status='pending' AND available_at<=now())),0)::bigint available_minor,COALESCE(sum(amount_minor) FILTER(WHERE status='pending' AND available_at>now()),0)::bigint pending_minor,COALESCE(sum(amount_minor) FILTER(WHERE status='redeemed'),0)::bigint redeemed_minor FROM reward_ledger WHERE user_id=$1 AND (expires_at IS NULL OR expires_at>now())`,[s.user_id])
 ]);
 await p.query(`UPDATE reward_ledger SET status='available' WHERE user_id=$1 AND status='pending' AND available_at<=now()`,[s.user_id]);
 return response(res,200,{wallet:tx.rows[0],cashback:rewards.rows[0],currency:'MXN'});
}
async function goldenCampaigns(req,res){
 const r=await getPool().query(`SELECT g.*,e.title event_title,(SELECT count(*) FROM golden_ticket_entries ge WHERE ge.campaign_id=g.id)::int entries FROM golden_ticket_campaigns g LEFT JOIN events e ON e.id=g.event_id WHERE g.status='published' AND g.starts_at<=now() AND g.ends_at>now() ORDER BY g.starts_at`);
 return response(res,200,{campaigns:r.rows});
}
async function goldenEntry(req,res,campaignId){
 const s=await requireUser(req),p=getPool(),c=await p.connect();
 try{await c.query('BEGIN');const r=await c.query(`SELECT * FROM golden_ticket_campaigns WHERE id=$1 AND status='published' AND starts_at<=now() AND ends_at>now() FOR UPDATE`,[campaignId]);const campaign=r.rows[0];if(!campaign)throw invalid('La experiencia ya no acepta participaciones',409);
 const rules=campaign.rules||{};if(rules.requires_membership){const e=await eligibility(s.user_id);if(!e.member&&!e.company)throw invalid('Esta experiencia requiere membresía o convenio activo',403)}
 if(rules.requires_event_purchase||campaign.event_id){const paid=await c.query(`SELECT 1 FROM orders o JOIN reservations re ON re.id=o.reservation_id WHERE o.user_id=$1 AND o.status='paid' AND ($2::uuid IS NULL OR re.event_id=$2) LIMIT 1`,[s.user_id,campaign.event_id]);if(!paid.rowCount)throw invalid('Necesitas una compra elegible para participar',403)}
 const ins=await c.query(`INSERT INTO golden_ticket_entries(campaign_id,user_id) VALUES($1,$2) ON CONFLICT(campaign_id,user_id) DO NOTHING RETURNING id`,[campaignId,s.user_id]);await c.query('COMMIT');return response(res,201,{ok:true,entered:!!ins.rowCount,alreadyEntered:!ins.rowCount});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function awardsList(res){
 const r=await getPool().query(`SELECT p.id,p.name,p.slug,p.status,p.starts_at,p.ends_at,n.id nomination_id,n.category,n.title,n.description,e.title event_title FROM awards_programs p LEFT JOIN award_nominations n ON n.program_id=p.id AND n.status='approved' LEFT JOIN events e ON e.id=n.event_id WHERE p.status IN('nominations','voting','closed') ORDER BY p.created_at DESC,n.category,n.title`);
 const map=new Map();for(const x of r.rows){if(!map.has(x.id))map.set(x.id,{id:x.id,name:x.name,slug:x.slug,status:x.status,starts_at:x.starts_at,ends_at:x.ends_at,nominations:[]});if(x.nomination_id)map.get(x.id).nominations.push({id:x.nomination_id,category:x.category,title:x.title,description:x.description,event_title:x.event_title})}
 return response(res,200,{programs:[...map.values()]});
}
async function awardNomination(req,res,programId){
 const s=await requireUser(req),d=await reqBody(req),category=clean(d.category,80),title=clean(d.title,160),description=clean(d.description,2000);
 const program=await getPool().query(`SELECT status FROM awards_programs WHERE id=$1`,[programId]);if(!program.rowCount||program.rows[0].status!=='nominations')throw invalid('El programa no recibe nominaciones',409);if(!category||title.length<3)throw invalid('Categoría y título requeridos');
 const r=await getPool().query(`INSERT INTO award_nominations(program_id,event_id,submitted_by,category,title,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status`,[programId,uuid(d.eventId)?d.eventId:null,s.user_id,category,title,description]);return response(res,201,{nomination:r.rows[0],note:'La nominación queda pendiente de revisión editorial.'});
}
async function awardVote(req,res,nominationId){
 const s=await requireUser(req),program=await getPool().query(`SELECT p.id,p.status FROM awards_programs p JOIN award_nominations n ON n.program_id=p.id WHERE n.id=$1 AND n.status='approved'`,[nominationId]);if(!program.rowCount||program.rows[0].status!=='voting')throw invalid('Esta nominación no está recibiendo votos',409);
 try{await getPool().query(`INSERT INTO award_votes(nomination_id,user_id) VALUES($1,$2)`,[nominationId,s.user_id]);return response(res,201,{ok:true,voted:true})}catch(e){if(e.code==='23505')throw invalid('Ya registraste tu voto para esta nominación',409);throw e}
}
async function merchCatalog(res){
 const r=await getPool().query(`SELECT id,event_id,title,description,price_minor,stock-reserved_stock available,image_url FROM merch_products WHERE published=true AND stock>reserved_stock ORDER BY created_at DESC LIMIT 100`);
 return response(res,200,{products:r.rows});
}
async function merchOrder(req,res){
 const s=await requireUser(req),d=await reqBody(req);if(!Array.isArray(d.items)||!d.items.length||d.items.length>20)throw invalid('Agrega entre 1 y 20 productos');
 const p=getPool(),c=await p.connect();
 try{await c.query('BEGIN');let total=0;const items=[];
 for(const line of d.items){if(!uuid(line.productId)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10)throw invalid('Producto o cantidad inválidos');const pr=await c.query(`SELECT * FROM merch_products WHERE id=$1 AND published=true FOR UPDATE`,[line.productId]);const product=pr.rows[0];if(!product||product.stock-product.reserved_stock<line.quantity||line.quantity>product.max_per_order)throw invalid('Producto sin inventario suficiente',409);const amount=Number(product.price_minor)*line.quantity;total+=amount;items.push({product,quantity:line.quantity,total:amount});}
 const merch=await c.query(`INSERT INTO merch_orders(user_id,event_id,status,total_minor,expires_at) VALUES($1,$2,'pending',$3,now()+interval '15 minutes') RETURNING id`,[s.user_id,uuid(d.eventId)?d.eventId:null,total]);
 const order=await c.query(`INSERT INTO orders(user_id,total_minor,subtotal_minor,source,metadata) VALUES($1,$2,$2,'merch',jsonb_build_object('merchOrderId',$3)) RETURNING id`,[s.user_id,total,merch.rows[0].id]);
 await c.query(`UPDATE merch_orders SET order_id=$1 WHERE id=$2`,[order.rows[0].id,merch.rows[0].id]);
 for(const x of items){await c.query(`UPDATE merch_products SET reserved_stock=reserved_stock+$1 WHERE id=$2`,[x.quantity,x.product.id]);await c.query(`INSERT INTO merch_order_items(order_id,product_id,quantity,unit_price_minor,total_minor) VALUES($1,$2,$3,$4,$5)`,[merch.rows[0].id,x.product.id,x.quantity,x.product.price_minor,x.total]);await c.query(`INSERT INTO order_items(order_id,description,quantity,unit_price_minor,total_minor) VALUES($1,$2,$3,$4,$5)`,[order.rows[0].id,x.product.title,x.quantity,x.product.price_minor,x.total]);}
 await c.query('COMMIT');return response(res,201,{orderId:order.rows[0].id,merchOrderId:merch.rows[0].id,totalMinor:total,paymentMode:'configured'});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function adminFeatureCreate(req,res,kind){
 requireAdmin(req);const d=await reqBody(req),p=getPool();
 if(kind==='golden'){const r=await p.query(`INSERT INTO golden_ticket_campaigns(event_id,title,description,prize,winner_count,status,starts_at,ends_at,rules) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,[uuid(d.eventId)?d.eventId:null,clean(d.title,140),clean(d.description,2000),clean(d.prize,500),Math.max(1,Math.min(100,Number(d.winnerCount)||1)),d.publish===true?'published':'draft',d.startsAt,d.endsAt,JSON.stringify(d.rules||{})]);return response(res,201,{id:r.rows[0].id})}
 if(kind==='awards'){const r=await p.query(`INSERT INTO awards_programs(name,slug,status,starts_at,ends_at,rules) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[clean(d.name,140),clean(d.slug,90),['nominations','voting','closed'].includes(d.status)?d.status:'draft',d.startsAt||null,d.endsAt||null,JSON.stringify(d.rules||{})]);return response(res,201,{id:r.rows[0].id})}
 if(kind==='cashback'){if(!Number.isInteger(d.rateBps)||d.rateBps<1||d.rateBps>5000)throw invalid('Cashback rate debe estar entre 1 y 5000 puntos base');const r=await p.query(`INSERT INTO cashback_rules(event_id,name,rate_bps,max_cashback_minor,status,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[uuid(d.eventId)?d.eventId:null,clean(d.name,100),d.rateBps,d.maxCashbackMinor===undefined?null:Number(d.maxCashbackMinor),d.active===true?'active':'draft',d.startsAt||null,d.endsAt||null]);return response(res,201,{id:r.rows[0].id})}
 if(kind==='campaign'){const r=await p.query(`INSERT INTO promotional_campaigns(title,slug,campaign_type,description,status,starts_at,ends_at,rules) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[clean(d.title,140),clean(d.slug,90),d.campaignType,clean(d.description,2000),d.status||'draft',d.startsAt||null,d.endsAt||null,JSON.stringify(d.rules||{})]);return response(res,201,{id:r.rows[0].id})}
}
async function adminGoldenList(req,res){
 requireAdmin(req);const r=await getPool().query(`SELECT g.id,g.title,g.prize,g.status,g.starts_at,g.ends_at,g.winner_count,(SELECT count(*) FROM golden_ticket_entries e WHERE e.campaign_id=g.id)::int entries FROM golden_ticket_campaigns g ORDER BY g.created_at DESC LIMIT 100`);
 const n=await getPool().query(`SELECT n.id,n.title,n.category,n.status,p.name program_name FROM award_nominations n JOIN awards_programs p ON p.id=n.program_id WHERE n.status='pending' ORDER BY n.created_at DESC LIMIT 100`);
 return response(res,200,{campaigns:r.rows,pendingNominations:n.rows});
}
async function adminGoldenDraw(req,res,campaignId){
 requireAdmin(req);const p=getPool(),c=await p.connect();
 try{await c.query('BEGIN');const r=await c.query(`SELECT * FROM golden_ticket_campaigns WHERE id=$1 FOR UPDATE`,[campaignId]);const campaign=r.rows[0];if(!campaign)throw invalid('Campaña no encontrada',404);if(campaign.status==='drawn')throw invalid('El sorteo ya fue realizado',409);if(new Date(campaign.ends_at)>new Date())throw invalid('El periodo de participación todavía no termina',409);
 const entries=await c.query(`SELECT id,user_id FROM golden_ticket_entries WHERE campaign_id=$1 AND status='entered' ORDER BY id FOR UPDATE`,[campaignId]);const list=[...entries.rows];for(let i=list.length-1;i>0;i--){const j=crypto.randomInt(i+1);[list[i],list[j]]=[list[j],list[i]]}
 const winners=list.slice(0,Math.min(Number(campaign.winner_count),list.length));for(const w of winners){await c.query(`UPDATE golden_ticket_entries SET status='winner' WHERE id=$1`,[w.id]);await c.query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'golden_winner','¡Ganaste un Golden Ticket!',$2,'/app.html#/golden')`,[w.user_id,`Has ganado: ${campaign.prize}. El equipo TADAA! se pondrá en contacto contigo.`]);}
 if(winners.length)await c.query(`UPDATE golden_ticket_entries SET status='not_selected' WHERE campaign_id=$1 AND status='entered'`,[campaignId]);
 await c.query(`UPDATE golden_ticket_campaigns SET status='drawn' WHERE id=$1`,[campaignId]);
 const payload=winners.map(x=>({entryId:x.id,userId:x.user_id}));
 const draw=await c.query(`INSERT INTO golden_ticket_draws(campaign_id,winners) VALUES($1,$2) RETURNING id`,[campaignId,JSON.stringify(payload)]);
 await c.query('COMMIT');writeAudit({action:'golden_ticket.draw',id:campaignId,drawId:draw.rows[0].id,winners:winners.length});return response(res,200,{ok:true,drawId:draw.rows[0].id,winners:payload});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function adminAwardNomination(req,res,nominationId){
 requireAdmin(req);const d=await reqBody(req);if(!['approved','rejected'].includes(d.status))throw invalid('Estado de nominación inválido');
 const r=await getPool().query(`UPDATE award_nominations SET status=$1 WHERE id=$2 RETURNING id,status`,[d.status,nominationId]);if(!r.rowCount)throw invalid('Nominación no encontrada',404);return response(res,200,{nomination:r.rows[0]});
}
async function adminMerch(req,res,productId){
 requireAdmin(req);const p=getPool();
 if(req.method==='GET'){const r=await p.query(`SELECT id,title,description,price_minor,stock,reserved_stock,published,image_url,event_id FROM merch_products ORDER BY created_at DESC LIMIT 200`);return response(res,200,{products:r.rows})}
 const d=await reqBody(req);
 if(req.method==='POST'){const title=clean(d.title,140),price=Number(d.priceMinor),stock=Number(d.stock);if(title.length<3||!Number.isSafeInteger(price)||price<0||!Number.isInteger(stock)||stock<0)throw invalid('Título, precio en centavos y stock válidos requeridos');const r=await p.query(`INSERT INTO merch_products(organization_id,event_id,title,description,price_minor,stock,image_url,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[uuid(d.organizationId)?d.organizationId:null,uuid(d.eventId)?d.eventId:null,title,clean(d.description,1000),price,stock,clean(d.imageUrl,1000),d.published===true]);return response(res,201,{id:r.rows[0].id})}
 if(req.method==='PATCH'&&uuid(productId)){const r=await p.query(`UPDATE merch_products SET published=COALESCE($1,published),stock=COALESCE($2,stock),updated_at=now() WHERE id=$3 RETURNING id,published,stock`,[typeof d.published==='boolean'?d.published:null,Number.isInteger(d.stock)?d.stock:null,productId]);if(!r.rowCount)throw invalid('Producto no encontrado',404);return response(res,200,{product:r.rows[0]})}
 throw invalid('Operación de merchandising no permitida',405);
}
async function publicCampaigns(res){const r=await getPool().query(`SELECT id,title,slug,campaign_type,description,starts_at,ends_at,rules FROM promotional_campaigns WHERE status='active' AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) ORDER BY starts_at`);return response(res,200,{campaigns:r.rows})}
async function adminCheckin(req,res){requireAdmin(req);if(process.env.TADAA_PRIVATE_BETA!=='true')throw invalid('Validación de acceso restringida al entorno de pruebas',403);const d=await reqBody(req),id=verifiedTicket(clean(d.qrPayload,3000));if(!id)throw invalid('Código inválido o vencido',403);const p=getPool(),c=await p.connect();try{await c.query('BEGIN');const x=await c.query(`SELECT id,status FROM tickets WHERE id=$1 FOR UPDATE`,[id]);if(!x.rowCount||x.rows[0].status!=='valid')throw invalid('Boleto no válido o ya utilizado',409);await c.query(`UPDATE tickets SET status='used',used_at=now() WHERE id=$1`,[id]);await c.query(`INSERT INTO ticket_scans(ticket_id,result) VALUES($1,'accepted')`,[id]);await c.query('COMMIT');return response(res,200,{ok:true,ticketId:id,accepted:true})}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
async function adminPayment(req,res){requireAdmin(req);const vault=readVault(),settings=vault.platformPayments||{mode:'test',provider:'clip',test:{},live:{}};
 const liveEnabled=process.env.TADAA_CLIP_CHECKOUT_ENABLED==='true';
 if(req.method==='GET')return response(res,200,{provider:'clip-checkout-v2',mode:settings.mode||'test',testConfigured:true,liveConfigured:!!settings.live?.key,realCheckoutReady:liveEnabled&&!!settings.live?.key,sandboxNote:'La disponibilidad de Sandbox depende del producto de Clip y de las credenciales habilitadas en la cuenta. El modo test de TADAA! es un simulador interno sin cargo bancario.'});
 const d=await reqBody(req);settings.provider='clip-checkout-v2';
 if(typeof d.liveKey==='string'&&d.liveKey.length)settings.live={...(settings.live||{}),key:clean(d.liveKey,1000)};
 if(d.mode==='live'){if(!liveEnabled)throw invalid('Para activar Clip real, primero habilita TADAA_CLIP_CHECKOUT_ENABLED=true en Environment de xCloud y confirma la configuración comercial.',503);if(!settings.live?.key)throw invalid('Guarda primero la API Key de Clip.',400);settings.mode='live';}
 else if(d.mode==='test'){settings.mode='test';}
 else throw invalid('Modo desconocido');
 vault.platformPayments=settings;saveVault(vault);writeAudit({action:'payment-config.changed',provider:'clip-checkout-v2',mode:settings.mode});
 return response(res,200,{ok:true,mode:settings.mode,liveConfigured:!!settings.live?.key,realCheckoutReady:liveEnabled&&!!settings.live?.key,realPayments:settings.mode==='live'});
}
async function publicPaymentMode(res){const vault=readVault(),settings=vault.platformPayments||{};const enabled=process.env.TADAA_CLIP_CHECKOUT_ENABLED==='true'&&settings.mode==='live'&&!!settings.live?.key;return response(res,200,{mode:enabled?'clip':'internal_test',realPayments:enabled,provider:'clip-checkout-v2'});}
async function clipCheckout(req,res,orderId){
 const s=await requireUser(req);await expirePendingReservations();if(process.env.TADAA_CLIP_CHECKOUT_ENABLED!=='true')throw invalid('Checkout real de Clip todavía no está habilitado en este sitio.',503);
 const vault=readVault(),settings=vault.platformPayments||{};if(settings.mode!=='live'||!settings.live?.key)throw invalid('Clip no está configurado para cobros reales.',503);
 const p=getPool(),c=await p.connect();
 try{
  await c.query('BEGIN');
  const r=await c.query(`SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`,[orderId,s.user_id]);const o=r.rows[0];if(!o)throw invalid('Pedido no encontrado',404);if(o.status==='paid'){await c.query('COMMIT');return response(res,200,{ok:true,alreadyPaid:true});}if(o.status!=='pending')throw invalid('El pedido ya no está disponible',409);
  const prior=await c.query(`SELECT provider_reference,provider_payload FROM payments WHERE order_id=$1 AND provider='clip-checkout-v2' AND status='pending' ORDER BY created_at DESC LIMIT 1`,[o.id]);
  if(prior.rowCount&&prior.rows[0].provider_payload?.payment_request_url){await c.query('COMMIT');return response(res,200,{ok:true,checkoutUrl:prior.rows[0].provider_payload.payment_request_url,reused:true});}
  const amount=clipAmountFromMinor(o.total_minor);
  const origin=process.env.PUBLIC_ORIGIN;if(!origin||!origin.startsWith('https://'))throw invalid('PUBLIC_ORIGIN HTTPS no está configurado.');
  const payload={amount:Number(amount),currency:o.currency||'MXN',purchase_description:`TADAA! pedido ${String(o.id).slice(0,8)}`,redirection_url:{success:`${origin}/app.html?payment=return&orderId=${o.id}#/reservas`,error:`${origin}/app.html?payment=error&orderId=${o.id}#/reservas`,default:`${origin}/app.html#/reservas`},webhook_url:`${origin}/api/webhooks/clip/checkout`,metadata:{external_reference:o.id},custom_payment_options:{payment_method_types:['debit','credit','cash']}};
  const clip=await fetch('https://api.payclip.com/v2/checkout',{method:'POST',headers:{Authorization:`Basic ${settings.live.key}`,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const result=await clip.json().catch(()=>({}));if(!clip.ok)throw invalid(`Clip no pudo crear el checkout (HTTP ${clip.status}). Revisa la configuración de la cuenta y las credenciales.`,502);
  const paymentId=result.payment_request_id||result.id,url=result.payment_request_url||result.url;if(!paymentId||!url)throw invalid('Clip respondió sin identificador o URL de checkout.',502);
  await c.query(`INSERT INTO payments(order_id,provider,status,amount_minor,idempotency_key,provider_reference,provider_payload) VALUES($1,'clip-checkout-v2','pending',$2,$3,$4,$5) ON CONFLICT(idempotency_key) DO UPDATE SET provider_reference=EXCLUDED.provider_reference,provider_payload=EXCLUDED.provider_payload,updated_at=now()`,[o.id,o.total_minor,'clip-checkout-'+o.id,paymentId,JSON.stringify({payment_request_url:url,status:result.status||'CHECKOUT_CREATED'})]);
  await c.query('COMMIT');return response(res,200,{ok:true,checkoutUrl:url,paymentRequestId:paymentId,provider:'clip'});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function clipWebhook(req,res){
 const d=await reqBody(req),paymentId=clean(d.payment_request_id||d.id,64),eventId=clean(d.id||`${paymentId}:${d.resource_status||d.event_type||'update'}`,100);
 if(!paymentId)throw invalid('Webhook sin payment_request_id',400);
 const vault=readVault(),keyValue=vault.platformPayments?.live?.key;if(!keyValue||process.env.TADAA_CLIP_CHECKOUT_ENABLED!=='true')throw invalid('Webhook de Clip no habilitado',503);
 const p=getPool(),c=await p.connect();
 try{
  await c.query('BEGIN');
  const ins=await c.query(`INSERT INTO payment_webhook_events(provider,provider_event_id,event_type,payload_hash) VALUES('clip-checkout-v2',$1,$2,$3) ON CONFLICT(provider,provider_event_id) DO NOTHING RETURNING id`,[eventId,clean(d.resource_status||d.event_type||'unknown',80),hash(JSON.stringify(d))]);
  if(!ins.rowCount){await c.query('COMMIT');return response(res,200,{ok:true,duplicate:true});}
  const payment=await c.query(`SELECT p.id payment_id,p.order_id,p.amount_minor,p.status,o.user_id,o.reservation_id,o.source,o.status order_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider='clip-checkout-v2' AND p.provider_reference=$1 FOR UPDATE OF p,o`,[paymentId]);
  if(!payment.rowCount){await c.query(`UPDATE payment_webhook_events SET status='rejected',processed_at=now() WHERE id=$1`,[ins.rows[0].id]);await c.query('COMMIT');return response(res,200,{ok:true,ignored:true})}
  const verify=await fetch(`https://api.payclip.com/v2/checkout/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Basic ${keyValue}`,Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'error'});
  const detail=await verify.json().catch(()=>({}));if(!verify.ok)throw invalid('No se pudo verificar el estado del pago directamente con Clip.',502);
  const status=String(detail.status||'').toUpperCase();
  if(!isClipCheckoutPaid(status)){
   await c.query(`UPDATE payments SET status=$1,provider_payload=$2,updated_at=now() WHERE id=$3`,[status==='CHECKOUT_EXPIRED'?'cancelled':'pending',JSON.stringify({payment_request_id:paymentId,status}),payment.rows[0].payment_id]);
   await c.query(`UPDATE payment_webhook_events SET status='processed',processed_at=now() WHERE id=$1`,[ins.rows[0].id]);
   await c.query('COMMIT');return response(res,200,{ok:true,verified:true,paid:false,status});
  }
  const amount=Number(detail.amount);if(!Number.isFinite(amount)||Math.round(amount*100)!==Number(payment.rows[0].amount_minor))throw invalid('El monto verificado por Clip no coincide con el pedido.',409);
  const order=payment.rows[0];if(order.order_status!=='paid'){
   await c.query(`UPDATE orders SET status='paid',updated_at=now() WHERE id=$1`,[order.order_id]);
   await c.query(`UPDATE payments SET status='approved',provider_payload=$1,updated_at=now() WHERE id=$2`,[JSON.stringify({payment_request_id:paymentId,transaction_id:detail.transaction_id||null,status}),order.payment_id]);
   if(order.reservation_id){
    const re=await c.query('SELECT event_id FROM reservations WHERE id=$1 FOR UPDATE',[order.reservation_id]);await c.query(`UPDATE reservations SET status='confirmed',updated_at=now() WHERE id=$1`,[order.reservation_id]);
    const items=await c.query('SELECT id,quantity FROM order_items WHERE order_id=$1',[order.order_id]);
    for(const item of items.rows){const seats=await c.query('SELECT seat_id FROM order_item_seats WHERE order_item_id=$1',[item.id]);if(seats.rowCount){for(const seat of seats.rows){await issueTicket(c,{itemId:item.id,userId:order.user_id,seatId:seat.seat_id,eventId:re.rows[0].event_id});await c.query(`UPDATE event_seats SET status='sold' WHERE id=$1`,[seat.seat_id])}}else for(let i=0;i<item.quantity;i++)await issueTicket(c,{itemId:item.id,userId:order.user_id,eventId:re.rows[0].event_id});}
    const ev=await c.query('SELECT id,ticketing_mode,membership_promo_enabled,membership_promo_days,starts_at,ends_at FROM events WHERE id=$1',[re.rows[0].event_id]);if(ev.rows[0]?.ticketing_mode==='tadaa'){if(ev.rows[0].membership_promo_enabled)await grantTicketMembership(c,order.user_id,order.order_id,ev.rows[0].id,ev.rows[0].membership_promo_days||30);await grantCashback(c,order.user_id,order.order_id,ev.rows[0].id,order.amount_minor);}
   }else if(order.source==='membership'){
    const mr=await c.query(`UPDATE memberships SET status='active',source='individual',current_period_start=now(),current_period_end=now()+interval '1 month',auto_renew_authorized=false,updated_at=now() WHERE id=(SELECT id FROM memberships WHERE user_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1) RETURNING id,current_period_end`,[order.user_id]);await consumeMembershipOffer(c,order.order_id);
    if(mr.rowCount)for(const days of [7,3,1])await c.query(`INSERT INTO membership_notices(membership_id,user_id,notice_key,scheduled_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`,[mr.rows[0].id,order.user_id,'expires_'+days+'d',new Date(new Date(mr.rows[0].current_period_end).getTime()-days*86400000)]);
   }else if(order.source==='merch'){const mo=await c.query(`SELECT id FROM merch_orders WHERE order_id=$1 FOR UPDATE`,[order.order_id]);if(mo.rowCount){const items=await c.query(`SELECT product_id,quantity FROM merch_order_items WHERE order_id=$1`,[mo.rows[0].id]);for(const item of items.rows)await c.query(`UPDATE merch_products SET reserved_stock=GREATEST(0,reserved_stock-$1),stock=GREATEST(0,stock-$1) WHERE id=$2`,[item.quantity,item.product_id]);await c.query(`UPDATE merch_orders SET status='paid' WHERE id=$1`,[mo.rows[0].id]);}}
   await c.query(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'payment_confirmed','Pago confirmado','Tu pago de TADAA! fue confirmado por Clip.','/app.html#/boletos')`,[order.user_id]);
  }
  await c.query(`UPDATE payment_webhook_events SET status='processed',processed_at=now() WHERE id=$1`,[ins.rows[0].id]);
  await c.query('COMMIT');return response(res,200,{ok:true,verified:true,paid:true});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function orderPaymentStatus(req,res,orderId){
 const s=await requireUser(req),r=await getPool().query(`SELECT o.id,o.status,p.provider,p.provider_reference,p.status payment_status FROM orders o LEFT JOIN LATERAL(SELECT * FROM payments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1)p ON true WHERE o.id=$1 AND o.user_id=$2`,[orderId,s.user_id]);
 if(!r.rowCount)throw invalid('Pedido no encontrado',404);return response(res,200,{order:r.rows[0],verified:r.rows[0].status==='paid'});
}
async function adminPresentation(req,res){requireAdmin(req);const d=await reqBody(req);if(!pathSafe(clean(d.slug,90))||clean(d.title).length<3)throw invalid('Slug y título obligatorios');const r=await getPool().query(`INSERT INTO partner_presentations(slug,title,subtitle,status,slides,organization_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,status=EXCLUDED.status,slides=EXCLUDED.slides,updated_at=now() RETURNING id`,[clean(d.slug,90),clean(d.title,150),clean(d.subtitle,260),d.publish?'published':'draft',JSON.stringify(Array.isArray(d.slides)?d.slides.slice(0,20):[]),uuid(d.organizationId)?d.organizationId:null]);return response(res,200,{presentationId:r.rows[0].id})}
async function adminDashboard(res){const p=getPool(),r=await Promise.all([p.query('SELECT count(*)::int n FROM app_users'),p.query('SELECT count(*)::int n FROM events'),p.query('SELECT count(*)::int n FROM organizations'),p.query('SELECT count(*)::int n FROM orders'),p.query(`SELECT id,name,slug,status FROM organizations ORDER BY created_at DESC LIMIT 40`),p.query(`SELECT id,title,slug,status FROM events ORDER BY created_at DESC LIMIT 40`),p.query(`SELECT id,contact_name,email,organization_name,kind,status FROM partner_applications ORDER BY created_at DESC LIMIT 30`)]);return response(res,200,{stats:{users:r[0].rows[0].n,events:r[1].rows[0].n,organizations:r[2].rows[0].n,orders:r[3].rows[0].n},organizations:r[4].rows,events:r[5].rows,applications:r[6].rows})}
export async function platformRequest(req,res,pathname,url){if(!pathname.startsWith('/api/v2/'))return false;
 try{const p=getPool();if(!p)return response(res,503,{error:'DATABASE_URL no configurada'}),true;
  const parts=pathname.split('/').filter(Boolean); // api/v2/...
  if(pathname==='/api/v2/health'&&req.method==='GET'){await p.query('SELECT 1');return response(res,200,{ok:true,product:'TADAA!',release:'beta3-core',database:'connected',realPayments:false}),true}
  if(pathname==='/api/v2/catalog'&&req.method==='GET')return await publicCatalog(res,url.searchParams),true;
  if(parts[2]==='events'&&parts[3]&&req.method==='GET')return await eventDetail(res,parts[3]),true;
  if(pathname==='/api/v2/alerts'&&req.method==='POST'){limiter(req,'alerts',10);const d=await reqBody(req),email=clean(d.email,254).toLowerCase();if(!isEmail(email)||d.consent!==true)throw invalid('Correo y consentimiento requeridos');await p.query(`INSERT INTO interest_alerts(email,interests) VALUES($1,$2) ON CONFLICT(email) DO UPDATE SET interests=EXCLUDED.interests`,[email,Array.isArray(d.interests)?d.interests.slice(0,15).map(x=>clean(x,40)):[]]);return response(res,201,{ok:true}),true}
  if(pathname==='/api/v2/organizations'&&req.method==='GET'){const r=await p.query(`SELECT o.id,o.name,o.slug FROM organizations o JOIN partner_agreements a ON a.organization_id=o.id WHERE a.kind IN('company','institution') AND a.status='active' ORDER BY o.name`);return response(res,200,{organizations:r.rows}),true}
  if(pathname==='/api/v2/auth/register'&&req.method==='POST')return await register(req,res),true;
  if(pathname==='/api/v2/auth/login'&&req.method==='POST')return await login(req,res),true;
  if(pathname==='/api/v2/auth/me'&&req.method==='GET')return await me(req,res),true;
  if(pathname==='/api/v2/auth/logout'&&req.method==='POST'){const s=await requireUser(req);await p.query('UPDATE user_sessions SET revoked_at=now() WHERE id=$1',[s.id]);res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`);return response(res,200,{ok:true}),true}
  if(pathname==='/api/v2/profile'&&req.method==='PATCH'){const s=await requireUser(req),d=await reqBody(req);await p.query(`UPDATE user_profiles SET interests=$1,address=$2,updated_at=now() WHERE user_id=$3`,[Array.isArray(d.interests)?d.interests.slice(0,15).map(x=>clean(x,40)):[],JSON.stringify(d.address||{}),s.user_id]);return response(res,200,{ok:true}),true}
  if(pathname==='/api/v2/favorites'&&req.method==='GET'){const s=await requireUser(req);const r=await p.query('SELECT event_id FROM event_favorites WHERE user_id=$1',[s.user_id]);return response(res,200,{ids:r.rows.map(x=>x.event_id)}),true}
  if(pathname==='/api/v2/favorites'&&req.method==='POST'){const s=await requireUser(req),d=await reqBody(req);if(!uuid(d.eventId))throw invalid('Evento inválido');if(d.favorite===false)await p.query('DELETE FROM event_favorites WHERE user_id=$1 AND event_id=$2',[s.user_id,d.eventId]);else await p.query('INSERT INTO event_favorites(user_id,event_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[s.user_id,d.eventId]);return response(res,200,{ok:true}),true}
  if(pathname==='/api/v2/payment-mode'&&req.method==='GET')return await publicPaymentMode(res),true;
  if(pathname==='/api/v2/wallet'&&req.method==='GET')return await walletSummary(req,res),true;
  if(pathname==='/api/v2/golden-tickets'&&req.method==='GET')return await goldenCampaigns(req,res),true;
  if(parts[2]==='golden-tickets'&&uuid(parts[3])&&parts[4]==='enter'&&req.method==='POST')return await goldenEntry(req,res,parts[3]),true;
  if(pathname==='/api/v2/awards'&&req.method==='GET')return await awardsList(res),true;
  if(parts[2]==='awards'&&uuid(parts[3])&&parts[4]==='nominations'&&req.method==='POST')return await awardNomination(req,res,parts[3]),true;
  if(parts[2]==='awards'&&parts[3]==='nominations'&&uuid(parts[4])&&parts[5]==='vote'&&req.method==='POST')return await awardVote(req,res,parts[4]),true;
  if(pathname==='/api/v2/merch'&&req.method==='GET')return await merchCatalog(res),true;
  if(pathname==='/api/v2/merch/orders'&&req.method==='POST')return await merchOrder(req,res),true;
  if(pathname==='/api/v2/campaigns'&&req.method==='GET')return await publicCampaigns(res),true;
  if(pathname==='/api/v2/checkout/clip'&&req.method==='POST'){const d=await reqBody(req);return await clipCheckout(req,res,d.orderId),true;}
  if(parts[2]==='orders'&&uuid(parts[3])&&parts[4]==='payment-status'&&req.method==='GET')return await orderPaymentStatus(req,res,parts[3]),true;
  if(pathname==='/api/webhooks/clip/checkout'&&req.method==='POST')return await clipWebhook(req,res),true;
  if(pathname==='/api/v2/membership'&&req.method==='GET')return await membershipSummary(req,res),true;
  if(pathname==='/api/v2/membership/renewal'&&req.method==='POST')return await setRenewalPreference(req,res),true;
  if(pathname==='/api/v2/notifications'&&req.method==='GET')return await notificationList(req,res),true;
  if(parts[2]==='orders'&&uuid(parts[3])&&parts[4]==='refund-request'&&req.method==='POST')return await refundRequest(req,res,parts[3]),true;
  if(pathname==='/api/v2/membership/checkout'&&req.method==='POST')return await membershipOrder(req,res),true;
  if(pathname==='/api/v2/membership/cancel'&&req.method==='POST'){const s=await requireUser(req);await p.query('UPDATE memberships SET cancel_at_period_end=true,auto_renew_authorized=false,updated_at=now() WHERE user_id=$1 AND status=$2',[s.user_id,'active']);return response(res,200,{ok:true,cancelAtPeriodEnd:true}),true}
  if(pathname==='/api/v2/checkout/test-pay'&&req.method==='POST')return await sandboxPay(req,res),true;
  if(pathname==='/api/v2/orders'&&req.method==='GET'){const s=await requireUser(req);return await listOrders(s,res),true}
  if(pathname==='/api/v2/orders'&&req.method==='POST')return await createOrder(req,res),true;
  if(parts[2]==='tickets'&&uuid(parts[3])&&parts[4]==='qr'&&req.method==='GET'){
   const user=await requireUser(req),r=await p.query(`SELECT id FROM tickets WHERE id=$1 AND owner_user_id=$2 AND status=$3 AND delivery_status='final'`,[parts[3],user.user_id,'valid']);
   if(!r.rowCount)throw invalid('Boleto no disponible',404);
   const {default:QR}=await import('qrcode');
   const svg=await QR.toString(tokenFor(parts[3]),{type:'svg',margin:2,width:260,color:{dark:'#101010',light:'#ffffff'}});
   res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(svg);return true;
  }
  if(pathname==='/api/v2/tickets'&&req.method==='GET'){const s=await requireUser(req);return await ticketList(s,res),true}
  if(parts[2]==='partners'&&parts[3]&&parts.length===4&&req.method==='GET'){const r=await p.query(`SELECT id,slug,title,subtitle,slides,theme FROM partner_presentations WHERE slug=$1 AND status='published'`,[parts[3]]);if(!r.rowCount)throw invalid('Presentación no encontrada',404);return response(res,200,{presentation:r.rows[0]}),true}
  if(parts[2]==='partners'&&parts[3]&&parts[4]==='apply'&&req.method==='POST'){limiter(req,'apply',8);const d=await reqBody(req);if(!isEmail(clean(d.email))||!clean(d.organizationName)||!clean(d.contactName))throw invalid('Completa los datos de contacto');const r=await p.query(`INSERT INTO partner_applications(presentation_id,organization_name,contact_name,email,phone,kind,message) VALUES((SELECT id FROM partner_presentations WHERE slug=$1),$2,$3,$4,$5,$6,$7) RETURNING id`,[parts[3],clean(d.organizationName,150),clean(d.contactName,120),clean(d.email,254),clean(d.phone,50),clean(d.kind,40),clean(d.message,2000)]);return response(res,201,{requestId:r.rows[0].id,received:true}),true}
  if(parts[2]==='partners'&&parts[3]&&parts[4]==='meeting'&&req.method==='POST'){limiter(req,'meeting',8);const d=await reqBody(req);if(!isEmail(clean(d.email))||!clean(d.contactName)||Number.isNaN(Date.parse(d.requestedAt)))throw invalid('Datos de cita inválidos');const r=await p.query(`INSERT INTO partner_meeting_requests(presentation_id,contact_name,email,requested_at,timezone,notes) VALUES((SELECT id FROM partner_presentations WHERE slug=$1),$2,$3,$4,$5,$6) RETURNING id`,[parts[3],clean(d.contactName,140),clean(d.email,254),new Date(d.requestedAt),clean(d.timezone,70)||'America/Mexico_City',clean(d.notes,1500)]);return response(res,201,{requestId:r.rows[0].id,status:'requested',note:'Solicitud recibida, pendiente de confirmación humana'}),true}
  if(parts[2]==='orgs'&&uuid(parts[3])){const org=parts[3];
   if(parts[4]==='producer'&&parts[5]==='overview'&&req.method==='GET')return await producerOverview(req,res,org),true;
   if(parts[4]==='producer'&&parts[5]==='events'&&uuid(parts[6])&&parts[7]==='ticket-types'&&req.method==='POST')return await producerTicketType(req,res,org,parts[6]),true;
   if(parts[4]==='producer'&&parts[5]==='events'&&uuid(parts[6])&&parts[7]==='checkin'&&req.method==='POST')return await producerCheckin(req,res,org,parts[6]),true;
   if(parts[4]==='events'&&req.method==='GET'){await organizationManager(req,org);const r=await p.query('SELECT id,title,slug,status,starts_at,ticketing_mode FROM events WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100',[org]);return response(res,200,{events:r.rows}),true}
   if(parts[4]==='events'&&parts[5]&&parts[6]==='ticket-types'&&req.method==='POST')return await producerTicketType(req,res,org,parts[5]),true;
   if(parts[4]==='events'&&parts[5]&&parts[6]==='checkin'&&req.method==='POST')return await producerCheckin(req,res,org,parts[5]),true;
   if(parts[4]==='events'&&req.method==='POST'){const s=await organizationManager(req,org),d=await reqBody(req);const producerAgreement=await p.query(`SELECT 1 FROM partner_agreements WHERE organization_id=$1 AND kind='producer' AND status='active'`,[org]);if(!producerAgreement.rowCount)throw invalid('La organización no tiene convenio de productor activo',403);if(clean(d.title,120).length<3||!pathSafe(clean(d.slug,90)))throw invalid('Evento y slug requeridos');const ticketingMode=d.ticketingMode==='tadaa'?'tadaa':'external';const r=await p.query(`INSERT INTO events(organization_id,title,slug,description,starts_at,metadata,status,ticketing_mode,membership_promo_enabled,membership_promo_days) VALUES($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9) RETURNING id`,[org,clean(d.title,120),clean(d.slug,90),clean(d.description,3000),d.startsAt||null,JSON.stringify({category:clean(d.category,50)}),ticketingMode,ticketingMode==='tadaa'&&d.membershipPromoEnabled===true,Math.max(1,Math.min(90,Number(d.membershipPromoDays)||30))]);await audit(s.user_id,'event.created','event',r.rows[0].id,{ticketingMode});return response(res,201,{eventId:r.rows[0].id,status:'draft',ticketingMode,note:'Publicación requiere aprobación de administración TADAA!'}),true}
if(parts[4]==='employees'&&req.method==='GET'){await organizationManager(req,org);const r=await p.query('SELECT id,employee_code,given_name,active,claimed_by,approved_at FROM company_employees WHERE organization_id=$1 ORDER BY updated_at DESC LIMIT 400',[org]);return response(res,200,{employees:r.rows}),true}
   if(parts[4]==='imports'&&parts.length===5&&req.method==='POST')return await companyImport(req,res,org),true;
   if(parts[4]==='imports'&&uuid(parts[5])&&parts[6]==='confirm'&&req.method==='POST')return await confirmImport(req,res,org,parts[5]),true;
   if(parts[4]==='employees'&&uuid(parts[5])&&parts[6]==='approve'&&req.method==='POST')return await companyApprove(req,res,org,parts[5]),true;
   if(parts[4]==='imports'&&req.method==='GET'){await organizationManager(req,org);const r=await p.query('SELECT id,kind,original_filename,summary,status,created_at,confirmed_at FROM employee_import_batches WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100',[org]);return response(res,200,{batches:r.rows}),true}
  }
  if(parts[2]==='admin'){requireAdmin(req);
   if(parts[3]==='dashboard'&&req.method==='GET')return await adminDashboard(res),true;
   if(parts[3]==='ticketing'&&req.method==='GET')return await adminTicketing(req,res),true;
   if(parts[3]==='settlements'&&req.method==='GET'){const r=await p.query(`SELECT ps.*,o.name organization_name,e.title event_title FROM producer_settlements ps JOIN organizations o ON o.id=ps.organization_id LEFT JOIN events e ON e.id=ps.event_id ORDER BY ps.created_at DESC LIMIT 100`);return response(res,200,{settlements:r.rows}),true;}
   if(parts[3]==='refunds'&&req.method==='GET')return await adminRefunds(req,res,null),true;
   if(parts[3]==='refunds'&&uuid(parts[4])&&req.method==='PATCH')return await adminRefunds(req,res,parts[4]),true;
   if(parts[3]==='partners'&&req.method==='POST')return await adminAddPartner(req,res),true;
   if(parts[3]==='golden-campaigns'&&req.method==='GET')return await adminGoldenList(req,res),true;
   if(parts[3]==='golden-campaigns'&&req.method==='POST')return await adminFeatureCreate(req,res,'golden'),true;
   if(parts[3]==='golden-campaigns'&&uuid(parts[4])&&parts[5]==='draw'&&req.method==='POST')return await adminGoldenDraw(req,res,parts[4]),true;
   if(parts[3]==='awards'&&parts[4]==='nominations'&&uuid(parts[5])&&req.method==='PATCH')return await adminAwardNomination(req,res,parts[5]),true;
   if(parts[3]==='awards'&&req.method==='POST')return await adminFeatureCreate(req,res,'awards'),true;
   if(parts[3]==='cashback-rules'&&req.method==='POST')return await adminFeatureCreate(req,res,'cashback'),true;
   if(parts[3]==='campaigns'&&req.method==='POST')return await adminFeatureCreate(req,res,'campaign'),true;
   if(parts[3]==='merch'&&(req.method==='GET'||req.method==='POST'))return await adminMerch(req,res,null),true;
   if(parts[3]==='merch'&&uuid(parts[4])&&req.method==='PATCH')return await adminMerch(req,res,parts[4]),true;
   if(parts[3]==='settlements'&&req.method==='POST')return await adminCreateSettlement(req,res),true;
   if(parts[3]==='events'&&uuid(parts[4])&&parts[5]==='seats'&&req.method==='POST')return await adminCreateSeats(req,res,parts[4]),true;
   if(parts[3]==='events'&&req.method==='POST')return await adminEvent(req,res),true;
   if(parts[3]==='events'&&uuid(parts[4])&&req.method==='PATCH'){const d=await reqBody(req);if(d.status!==undefined&&!['draft','published','cancelled','completed'].includes(d.status))throw invalid('Estado no permitido');if(d.ticketingMode!==undefined&&!['tadaa','external'].includes(d.ticketingMode))throw invalid('Tipo de boletera inválido');const current=await p.query('SELECT id FROM events WHERE id=$1',[parts[4]]);if(!current.rowCount)throw invalid('Evento no encontrado',404);await p.query(`UPDATE events SET status=COALESCE($1,status),ticketing_mode=COALESCE($2,ticketing_mode),membership_promo_enabled=COALESCE($3,membership_promo_enabled),membership_promo_days=COALESCE($4,membership_promo_days),updated_at=now() WHERE id=$5`,[d.status??null,d.ticketingMode??null,d.membershipPromoEnabled??null,d.membershipPromoDays??null,parts[4]]);writeAudit({action:'event.updated',id:parts[4],status:d.status,ticketingMode:d.ticketingMode});return response(res,200,{ok:true}),true}

   if(parts[3]==='tickets'&&req.method==='POST')return await adminTicketType(req,res),true;
   if(parts[3]==='checkin'&&req.method==='POST')return await adminCheckin(req,res),true;
   if(parts[3]==='payment-config'&&['GET','PUT'].includes(req.method))return await adminPayment(req,res),true;
   if(parts[3]==='presentations'&&req.method==='POST')return await adminPresentation(req,res),true;
  }
  if(await featureRequest(req,res,pathname,url,parts,{getPool,response,invalid,reqBody,clean,uuid,session,requireUser,requireAdmin,canManage,organizationManager,audit,eligibility,verifiedTicket,tokenFor}))return true;
  throw invalid('Ruta no encontrada',404);
 }catch(e){let status=e.httpCode||(e.code==='23505'?409:e.code==='23503'?400:500);if(status===500)console.error('Platform error',e.name,e.code||'');response(res,status,{error:status===500?'Error interno del servidor':e.message});return true}
}
