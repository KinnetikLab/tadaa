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
  {slug:'productores-teatro-demo',title:'TADAA! × Productores teatrales',subtitle:'Presenta tus obras a nuevas audiencias y construyamos juntos su descubrimiento.',slides:[
   {title:'Tu próxima audiencia está aquí',text:'TADAA! busca acercar al público a obras, musicales, comedia y experiencias escénicas en Ciudad de México.'},
   {title:'Una cartelera viva',text:'Cada producción puede tener ficha editorial, arte autorizado, recinto, temporada, créditos y enlaces oficiales.'},
   {title:'Tu producción, bien presentada',text:'Creamos una experiencia digital con información clara, imágenes autorizadas y una ruta sencilla para consultar funciones.'},
   {title:'Control de tu contenido',text:'El productor aporta y valida los materiales; TADAA! revisa derechos, datos y condiciones antes de publicar.'},
   {title:'Descubrimiento y comunidad',text:'Los usuarios pueden explorar categorías, guardar obras de interés y descubrir recomendaciones editoriales.'},
   {title:'Campañas y experiencias',text:'Podemos proponer activaciones, temporadas temáticas, funciones especiales y experiencias exclusivas sujetas a acuerdo.'},
   {title:'Cómo colaboramos',text:'Revisamos la producción, definimos el alcance, recibimos el material autorizado y acordamos cómo enlazar la boletera oficial.'},
   {title:'Presenta tu obra',text:'Envía una solicitud para que el equipo TADAA! revise tu producción y programe una conversación.'}
  ]}
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
