/* Datos de DEMOSTRACIÓN: referencia visual tomada de los catálogos que compartió el usuario.
   Fechas, precios, funciones y disponibilidad requieren validación antes de publicación real. */
window.TADAA_DEFAULT = {
  version: 3,
  settings: {
    brandLogo: 'assets/logo-tadaa-black.png',
    brandLogoLight: 'assets/logo-tadaa-white.png',
    accent: '#D6FF35',
    bookingHours: 8,
    homeCity: 'Ciudad de México',
    supportEmail: 'contacto@boletodos.com'
  },
  categories: [
    {id:'Teatro',name:'Teatro',image:'assets/cat-teatro.webp'},
    {id:'Conciertos',name:'Conciertos',image:'assets/cat-conciertos.webp'},
    {id:'Paseos',name:'Paseos',image:'assets/cat-experiencias.webp'},
    {id:'Familia',name:'Familia',image:'assets/cat-familia.webp'},
    {id:'Gastronomía',name:'Gastronomía',image:'assets/cat-gastro.webp'},
    {id:'Cultura',name:'Cultura',image:'assets/cat-cultura.webp'}
  ],
  banners: [
    {id:'ban-1',image:'assets/hero-crowd.webp',logo:'assets/logo-home.png',tagline:'EXPERIENCIAS · CDMX',cta:'Explorar eventos',eventId:'',active:true},
    {id:'ban-2',image:'assets/hoy-main.webp',logo:'assets/logo-hoy.png',tagline:'TEATRO · TEMPORADA ESPECIAL',cta:'Conocer el evento',eventId:'hoy',active:true},
    {id:'ban-3',image:'assets/morat-main.webp',logo:'assets/logo-morat.png',tagline:'CONCIERTOS · EN VIVO',cta:'Ver concierto',eventId:'morat',active:true},
    {id:'ban-4',image:'assets/matilda-main.webp',logo:'assets/logo-matilda.png',tagline:'MUSICALES · EN CARTELERA',cta:'Ver musical',eventId:'matilda',active:true}
  ],
  events: [
    {id:'hoy', title:'20 años después · Hoy No Me Puedo Levantar',category:'Teatro',slug:'20-anos-despues-hoy-no-me-puedo-levantar',mainImage:'assets/hoy-main.webp',cardImage:'assets/hoy-main.webp',logo:'',mapImage:'assets/hoy-map.webp',gallery:['assets/hoy-icon.webp'],trailer:'assets/tadaa-video-demo.mp4',trailerLabel:'Ver promo (demo)',venue:'Centro Cultural Teatro 1',address:'Av. Chapultepec y Av. Cuauhtémoc, Cuauhtémoc, Ciudad de México',dateLabel:'11–22 dic 2026 · 8–10 ene 2027',functions:['11 dic 2026 · 20:30','12 dic 2026 · 17:00','12 dic 2026 · 20:30','13 dic 2026 · 13:00','18 dic 2026 · 20:30','19 dic 2026 · 17:00','20 dic 2026 · 17:00','8 ene 2027 · 20:30'],description:'Veinte años después, este espectáculo reúne al elenco original para celebrar la historia y la música que marcaron a toda una generación.',duration:'Por confirmar',age:'Consultar condiciones',accessibility:'Consultar con el recinto',delivery:'Digital o física, según proveedor',published:true,highlight:true,zones:[{id:'z1',name:'Banamex',regular:4316,discount:3700,active:true},{id:'z2',name:'VIP Oro',regular:4068,discount:3500,active:true},{id:'z3',name:'VIP',regular:3820,discount:3250,active:true},{id:'z4',name:'Orquesta',regular:3572,discount:3050,active:true},{id:'z5',name:'Preferente 1',regular:3224,discount:2850,active:true},{id:'z6',name:'Preferente 2',regular:3076,discount:2650,active:true}]},
    {id:'matilda',title:'Matilda · El Musical',category:'Teatro',slug:'matilda-el-musical',mainImage:'assets/matilda-main.webp',cardImage:'assets/matilda-main.webp',logo:'',mapImage:'assets/matilda-map.webp',gallery:['assets/cat-teatro.webp'],trailer:'assets/tadaa-matilda-demo.mp4',trailerLabel:'Ver promo (demo)',venue:'Centro Cultural Teatro 1',address:'Av. Chapultepec y Av. Cuauhtémoc, Cuauhtémoc, Ciudad de México',dateLabel:'30 y 31 oct · funciones de noviembre',functions:['30 oct 2026 · 19:30','31 oct 2026 · 19:00','6 nov 2026 · 19:30','7 nov 2026 · 19:00','8 nov 2026 · 17:00'],description:'Matilda es una niña extraordinaria, ingeniosa e imaginativa, que decide cambiar su propia historia. Una aventura musical llena de carácter y magia.',duration:'Consultar con producción',age:'Familiar',accessibility:'Consultar con el recinto',delivery:'Según disponibilidad del proveedor',published:true,highlight:true,zones:[{id:'z1',name:'Banamex',regular:3968,discount:2000,active:true},{id:'z2',name:'VIP Oro',regular:3596,discount:1800,active:true},{id:'z3',name:'VIP 1',regular:3348,discount:1600,active:true},{id:'z4',name:'VIP 2',regular:3100,discount:1500,active:true},{id:'z5',name:'Orquesta 1',regular:2728,discount:1400,active:true},{id:'z6',name:'Orquesta 2',regular:2356,discount:1200,active:true},{id:'z7',name:'Preferente 1',regular:2170,discount:1100,active:true},{id:'z8',name:'Preferente 2',regular:1860,discount:850,active:true},{id:'z9',name:'Mezzanine 1',regular:1798,discount:700,active:true}]},
    {id:'morat',title:'Morat',category:'Conciertos',slug:'morat',mainImage:'assets/morat-main.webp',cardImage:'assets/morat-main.webp',logo:'',mapImage:'assets/morat-map.webp',gallery:['assets/cat-conciertos.webp'],trailer:'',trailerLabel:'Ver promo',venue:'Palacio de los Deportes',address:'Av. Río Churubusco y Añil, Granjas México, Ciudad de México',dateLabel:'17 nov 2026 · 20:00',functions:['17 nov 2026 · 20:00'],description:'Morat en vivo. Vive una noche llena de música, energía y tus canciones favoritas.',duration:'Consultar con producción',age:'Consultar condiciones',accessibility:'Consultar recinto',delivery:'Según proveedor',published:true,highlight:true,zones:[{id:'z1',name:'Oro',regular:4129,discount:3600,active:true},{id:'z2',name:'Zona C',regular:2765,discount:2400,active:true},{id:'z3',name:'Zona D',regular:2393,discount:2100,active:true}]},
    {id:'bruno',title:'Bruno Mars',category:'Conciertos',slug:'bruno-mars',mainImage:'assets/bruno-main.webp',cardImage:'assets/bruno-main.webp',logo:'',mapImage:'assets/bruno-map.webp',gallery:['assets/cat-conciertos.webp'],trailer:'',trailerLabel:'Ver promo',venue:'Estadio GNP Seguros',address:'Viaducto Piedad y Río Churubusco, Ciudad Deportiva, Ciudad de México',dateLabel:'11 dic 2026 · 21:00',functions:['11 dic 2026 · 21:00'],description:'Un espectáculo musical para disfrutar en vivo en Ciudad de México.',duration:'Consultar con producción',age:'Consultar condiciones',accessibility:'Consultar recinto',delivery:'Según proveedor',published:true,highlight:false,zones:[{id:'z1',name:'Platino',regular:6979,discount:6000,active:true},{id:'z2',name:'GNP',regular:3755,discount:3300,active:true},{id:'z3',name:'General B',regular:1771,discount:1550,active:true}]},
    {id:'queen',title:'God Save The Queen',category:'Conciertos',slug:'god-save-the-queen',mainImage:'assets/queen-main.webp',cardImage:'assets/queen-main.webp',logo:'',mapImage:'assets/queen-map.webp',gallery:['assets/cat-conciertos.webp'],trailer:'',trailerLabel:'Ver promo',venue:'Arena CDMX',address:'Av. de las Granjas 800, Santa Bárbara, Azcapotzalco, Ciudad de México',dateLabel:'19 nov 2026 · 21:00',functions:['19 nov 2026 · 21:00'],description:'Tributo musical en vivo con clásicos de Queen.',duration:'Consultar con producción',age:'Consultar condiciones',accessibility:'Consultar recinto',delivery:'Según proveedor',published:true,highlight:false,zones:[{id:'z1',name:'Verde',regular:1067,discount:890,active:true},{id:'z2',name:'Azul',regular:942,discount:800,active:true},{id:'z3',name:'Aqua',regular:691,discount:550,active:true},{id:'z4',name:'Morado',regular:565,discount:410,active:true}]},
    {id:'bio',title:'BioParque Estrella',category:'Paseos',slug:'bioparque-estrella',mainImage:'assets/bioparque-main.webp',cardImage:'assets/bioparque-main.webp',logo:'',mapImage:'assets/bioparque-map.webp',gallery:['assets/bioparque-extra.webp'],trailer:'',trailerLabel:'Ver promo',venue:'BioParque Estrella',address:'Carretera Jilotepec-Ixtlahuaca km 38.5, Chapa de Mota, Estado de México',dateLabel:'Fechas a consultar',functions:['Fecha por confirmar con el proveedor'],description:'Naturaleza, aventura y experiencias familiares. El precio depende de la modalidad y servicios incluidos.',duration:'Jornada completa',age:'Familiar',accessibility:'Consultar recinto',delivery:'Según proveedor',published:true,highlight:false,zones:[{id:'z1',name:'Pasaporte Aventura',regular:470,discount:380,active:true},{id:'z2',name:'Entrada + transporte',regular:700,discount:600,active:true}]}
  ],
  orders: []
};

