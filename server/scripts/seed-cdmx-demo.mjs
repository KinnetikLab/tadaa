import { getPool, closePool } from '../src/db.mjs';

const batch = 'cdmx-demo-2026-11-19';
const sourceTicketmaster = 'https://www.ticketmaster.com.mx/browse/musicales-catid-207/teatro-y-culturales-rid-10002/ciudad-de-m-xico-y-rea-metropolitana-dma-802?page=1';
const govtGuide = 'https://mexicocity.cdmx.gob.mx/wp-content/uploads/2026/11/Guia-Noviembre-2026-Memoria-del-Corazon-v.11_compressed.pdf';
const cartelera = 'https://carteleradeteatro.mx/contenidos/estrenos-y-reestrenos-de-noviembre-2026/';

const items = [
  {title:'El Rey León',slug:'cdmx-demo-el-rey-leon',category:'Musical',venue:'Teatro Telcel',starts:'2026-11-19T20:00:00-06:00',schedule:'Jueves 19 de noviembre de 2026 · 20:00 h (función listada)',description:'El musical familiar de gran formato basado en la historia de Simba. Consulta la ficha oficial para confirmar horarios, disponibilidad, precios y condiciones de acceso.',source:sourceTicketmaster,picks:true,art:'el-rey-leon',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Buena Vista Social Club, El Musical',slug:'cdmx-demo-buena-vista-social-club',category:'Musical',venue:'Teatro de los Insurgentes',starts:'2026-11-19T20:00:00-06:00',schedule:'Jueves 19 de noviembre de 2026 · 20:00 h (función listada)',description:'Musical inspirado en la música cubana, la amistad y las historias que atraviesan generaciones. Consulta la boletera para confirmar disponibilidad y detalles.',source:sourceTicketmaster,picks:true,art:'buena-vista',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Mentidrags',slug:'cdmx-demo-mentidrags',category:'Musical',venue:'Teatro Aldama',starts:'2026-11-19T20:00:00-06:00',schedule:'Jueves 19 de noviembre de 2026 · 20:00 h (función listada)',description:'Espectáculo musical listado en la cartelera de CDMX. Consulta la ficha oficial para conocer reparto, duración, restricciones y disponibilidad.',source:sourceTicketmaster,picks:false,art:'mentidrags',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Toc Toc',slug:'cdmx-demo-toc-toc',category:'Comedia',venue:'Teatro Royal Pedregal',starts:'2026-11-19T20:00:00-06:00',schedule:'Jueves 19 de noviembre de 2026 · 20:00 h (función listada)',description:'Comedia teatral de conjunto. La cartelera registra una función en CDMX; confirma la fecha seleccionada y disponibilidad con la boletera.',source:'https://www.ticketmaster.com.mx/browse/todos-los-eventos-teatro-y-culturales-catid-10002/teatro-y-culturales-rid-10002/m-xico-dma-596?page=28',picks:true,art:'toc-toc',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Matilda, El Musical',slug:'cdmx-demo-matilda',category:'Musical',venue:'Centro Cultural Teatro I',starts:'2026-11-20T19:30:00-06:00',schedule:'Viernes 20 de noviembre de 2026 · 19:30 h (función listada)',description:'Musical familiar basado en la historia de una niña con imaginación extraordinaria. Confirma horarios, precios y disponibilidad en la boletera oficial.',source:sourceTicketmaster,picks:true,art:'matilda',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Mentiras, El Musical',slug:'cdmx-demo-mentiras-el-musical',category:'Musical',venue:'Teatro Aldama',starts:'2026-11-20T20:00:00-06:00',schedule:'Viernes 20 de noviembre de 2026 · 20:00 h (función listada)',description:'Musical con canciones emblemáticas del pop en español de los años ochenta. Revisa la ficha oficial para confirmar funciones y condiciones.',source:sourceTicketmaster,picks:false,art:'mentiras',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Urinetown, el musical',slug:'cdmx-demo-urinetown',category:'Musical',venue:'Teatro Milán',starts:'2026-11-20T20:00:00-06:00',schedule:'Viernes 20 de noviembre de 2026 · 20:00 h (función listada)',description:'Musical satírico incluido en la cartelera de CDMX. Consulta la fuente oficial antes de planear tu visita.',source:sourceTicketmaster,picks:false,art:'urinetown',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Nocturno',slug:'cdmx-demo-nocturno',category:'Teatro',venue:'Centro Cultural Teatro II',starts:'2026-11-20T20:00:00-06:00',schedule:'Viernes 20 de noviembre de 2026 · 20:00 h (función listada)',description:'Producción escénica registrada en la cartelera de CDMX. Confirma detalles y disponibilidad en la fuente oficial.',source:sourceTicketmaster,picks:false,art:'nocturno',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'La Dama de Negro',slug:'cdmx-demo-la-dama-de-negro',category:'Terror',venue:'Teatro 11 de Julio',starts:null,schedule:'Funciones reportadas viernes a domingo durante noviembre de 2026; confirmar horario de cada fecha.',description:'Montaje de terror y suspenso incluido en la cartelera turística de CDMX para noviembre. La ficha no reserva lugares: consulta la programación y boletera para elegir función.',source:govtGuide,picks:true,art:'dama-negro',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'El hijo',slug:'cdmx-demo-el-hijo',category:'Drama',venue:'La Teatrería',starts:null,schedule:'Funciones reportadas viernes a domingo durante noviembre de 2026; confirmar horario de cada fecha.',description:'Puesta en escena de drama incluida en la cartelera y los estrenos de noviembre. Consulta el recinto o la boletera para confirmar funciones vigentes.',source:cartelera,picks:false,art:'el-hijo',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'La muerte de un viajante',slug:'cdmx-demo-muerte-viajante',category:'Drama',venue:'Teatro Rafael Solana',starts:null,schedule:'Funciones reportadas viernes a domingo durante noviembre de 2026; confirmar horario de cada fecha.',description:'Drama de Arthur Miller registrado en la cartelera turística de CDMX. Fechas y horarios específicos deben confirmarse en la boletera.',source:govtGuide,picks:false,art:'viajante',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Puras cosas maravillosas',slug:'cdmx-demo-puras-cosas-maravillosas',category:'Teatro',venue:'Foro Lucerna',starts:null,schedule:'Jueves de noviembre de 2026; confirmar hora y funciones restantes.',description:'Obra listada en la cartelera turística de noviembre de la Ciudad de México. Confirma la función específica con el recinto.',source:govtGuide,picks:false,art:'cosas-maravillosas',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Nacahue: Ramón y Hortensia. A partir de Romeo y Julieta',slug:'cdmx-demo-nacahue',category:'Teatro',venue:'Teatro Benito Juárez',starts:null,schedule:'Jueves a domingos durante noviembre de 2026; confirmar horario de cada función.',description:'Puesta en escena incluida en la guía turística oficial de CDMX para noviembre de 2026. Consulta el recinto para confirmar programación.',source:govtGuide,picks:false,art:'nacahue',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Yo soy mi propia esposa',slug:'cdmx-demo-yo-soy-mi-propia-esposa',category:'Monólogo',venue:'Foro Lucerna',starts:'2026-11-20T20:30:00-06:00',schedule:'Temporada del 6 de noviembre al 20 de diciembre; viernes 20:30 h, sábados 20:00 h y domingos 17:30 h.',description:'Monólogo dirigido por Miguel Septién, basado en la vida de Charlotte von Mahlsdorf. La ficha y programación se contrastan con la cartelera y la boletera; TADAA! no representa a la producción.',source:'https://www.ticketmaster.com.mx/yo-soy-mi-propia-esposa-boletos/artist/4703646',picks:true,art:'esposa',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Agosto. Condado de Osage',slug:'cdmx-demo-agosto-condado-osage',category:'Drama',venue:'Centro Cultural Helénico - Foro La Gruta',starts:'2026-11-28T17:00:00-06:00',schedule:'Temporada del 28 de noviembre al 13 de diciembre. Jue/vie 19:00 h; sáb/dom 18:00 h. Excepciones: 28 nov 17:00 h y 29 nov 16:00 h.',description:'Tragicomedia familiar de Tracy Letts, traducida y dirigida por Diego del Río. Producción de 25 Producción y Bauter & Partners. La ficha no implica alianza con la compañía.',source:'https://helenico.gob.mx/cartelera/detalle/340871/agosto-condado-de-osage',picks:true,art:'agosto',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Lágrimas de agua dulce',slug:'cdmx-demo-lagrimas-agua-dulce',category:'Familiar',venue:'Centro Cultural Helénico',starts:'2026-11-21T13:00:00-06:00',schedule:'Temporada del 7 de noviembre al 13 de diciembre de 2026; sábados y domingos 13:00 h en Foro La Gruta.',description:'Obra para niñas y niños de Jaime Chabaud, dirigida por Gabriela Núñez y presentada por la compañía Chac Bolay. Consulta el recinto para confirmar las funciones restantes.',source:'https://helenico.gob.mx/cartelera/detalle/340628/lagrimas-de-agua-dulce',picks:false,art:'lagrimas',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Las dos Cassandras',slug:'cdmx-demo-las-dos-cassandras',category:'Drama',venue:'Centro Cultural Helénico - Foro La Gruta',starts:'2026-11-23T20:00:00-06:00',schedule:'Temporada del 16 de noviembre al 15 de diciembre de 2026; funciones lunes y martes (confirmar horario de cada fecha).'
,description:'Reestreno teatral incluido en la cartelera oficial del Centro Cultural Helénico. Consulta la ficha del recinto para confirmar funciones y disponibilidad.',source:'https://helenico.gob.mx/cartelera',picks:false,art:'cassandras',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'},
  {title:'Algodón de azúcar',slug:'cdmx-demo-algodon-de-azucar',category:'Teatro',venue:'Centro Cultural Helénico - Teatro Helénico',starts:'2026-11-23T20:00:00-06:00',schedule:'Temporada del 9 de noviembre al 16 de diciembre de 2026; funciones lunes a miércoles (confirmar horario de cada fecha).',description:'Puesta en escena de la compañía Conejillos de Indias, incluida en la cartelera del Centro Cultural Helénico. Confirma las funciones en el sitio del recinto.',source:'https://helenico.gob.mx/',picks:true,art:'algodon',credit:'Arte editorial original de TADAA!; no es el cartel oficial de la producción.'}
];

const pool=getPool();
if(!pool) throw new Error('DATABASE_URL no configurada');
const client=await pool.connect();
let inserted=0,updatedExtras=0;
try {
 await client.query('BEGIN');
 for (const item of items) {
   let venueId=null;
   if(item.venue!=='Por confirmar'){
     const found=await client.query('SELECT id FROM venues WHERE name=$1 ORDER BY created_at LIMIT 1',[item.venue]);
     if(found.rowCount) venueId=found.rows[0].id;
     else {
       const v=await client.query(`INSERT INTO venues(name,address) VALUES($1,$2::jsonb) RETURNING id`,
         [item.venue,JSON.stringify({city:'Ciudad de México',state:'CDMX',country:'México'})]);
       venueId=v.rows[0].id;
     }
   }
   const metadata={
     category:item.category,
     schedule_label:item.schedule,
     source_url:item.source,
     external_ticketing_url:item.source,
     seed_batch:batch,
     is_demo_content:true,
     editorial_art:true,
     visual_label:'Arte editorial TADAA! · no oficial',
     image_rights_status:'original_tadaa_art',
     commercial_status:'informational_only',
     price_status:'not_verified',
     availability_status:'not_connected',
     producer_relationship:'not_affiliated',
     verified_at:'2026-11-19'
   };
   const insertedEvent=await client.query(`
     INSERT INTO events(title,slug,description,status,starts_at,currency,venue_id,metadata)
     VALUES($1,$2,$3,'published',$4,'MXN',$5,$6::jsonb)
     ON CONFLICT(slug) DO NOTHING RETURNING id`,
     [item.title,item.slug,item.description,item.starts,venueId,JSON.stringify(metadata)]);
   const event=insertedEvent.rowCount
     ? insertedEvent.rows[0]
     : (await client.query('SELECT id FROM events WHERE slug=$1',[item.slug])).rows[0];
   if(!event) throw new Error('No se pudo recuperar el evento '+item.slug);
   if(insertedEvent.rowCount) inserted++;
   const poster=`/experience/img/catalogo/${item.art}.svg`;
   const hero=`/experience/img/catalogo/${item.art}-hero.svg`;
   await client.query(`
     INSERT INTO event_extras(event_id,poster_url,hero_url,ticket_url,picks,credits,instructions,maps_url)
     VALUES($1,$2,$3,$4,$5,'[]'::jsonb,$6::jsonb,$7)
     ON CONFLICT(event_id) DO UPDATE SET
       poster_url=EXCLUDED.poster_url,hero_url=EXCLUDED.hero_url,
       ticket_url=EXCLUDED.ticket_url,picks=EXCLUDED.picks,
       instructions=EXCLUDED.instructions,maps_url=EXCLUDED.maps_url`,
     [event.id,poster,hero,item.source,item.picks,
      JSON.stringify(['Consulta la fuente oficial para confirmar fecha, horario, precio y disponibilidad.','Esta ficha es informativa; TADAA! todavía no vende ni emite boletos para esta producción.']),
      item.venue==='Por confirmar'?'':`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.venue+', Ciudad de México, México')}`]);
   updatedExtras++;
 }
 const presentations=[
  {slug:'general-cdmx-demo',title:'TADAA! × Tu organización',subtitle:'Una alianza para acercar experiencias, cultura y beneficios a más personas.',slides:[
   {title:'Una ciudad llena de planes',text:'TADAA! reúne experiencias, teatro, conciertos y actividades en una plataforma de descubrimiento.'},
   {title:'Una nueva forma de conectar',text:'Un espacio digital para que las comunidades encuentren planes relevantes y beneficios claros.'},
   {title:'Convenios para comunidades',text:'Las organizaciones pueden ofrecer acceso a beneficios mediante un convenio y un padrón de colaboradores autorizado.'},
   {title:'Experiencias para colaboradores',text:'Cada persona puede descubrir eventos, guardar intereses y consultar información desde web y móvil.'},
   {title:'Control y transparencia',text:'El portal empresarial permite gestionar altas y bajas del padrón con revisión previa, confirmación e historial.'},
   {title:'Campañas y experiencias',text:'Podemos diseñar activaciones, temporadas temáticas y experiencias especiales según los objetivos del aliado.'},
   {title:'Cómo comenzamos',text:'Conocemos a tu equipo, definimos el alcance del convenio, validamos el padrón y preparamos el lanzamiento.'},
   {title:'Construyamos la alianza',text:'Solicita una conversación o envía tu inscripción. El equipo TADAA! revisará la propuesta y confirmará los siguientes pasos.'}
  ]},
  {
  "slug": "productores-teatro-demo",
  "title": "TADAA!",
  "subtitle": "Una nueva plataforma de comercialización de experiencias.",
  "slides": [
    {
      "title": "Una nueva oportunidad para el entretenimiento",
      "text": "Tu próximo público podría estar más cerca de lo que imaginas.\nEl mercado del entretenimiento está evolucionando. Los consumidores buscan mejores oportunidades para acceder a experiencias, mientras que productores y recintos necesitan nuevas formas de conectar con sus audiencias y comercializar su inventario.\nTadaa! nace para conectar ambas necesidades.\nNo buscamos sustituir tus canales de venta actuales. Queremos convertirnos en un canal complementario que genere nuevas oportunidades comerciales.\nUn nuevo punto de contacto entre tus eventos y sus próximos asistentes.\n# Nuestro mercado inicial\n* 9.17 millones | habitantes en Ciudad de México.\n* 4.90 millones | personas ocupadas.\n* 54.3% | de empleo formal estimado entre la población ocupada.\n* $2,505 MXN | de gasto mensual promedio por hogar en una categoría que incluye educación y esparcimiento.\n~ Fuentes: INEGI, ENOE 4T 2025 y ENIGH 2024; AMAI, NSE 2026. Los indicadores corresponden a universos diferentes y no representan un cruce de compradores individuales."
    },
    {
      "title": "¿Qué es Tadaa!?",
      "text": "Una plataforma. Múltiples formas de comercializar experiencias.\nTadaa! es una plataforma digital que conecta a consumidores con espectáculos, eventos y experiencias mediante condiciones preferenciales, campañas especiales y beneficios exclusivos.\nNuestro modelo combina tres elementos:\n* Distribución | acceso a comunidades corporativas y consumidores individuales.\n* Comercialización | inventario asignado y condiciones acordadas con cada productor.\n* Experiencias | herramientas que agregan valor antes, durante y después de la compra.\n! No somos solamente otro punto de venta. Somos un aliado comercial que ayuda a extender el alcance de cada producción."
    },
    {
      "title": "Nuestra ventaja: una red de distribución diferente",
      "text": "No esperamos a que el consumidor nos encuentre. Llegamos hasta él.\nNuestro principal diferenciador es una red de convenios con empresas e instituciones públicas y privadas.\nA través de estos acuerdos, Tadaa! puede acercar beneficios de entretenimiento directamente a comunidades de colaboradores mediante campañas de comunicación interna.\n# ¿Cómo funciona?\n* 01 · Convenios corporativos | empresas e instituciones incorporan Tadaa! como beneficio para sus colaboradores.\n* 02 · Comunicación directa | activamos campañas y promociones a través de sus canales internos.\n* 03 · Acceso a experiencias | los colaboradores descubren y adquieren boletos desde nuestra plataforma.\n* 04 · Nuevas audiencias | los productores acceden a comunidades que pueden no estar alcanzando mediante sus canales habituales.\n! Una red de distribución que convierte los beneficios corporativos en oportunidades de comercialización."
    },
    {
      "title": "Una comunidad abierta",
      "text": "El entretenimiento también está al alcance de todos.\nAdemás de nuestra red corporativa, cualquier persona puede acceder a Tadaa! mediante una membresía individual.\n* $50 MXN al mes | Membresía Tadaa!\nAcceso a oportunidades, tarifas preferenciales y beneficios disponibles dentro de la plataforma.\n! Así construimos dos vías de adquisición: comunidades corporativas y consumidores individuales."
    },
    {
      "title": "Así trabajamos contigo",
      "text": "Una alianza comercial diseñada alrededor de cada producción.\nCada colaboración comienza con un acuerdo que establece las condiciones de comercialización.\n* 01 · Acordamos | Definimos tarifas preferenciales, inventario, categorías y condiciones.\n* 02 · Asignamos | El productor pone a disposición de Tadaa! un inventario específico para comercialización.\n* 03 · Activamos | Diseñamos campañas, beneficios y oportunidades de venta para nuestra comunidad.\n* 04 · Comercializamos | Los usuarios descubren y compran sus experiencias desde Tadaa!.\n* 05 · Damos seguimiento | El aliado consulta sus ventas y transacciones desde su panel de control.\n! El productor conserva visibilidad sobre las condiciones de su inventario y el alcance de la colaboración."
    },
    {
      "title": "Partner Dashboard",
      "text": "Tu operación, siempre a la vista.\nLos aliados de Tadaa! cuentan con acceso a un panel digital para consultar y dar seguimiento a la actividad comercial de sus producciones.\nDesde el Partner Dashboard podrán:\n* Consultar ventas por evento.\n* Verificar compras y transacciones.\n* Dar seguimiento a los accesos comercializados.\n* Gestionar la entrega de accesos al cliente, según la modalidad acordada.\n* Tener mayor visibilidad de la operación de Tadaa!.\n! Información accesible para tomar mejores decisiones comerciales."
    },
    {
      "title": "Ticketing flexible",
      "text": "Nos adaptamos a tu operación. No al revés.\nSabemos que cada producción tiene procesos, proveedores y necesidades diferentes. Por eso, Tadaa! puede integrarse de distintas maneras.\n* Tadaa! como boletera | Podemos ofrecer el servicio de comercialización y ticketing cuando el productor requiere una solución integral.\n* Tadaa! como canal complementario | Si ya cuentas con una boletera, podemos trabajar en paralelo para comercializar el inventario asignado a nuestra plataforma.\n* Accesos provisionales | Si conservas tu sistema de ticketing, podemos emitir accesos provisionales con códigos QR dinámicos que se renuevan cada minuto para facilitar la verificación de compras.\n! La flexibilidad operativa nos permite colaborar con diferentes modelos de producción."
    },
    {
      "title": "NOW!",
      "text": "El momento de activar inventario es ahora.\nUna campaña especial para comercializar boletos de último minuto.\nEl productor asigna un inventario específico y establece las condiciones de la promoción. Tadaa! activa una campaña dirigida a sus usuarios, quienes pueden registrarse para acceder a una oportunidad de compra con un descuento especial.\n* Inventario y disponibilidad definidos por producción.\n* Descuentos y condiciones previamente acordadas.\n* Activaciones dirigidas a nuestra comunidad.\n* Campañas con periodos de vigencia establecidos.\n! Una herramienta de comercialización controlada para aprovechar oportunidades de venta de último momento."
    },
    {
      "title": "GOLDEN TICKET",
      "text": "Cada boleto puede esconder algo extraordinario.\nUna experiencia especial para convertir una compra en un recuerdo inolvidable.\nPor cada 100 boletos vendidos en Tadaa!, uno puede recibir un beneficio adicional, de acuerdo con la mecánica y disponibilidad acordadas con el productor.\n# Algunos ejemplos:\n* Upgrade de asiento.\n* Meet & greet.\n* Merchandising exclusivo.\n* Accesos o experiencias especiales.\n! No solamente vendemos boletos. Creamos motivos para elegir una experiencia."
    },
    {
      "title": "PREVIEW NIGHT",
      "text": "Antes de que se abra el telón, comienza la experiencia.\nUn espacio digital para producciones próximas a estrenarse.\nPREVIEW NIGHT permite crear micrositios especiales para presentar nuevas producciones y distribuir electrónicamente cortesías e invitaciones.\n# Ideal para:\n* Premières y funciones de prensa.\n* Invitaciones para amigos y familiares.\n* Funciones especiales.\n* Lanzamientos y estrenos.\n! Una herramienta para organizar invitaciones y generar expectativa alrededor de cada producción."
    },
    {
      "title": "Más oportunidades por cada compra",
      "text": "La experiencia no termina en el boleto.\nTadaa! permite incorporar productos y servicios adicionales a la compra de entradas.\n* Add-ons | Ofrece merchandising, combos de alimentos y bebidas, productos exclusivos, paquetes y experiencias adicionales.\n* Preventas | Genera oportunidades de acceso anticipado para nuestra comunidad.\n* Meses sin intereses | Facilita alternativas de pago cuando el margen comercial y las condiciones de cada producción lo permiten.\n* Cortesías digitales | Distribuye invitaciones y accesos electrónicos de manera organizada.\n! Más posibilidades de compra. Mayor valor por transacción."
    },
    {
      "title": "Gamification & Loyalty",
      "text": "Comprar experiencias también tiene recompensas.\nCreamos incentivos para que los usuarios regresen a Tadaa!.\nA medida que compran, pueden avanzar de nivel, desbloquear insignias y acceder a beneficios especiales.\n# Entre las recompensas contempladas:\n* Cashback.\n* Tarifas preferenciales.\n* Beneficios exclusivos.\n* Nuevas oportunidades de acceso.\n! Para los productores, esto representa una oportunidad de impulsar la recompra y mantener sus producciones presentes en una comunidad que sigue descubriendo nuevas experiencias."
    },
    {
      "title": "Construyamos una alianza",
      "text": "Tu producción tiene una nueva oportunidad de llegar más lejos.\nCada espectáculo es diferente. Por eso, diseñamos cada colaboración de acuerdo con las necesidades comerciales y operativas de cada aliado.\n# Definamos juntos:\n* Inventario y categorías disponibles.\n* Tarifas preferenciales y condiciones comerciales.\n* Periodos de comercialización.\n* Campañas NOW! y beneficios GOLDEN TICKET.\n* Preventas, cortesías y PREVIEW NIGHT.\n* Add-ons y experiencias adicionales.\n* Modalidad de ticketing y validación.\n* Operación, liquidación y atención al cliente.\n! Tú produces experiencias extraordinarias. Nosotros te ayudamos a llevarlas a nuevas audiencias."
    }
  ]
}
 ];
 for(const p of presentations){
   await client.query(`INSERT INTO partner_presentations(slug,title,subtitle,status,slides,theme)
     VALUES($1,$2,$3,'published',$4::jsonb,$5::jsonb)
     ON CONFLICT(slug) DO NOTHING`,
     [p.slug,p.title,p.subtitle,JSON.stringify(p.slides),JSON.stringify({accent:'#D6FF35',background:'#050505',demoContent:true})]);
 }
 await client.query('COMMIT');
 console.log(JSON.stringify({ok:true,batch,eventsInserted:inserted,eventArtRecords:updatedExtras,presentations:presentations.length,pricesSet:false,ticketInventoryCreated:false,realPayments:false},null,2));
} catch(e) {
 await client.query('ROLLBACK');
 throw e;
} finally {
 client.release();
 await closePool();
}
