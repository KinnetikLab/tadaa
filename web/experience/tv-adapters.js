/* TADAA! Ticket vibrante — adaptadores: conectan cada pantalla de los mockups con la API real.
 * Cada adaptador recibe la clase original de la plantilla y devuelve una que produce los mismos
 * valores que espera el HTML, pero con datos vivos. Si no hay eventos publicados, se muestran los
 * eventos de muestra del diseño (sin venta). */
(function(){
'use strict';
const TZ='America/Mexico_City';
const fmt=(iso,o)=>{try{return new Intl.DateTimeFormat('es-MX',{timeZone:TZ,...o}).format(new Date(iso))}catch{return ''}};
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const H={
 day:iso=>iso?fmt(iso,{day:'numeric'}):'',mon:iso=>iso?fmt(iso,{month:'short'}).replace('.','').toUpperCase():'',
 short:iso=>iso?cap(fmt(iso,{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'')):'Fecha por confirmar',
 hour:iso=>iso?fmt(iso,{hour:'2-digit',minute:'2-digit',hour12:false}):'',
 when:iso=>iso?H.short(iso)+' · '+H.hour(iso):'Fecha por confirmar',
 money:m=>'$'+Math.round(Number(m||0)/100).toLocaleString('en-US'),
 folio:id=>'TD-'+String(id||'').replace(/-/g,'').slice(0,8).toUpperCase(),
 ini:u=>(u?.full_name||u?.email||'T').trim().charAt(0).toUpperCase(),
 first:u=>(u?.full_name||'').trim().split(/\s+/)[0]||''
};
const IMG={matilda:'img/tv/ev/matilda.webp',morat:'img/tv/ev/morat.webp',nocturno:'img/tv/ev/nocturno.webp',inferno:'img/tv/ev/inferno.webp',bruno:'img/tv/ev/bruno.webp',bio:'img/tv/ev/bioparque.webp',queen:'img/tv/ev/queen.webp',hoy:'img/tv/ev/hoy.webp'};
const VIDEO='img/tv/video-demo.mp4';
/* Muestras del diseño: se ven solo si aún no hay eventos publicados. */
const SAMPLES=[
 {slug:'muestra-matilda',title:'Matilda · El Musical',cat:'Musical',k:'Teatro',venue:'Teatro 1',whenTxt:'Vie a dom · Teatro 1',d:'29',m:'NOV',price:'Desde $700',pct:'−61%',img:IMG.matilda,pos:'center 30%',golden:true,s:'now'},
 {slug:'muestra-morat',title:'Morat',cat:'Concierto',k:'Conciertos',venue:'Palacio de los Deportes',whenTxt:'17 nov · 20:00',d:'17',m:'NOV',price:'Desde $2,100',pct:'−13%',img:IMG.morat,pos:'center 40%',video:VIDEO,s:'now'},
 {slug:'muestra-nocturno',title:'Nocturno',cat:'Teatro',k:'Teatro',venue:'Teatro 2',whenTxt:'Hoy · 20:00',d:'21',m:'NOV',price:'Desde $850',pct:'−31%',img:IMG.nocturno,pos:'center 25%',rush:true,golden:true,s:'now'},
 {slug:'muestra-inferno',title:'INFERNO',cat:'Festival · Preventa',k:'Festivales',venue:'Sede por revelar',whenTxt:'2027 · fecha por revelar',d:'—',m:'2027',price:'Regístrate',pct:'',img:IMG.inferno,pos:'center 30%',original:true,golden:true,s:'pre',cta:'Registrarme a la preventa'},
 {slug:'muestra-bruno',title:'Bruno Mars',cat:'Concierto',k:'Conciertos',venue:'Estadio GNP Seguros',whenTxt:'11 dic · 20:30',d:'11',m:'DIC',price:'Desde $1,550',pct:'−14%',img:IMG.bruno,pos:'center',s:'now'},
 {slug:'muestra-bioparque',title:'BioParque Estrella',cat:'Paseo',k:'Paseos',venue:'Chapa de Mota',whenTxt:'Fecha abierta',d:'—',m:'ABIERTA',price:'Desde $380',pct:'−19%',img:IMG.bio,pos:'center',s:'now'},
 {slug:'muestra-queen',title:'God Save The Queen',cat:'Concierto',k:'Conciertos',venue:'Arena CDMX',whenTxt:'19 nov · 21:00',d:'19',m:'NOV',price:'Desde $410',pct:'',img:IMG.queen,pos:'center',rush:true,s:'now'},
 {slug:'muestra-hoy',title:'Hoy No Me Puedo Levantar',cat:'Musical',k:'Teatro',venue:'Teatro 1',whenTxt:'Nueva temporada',d:'—',m:'2027',price:'PRÓXIMAMENTE',pct:'',img:IMG.hoy,pos:'center',video:VIDEO,golden:true,s:'soon',cta:'Avisarme cuando salga'}
].map(x=>({sample:true,id:x.slug,rush:false,golden:false,original:false,video:false,cta:'',...x,photo:!x.video,when:x.whenTxt}));
const CAT_MAP={concierto:'Conciertos',conciertos:'Conciertos',teatro:'Teatro',musical:'Teatro',festival:'Festivales',festivales:'Festivales',paseo:'Paseos',paseos:'Paseos',parque:'Paseos',familia:'Familia',familiar:'Familia',experiencias:'Paseos'};
function mapEvent(e){if(!e)return null;const m=e.metadata||{};const img=e.hero_url||e.poster_url||m.hero_url||IMG.matilda;const cat=m.category||'Evento';
 const s=m.proximamente?'soon':m.preventa?'pre':'now';
 return {id:e.id,slug:e.slug||e.id,title:e.title,cat,k:CAT_MAP[String(cat).toLowerCase()]||cat,venue:e.venue||m.venue||'Sede por confirmar',starts:e.starts_at,
  when:e.starts_at?H.when(e.starts_at):'Fecha por confirmar',whenTxt:e.starts_at?H.short(e.starts_at)+' · '+(e.venue||''):'Fecha por confirmar',d:e.starts_at?H.day(e.starts_at):'—',m:e.starts_at?H.mon(e.starts_at):'',
  price:s==='soon'?'PRÓXIMAMENTE':s==='pre'?'PREVENTA':e.from_price_minor!=null?'Desde '+H.money(e.from_price_minor):(e.ticketing_mode==='tadaa'?'Ver precios':'Solicitar'),pct:m.discount_label||'',
  img,pos:m.image_position||'center',video:m.video_url||false,photo:!m.video_url,rush:!!m.now_enabled,golden:!!m.golden_enabled,original:!!m.tadaa_original,s,cta:s==='soon'?'Avisarme cuando salga':s==='pre'?'Entrar a la preventa':'',raw:e}}
function list(){const real=(TV.events||[]).map(mapEvent).filter(Boolean);return real.length?real:SAMPLES}
function bySlug(slug){return list().find(e=>e.slug===slug||e.id===slug)}
const cart={};// por evento: {typeId, qty, addons:{id:q}, seats:[]}
function cartFor(id){return cart[id]=cart[id]||{typeId:null,qty:1,addons:{},seats:[]}}

async function checkout(evId,{typeId,qty,addons,seats}){
 if(!TV.user)return TV.requireLogin('index.html#evento/'+encodeURIComponent(evId));
 if(!typeId)return TV.toast('Elige una zona');
 const body={ticketTypeId:typeId,quantity:seats?.length||qty,idempotencyKey:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()};
 const ad=Object.entries(addons||{}).filter(([,q])=>q>0).map(([id,quantity])=>({id,quantity}));if(ad.length)body.addons=ad;if(seats?.length)body.seatIds=seats;
 try{TV.toast('Apartando tus lugares…');const o=await TV.api.call('/api/v2/orders','POST',body);
  await TV.loadPaymentMode();
  if(TV.paymentMode==='clip'){const r=await TV.api.call('/api/v2/checkout/clip','POST',{orderId:o.orderId});if(r.checkoutUrl){location.assign(r.checkoutUrl);return}throw new Error('Clip no devolvió un enlace de pago')}
  await TV.api.call('/api/v2/checkout/test-pay','POST',{orderId:o.orderId});
  cart[evId]=null;await TV.loadTickets();TV.toast('¡Listo! Tu boleto ya está en Mi Wallet','ok');
  const g=TV.tickets.find(t=>t.golden&&!t.golden_revealed_at);TV.go(g?'golden':'wallet',g?[g.id]:[]);
 }catch(e){TV.toast(e.message||'No se pudo completar la compra','err')}}

const A=window.TVAdapters={load:{}};
const LOAD=(names,fn)=>names.forEach(n=>A.load[n]=fn);
LOAD(['DHome','Main','DExplorar','MExplorar'],async T=>{await Promise.all([T.catalog(),T.user?T.loadTickets():null,T.loadNow()])});
LOAD(['DEvento','MEvento','MAddons','MAsientos'],async(T,p)=>{await T.catalog();const id=p[0]||T.currentEvent||(list()[0]||{}).slug;T.currentEvent=id;if(id&&!String(id).startsWith('muestra-'))await T.event(id);if(T.user)await T.loadNow()});
LOAD(['DWallet','MWallet','MPase','MGolden','DGolden'],async T=>{await Promise.all([T.loadTickets(),T.catalog()])});
LOAD(['DRush','MRush'],async T=>{await Promise.all([T.loadNow(),T.catalog()])});
LOAD(['DCuenta','MCuenta','MLogro','MBaja'],async T=>{await Promise.all([T.loadAccount(),T.loadTickets()])});

/* valores globales disponibles en todas las plantillas */
const globals=()=>({TVini:H.ini(TV.user)});
const wrap=(C,fn)=>class extends C{renderVals(){let base={};try{base=super.renderVals()||{}}catch{}return Object.assign(globals(),base,fn.call(this,base))}};

/* ───── Inicio ───── */
function homeState(){const u=TV.user;const valid=(TV.tickets||[]).filter(t=>t.status==='valid').sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));const t=valid[0];
 const lvl=TV.account?.level?.name;const st=t?(t.delivery_status==='final'&&t.ticketing_mode==='tadaa'?'BOLETO FINAL · QR LISTO':t.delivery_status==='delivering'?'EN ENTREGA':'PASE PROVISIONAL'):'';
 const camp=(TV.now||[]).find(c=>c.state!=='closed');
 return {u,ini:H.ini(u),hello:u?('Hola, '+(H.first(u)||'')+(lvl?' · Nivel '+lvl:'')):'Hola · Bienvenido a TADAA!',hdr:u?{name:H.first(u)||'Mi cuenta',sub:lvl?'Nivel '+lvl:'Mi cuenta'}:{name:'Entrar',sub:'o crea tu cuenta'},
  today:cap(fmt(new Date(),{weekday:'long',day:'numeric',month:'short'}).replace('.','')),
  hasNext:!!t,noNext:!t,next:t?{img:(bySlug(t.event_id)||{}).img||IMG.matilda,kicker:'Tu próximo plan · '+H.when(t.starts_at),title:t.title,status:st,id:t.id}:{},
  cta:u?{kicker:'Aún no tienes planes',title:'Encuentra tu próximo plan',btn:'Explorar'}:{kicker:'Tarifas de convenio y Now!',title:'Entra o crea tu cuenta',btn:'Entrar'},
  hasNow:!!camp,nowb:camp?{title:'Now! · '+camp.title,sub:(camp.state==='open'?'¡Abierto! Quedan '+camp.remaining:'Abre '+H.when(camp.opens_at))+' · '+camp.signups+' inscritos',btn:camp.signed?'✓ Inscrito':camp.state==='open'?'Comprar':'Inscribirme'}:{},
  searchKey:e=>{if(e.key==='Enter'){TV.search=e.target.value;TV.go('explorar')}}}}
function loginLinks(root){if(TV.user)return;root.querySelectorAll('a[data-tv-link="explorar"],a[data-tv-link="cuenta"]').forEach(a=>{if(/Entrar/.test(a.textContent)){a.removeAttribute('data-tv-link');a.href='login.html?next=index.html'}})}
A.Main=C=>class extends C{renderVals(){const h=homeState();return {...globals(),...h,popular:list().slice(0,8).map(e=>({...e,now:e.rush}))}}
 afterPaint(root){loginLinks(root);const n=root.querySelector('a[data-tv-link="pase"]');if(n){const h=homeState();if(h.next.id)n.__tvItem={id:h.next.id}}}};
A.DHome=C=>class extends C{renderVals(){const i=this.state.i||0;const evs=list();const data=evs.slice(0,6);const n=Math.max(1,data.length);const ii=i%n;
 const cards=data.map((c,k)=>({...c,photo:!c.video,style:'position: relative; flex: 0 0 '+(k===ii?360:300)+'px; height: '+(k===ii?500:440)+'px; border-radius: 32px; overflow: hidden; display: block; color: #FFFFFF; background: #08091A; transition: all .5s cubic-bezier(.2,.8,.2,1); box-shadow: '+(k===ii?'0 40px 80px rgba(6,14,90,.55)':'none')+'; opacity: '+(k<ii?0:1)+';'}));
 const track='display: flex; align-items: flex-end; gap: 18px; height: 500px; transition: transform .5s cubic-bezier(.2,.8,.2,1); transform: translateX(-'+(ii*318)+'px);';
 const dots=data.map((x,k)=>({aria:'Ir a '+x.title,pick:()=>this.setState({i:k}),style:'height: 8px; border: 0; padding: 0; border-radius: 99px; transition: width .3s; '+(k===ii?'width: 44px; background: #D6FF35;':'width: 14px; background: rgba(255,255,255,.4);')}));
 const base=super.renderVals();
 const top=evs.filter(e=>e.s==='now').slice(0,4).map((c,k)=>({...c,n:String(k+1),photo:!c.video}));
 const h=homeState();return {...globals(),...base,...h,cards,track,dots,prev:()=>this.setState({i:(ii+n-1)%n}),next:()=>this.setState({i:(ii+1)%n}),top}}
 afterPaint(root){loginLinks(root);const a=root.querySelector('header a[data-tv-link="cuenta"]');if(a&&!TV.user){a.removeAttribute('data-tv-link');a.href='login.html?next=index.html'}}};

/* ───── Cartelera ───── */
const CATS=['Todo','Conciertos','Teatro','Festivales','Paseos','Familia','Now!'];
function filterCat(evs,c){return c==='Now!'?evs.filter(e=>e.rush):c==='Todo'?evs:evs.filter(e=>e.k===c||e.cat===c)}
function dayKey(d){return fmt(d,{year:'numeric',month:'2-digit',day:'2-digit'})}
A.DExplorar=C=>class extends C{constructor(p){super(p);this.state={cat:'Todo',day:null,tab:'now',f:0,q:TV.search||''};TV.search=''}componentDidMount(){this.t=setInterval(()=>this.setState({f:(this.state.f||0)+1}),5000)}componentWillUnmount(){clearInterval(this.t)}renderVals(){const st=this.state;
 const chip=on=>'height: 42px; padding: 0 16px; border-radius: 99px; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; '+(on?'border: 0; background: #08091A; color: #D6FF35;':'border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.12); color: #FFFFFF;');
 const cats=CATS.map(label=>({label,on:st.cat===label,pick:()=>this.setState({cat:label}),style:chip(st.cat===label)}));
 const all=list();const busy=new Set(all.filter(e=>e.starts).map(e=>dayKey(e.starts)));const ws=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];const today=new Date();
 const days=Array.from({length:14},(_,k)=>{const d=new Date(today.getTime()+k*864e5),key=dayKey(d),on=st.day===key;return {n:d.getDate(),w:ws[d.getDay()],on,pick:()=>this.setState({day:on?null:key}),
  style:'flex: 0 0 66px; height: 84px; border-radius: 99px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-family: inherit; cursor: pointer; '+(on?'border: 0; background: #08091A; color: #D6FF35;':'border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.08); color: #FFFFFF;'),
  dot:'width: 5px; height: 5px; border-radius: 50%; background: '+(busy.has(key)?(on?'#D6FF35':'#FFFFFF'):'transparent')+';'}});
 const F=all.filter(e=>e.s==='now').slice(0,3);const f=F.length?st.f%F.length:0;const feat=F.length?[{...F[f],cat:String(F[f].cat).toUpperCase()}]:[];
 const fdots=F.map((x,k)=>'height: 6px; border-radius: 99px; '+(k===f?'width: 30px; background: #D6FF35;':'width: 12px; background: rgba(255,255,255,.5);'));
 const tabsData=[['now','En cartelera'],['soon','Próximamente'],['pre','En preventa']];
 const tabs=tabsData.map(([id,label])=>({label,on:st.tab===id,count:all.filter(e=>e.s===id).length,pick:()=>this.setState({tab:id}),style:'height: 42px; padding: 0 18px; border: 0; border-radius: 99px; font-family: inherit; font-weight: 800; font-size: 13px; cursor: pointer; '+(st.tab===id?'background: #1238FF; color: #FFFFFF;':'background: transparent; color: #08091A;')}));
 let events=filterCat(all.filter(e=>e.s===st.tab),st.cat);if(st.q)events=events.filter(e=>(e.title+' '+e.venue).toLowerCase().includes(st.q.toLowerCase()));if(st.day)events=events.filter(e=>e.starts&&dayKey(e.starts)===st.day);
 const chipBase='position: absolute; left: 14px; top: 14px; border-radius: 99px; padding: 7px 12px; font-size: 11px; font-weight: 800; ';
 events=events.map(e=>({...e,soon:e.s!=='now',chip:e.price,chipStyle:chipBase+(e.s==='now'?'background: #D6FF35; color: #08091A;':e.s==='soon'?'background: #FFFFFF; color: #08091A;':'background: #1238FF; color: #FFFFFF;')}));
 return {...globals(),cats,days,feat,fdots,tabs,events}}};