// v0.4: estructura de demo para ciudades, favoritos, carrito y funciones abiertas.
window.TADAA_DEFAULT.version=4;
window.TADAA_DEFAULT.favorites=[];
window.TADAA_DEFAULT.cart=[];
window.TADAA_DEFAULT.profile={name:'',email:'',phone:'',company:'',notifications:true};
window.TADAA_DEFAULT.settings.selectedCity='Todas las ciudades';
window.TADAA_DEFAULT.settings.homeCity='Ciudad de México';
window.TADAA_DEFAULT.events.forEach(e=>{
 e.city=e.id==='bio'?'Chapa de Mota':'Ciudad de México';
 e.functionMode=e.id==='bio'?'open':'fixed';
 e.openStart=e.id==='bio'?'2026-11-01':'';
 e.openEnd=e.id==='bio'?'2027-03-31':'';
 e.openDays=[0,1,2,3,4,5,6];
 e.openTime=e.id==='bio'?'10:00':'';
 e.heroPosition='center 40%';
});
window.TADAA_DEFAULT.events.unshift({
 id:'nocturno',title:'Nocturno · Daniel Giménez Cacho',category:'Teatro',slug:'nocturno',
 mainImage:'assets/nocturno-main.webp',cardImage:'assets/nocturno-main.webp',logo:'',mapImage:'assets/nocturno-map.webp',
 gallery:[],trailer:'',trailerLabel:'Ver tráiler',venue:'Centro Cultural Teatro 2',
 address:'Av. Chapultepec y Av. Cuauhtémoc, Cuauhtémoc, Ciudad de México',city:'Ciudad de México',
 dateLabel:'Viernes 20:00 · Sábados 20:30',functions:['Viernes · 20:00','Sábado · 20:30'],
 functionMode:'fixed',openStart:'',openEnd:'',openDays:[0,1,2,3,4,5,6],openTime:'',heroPosition:'center 30%',
 description:'Obra inédita en México. Un hombre huye de su hogar tras un homicidio imprudencial, mientras su familia se desmorona. A lo largo de los años busca el perdón a través de la música clásica y la literatura.',
 duration:'Por confirmar',age:'Consultar condiciones',accessibility:'Consultar al recinto',delivery:'Según proveedor',published:true,highlight:true,
 zones:[{id:'z1',name:'VIP',regular:1800,discount:1250,active:true},{id:'z2',name:'Preferente',regular:1400,discount:1050,active:true},{id:'z3',name:'Vista parcial',regular:1100,discount:850,active:true}]
});
window.TADAA_DEFAULT.banners.splice(1,0,{id:'ban-nocturno',image:'assets/nocturno-main.webp',logo:'assets/logo-nocturno.png',tagline:'TEATRO · FUNCIONES ESPECIALES',cta:'Ver evento',eventId:'nocturno',active:true});


