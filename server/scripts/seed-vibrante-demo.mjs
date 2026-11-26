// Datos de demostración "Ticket vibrante": productores, empresa, recintos, 8 eventos con arte,
// zonas, asientos, Golden, add-ons, Now!, colaboradores, usuarios demo, compras y check-ins.
// Idempotente (IDs fijos). Todo queda marcado con metadata.demo = 'vibrante'.
//   node server/scripts/seed-vibrante-demo.mjs            → crea o actualiza
//   node server/scripts/seed-vibrante-demo.mjs --remove   → borra los datos demo
//   --keep-cdmx  → no archiva los eventos 'cdmx-demo-*' del seed anterior
import crypto from 'node:crypto';
import {getPool,closePool} from '../src/db.mjs';

const TAG='vibrante';
const id=name=>{const h=crypto.createHash('sha1').update('tadaa-demo:'+name).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`};
const passwordHash=p=>{const s=crypto.randomBytes(16);return 'scrypt:'+s.toString('hex')+':'+crypto.scryptSync(p,s,64).toString('hex')};
const code=()=>crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
const at=(days,h=20,m=0)=>{const d=new Date();d.setUTCDate(d.getUTCDate()+days);d.setUTCHours(h+6,m,0,0);return d.toISOString()};// hora CDMX
const hours=h=>new Date(Date.now()+h*3600e3).toISOString();
const PASS=process.env.DEMO_PASSWORD||'Demo-Tadaa-2026';
const remove=process.argv.includes('--remove'),keepCdmx=process.argv.includes('--keep-cdmx');

const ORGS=[
 {k:'org-originals',name:'TADAA! Originals',slug:'tadaa-originals',kind:'producer'},
 {k:'org-escena',name:'Escena Viva Producciones',slug:'escena-viva',kind:'producer'},
 {k:'org-empresa',name:'Empresa Demo Norte',slug:'empresa-demo-norte',kind:'company'},
 {k:'org-uni',name:'Universidad Demo',slug:'universidad-demo',kind:'institution'}
];
const VENUES=[['ven-teatro1','Centro Cultural Teatro 1',1200],['ven-teatro2','Centro Cultural Teatro 2',600],['ven-palacio','Palacio de los Deportes',18000],['ven-gnp','Estadio GNP Seguros',65000],['ven-bio','BioParque Estrella · Chapa de Mota',5000],['ven-arena','Arena CDMX',22000],['ven-autodromo','Sede por revelar',40000],['ven-cine','Cinépolis Plaza Universidad',2400],['ven-museo','Museo Vivo de Ciencia y Arte',1500]];
const EVENTS=[
 {k:'matilda',org:'org-escena',venue:'ven-teatro1',title:'Matilda · El Musical',days:6,h:19,mode:'tadaa',img:'matilda.webp',cat:'Musical',
  desc:'Basado en la novela de Roald Dahl. Matilda es una niña extraordinaria que descubre en los libros —y en un poder secreto— la forma de enfrentar a los adultos injustos. Un musical para toda la familia con canciones de Tim Minchin.',
  meta:{tagline:'Una niña extraordinaria contra un mundo de adultos',rating:'Familiar',duration:'2 h 40 min · con intermedio',access:'Silla de ruedas · elevador',tags:['musical','familia','roalddahl','asientosnumerados'],tadaa_rating:'4.8',discount_label:'−61%',golden_enabled:true,
   cast:[{role:'Matilda',name:'Valentina Ríos',photo:'img/tv/cast/matilda.svg'},{role:'Miss Trunchbull',name:'Rodrigo Salas',photo:'img/tv/cast/trunchbull.svg'},{role:'Miss Honey',name:'Camila Ortega',photo:'img/tv/cast/honey.svg'},{role:'Sr. Wormwood',name:'Andrés Lugo',photo:'img/tv/cast/wormwood.svg'},{role:'Sra. Wormwood',name:'Paola Reyes',photo:'img/tv/cast/sra-wormwood.svg'}],tadaa_reviews:1284,address:'Centro Cultural Teatro 1, Av. Revolución 1500, Guadalupe Inn, CDMX',
   crew:[{role:'Libreto',name:'Dennis Kelly'},{role:'Música y letras',name:'Tim Minchin'},{role:'Dirección',name:'Por anunciar'},{role:'Producción',name:'Escena Viva'}],
   reviews:{media:[{stars:'★★★★★',text:'Un musical brillante que hace reír a niños y adultos por igual.',source:'Revista Escena (demo)'},{stars:'★★★★☆',text:'La puesta en escena es un festín visual.',source:'Cartelera CDMX (demo)'}],public:[{who:'Asistente verificado',stars:'★★★★★',text:'Fuimos en familia y salimos cantando.'},{who:'Asistente verificado',stars:'★★★★★',text:'La escena de las letras es mágica.'}]}},
  types:[['Orquesta 1',140000,279600],['Platea',120000,239600],['Mezzanine 1',70000,179800]],seats:true,
  golden:{odds:100,max:12,kind:'upgrade',title:'Upgrade a Orquesta',detail:'Si tu boleto es Platea o Mezzanine, entras a Orquesta en la misma función.'},
  addons:[['merch','Programa de mano','Recógelo en taquilla',15000,300],['combo','Combo dulcería','Palomitas + 2 bebidas',18900,300]]},
 {k:'morat',org:'org-escena',venue:'ven-palacio',title:'Morat',days:3,h:20,mode:'external',img:'morat.webp',cat:'Concierto',
  desc:'La banda colombiana regresa con su gira. Boletera oficial externa: TADAA! gestiona tu solicitud con tarifa de convenio y te da un pase provisional mientras llegan tus boletos oficiales.',
  meta:{tagline:'Gira 2026',rating:'Todo público',duration:'2 h aprox.',tags:['concierto','pop'],tadaa_rating:'4.7',discount_label:'−13%',video_url:'img/tv/video-demo.mp4'},types:[['Zona C',240000,276000],['Zona D',210000,241000]]},
 {k:'nocturno',org:'org-escena',venue:'ven-teatro2',title:'Nocturno',hoursFromNow:8,mode:'tadaa',img:'nocturno.webp',cat:'Teatro',
  desc:'Daniel Giménez Cacho protagoniza la obra de Adam Rapp sobre un hombre que vuelve a casa tras una tragedia. “Entre el dolor y la nada, me quedo con el dolor.”',
  meta:{tagline:'Entre el dolor y la nada',rating:'Adolescentes y adultos',duration:'1 h 45 min',tags:['teatro','drama'],tadaa_rating:'4.6',discount_label:'−31%',now_enabled:true,cast:[{role:'Padre',name:'Esteban Marín',photo:'img/tv/cast/padre.svg'},{role:'Hija',name:'Lucía Ferrer',photo:'img/tv/cast/hija.svg'}],tadaa_reviews:356},
  types:[['Preferente',85000,123000],['Lugares Now!',85000,0]],now:{type:'Lugares Now!',opensInHours:3,price:35000,quota:40,max:2}},
 {k:'inferno',org:'org-originals',venue:'ven-autodromo',title:'INFERNO',days:200,h:18,mode:'tadaa',img:'inferno.webp',cat:'Festival',
  desc:'Nueve círculos, nueve artistas sellados. El primer festival TADAA! Original: producido y vendido por TADAA!. Regístrate a la preventa para recibir tu acceso antes que nadie.',
  meta:{tagline:'Sins awaken · 2027',rating:'18+',duration:'2 días',tags:['festival','electrónica','original'],tadaa_original:true,preventa:true,golden_enabled:true},
  types:[['General preventa',120000,180000],['VIP preventa',260000,340000]],golden:{odds:100,max:30,kind:'meet_greet',title:'Meet & greet con un artista sellado',detail:'Conoce a uno de los artistas del line-up antes de su set.'}},
 {k:'bruno',org:'org-escena',venue:'ven-gnp',title:'Bruno Mars',days:16,h:20,mode:'external',img:'bruno.webp',cat:'Concierto',
  desc:'El show de Bruno Mars llega al Estadio GNP Seguros. Solicita tus boletos con tarifa de convenio: recibes un pase provisional y luego tus boletos oficiales.',
  meta:{tagline:'Gira mundial',rating:'Todo público',duration:'2 h aprox.',tags:['concierto','pop'],discount_label:'−14%'},types:[['GNP Verde',155000,180000],['GNP Naranja',230000,265000]]},
 {k:'bioparque',org:'org-escena',venue:'ven-bio',title:'BioParque Estrella',days:10,h:10,mode:'tadaa',img:'bioparque.webp',cat:'Paseo',
  desc:'Safari en camión, aviario, tirolesa y más de 500 animales. Pasaporte Aventura con tarifa de convenio y combos para toda la familia.',
  meta:{kind:'attraction',open_days:[0,1,2,3,4,5,6],highlight:'Safari, aviario y tirolesa',hours:'Todos los días · 9:00 a 17:00',validity:'Válido cualquier día por 30 días',address:'Carretera Chapa de Mota km 3, Estado de México',tagline:'Un día de safari',rating:'Familiar',duration:'Todo el día',tags:['paseo','familia','naturaleza'],tadaa_rating:'4.5',discount_label:'−19%'},
  types:[['Pasaporte Aventura',38000,47000],['Pasaporte Niño',29000,36000]],
  addons:[['combo','Combo familiar','2 hamburguesas, 2 papas y 2 bebidas',32000,200],['food','Comida en el restaurante','Buffet para 1 persona',22000,200],['merch','Peluche león','Tamaño mediano',29900,80],['merch','Gorra safari','Talla única',24900,80],['parking','Estacionamiento','Por auto, todo el día',12000,300]]},
 {k:'cinepolis',org:'org-escena',venue:'ven-cine',title:'Cinépolis · Plaza Universidad',days:1,h:12,mode:'tadaa',img:'cine.webp',cat:'Cine',
  desc:'Boletos de cine con tarifa de convenio para cualquier película en cartelera. Elige el tipo de sala y canjea tu pase en taquilla o en la app del cine.',
  meta:{kind:'cinema',open_days:[0,1,2,3,4,5,6],highlight:'4 estrenos en cartelera',hours:'Todos los días · funciones de 11:00 a 23:30',validity:'Válido para cualquier función por 60 días',address:'Cinépolis Plaza Universidad, Av. Universidad 1000, Santa Cruz Atoyac, CDMX',tagline:'Tu cine con tarifa TADAA!',rating:'Según película',duration:'Según película',tags:['cine','estrenos','pareja'],tadaa_rating:'4.6',tadaa_reviews:2140,discount_label:'−32%',
   movies:[{title:'Órbita Cero',genre:'Ciencia ficción',rating:'B',runtime:'2 h 08 min',poster:'img/tv/cine/orbita.webp'},{title:'La Reina del Barrio',genre:'Comedia',rating:'B',runtime:'1 h 46 min',poster:'img/tv/cine/reina.webp'},{title:'Niebla',genre:'Terror',rating:'B15',runtime:'1 h 52 min',poster:'img/tv/cine/niebla.webp'},{title:'Patitas al Rescate',genre:'Animación',rating:'AA',runtime:'1 h 34 min',poster:'img/tv/cine/patitas.webp'}]},
  types:[['Sala tradicional',6500,9500],['Sala 3D',8500,12500],['Sala VIP',15500,21000]],
  addons:[['combo','Combo palomitas','Palomitas grandes + 2 refrescos',14900,500],['food','Nachos con queso','Porción individual',8900,300],['combo','Combo dulcería','Palomitas medianas + refresco + dulce',11900,300]]},
 {k:'museovivo',org:'org-escena',venue:'ven-museo',title:'Museo Vivo de Ciencia y Arte',days:1,h:10,mode:'tadaa',img:'museo.webp',cat:'Museo',
  desc:'Salas interactivas de ciencia, arte contemporáneo y una exposición temporal. Recorrido libre a tu ritmo; tu pase incluye la exposición temporal.',
  meta:{kind:'museum',open_days:[0,2,3,4,5,6],highlight:'Exposición temporal incluida',hours:'Martes a domingo · 10:00 a 18:00',validity:'Válido cualquier día por 30 días',address:'Av. Chapultepec 500, Juárez, CDMX',tagline:'Ciencia y arte para tocar',rating:'Todo público',duration:'2 a 3 horas',tags:['museo','familia','cultura'],tadaa_rating:'4.7',tadaa_reviews:612,discount_label:'−40%'},
  types:[['Entrada general',4500,7500],['Entrada familiar (4 personas)',15000,26000]],
  addons:[['experience','Visita guiada','Recorrido de 60 min con guía',8000,200],['merch','Catálogo de la exposición','Edición impresa',22000,80]]},
 {k:'finalliga',org:'org-escena',venue:'ven-arena',title:'Final de Liga · Halcones vs. Toros',days:3,h:20,mode:'tadaa',img:'deporte.webp',cat:'Deporte',
  desc:'La gran final de la liga de básquetbol de la capital. Partido único, show de medio tiempo y activaciones para toda la familia.',
  meta:{tagline:'Un partido, un campeón',rating:'Todo público',duration:'2 h 30 min',tags:['deportes','basquetbol','familia'],tadaa_rating:'4.5',tadaa_reviews:428,discount_label:'−35%'},
  types:[['Cancha',150000,220000],['Platea',65000,95000],['General',28000,42000]],
  addons:[['combo','Combo de partido','Hot dog + refresco',12900,400],['merch','Jersey oficial','Réplica de la temporada',89900,120]]},
 {k:'queen',org:'org-escena',venue:'ven-arena',title:'God Save The Queen',hoursFromNow:5,mode:'tadaa',img:'queen.webp',cat:'Concierto',
  desc:'“El mejor show sobre Queen del mundo”. Tributo con orquesta y las canciones de Freddie Mercury.',
  meta:{tagline:'El tributo definitivo',rating:'Todo público',duration:'2 h',tags:['concierto','tributo'],tadaa_rating:'4.7',now_enabled:true},
  types:[['Verde',41000,52000],['Lugares Now!',41000,0]],now:{type:'Lugares Now!',opensInHours:-0.25,price:19000,quota:30,max:2}},
 {k:'hoy',org:'org-escena',venue:'ven-teatro1',title:'Hoy No Me Puedo Levantar',days:120,h:20,mode:'tadaa',img:'hoy.webp',cat:'Musical',
  desc:'El musical con las canciones de Mecano vuelve con nueva temporada. Muy pronto en TADAA!: activa el aviso para enterarte primero.',
  meta:{tagline:'Nueva temporada',rating:'Todo público',tags:['musical','mecano'],proximamente:true,golden_enabled:false,video_url:'img/tv/video-demo.mp4'},types:[]}
];
const USERS=[['ana','Ana Rodríguez','ROAA900101AB1'],['luis','Luis Martínez','MAPL880312AB2'],['sofia','Sofía Pérez','PESS950505AB3'],['diego','Diego Hernández','HEDD910707AB4'],['mariana','Mariana López','LOGM920620AB5'],['jorge','Jorge Castillo','CAJJ870101AB6'],
 ['productor','Productora Demo',null],['staff','Staff Puerta Demo',null],['empresa','RH Empresa Demo',null]];

const pool=getPool();if(!pool)throw new Error('DATABASE_URL no configurada');const c=await pool.connect();
let sp=0;const q=async(s,a)=>{if(/^(BEGIN|COMMIT|ROLLBACK)/.test(s))return c.query(s);const n='sp'+(++sp);await c.query('SAVEPOINT '+n);try{const r=await c.query(s,a);await c.query('RELEASE SAVEPOINT '+n);return r}catch(e){await c.query('ROLLBACK TO SAVEPOINT '+n);throw e}};
try{
 await q('BEGIN');
 // limpieza de compras demo (se recrean)
 await q(`DELETE FROM tickets WHERE order_item_id IN (SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.metadata->>'demo'=$1)`,[TAG]);
 await q(`DELETE FROM order_access_checks WHERE order_id IN (SELECT id FROM orders WHERE metadata->>'demo'=$1)`,[TAG]);
 await q(`DELETE FROM order_addons WHERE order_id IN (SELECT id FROM orders WHERE metadata->>'demo'=$1)`,[TAG]);
 await q(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE metadata->>'demo'=$1)`,[TAG]);
 const res=await q(`DELETE FROM orders WHERE metadata->>'demo'=$1 RETURNING reservation_id`,[TAG]);
 const rids=res.rows.map(r=>r.reservation_id).filter(Boolean);if(rids.length)await q(`DELETE FROM reservations WHERE id=ANY($1::uuid[])`,[rids]);
 await q(`UPDATE event_seats SET status='available' WHERE event_id IN (SELECT id FROM events WHERE metadata->>'demo'=$1)`,[TAG]);
 if(remove){
  const ev=(await q(`SELECT id FROM events WHERE metadata->>'demo'=$1`,[TAG])).rows.map(r=>r.id);
  if(ev.length){for(const t of ['now_signups WHERE campaign_id IN (SELECT id FROM now_campaigns WHERE event_id=ANY($1::uuid[]))','now_campaigns WHERE event_id=ANY($1::uuid[])','event_golden_config WHERE event_id=ANY($1::uuid[])','event_addons WHERE event_id=ANY($1::uuid[])','event_seats WHERE event_id=ANY($1::uuid[])','ticket_types WHERE event_id=ANY($1::uuid[])','event_extras WHERE event_id=ANY($1::uuid[])','events WHERE id=ANY($1::uuid[])'])await q('DELETE FROM '+t,[ev])}
  await q(`DELETE FROM company_employees WHERE organization_id=$1`,[id('org-empresa')]);
  await q(`DELETE FROM membership_offers WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE '%@demo.tadaa.mx')`);
  await q(`UPDATE app_users SET status='disabled' WHERE email LIKE '%@demo.tadaa.mx'`).catch(()=>{});
  await q('COMMIT');console.log('✓ Datos demo eliminados (usuarios demo desactivados).');process.exit(0);
 }
 // organizaciones
 for(const o of ORGS){await q(`INSERT INTO organizations(id,name,slug,status) VALUES($1,$2,$3,'active') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,status='active'`,[id(o.k),o.name,o.slug]).catch(async e=>{if(e.code==='23505'){await q(`UPDATE organizations SET slug=slug||'-'||substr(md5(random()::text),1,4) WHERE slug=$1 AND id<>$2`,[o.slug,id(o.k)]);await q(`INSERT INTO organizations(id,name,slug,status) VALUES($1,$2,$3,'active') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name`,[id(o.k),o.name,o.slug])}else throw e});
  await q(`INSERT INTO partner_agreements(id,organization_id,kind,status) VALUES($1,$2,$3,'active') ON CONFLICT(id) DO UPDATE SET status='active'`,[id(o.k+'-agr'),id(o.k),o.kind])}
 for(const [k,name,cap] of VENUES)await q(`INSERT INTO venues(id,name,capacity) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,capacity=EXCLUDED.capacity`,[id(k),name,cap]);
 // usuarios
 const U={};const ph=passwordHash(PASS);
 for(const [k,name,rfc] of USERS){const email=k+'@demo.tadaa.mx';const r=await q(`INSERT INTO app_users(id,email,full_name,password_hash,status) VALUES($1,$2,$3,$4,'active') ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,status='active' RETURNING id`,[id('user-'+k),email,name,ph]);U[k]=r.rows[0].id;
  await q(`INSERT INTO user_profiles(user_id,given_name,rfc) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET given_name=EXCLUDED.given_name,rfc=COALESCE(user_profiles.rfc,EXCLUDED.rfc)`,[U[k],name.split(' ')[0],rfc]).catch(e=>{if(e.code!=='23505')throw e})}
 for(const k of ['ana','luis','sofia','diego','mariana','jorge'])await q(`INSERT INTO memberships(id,user_id,status,source,current_period_start,current_period_end,rfc) VALUES($1,$2,'active','individual',now()-interval '40 days',now()+interval '20 days',(SELECT rfc FROM user_profiles WHERE user_id=$2)) ON CONFLICT(id) DO UPDATE SET status='active',current_period_end=now()+interval '20 days'`,[id('mem-'+k),U[k]]).catch(e=>{if(e.code!=='23505')throw e});
 for(const [org,user,role] of [['org-escena','productor','owner'],['org-originals','productor','owner'],['org-escena','staff','staff'],['org-originals','staff','staff'],['org-empresa','empresa','admin'],['org-uni','empresa','admin']])await q(`INSERT INTO organization_members(organization_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role`,[id(org),U[user],role]);
 // colaboradores de la empresa
 const EMP=[['EMP-1001','Ana Rodríguez','ROAA900101AB1','ana',true],['EMP-1002','Luis Martínez','MAPL880312AB2','luis',true],['EMP-1007','Mariana López','LOGM920620AB5','mariana',true],['EMP-1013','Carlos Ruiz','RUCC850915AB2',null,false],['EMP-1021','Fernanda Díaz','DIAF950228AB7',null,true],['EMP-1030','Jorge Castillo','CAJJ870101AB6','jorge',true],['EMP-1034','Paola Reyes','REPP930303AB8',null,true],['EMP-1040','Andrés Lugo','LUAA890909AB9',null,true]];
 for(const [codeE,name,rfc,user,active] of EMP)await q(`INSERT INTO company_employees(id,organization_id,employee_code,given_name,rfc,active,claimed_by,approved_at,deactivated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(organization_id,employee_code) DO UPDATE SET given_name=EXCLUDED.given_name,rfc=EXCLUDED.rfc,active=EXCLUDED.active,claimed_by=EXCLUDED.claimed_by,approved_at=EXCLUDED.approved_at,deactivated_at=EXCLUDED.deactivated_at`,[id('emp-'+codeE),id('org-empresa'),codeE,name,rfc,active,user?U[user]:null,user&&active?new Date(Date.now()-864e5*20).toISOString():null,active?null:new Date(Date.now()-864e5*90).toISOString()]);
 // eventos
 const T={},S={},AD={};
 for(const e of EVENTS){const eid=id('ev-'+e.k);const starts=e.hoursFromNow!=null?hours(e.hoursFromNow):at(e.days,e.h);
  const meta={...e.meta,category:e.cat,demo:TAG,golden_enabled:!!e.golden,now_enabled:!!e.now,addons_enabled:!!e.addons};
  await q(`INSERT INTO events(id,organization_id,venue_id,title,slug,description,status,starts_at,ticketing_mode,metadata,membership_promo_enabled,membership_promo_days) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10,30)
   ON CONFLICT(id) DO UPDATE SET organization_id=EXCLUDED.organization_id,venue_id=EXCLUDED.venue_id,title=EXCLUDED.title,description=EXCLUDED.description,status='published',starts_at=EXCLUDED.starts_at,ticketing_mode=EXCLUDED.ticketing_mode,metadata=EXCLUDED.metadata,updated_at=now()`,
   [eid,id(e.org),id(e.venue),e.title,e.k,e.desc,starts,e.mode,JSON.stringify(meta),e.k==='matilda']).catch(async err=>{if(err.code==='23505'){await q(`INSERT INTO events(id,organization_id,venue_id,title,slug,description,status,starts_at,ticketing_mode,metadata) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,status='published',starts_at=EXCLUDED.starts_at,ticketing_mode=EXCLUDED.ticketing_mode,metadata=EXCLUDED.metadata`,[eid,id(e.org),id(e.venue),e.title,e.k+'-demo',e.desc,starts,e.mode,JSON.stringify(meta)])}else throw err});
  const img='img/tv/ev/'+e.img;
  await q(`INSERT INTO event_extras(event_id,hero_url,poster_url,maps_url) VALUES($1,$2,$2,$3) ON CONFLICT(event_id) DO UPDATE SET hero_url=EXCLUDED.hero_url,poster_url=EXCLUDED.poster_url,maps_url=EXCLUDED.maps_url`,[eid,img,'https://maps.google.com/?q='+encodeURIComponent(VENUES.find(v=>v[0]===e.venue)[1])]);
  T[e.k]={};
  for(const [name,price,regular] of e.types){const tid=id('tt-'+e.k+'-'+name);const total=name.includes('Now!')?(e.now?.quota||40):e.k==='matilda'?60:500;
   await q(`INSERT INTO ticket_types(id,event_id,name,price_minor,quantity_total,quantity_reserved,max_per_order,section_name,description) VALUES($1,$2,$3,$4,$5,0,8,$3,$6) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,price_minor=EXCLUDED.price_minor,quantity_total=EXCLUDED.quantity_total,quantity_reserved=0,description=EXCLUDED.description`,[tid,eid,name,price,total,regular?JSON.stringify({regular_price_minor:regular}):null]);
   T[e.k][name]={id:tid,price,regular}}
  if(e.seats){S[e.k]=[];const rows={'Orquesta 1':['A','B','C'],'Platea':['D','E','F'],'Mezzanine 1':['G','H']};
   for(const [sec,rs] of Object.entries(rows))for(const r of rs)for(let n=1;n<=12;n++){const sid=id(`seat-${e.k}-${r}${n}`);await q(`INSERT INTO event_seats(id,event_id,ticket_type_id,section_name,row_label,seat_label,status,price_minor) VALUES($1,$2,$3,$4,$5,$6,'available',$7) ON CONFLICT(id) DO UPDATE SET status='available',ticket_type_id=EXCLUDED.ticket_type_id`,[sid,eid,T[e.k][sec].id,sec,r,String(n),T[e.k][sec].price]);S[e.k].push({id:sid,sec,row:r,n})}}
  if(e.golden)await q(`INSERT INTO event_golden_config(event_id,enabled,odds,max_winners,benefit_kind,benefit_title,benefit_detail) VALUES($1,true,$2,$3,$4,$5,$6) ON CONFLICT(event_id) DO UPDATE SET enabled=true,odds=EXCLUDED.odds,max_winners=EXCLUDED.max_winners,benefit_kind=EXCLUDED.benefit_kind,benefit_title=EXCLUDED.benefit_title,benefit_detail=EXCLUDED.benefit_detail`,[eid,e.golden.odds,e.golden.max,e.golden.kind,e.golden.title,e.golden.detail]);
  AD[e.k]=[];for(const [i,[kind,title,desc,price,stock]] of (e.addons||[]).entries()){const aid=id('ad-'+e.k+'-'+title);await q(`INSERT INTO event_addons(id,event_id,kind,title,description,price_minor,stock,sort_order,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,price_minor=EXCLUDED.price_minor,stock=EXCLUDED.stock,active=true`,[aid,eid,kind,title,desc,price,stock,i]);AD[e.k].push({id:aid,title,price})}
  if(e.now){const cid=id('now-'+e.k);await q(`INSERT INTO now_campaigns(id,event_id,ticket_type_id,function_label,opens_at,closes_at,price_minor,quota,max_per_user,enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true) ON CONFLICT(id) DO UPDATE SET opens_at=EXCLUDED.opens_at,closes_at=EXCLUDED.closes_at,price_minor=EXCLUDED.price_minor,quota=EXCLUDED.quota,enabled=true`,[cid,eid,T[e.k][e.now.type].id,'Hoy',hours(e.now.opensInHours),starts,e.now.price,e.now.quota,e.now.max]);
   await q(`DELETE FROM now_signups WHERE campaign_id=$1`,[cid]);for(const k of ['luis','sofia','diego','mariana'])await q(`INSERT INTO now_signups(campaign_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[cid,U[k]])}
 }
 // compras demo
 let orders=0,tickets=0;
 async function buy(user,ev,typeName,qty,{seats=[],addons=[],delivery='final',used=0,golden=false,daysAgo=2,now=false}={}){
  const e=EVENTS.find(x=>x.k===ev),tt=T[ev][typeName],eid=id('ev-'+ev);const created=new Date(Date.now()-daysAgo*864e5).toISOString();
  const r=(await q(`INSERT INTO reservations(user_id,event_id,status,expires_at,created_at) VALUES($1,$2,'confirmed',now(),$3) RETURNING id`,[U[user],eid,created])).rows[0].id;
  const unit=now?e.now.price:tt.price;const adTotal=addons.reduce((s,[t,qn])=>s+AD[ev].find(a=>a.title===t).price*qn,0);const sub=unit*qty+adTotal;
  const meta={demo:TAG,ticketingMode:e.mode,...(now?{nowCampaignId:id('now-'+ev)}:{})};
  const o=(await q(`INSERT INTO orders(user_id,reservation_id,status,subtotal_minor,fees_minor,total_minor,source,metadata,created_at) VALUES($1,$2,'paid',$3,0,$3,'tickets',$4,$5) RETURNING id`,[U[user],r,sub,JSON.stringify(meta),created])).rows[0].id;
  const oi=(await q(`INSERT INTO order_items(order_id,ticket_type_id,description,quantity,unit_price_minor,total_minor) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[o,tt.id,(now?'Now! · ':'')+typeName,qty,unit,unit*qty])).rows[0].id;
  for(const [t,qn] of addons){const a=AD[ev].find(x=>x.title===t);await q(`INSERT INTO order_addons(order_id,addon_id,title,quantity,unit_price_minor,total_minor,delivered_at) VALUES($1,$2,$3,$4,$5,$6,$7)`,[o,a.id,a.title,qn,a.price,a.price*qn,used?created:null])}
  const g=EVENTS.find(x=>x.k===ev).golden;
  for(let i=0;i<qty;i++){const seat=seats[i]||null;const isG=golden&&i===0;
   await q(`INSERT INTO tickets(order_item_id,owner_user_id,code_hash,seat_id,status,used_at,delivery_status,external_reference,golden,golden_benefit,golden_revealed_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [oi,U[user],code(),seat,i<used?'used':'valid',i<used?created:null,delivery,delivery==='delivering'?'OCS-'+Math.floor(100000+Math.random()*900000):null,isG,isG?JSON.stringify({kind:g.kind,title:g.title,detail:g.detail}):null,null,created]);tickets++;
   if(seat)await q(`UPDATE event_seats SET status='sold' WHERE id=$1`,[seat])}
  await q(`UPDATE ticket_types SET quantity_reserved=quantity_reserved+$1 WHERE id=$2`,[qty,tt.id]);orders++;return o}
 const st=S.matilda,seat=(r,n)=>st.find(s=>s.row===r&&s.n===n).id;
await buy('luis','cinepolis','Sala 3D',2,{addons:[['Combo palomitas',1]],daysAgo:1});
await buy('mariana','cinepolis','Sala VIP',2,{daysAgo:2});
await buy('diego','finalliga','Platea',2,{addons:[['Combo de partido',2]],daysAgo:1});
await buy('sofia','museovivo','Entrada familiar (4 personas)',1,{addons:[['Visita guiada',1]],daysAgo:3});
await buy('ana','cinepolis','Sala tradicional',3,{addons:[['Nachos con queso',1]],daysAgo:5,used:3});
 await buy('ana','matilda','Mezzanine 1',2,{seats:[seat('G',8),seat('G',9)],addons:[['Programa de mano',1]],daysAgo:3});
 await buy('luis','matilda','Orquesta 1',4,{seats:[seat('C',4),seat('C',5),seat('C',6),seat('C',7)],addons:[['Combo dulcería',2]],daysAgo:4,used:0});
 await buy('sofia','matilda','Platea',1,{seats:[seat('E',10)],daysAgo:1});
 await buy('diego','matilda','Orquesta 1',2,{seats:[seat('A',1),seat('A',2)],addons:[['Programa de mano',1]],golden:true,daysAgo:2});
 await buy('mariana','matilda','Mezzanine 1',4,{seats:[seat('H',3),seat('H',4),seat('H',5),seat('H',6)],addons:[['Combo dulcería',4]],daysAgo:5});
 await buy('jorge','matilda','Platea',2,{seats:[seat('D',7),seat('D',8)],daysAgo:6});
 for(const [i,u] of ['luis','sofia','diego','mariana','jorge','ana'].entries()){await buy(u,'matilda','Platea',1+(i%2),{seats:[seat('F',1+i*2),seat('F',2+i*2)].slice(0,1+(i%2)),daysAgo:7+i})}
 await buy('ana','morat','Zona C',2,{delivery:'provisional',daysAgo:1});
 await buy('luis','morat','Zona D',2,{delivery:'delivering',daysAgo:4});
 await buy('mariana','bruno','GNP Verde',4,{delivery:'provisional',daysAgo:2});
 await buy('ana','nocturno','Preferente',2,{daysAgo:2});
 await buy('jorge','nocturno','Preferente',1,{daysAgo:3});
 await buy('sofia','queen','Lugares Now!',2,{now:true,daysAgo:0});
 await buy('ana','bioparque','Pasaporte Aventura',2,{addons:[['Combo familiar',1],['Peluche león',1]],daysAgo:1});
 await buy('diego','bioparque','Pasaporte Niño',3,{addons:[['Estacionamiento',1]],daysAgo:2});
 await buy('luis','inferno','General preventa',2,{daysAgo:8});
 await buy('mariana','inferno','VIP preventa',2,{daysAgo:9,golden:true});
 // historial: un plan ya utilizado (check-in) para que haya asistencias y badges
 await buy('ana','queen','Verde',2,{used:2,daysAgo:12});
 // oferta de baja (pajarito) para un colaborador inactivo con cuenta
 await q(`INSERT INTO membership_offers(user_id,kind,discount_pct,months_total,source_organization_id) VALUES($1,'company_exit',50,3,$2) ON CONFLICT DO NOTHING`,[U.sofia,id('org-empresa')]);
 // notificaciones de bienvenida
 for(const k of ['ana','diego'])await q(`INSERT INTO user_notifications(user_id,kind,title,message,action_url) VALUES($1,'demo','Bienvenida a TADAA!','Esta es una cuenta de demostración con boletos de ejemplo.','/experience/index.html#wallet')`,[U[k]]).catch(()=>{});
 if(!keepCdmx){const r=await q(`UPDATE events SET status='draft',updated_at=now() WHERE slug LIKE 'cdmx-demo-%' AND status='published'`);if(r.rowCount)console.log('↷ Archivados (borrador)',r.rowCount,'eventos cdmx-demo del seed anterior');}
 await q('COMMIT');
 console.log(`✓ Demo listo: ${EVENTS.length} eventos, ${orders} compras, ${tickets} boletos.`);
 console.log(`  Usuarios (contraseña ${PASS}): ana, luis, sofia, diego, mariana, jorge @demo.tadaa.mx`);
 console.log('  Portales: productor@demo.tadaa.mx · staff@demo.tadaa.mx · empresa@demo.tadaa.mx');
}catch(e){await q('ROLLBACK');console.error('✗',e.message);process.exitCode=1}finally{c.release();await closePool?.()}