A.MExplorar=C=>class extends C{constructor(p){super(p);this.state={cat:'Todo',day:null,q:TV.search||''};TV.search=''}renderVals(){const st=this.state;
 const cats=CATS.map(label=>({label,on:st.cat===label,pick:()=>this.setState({cat:label}),style:'flex: 0 0 auto; border-radius: 99px; font: inherit; font-weight: 700; font-size: 13px; padding: 11px 16px; '+(st.cat===label?'border: 0; background: #1238FF; color: #FFFFFF;':'border: 1px solid #D5DBEA; background: #FFFFFF; color: #08091A;')}));
 const ws=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],today=new Date(),base='width: 48px; height: 60px; border-radius: 99px; border: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-family: inherit; ';
 const days=Array.from({length:7},(_,k)=>{const d=new Date(today.getTime()+k*864e5),key=dayKey(d),on=st.day===key;return {n:d.getDate(),w:ws[d.getDay()],on,pick:()=>this.setState({day:on?null:key}),style:base+(on?'background: #08091A; color: #D6FF35;':'background: transparent; color: #08091A;')}});
 let ev=filterCat(list(),st.cat);if(st.day)ev=ev.filter(e=>e.starts&&dayKey(e.starts)===st.day);if(st.q)ev=ev.filter(e=>(e.title+' '+e.venue).toLowerCase().includes(st.q.toLowerCase()));
 return {...globals(),cats,days,month:fmt(today,{month:'short'}).replace('.','').toUpperCase(),q:st.q,search:e=>{this.state.q=e.target.value;clearTimeout(this._t);this._t=setTimeout(()=>{const pos=e.target.selectionStart;this.setState({});requestAnimationFrame(()=>{const i=document.querySelector('#tv input[aria-label="Buscar"]');if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch{}}})},250)},events:ev,empty:!ev.length}}};