// v0.5: demo corporativa cerrada. TODAS las organizaciones, números y códigos son ficticios.
window.TADAA_DEFAULT.version=5;
window.TADAA_DEFAULT.settings={
 ...window.TADAA_DEFAULT.settings,
 headerLogoDark:'assets/logo-tadaa-white.png',headerLogoLight:'assets/logo-tadaa-black.png',
 footerLogoDark:'assets/logo-tadaa-white.png',footerLogoLight:'assets/logo-tadaa-black.png',
 headerTheme:'dark',footerTheme:'dark',favicon:'assets/app-icon.png'
};
window.TADAA_DEFAULT.institutions=[
 {id:'inst-empresa',name:'Empresa Demo Norte',kind:'Empresa',active:true},
 {id:'inst-universidad',name:'Universidad Demo Metropolitana',kind:'Universidad',active:true},
 {id:'inst-colegio',name:'Colegio Demo Central',kind:'Colegio',active:true}
];
window.TADAA_DEFAULT.members=[
 {id:'m-001',institutionId:'inst-empresa',memberId:'EMP-1001',active:true},
 {id:'m-002',institutionId:'inst-universidad',memberId:'ALU-2026',active:true},
 {id:'m-003',institutionId:'inst-colegio',memberId:'EST-0042',active:true}
];
window.TADAA_DEFAULT.users=[];
window.TADAA_DEFAULT.leads=[];
window.TADAA_DEFAULT.session=null;
window.TADAA_DEFAULT.events.forEach(e=>{
 e.openSchedule=e.openSchedule||{};
 // La existencia de días habilitados en la demo NO implica disponibilidad real.
 if(e.id==='matilda'){
  e.functionMode='open'; e.openStart='2026-10-30';e.openEnd='2027-01-31';
  e.openDays=[5,6,0];e.openTime='19:30';e.openSchedule={'5':'19:30','6':'19:00','0':'17:00'};
  e.dateLabel='Viernes, sábados y domingos · fecha a elegir';
 }
 if(e.id==='nocturno'){
  e.functionMode='open';e.openStart='2026-10-30';e.openEnd='2027-01-31';
  e.openDays=[5,6];e.openTime='20:00';e.openSchedule={'5':'20:00','6':'20:30'};
  e.dateLabel='Viernes 20:00 y sábados 20:30 · fecha a elegir';
 }
 if(!e.trailer)e.trailer='assets/tadaa-video-demo.mp4';
 if(!e.trailerLabel)e.trailerLabel='Ver video / promo (demo)';
});