/* ───── Evento ───── */
function eventModel(slug){const s=bySlug(slug)||SAMPLES[0];const d=s.sample?null:TV.detail[s.slug]||TV.detail[s.id];const e=d?.event;const m=e?.metadata||{};
 const types=(d?.ticketTypes||[]).filter(t=>!t.now);const golden=d?.golden||(s.golden?{odds:100,benefit_title:'upgrade de sección en esta función'}:null);
 const ev={...s,logo:m.logo_url||'',noLogo:!m.logo_url,titleSize:(s.title.length>16?'34px':'44px'),titleSizeD:(s.title.length>18?'72px':'104px'),
  chip:(String(s.cat).toUpperCase())+(s.pct?' · HASTA '+s.pct:''),mode:e?(e.ticketing_mode==='tadaa'?'TADAA! TICKETS · BOLETO FINAL':'BOLETERA OFICIAL · PASE PROVISIONAL'):'TADAA! TICKETS · BOLETO FINAL',
  rating:m.rating||(s.sample&&s.slug==='muestra-matilda'?'FAMILIAR':''),ratingLong:m.rating||'Por confirmar',score:m.tadaa_rating||(s.sample?'4.8':''),scoreBig:m.tadaa_rating||(s.sample?'4.8':'—'),
  when:e?.starts_at?H.when(e.starts_at):s.whenTxt,sub:(s.venue||'')+' · '+(e?.starts_at?H.when(e.starts_at):s.whenTxt),
  tagline:m.tagline||s.title,desc:e?.description||m.synopsis||(s.sample?'Vive '+s.title+' con tarifas de convenio TADAA!, boleto con QR dinámico en tu Wallet y beneficios como Golden Ticket y Now!.':''),
  video:m.video_url||VIDEO,duration:m.duration||'Por confirmar',access:m.access||'Consulta con el recinto',tags:Array.isArray(m.tags)?m.tags:(s.sample?['convenio','tadaa']:[]),
  maps:e?.maps_url||d?.event?.maps_url||'https://maps.google.com/?q='+encodeURIComponent(s.venue||''),short:s.title.split(' · ')[0],
  golden:!!golden,odds:golden?.odds||100,goldenBenefit:golden?.benefit_title||'',now:!!(d?.now?.length)||s.rush,
  extraNote:e?.membership_promo_enabled?'Incluye '+(e.membership_promo_days||30)+' días de membresía TADAA!.':'Pago seguro con Clip; tu boleto llega a Mi Wallet.'};
 return {s,d,e,m,types,ev,addons:d?.addons||[],seats:d?.seats||[],nowList:d?.now||[]}}
const SAMPLE_Z=[{id:'s1',name:'VIP Oro',regular:359600,price:180000},{id:'s2',name:'Orquesta 1',regular:279600,price:140000},{id:'s3',name:'Platea',regular:239600,price:120000},{id:'s4',name:'Mezzanine 1',regular:179800,price:70000}];
function zonesOf(M){if(M.s.sample)return SAMPLE_Z;return M.types.map(t=>({id:t.id,name:t.name,price:Number(t.price_minor),regular:Number(t.metadata?.regular_price_minor||0),left:Number(t.quantity_total)-Number(t.quantity_reserved||0),max:Number(t.max_per_order||8)}))}
function buyState(M,z,cartObj){if(M.s.sample)return {label:M.s.s==='now'?'Próximamente en TADAA!':M.s.cta||'Avisarme',disabled:true,act:()=>TV.toast('Evento de muestra del diseño: aún no está a la venta')};
 if(M.e&&M.e.ticketing_mode!=='tadaa')return {label:'Solicitar boletos',disabled:false,act:()=>{location.href='app.html#/evento/'+M.e.id}};
 if(!z)return {label:'Sin venta abierta',disabled:true,act:()=>TV.toast('La venta no está abierta para este evento')};
 if(M.seats.length)return {label:'Elegir asientos',disabled:false,act:()=>TV.go('asientos',[M.s.slug])};
 return {label:TV.user?'Pagar con Clip':'Entrar y pagar',disabled:false,act:()=>checkout(M.s.slug,{typeId:z.id,qty:cartObj.qty,addons:cartObj.addons})}}
A.DEvento=C=>class extends C{constructor(p){super(p);this.slug=(p.params||[])[0]||TV.currentEvent;this.state={tab:'sin'}}renderVals(){const M=eventModel(this.slug),st=this.state,c=cartFor(M.s.slug);const Z=zonesOf(M);if(!c.typeId||!Z.find(z=>z.id===c.typeId))c.typeId=Z[Z.length-1]?.id||null;
 const rowBase='width: 100%; min-height: 66px; display: grid; grid-template-columns: 1.4fr 1fr 1fr 80px; align-items: center; gap: 12px; padding: 10px 20px; border-radius: 22px; border: 0; font-family: inherit; text-align: left; cursor: pointer; ';
 const rows=Z.map(z=>({name:z.name,regular:z.regular?H.money(z.regular):'',price:H.money(z.price),pct:z.regular>z.price?'−'+Math.round((1-z.price/z.regular)*100)+'%':(z.left!=null&&z.left<=20&&z.left>0?'Últimos':''),on:c.typeId===z.id,pick:()=>{c.typeId=z.id;this.setState({})},style:rowBase+(c.typeId===z.id?'background: #1238FF; color: #FFFFFF;':'background: #FFFFFF; color: #08091A;')}));
 const fdate=M.e?.starts_at;const funcs=[{d:fdate?H.short(fdate):M.s.whenTxt,h:fdate?H.hour(fdate):'',on:true,pick:()=>{},style:'height: 42px; padding: 0 14px; border-radius: 99px; font-family: inherit; font-size: 13px; border: 0; background: #08091A; color: #D6FF35;'}];
 const T=[['sin','Sinopsis'],['rep','Reparto y producción'],['info','Info del evento'],['res','Reseñas']];
 const tabs=T.map(([id,label])=>({label,on:st.tab===id,pick:()=>this.setState({tab:id}),style:'flex: 1; min-width: 120px; height: 46px; border: 0; border-radius: 18px; font-family: inherit; font-weight: 800; font-size: 13px; cursor: pointer; '+(st.tab===id?'background: #FFFFFF; color: #08091A; box-shadow: 0 4px 12px rgba(8,9,26,.08);':'background: transparent; color: #4A5068;')}));
 const colors=['#D6FF35','#FF8A3D','#B9C7FF','#FFE9A8','#FFB3CF'];const castSrc=Array.isArray(M.m.cast)?M.m.cast:(M.s.sample?[['Matilda','Valentina Ríos'],['Miss Trunchbull','Rodrigo Salas'],['Miss Honey','Camila Ortega'],['Sr. Wormwood','Andrés Lugo'],['Sra. Wormwood','Paola Reyes']].map(([role,name])=>({role,name})):[]);
 const cast=castSrc.map((x,i)=>{const name=x.name||String(x);return {name,role:x.role||'',ini:name.split(/\s+/).map(w=>w[0]).slice(0,2).join(''),bg:colors[i%5],style:'width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-family: Outfit, sans-serif; font-weight: 800; background: '+colors[i%5]+'; color: #08091A;'}});
 const crew=Array.isArray(M.m.crew)?M.m.crew.map(x=>({role:x.role||'',name:x.name||String(x)})):(M.s.sample?[{role:'Libreto',name:'Dennis Kelly'},{role:'Música y letras',name:'Tim Minchin'},{role:'Dirección',name:'Por anunciar'},{role:'Producción',name:'Por anunciar'}]:[]);
 const rv=M.m.reviews||{};const media=(rv.media||(M.s.sample?[{stars:'★★★★★',text:'Un espectáculo que se disfruta a cualquier edad.',source:'Reseña de ejemplo'}]:[])).map(r=>({stars:r.stars||'★★★★★',text:r.text||'',source:r.source||''}));
 const pub=(rv.public||[]).map(r=>({who:r.who||'Asistente verificado',stars:r.stars||'★★★★★',text:r.text||''}));
 const stars=[[5,82],[4,12],[3,4],[2,1],[1,1]].map(([n,p])=>({n,bar:'display: block; height: 100%; width: '+p+'%; background: #1238FF;'}));
 const AD=M.s.sample?[]:M.addons.filter(a=>a.available>0);const bgs={merch:'#B9C7FF',combo:'#D6FF35',food:'#FFB86B',experience:'#FFE9A8',parking:'#EEF1F7'};
 const addons=AD.map(a=>{const on=(c.addons[a.id]||0)>0;return {id:a.id,name:a.title,desc:a.description||({merch:'Merch oficial',combo:'Combo',food:'Alimentos',experience:'Experiencia',parking:'Estacionamiento'}[a.kind]||''),price:'+'+H.money(a.price_minor),on,bg:bgs[a.kind]||'#D6FF35',icon:'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z',
  toggle:()=>{c.addons[a.id]=on?0:1;this.setState({})},style:'display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 12px 8px 8px; border-radius: 18px; font-family: inherit; color: #08091A; text-align: left; cursor: pointer; '+(on?'background: #EEF2FF; border: 2px solid #1238FF;':'background: #FFFFFF; border: 2px solid #E1E6F2;'),
  check:'width: 24px; height: 24px; flex: 0 0 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 800; '+(on?'background: #1238FF; color: #FFFFFF;':'background: #EEF1F7; color: transparent;')}});
 const sel=Z.find(z=>z.id===c.typeId);const q=c.qty;const addTotal=AD.reduce((s,a)=>s+(c.addons[a.id]||0)*Number(a.price_minor),0);const maxQ=Math.max(1,Math.min(8,sel?.max||8,sel?.left??8));
 const B=buyState(M,sel,c);const sim=list().filter(e=>e.slug!==M.s.slug).slice(0,4).map(e=>({...e,meta:e.cat+' · '+e.venue}));
 return {...globals(),ev:M.ev,rows,funcs,tabs,cast,castLabel:M.m.cast?'REPARTO':'REPARTO PROVISIONAL',crew,stars,media,public:pub,addons,hasAddons:addons.length>0,qty:q,zoneName:sel?.name||'—',funcName:funcs[0].d+(funcs[0].h?' · '+funcs[0].h:''),
  total:H.money((sel?.price||0)*q+addTotal),save:H.money(sel&&sel.regular>sel.price?(sel.regular-sel.price)*q:0),minus:()=>{c.qty=Math.max(1,q-1);this.setState({})},plus:()=>{c.qty=Math.min(maxQ,q+1);this.setState({})},
  hasSave:!!(sel&&sel.regular>sel.price),tSin:st.tab==='sin',tRep:st.tab==='rep',tInfo:st.tab==='info',tRes:st.tab==='res',similar:sim,noZones:!Z.length,noZonesMsg:M.e&&M.e.ticketing_mode!=='tadaa'?'Este evento lo vende una boletera oficial: solicita tus boletos y te damos un pase provisional.':'La venta aún no está abierta para este evento.',
  buy:B.act,buyDisabled:B.disabled,ctaLabel:B.label}}};
A.MEvento=C=>class extends C{constructor(p){super(p);this.slug=(p.params||[])[0]||TV.currentEvent;this.state={}}renderVals(){const M=eventModel(this.slug),c=cartFor(M.s.slug);const Z=zonesOf(M);if(!c.typeId||!Z.find(z=>z.id===c.typeId))c.typeId=Z[Math.min(1,Z.length-1)]?.id||null;
 const base='width: 100%; min-height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 18px; font-family: inherit; text-align: left; ';
 const zones=Z.slice(0,M.s.sample?3:20).map(z=>{const on=c.typeId===z.id;return {name:z.name,regular:z.regular?H.money(z.regular):'',price:H.money(z.price),pct:z.regular>z.price?'−'+Math.round((1-z.price/z.regular)*100)+'%':'',on,pick:()=>{c.typeId=z.id;this.setState({})},style:base+(on?'background: #1238FF; color: #FFFFFF; border: 2px solid #1238FF;':'background: #FFFFFF; color: #08091A; border: 2px solid #E1E6F2;')}});
 const sel=Z.find(z=>z.id===c.typeId),q=c.qty,maxQ=Math.max(1,Math.min(8,sel?.max||8,sel?.left??8));const AD=M.s.sample?[]:M.addons.filter(a=>a.available>0);const adCount=Object.values(c.addons).reduce((a,b)=>a+b,0);const addTotal=AD.reduce((s,a)=>s+(c.addons[a.id]||0)*Number(a.price_minor),0);
 const B=buyState(M,sel,c);
 return {...globals(),ev:M.ev,zones,qty:q,total:H.money((sel?.price||0)*q+addTotal),save:H.money(sel&&sel.regular>sel.price?(sel.regular-sel.price)*q:0),minus:()=>{c.qty=Math.max(1,q-1);this.setState({})},plus:()=>{c.qty=Math.min(maxQ,q+1);this.setState({})},
  saveLabel:sel&&sel.regular>sel.price?'Total estimado · ahorras '+H.money((sel.regular-sel.price)*q):'Total estimado',hasSeats:M.seats.length>0,noZones:!Z.length,noZonesMsg:M.e&&M.e.ticketing_mode!=='tadaa'?'Lo vende una boletera oficial: solicítalo y recibe un pase provisional.':'La venta aún no está abierta.',maxQty:maxQ,
  hasAddons:AD.length>0,addonsLabel:adCount?adCount+' agregado(s) · +'+H.money(addTotal):AD.length+' opciones de merch y combos',addonsCta:adCount?'Editar':'Ver',buy:B.act,buyDisabled:B.disabled,ctaLabel:B.label}}};
A.MAddons=C=>class extends C{constructor(p){super(p);this.slug=(p.params||[])[0]||TV.currentEvent;this.state={}}renderVals(){const M=eventModel(this.slug),c=cartFor(M.s.slug);const Z=zonesOf(M),sel=Z.find(z=>z.id===c.typeId)||Z[0];if(sel&&!c.typeId)c.typeId=sel.id;
 const AD=M.addons.filter(a=>a.available>0);const bgs={merch:'#B9C7FF',combo:'#D6FF35',food:'#FFB86B',experience:'#FFE9A8',parking:'#EEF1F7'};const icon='M4 11h16M5 11a7 7 0 0 1 14 0M4 15h16l-1 4H5z';
 const combos=AD.filter(a=>a.kind!=='merch').map(a=>{const qn=c.addons[a.id]||0,max=Math.min(a.max_per_order||4,a.available);return {id:a.id,name:a.title,desc:a.description||'',price:H.money(a.price_minor)+' c/u',q:qn,bg:bgs[a.kind]||'#D6FF35',icon,card:'display: flex; align-items: center; gap: 12px; background: #FFFFFF; border-radius: 22px; padding: 10px; '+(qn?'box-shadow: inset 0 0 0 2px #1238FF;':''),minus:()=>{c.addons[a.id]=Math.max(0,qn-1);this.setState({})},plus:()=>{c.addons[a.id]=Math.min(max,qn+1);this.setState({})}}});
 const merch=AD.filter(a=>a.kind==='merch').map(a=>{const on=(c.addons[a.id]||0)>0;return {id:a.id,name:a.title,price:H.money(a.price_minor),on,bg:bgs.merch,icon:'M8 21v-6M16 21v-6M6 15h12l-2-7H8z',mark:on?'✓ Agregado':'+ Agregar',toggle:()=>{c.addons[a.id]=on?0:1;this.setState({})},badge:'font-size: 11px; font-weight: 800; border-radius: 99px; padding: 4px 8px; '+(on?'background: #08091A; color: #D6FF35;':'background: #EEF1F7; color: #08091A;'),card:'flex: 1; display: flex; flex-direction: column; gap: 8px; background: #FFFFFF; border-radius: 22px; padding: 10px; font-family: inherit; color: #08091A; border: 0; '+(on?'box-shadow: inset 0 0 0 2px #1238FF;':'')}});
 const extras=AD.reduce((s,a)=>s+(c.addons[a.id]||0)*Number(a.price_minor),0);const tickets=(sel?.price||0)*c.qty;const B=buyState(M,sel,c);
 return {...globals(),combos,merch,hasCombos:combos.length>0,hasMerch:merch.length>0,extras:H.money(extras),ticketsTotal:H.money(tickets),total:H.money(tickets+extras),evTitle:M.s.title,evSub:c.qty+' × '+(sel?.name||'Boleto')+' · '+(M.e?.starts_at?H.short(M.e.starts_at):M.s.whenTxt),pay:B.act,payLabel:B.label}}};
A.MAsientos=C=>class extends C{constructor(p){super(p);this.slug=(p.params||[])[0]||TV.currentEvent;this.state={}}renderVals(){const M=eventModel(this.slug),c=cartFor(M.s.slug);const seats=M.seats;const palette=['#1238FF','#7FA0FF','#B9C7FF','#FFB86B','#FF8A3D'];
 const secs=[...new Set(seats.map(s=>s.section_name||'General'))];const colorOf=n=>palette[secs.indexOf(n)%palette.length];const rowsMap=new Map();seats.forEach(s=>{const k=s.row_label||'—';if(!rowsMap.has(k))rowsMap.set(k,[]);rowsMap.get(k).push(s)});
 const types=new Map(M.types.map(t=>[t.id,t]));
 const rows=[...rowsMap.entries()].map(([label,arr])=>({label,seats:arr.sort((a,b)=>String(a.seat_label).localeCompare(String(b.seat_label),undefined,{numeric:true})).map(s=>{const taken=s.status&&s.status!=='available',on=c.seats.includes(s.id);return {taken,on,aria:'Fila '+label+' asiento '+s.seat_label+(taken?' · ocupado':''),pick:()=>{if(taken)return;if(s.ticket_type_id&&c.typeId!==s.ticket_type_id){c.typeId=s.ticket_type_id;c.seats=[]}c.seats=on?c.seats.filter(x=>x!==s.id):c.seats.length>=8?c.seats:[...c.seats,s.id];this.setState({})},style:'aspect-ratio: 1; min-width: 0; padding: 0; border: 0; border-radius: 6px 6px 4px 4px; '+(on?'background: #D6FF35; box-shadow: inset 0 0 0 2px #08091A;':taken?'background: #E1E6F2;':'background: '+colorOf(s.section_name||'General')+';')}})}));
 const legend=secs.map(n=>{const t=M.types.find(x=>x.name===n)||{};return {label:n+(t.price_minor?' '+H.money(t.price_minor):''),color:colorOf(n)}}).concat([{label:'Tuyos',color:'#D6FF35'}]);
 const sel=seats.filter(s=>c.seats.includes(s.id));const price=sel.reduce((a,s)=>a+Number((types.get(s.ticket_type_id)||types.get(c.typeId)||{}).price_minor||0),0);
 return {...globals(),rows,legend,count:sel.length,picked:sel.length?sel.map(s=>'Fila '+s.row_label+' · '+s.seat_label).join(', '):'Toca un asiento',total:H.money(price),evTitle:M.s.title,evSub:M.ev.sub,promo:M.e?.membership_promo_enabled?'+'+(M.e.membership_promo_days||30)+' DÍAS DE MEMBRESÍA':'',
  pay:()=>sel.length?checkout(M.s.slug,{typeId:c.typeId,seats:c.seats,addons:c.addons}):TV.toast('Elige al menos un asiento'),payLabel:TV.user?'Pagar con Clip':'Entrar y pagar'}}};

/* ───── Wallet y pase ───── */
const K={final:['BOLETO FINAL · TADAA! TICKETS','background: #D6FF35; color: #08091A;'],prov:['PASE PROVISIONAL · NO ES ACCESO','background: transparent; color: #C7CDE6; border: 1.5px dashed #8C93B5;'],entrega:['EN ENTREGA · PROVEEDOR EXTERNO','background: #FFE9A8; color: #5A3D00;'],done:['UTILIZADO · GRACIAS POR IR','background: #3A3E66; color: #FFFFFF;']};
const kindOf=t=>t.status!=='valid'?'done':t.delivery_status==='provisional'?'prov':t.delivery_status==='delivering'?'entrega':'final';
function orders(){const g=new Map();for(const t of TV.tickets||[]){const k=t.order_id||t.id;if(!g.has(k))g.set(k,[]);g.get(k).push(t)}
 return [...g.values()].map(ts=>{const t=ts.find(x=>x.status==='valid')||ts[0];const e=bySlug(t.event_id)||{};const k=kindOf(t);const seat=t.seat_label?((t.section_name||'')+' '+(t.row_label||'')+' '+t.seat_label).trim():(t.ticket_type||'General')+' × '+ts.length;
  return {id:t.id,tickets:ts,t,k,img:e.img||IMG.matilda,title:t.title,meta:H.short(t.starts_at)+' · '+seat,date:H.when(t.starts_at),zone:seat,total:ts.length+(ts.length>1?' boletos':' boleto'),folio:H.folio(t.order_id),cur:k==='final'||k==='done'?4:k==='entrega'?2:1,venue:t.venue||'—',golden:ts.some(x=>x.golden),
   cta:k==='final'?'Mostrar QR de acceso':k==='prov'?'Ver detalle de mi solicitud':k==='entrega'?'Cómo recibir mis boletos':'Ver detalle'}}).sort((a,b)=>(a.k==='done')-(b.k==='done')||new Date(a.t.starts_at)-new Date(b.t.starts_at))}
const stepsFor=o=>[['Solicitud recibida',o.folio],[o.k==='prov'?'Confirmando con el productor':'Pagado con Clip',o.k==='prov'?'Te avisamos en menos de 8 h':o.total],['Entrega de boletos','Por correo o en taquilla, según el proveedor'],['Listo para entrar','Boleto final o boletos oficiales en mano']].map(([title,sub],i)=>{const done=i<o.cur,now=i===o.cur;return {title,sub,mark:done?'✓':String(i+1),color:done||now?'#08091A':'#8C93B5',dot:'width: 26px; height: 26px; flex: 0 0 26px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 800; '+(done?'background: #08091A; color: #D6FF35;':now?'background: #1238FF; color: #FFFFFF;':'background: #EEF1F7; color: #8C93B5;')}});
const qrSrc=id=>id?'/api/v2/tickets/'+id+'/qr?m='+Math.floor(Date.now()/60000):'';
A.DWallet=C=>class extends C{constructor(p){super(p);this.state={picked:null,now:Date.now()}}renderVals(){const O=orders();const chipBase='font-size: 10px; font-weight: 800; letter-spacing: .06em; padding: 5px 9px; border-radius: 99px; ';
 const base='width: 100%; display: flex; align-items: center; gap: 20px; padding: 12px 24px 12px 12px; border-radius: 28px; font-family: inherit; color: #FFFFFF; cursor: pointer; ';
 const picked=this.state.picked||O[0]?.id;const list2=O.map(o=>{const on=picked===o.id;return {...o,on,chip:K[o.k][0],chipStyle:chipBase+K[o.k][1],pick:()=>this.setState({picked:o.id}),style:base+(o.k==='prov'?'background: rgba(255,255,255,.03); border: 2px dashed '+(on?'#D6FF35':'#3A3E66')+';':'background: #161833; border: 2px solid '+(on?'#D6FF35':'#2A2D52')+';')}});
 const sel=list2.find(o=>o.on)||{k:'final',title:'Sin boletos todavía',chip:'',chipStyle:'',img:'img/tv/grain.png',date:'—',zone:'—',cta:'Explorar cartelera',folio:'',cur:0,t:{}};
 const sec=60-new Date(this.state.now).getSeconds(),deg=Math.round(sec/60*360);const isFinal=sel.k==='final'&&!!sel.t?.qrPayload;
 return {...globals(),orders:list2,sel,steps:sel.t?.id?stepsFor(sel):[],isFinal,notFinal:!isFinal,passStyle:'color: #08091A; border-radius: 28px; padding: 14px 12px 20px; '+(sel.k==='prov'?'background: #F4F6FC; outline: 2px dashed rgba(255,255,255,.75); outline-offset: 5px;':'background: #FFFFFF;'),
  cells:[],qrSrc:isFinal?qrSrc(sel.t.id):'',left:'0:'+String(sec).padStart(2,'0'),ring:'width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: conic-gradient(#1238FF '+deg+'deg, #E1E6F2 0);'}}
 afterPaint(root){const grid=root.querySelector('[aria-label*="QR"]');const v=this.renderVals();if(grid&&v.qrSrc&&!grid.querySelector('img')){grid.innerHTML='';const i=document.createElement('img');i.src=v.qrSrc;i.alt='QR dinámico';i.style.cssText='grid-column:1/-1;grid-row:1/-1;width:100%;height:100%;display:block';grid.appendChild(i)}
  if(!TV.tickets.length){const h=root.querySelector('h1');if(h&&!root.querySelector('.tv-empty')){const p=document.createElement('p');p.className='tv-empty';p.style.cssText='color:#AEB6D6;font-size:15px;margin:8px 0 0';p.innerHTML='Aún no tienes boletos. <a href="#explorar" data-tv-link="explorar" style="color:#D6FF35;font-weight:800">Explora la cartelera →</a>';h.after(p)}}}};
A.MWallet=C=>class extends C{constructor(p){super(p);this.state={f:'all'}}renderVals(){const O=orders();const f=this.state.f;const F=[['all','Todos'],['final','Finales'],['entrega','En entrega'],['prov','Provisionales']];
 const filters=F.map(([id,label])=>({label,on:f===id,pick:()=>this.setState({f:id}),style:'flex: 1; height: 40px; border: 0; border-radius: 99px; font: inherit; font-size: 11px; '+(f===id?'background: #D6FF35; color: #08091A; font-weight: 800;':'background: transparent; color: #D9E0FF; font-weight: 700;')}));
 const L=O.filter(o=>f==='all'||o.k===f);const front=L.find(o=>o.k==='final')||L[0];const rest=L.filter(o=>o!==front);
 const colors={final:['#D6FF35','#08091A'],prov:['#1238FF','#FFFFFF'],entrega:['#FFFFFF','#08091A'],done:['#161833','#FFFFFF']};const chipS={final:'background: #08091A; color: #D6FF35;',prov:'color: #FFFFFF; border: 1.5px dashed rgba(255,255,255,.7);',entrega:'background: #FFE9A8; color: #5A3D00;',done:'background: #3A3E66; color: #FFFFFF;'};
 const chipBase='font-size: 10px; font-weight: 800; letter-spacing: .06em; padding: 5px 9px; border-radius: 99px; ';
 const stack=rest.map((o,i)=>({...o,chip:K[o.k][0],chipStyle:chipBase+chipS[o.k],style:'position: absolute; left: 0; right: 0; top: '+(i*78)+'px; height: 190px; border-radius: 28px; display: block; padding: 18px 20px; background: '+colors[o.k][0]+'; color: '+colors[o.k][1]+';'+(o.k==='done'?' border: 1px solid #2A2D52;':'')}));
 const top=rest.length*78;const fr=front?[{...front,chip:K[front.k][0],chipStyle:chipBase+chipS[front.k],seat:front.t.seat_label?front.zone:(front.t.ticket_type||'General'),state:front.k==='final'?'Listo':front.k==='prov'?'Confirmando':front.k==='entrega'?'En entrega':'Usado',
  style:'position: absolute; left: 0; right: 0; top: '+top+'px; border-radius: 28px; background: '+colors[front.k][0]+'; color: '+colors[front.k][1]+'; overflow: hidden; display: block'}]:[];
 return {...globals(),countLabel:O.length+(O.length===1?' plan':' planes'),filters,stack,front:fr,empty:!L.length,stackStyle:'position: relative; margin: 22px 16px 0; height: '+(L.length?top+380:220)+'px'}}};
A.MPase=C=>class extends C{constructor(p){super(p);this.id=(p.params||[])[0];this.state={now:Date.now()}}renderVals(){const O=orders();const o=O.find(x=>x.tickets.some(t=>t.id===this.id))||O.find(x=>x.k==='final')||O[0];
 if(!o)return {...globals(),tabs:[],chip:'SIN BOLETOS',chipStyle:'',cardStyle:'position: relative; margin: 14px 20px 0; color: #08091A; border-radius: 32px; padding: 14px 12px 18px; background: #FFFFFF;',seat:'—',isFinal:false,notFinal:true,steps:[],note:'Aún no tienes boletos.',cta:'Explorar cartelera',ctaAction:()=>TV.go('explorar'),img:IMG.matilda,title:'Tu próximo plan',day:'—',hour:'—',qrSrc:'',left:''};
 const t=o.t,v=o.k==='done'?'final':o.k;const sec=60-new Date(this.state.now).getSeconds();const tabBase='flex: 1; height: 40px; border: 0; border-radius: 99px; font-family: inherit; font-weight: 800; font-size: 12px; ';
 const tabs=[['prov','Provisional'],['entrega','En entrega'],['final','Boleto final']].map(([id,label])=>({label,on:v===id,pick:()=>{},style:tabBase+(v===id?'background: #FFFFFF; color: #08091A;':'background: transparent; color: #8C93B5;')}));
 const chips={prov:['PASE PROVISIONAL · NO ES ACCESO','background: transparent; color: #4A5068; border: 1.5px dashed #8C93B5;'],entrega:['EN ENTREGA · PROVEEDOR EXTERNO','background: #FFE9A8; color: #5A3D00;'],final:[o.k==='done'?'BOLETO UTILIZADO':(t.golden&&t.golden_revealed_at?'GOLDEN TICKET · BOLETO FINAL':'BOLETO FINAL · TADAA! TICKETS'),o.k==='done'?'background: #3A3E66; color: #FFFFFF;':t.golden&&t.golden_revealed_at?'background: linear-gradient(100deg,#FFE9A3,#E2B23C); color: #2A1A00;':'background: #D6FF35; color: #08091A;']};
 const isFinal=v==='final'&&!!t.qrPayload;const notes={prov:'El pase provisional sirve para seguir tu solicitud. No da acceso al evento.',entrega:'Este evento lo vende un proveedor externo; sus boletos oficiales son tu acceso.',final:o.k==='done'?'Este boleto ya se utilizó. ¡Gracias por ir!':'QR firmado y de un solo uso. Cambia cada minuto para evitar copias.'};
 const unrevealed=o.tickets.find(x=>x.golden&&!x.golden_revealed_at);
 return {...globals(),tabs,chip:chips[v][0],chipStyle:'align-self: flex-start; font-size: 10px; font-weight: 800; letter-spacing: .06em; padding: 5px 9px; border-radius: 99px; '+chips[v][1],cardStyle:'position: relative; margin: 14px 20px 0; color: #08091A; border-radius: 32px; padding: 14px 12px 18px; '+(v==='prov'?'background: #F4F6FC; outline: 2px dashed rgba(255,255,255,.75); outline-offset: 5px;':'background: #FFFFFF;'),
  seat:t.seat_label?o.zone:(t.ticket_type||'General'),isFinal,notFinal:!isFinal,qrSrc:isFinal?qrSrc(t.id):'',left:'0:'+String(sec).padStart(2,'0'),ring:'width: 28px; height: 28px; border-radius: 50%; background: conic-gradient(#1238FF '+Math.round(sec/60*360)+'deg, #E1E6F2 0);',steps:stepsFor(o),note:notes[v],
  cta:unrevealed?'¡Abrir mi Golden Ticket!':isFinal?'Subir el brillo y mostrar':'Ver Mi Wallet',ctaAction:()=>unrevealed?TV.go('golden',[unrevealed.id]):isFinal?(document.documentElement.requestFullscreen?.().catch(()=>{}),TV.toast('Muestra este QR en la entrada')):TV.go('wallet'),
  img:o.img,title:t.title,day:H.short(t.starts_at),hour:H.hour(t.starts_at)}}
 componentDidMount(){this.t=setInterval(()=>{const prev=Math.floor(this.state.now/60000);this.setState({now:Date.now()});if(Math.floor(Date.now()/60000)!==prev)TV.loadTickets().then(()=>this.setState({}))},1000)}componentWillUnmount(){clearInterval(this.t)}};

/* ───── Golden ───── */
function goldenModel(id){const t=(TV.tickets||[]).find(x=>x.id===id)||(TV.tickets||[]).find(x=>x.golden&&!x.golden_revealed_at)||(TV.tickets||[]).find(x=>x.golden);if(!t)return null;const b=t.golden_benefit||{};const e=bySlug(t.event_id)||{};
 return {t,g:{id:t.id,img:e.img||IMG.matilda,event:String(t.title).split(' · ')[0],odds:100,when:H.when(t.starts_at),access:b.title||'Beneficio Golden',title:b.title||'Beneficio Golden',detail:b.detail||'Te contactaremos para coordinarlo antes del evento.',folio:H.folio(t.order_id),original:!!e.original}}}
async function reveal(t){if(t&&!t.golden_revealed_at){try{await TV.api.call('/api/v2/tickets/'+t.id+'/reveal','POST',{});t.golden_revealed_at=new Date().toISOString()}catch{}}}
A.MGolden=C=>class extends C{constructor(p){super(p);this.id=(p.params||[])[0];this.state={phase:'reveal',now:Date.now()}}renderVals(){const G=goldenModel(this.id);const sec=60-new Date(this.state.now).getSeconds();
 if(!G)return {...globals(),isReveal:false,isDetail:true,g:{img:IMG.inferno,event:'Sin Golden Ticket aún',odds:100,when:'',access:'—',title:'Aún no te sale un Golden',detail:'1 de cada 100 boletos de eventos con Golden activo se vuelve dorado al emitirse. ¡Suerte en tu próxima compra!',folio:'',original:false},qrSrc:'',left:'',toDetail:()=>{},replay:()=>{}};
 return {...globals(),isReveal:this.state.phase==='reveal',isDetail:this.state.phase==='detail',g:G.g,qrSrc:G.t.qrPayload?qrSrc(G.t.id):'',left:'0:'+String(sec).padStart(2,'0'),toDetail:()=>{reveal(G.t);this.setState({phase:'detail'})},replay:()=>this.setState({phase:'reveal'})}}
 componentDidMount(){this.t=setInterval(()=>this.setState({now:Date.now()}),1000)}componentWillUnmount(){clearInterval(this.t)}};
A.DGolden=C=>class extends C{constructor(p){super(p);this.id=(p.params||[])[0]}renderVals(){const G=goldenModel(this.id);if(G)reveal(G.t);return {...globals(),g:G?G.g:{img:IMG.inferno,event:'TADAA!',odds:100,when:'',access:'—',title:'Aún no te sale un Golden',detail:'1 de cada 100 boletos de eventos con Golden activo se vuelve dorado. ¡Suerte en tu próxima compra!',original:false}}}};

/* ───── Now! ───── */
function nowModel(){const L=(TV.now||[]).slice().sort((a,b)=>(a.state==='open'?0:1)-(b.state==='open'?0:1)||new Date(a.opens_at)-new Date(b.opens_at));const c=L[0];
 const m=x=>{const e=bySlug(x.slug||x.event_id)||{};return {...x,img:x.hero_url||x.poster_url||e.img||IMG.nocturno,price:H.money(x.price_minor),regular:H.money(x.regular_price_minor),when:H.when(x.starts_at)+(x.venue?' · '+x.venue:''),opensAt:H.when(x.opens_at),quota:x.quota,signups:x.signups,maxPerUser:x.max_per_user,kicker:x.state==='open'?'NOW! ABIERTO':'PRÓXIMO NOW!',slug:x.slug}};
 return {c:c?m(c):null,rest:L.slice(1).map(m)}}
async function nowSignup(c,on){if(!TV.user)return TV.requireLogin('index.html#now');try{await TV.api.call('/api/v2/now/'+c.id+'/signup',on?'POST':'DELETE');await TV.loadNow();TV.toast(on?'¡Listo! Te avisamos cuando abra Now!':'Inscripción cancelada','ok');TV.rerender()}catch(e){TV.toast(e.message,'err')}}
const pad=n=>String(n).padStart(2,'0');const clock=ms=>{const s=Math.max(0,Math.floor(ms/1000));return pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60)};
A.MRush=C=>class extends C{constructor(p){super(p);this.state={qty:1,now:Date.now()}}renderVals(){const N=nowModel(),c=N.c;const qty=this.state.qty;
 const optBase='position: relative; flex: 1; min-height: 124px; border-radius: 22px; padding: 18px 14px 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; font-family: inherit; color: #FFFFFF; ';
 const maxU=c?.max_per_user||2;const opts=[[1,'Un boleto para ir por tu cuenta'],[2,'Dos boletos para ir acompañado']].filter(([n])=>n<=maxU).map(([n,text])=>{const on=qty===n;return {n,text,on,pick:()=>this.setState({qty:n}),style:optBase+(on?'background: linear-gradient(160deg, rgba(255,61,139,.22), rgba(255,138,61,.12)); border: 2px solid #FF6A5C;':'background: rgba(255,255,255,.04); border: 2px solid rgba(255,255,255,.12);'),check:'position: absolute; right: 12px; top: 12px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 800; '+(on?'background: linear-gradient(100deg, #FF3D8B, #FF8A3D); color: #0B0A1C;':'background: transparent; color: transparent; border: 1.5px solid rgba(255,255,255,.3);')}});
 const base='position: relative; overflow: hidden; height: 60px; border-radius: 99px; border: 0; font-family: inherit; font-weight: 800; font-size: 15px; ';
 if(!c)return {...globals(),c:{img:IMG.nocturno,title:'Sin Now! por ahora',when:'Te avisaremos cuando abra el próximo',price:'—',regular:'',opensAt:'',quota:0,signups:0},isEnroll:false,isWait:false,isOpen:false,opts:[],qty,clock:'',left:0,sold:0,bar:'',cta:'Ver cartelera',ctaStyle:base+'background: #D6FF35; color: #0B0A1C;',fine:'Now! abre horas antes de algunas funciones, solo para inscritos.',next:()=>TV.go('explorar')};
 const phase=c.state==='open'?'open':c.signed?'wait':'enroll';const sold=c.quota?Math.round((1-(c.remaining??c.quota)/c.quota)*100):0;
 const map={enroll:['Inscribirme a Now! · gratis',base+'background: linear-gradient(100deg, #FF3D8B, #FF8A3D); color: #0B0A1C;','Inscribirte no garantiza boleto.',()=>nowSignup(c,true)],
  wait:['✓ Inscrito · cancelar',base+'background: rgba(255,255,255,.12); color: #FFFFFF;','Te avisamos cuando abra. Puedes cancelar cuando quieras.',()=>nowSignup(c,false)],
  open:[c.signed===false?'El registro cerró':'Comprar '+qty+' por '+H.money(c.price_minor*qty),base+'background: #D6FF35; color: #0B0A1C;','Boleto final con QR dinámico en tu Wallet.',()=>c.signed===false?TV.toast('Now! es solo para quienes se inscribieron antes de abrir'):checkout(c.slug||c.event_id,{typeId:c.ticket_type_id,qty})]};
 const [cta,ctaStyle,fine,next]=map[phase];
 return {...globals(),c,isEnroll:phase==='enroll',isWait:phase==='wait',isOpen:phase==='open',opts,qty,clock:clock(new Date(c.opens_at)-this.state.now),left:c.remaining??c.quota,sold,bar:'display: block; height: 100%; width: '+sold+'%; background: #0B0A1C; border-radius: 99px;',cta,ctaStyle,fine,next}}
 componentDidMount(){this.t=setInterval(()=>{this.setState({now:Date.now()});const c=nowModel().c;if(c&&c.state!=='open'&&new Date(c.opens_at)<=Date.now()&&!this._r){this._r=true;TV.loadNow().then(()=>{this._r=false;this.setState({})})}},1000)}componentWillUnmount(){clearInterval(this.t)}};
A.DRush=C=>class extends C{constructor(p){super(p);this.state={now:Date.now()}}renderVals(){const N=nowModel(),c=N.c;const base='height: 60px; padding: 0 28px; border-radius: 99px; border: 0; font-family: inherit; font-weight: 800; font-size: 15px; cursor: pointer; ';
 const next=N.rest.concat(c?[]:[]).map(e=>({...e,opens:e.state==='open'?'¡Abierto ahora!':'Abre '+H.when(e.opens_at),label:e.signed?'✓ Inscrito':e.state==='open'?'Comprar':'Inscribirme',pick:()=>e.state==='open'?TV.go('now'):nowSignup(e,!e.signed),btn:'height: 44px; padding: 0 16px; border-radius: 99px; font-family: inherit; font-weight: 800; font-size: 13px; white-space: nowrap; cursor: pointer; '+(e.signed?'border: 1px solid #D6FF35; background: transparent; color: #D6FF35;':'border: 0; background: linear-gradient(100deg, #FF3D8B, #FF8A3D); color: #0B0A1C;')}));
 if(!c)return {...globals(),hasC:false,noC:true,c:{},next,clock:'',status:'',cta:'',ctaStyle:'',toggle:()=>{}};
 const open=c.state==='open';
 return {...globals(),hasC:true,noC:false,c,next,clock:open?'¡ABIERTO!':clock(new Date(c.opens_at)-this.state.now),status:open?(c.signed?'¡Ya abrió! Quedan '+c.remaining+' de '+c.quota:'El registro cerró al abrir la venta'):c.signed?'Estás inscrito · abre en':'La venta para inscritos abre en',
  cta:open?(c.signed?'Comprar ahora':'Registro cerrado'):c.signed?'✓ Inscrito · cancelar':'Inscribirme gratis',ctaStyle:base+(open||!c.signed?'background: linear-gradient(100deg, #FF3D8B, #FF8A3D); color: #0B0A1C;':'background: transparent; color: #D6FF35; border: 1px solid #D6FF35;'),
  toggle:()=>open?(c.signed?checkout(c.slug||c.event_id,{typeId:c.ticket_type_id,qty:1}):TV.toast('Now! es solo para inscritos')):nowSignup(c,!c.signed)}}
 componentDidMount(){this.t=setInterval(()=>this.setState({now:Date.now()}),1000)}componentWillUnmount(){clearInterval(this.t)}
 afterPaint(root){root.querySelectorAll('[data-tv-slug]').forEach(a=>{const s=a.getAttribute('data-tv-slug');if(s){a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();TV.go('evento',[s])},{once:true})}})}};

/* ───── Cuenta ───── */
const BADGE_ICONS={primer_plan:'M5 4h14v6a7 7 0 0 1-14 0zM9 21h6M12 17v4',habitual:'M12 2v4M4.9 4.9l2.8 2.8M2 12h4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',golden:'M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z',now:'M13 2 4 14h7l-1 8 9-12h-7z',socio:'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z',explorador:'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z'};
const ALL_BADGES=[['primer_plan','Primer plan','#D6FF35','Tu primer plan'],['habitual','Siempre llega','#FF8A3D','3 asistencias'],['explorador','Explorador','#B9C7FF','3 categorías'],['socio','Socio fiel','#FFE9A8','3 meses de membresía'],['now','Reflejos Now!','#FF3D8B','Gana un Now!'],['golden','Golden','#E9B949','Recibe un Golden']];
const LEVELS=[[0,'Curioso','Tarifas de convenio y Now!'],[300,'Fan','Badges · acceso a Golden'],[900,'Habitual','Now! anticipado · más oportunidades Golden'],[2000,'Leyenda','Preestrenos · atención prioritaria'],[4000,'Ícono TADAA!','Experiencias exclusivas']];
function acct(){const a=TV.account||{};const l=a.level||{xp:0,level:1,name:'Curioso',nextAt:300,progress:0};const owned=new Set((a.badges||[]).map(b=>b.key));const u=TV.user||{};
 const badges=ALL_BADGES.map(([key,name,bg,how])=>{const on=owned.has(key);return {name,how,icon:BADGE_ICONS[key],ink:on?'#08091A':'#AEB6D6',label:on?'#FFFFFF':'#8C93B5',shape:'width: 76px; height: 84px; display: grid; place-items: center; background: '+(on?bg:'#3A3E66')+'; border-radius: 22px 22px 38px 38px; '+(on?'box-shadow: 0 0 0 3px #08091A, 0 0 0 5px '+bg+';':'opacity: .55;')}});
 return {a,l,u,badges,owned,next:LEVELS[l.level]||null,plans:a.stats?.tickets||0}}
A.MCuenta=C=>class extends C{constructor(p){super(p);this.state={open:0}}renderVals(){const X=acct();const nx=X.next;
 const bgs=[['linear-gradient(110deg, #1238FF, #5B3CFF)','#FFFFFF'],['linear-gradient(110deg, #D6FF35, #9BE15D)','#08091A']];const tiers=LEVELS.slice(X.l.level,X.l.level+2).map((t,i)=>{const open=this.state.open===i;return {name:t[1],sub:i===0?(t[0]-X.l.xp)+' XP para desbloquearlo':'Desde '+t[0]+' XP',open,sign:open?'−':'+',toggle:()=>this.setState({open:open?-1:i}),perks:t[2].split(' · ').map(text=>({text})),head:'width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border: 0; font-family: inherit; text-align: left; background: '+bgs[i][0]+'; color: '+bgs[i][1]+';'}});
 return {...globals(),ini:H.ini(X.u),name:X.u.full_name||X.u.email||'Tu cuenta',level:X.l.name,nextLine:nx?((nx[0]-X.l.xp)+' XP para subir a '+nx[1]):'Nivel máximo',plans:X.plans,xp:X.l.xp,golden:X.a.stats?.golden||0,badgeCount:X.owned.size+' / '+ALL_BADGES.length,badges:X.badges,tiers,access:X.a.rfc?'RFC '+X.a.rfc:'Completa tu RFC en escritorio'}}};
A.DCuenta=C=>class extends C{constructor(p){super(p);this.state={rfc:null}}renderVals(){const X=acct();const nx=X.next;
 const levels=LEVELS.slice(0,4).map((t,i)=>{const s=i+1<X.l.level?'done':i+1===X.l.level?'now':'next';return {req:t[0]+' XP',name:t[1],perks:t[2],tag:s==='done'?'Superado':s==='now'?'Tu nivel':'Bloqueado',
  card:'display: flex; flex-direction: column; gap: 6px; border-radius: 24px; padding: 18px; '+(s==='now'?'background: #1238FF; color: #FFFFFF;':s==='done'?'background: #EEF1F7; color: #08091A;':'background: #FFFFFF; color: #08091A; border: 2px dashed #D5DBEA;'),
  tagStyle:'align-self: flex-start; margin-top: 6px; border-radius: 99px; padding: 4px 10px; font-size: 11px; font-weight: 800; '+(s==='now'?'background: #D6FF35; color: #08091A;':s==='done'?'background: #08091A; color: #FFFFFF;':'background: #EEF1F7; color: #4A5068;')}});
 const offer=(X.a.offers||[])[0];const rfc=this.state.rfc??X.a.rfc??'';
 return {...globals(),ini:H.ini(X.u),name:X.u.full_name||X.u.email||'Tu cuenta',levelLine:'Nivel '+X.l.name+(nx?' · '+(nx[0]-X.l.xp)+' XP para '+nx[1]:''),memberLine:X.u.email||'',plans:X.plans,xp:X.l.xp,golden:X.a.stats?.golden||0,badgeCount:X.owned.size+' / '+ALL_BADGES.length,badges:X.badges,levels,
  accessTag:offer?'OFERTA':'ACTIVO',accessKind:offer?'Un pajarito nos contó…':'Tu acceso',accessName:offer?offer.discount_pct+'% en tu membresía':'Convenio o membresía',accessSub:offer?(offer.months_total-offer.months_used)+' meses con descuento':'Consulta tu estado en Membresía',
  email:X.u.email||'',phone:X.u.phone||'—',rfc,rfcTag:X.a.rfc&&rfc===X.a.rfc?'✓ Verificado':'Guardar',rfcInput:e=>{this.state.rfc=e.target.value.toUpperCase()},
  saveRfc:async()=>{try{const r=await TV.api.call('/api/v2/me/rfc','PUT',{rfc:this.state.rfc??rfc});await TV.loadAccount();this.state.rfc=null;TV.toast(r.linkedAgreements?'RFC guardado y convenio vinculado':'RFC guardado','ok');this.setState({})}catch(err){TV.toast(err.message,'err')}}}}};
A.MBaja=C=>class extends C{renderVals(){const a=TV.account||{};const o=(a.offers||[])[0]||{discount_pct:50,months_total:3,months_used:0};
 return {...globals(),b:{company:'tu empresa',badges:(a.badges||[]).length,level:a.level?.name||'Curioso',pct:o.discount_pct,months:o.months_total-o.months_used,price:H.money(Math.round(10000*(100-o.discount_pct)/100))},keep:()=>{location.href='app.html#/membresia'}}}};
A.helpers=H;A.samples=SAMPLES;
})();
