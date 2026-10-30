export const INTEGRATIONS = Object.freeze({
  clip: { name:'Clip · Checkout Transparente', category:'Cobros', summary:'Cobro con tarjeta dentro de TADAA!; la API de pago debe ejecutarse en servidor.', mode:true, docs:'https://developer.clip.mx/reference/introduccion-al-sdk-de-checkout-transparente',
    fields:[{key:'apiKey',label:'API Key de Clip',type:'secret',required:true,help:'Credencial generada en el panel de desarrolladores de Clip. Nunca se introduce en un formulario público.'}], test:'GET de transacciones; no realiza cargos' },
  twilio: { name:'Twilio Verify · SMS', category:'Identidad', summary:'Verificación del número móvil por código de un solo uso.', mode:false, docs:'https://www.twilio.com/docs/verify/api',
    fields:[{key:'apiKeySid',label:'API Key SID',type:'secret',required:true},{key:'apiKeySecret',label:'API Key Secret',type:'secret',required:true},{key:'verifyServiceSid',label:'Verify Service SID (VA...)',type:'text',required:true}],test:'Consulta del servicio Verify; no envía mensajes' },
  resend: { name:'Resend · Correo transaccional', category:'Comunicaciones', summary:'Códigos de correo, confirmaciones y avisos de pedido (conectar flujo después).',mode:false,docs:'https://resend.com/docs/api-reference/domains/list-domains',
    fields:[{key:'apiKey',label:'API Key de Resend',type:'secret',required:true},{key:'fromEmail',label:'Remitente verificado',type:'email',required:true,help:'Ej. tickets@tadaa.mx; debe pertenecer a un dominio autorizado en Resend.'},{key:'fromName',label:'Nombre del remitente',type:'text',required:false}],test:'Lectura de dominios de la cuenta; no envía correos' },
  googlemaps: { name:'Google Maps · Geocoding', category:'Ubicaciones', summary:'Verificación de CP y ubicaciones; no proporciona un padrón completo de colonias.',mode:false,docs:'https://developers.google.com/maps/documentation/geocoding',
    fields:[{key:'apiKey',label:'API Key de Geocoding (servidor)',type:'secret',required:true,help:'Restringe la clave al servicio Geocoding y, cuando aplique, a la IP del servidor.'}],test:'Consulta del CP 06700, México' },
  postal: {name:'Catálogo de colonias MX', category:'Ubicaciones',summary:'Complemento obligatorio para ofrecer todas las colonias de un código postal.',mode:false,docs:'https://www.correosdemexico.gob.mx/',
    fields:[{key:'provider',label:'Origen de datos',type:'select',options:['Pendiente de fuente oficial/licenciada','Base SEPOMEX propia','Proveedor contratado'],required:true},{key:'reference',label:'Versión / referencia del catálogo',type:'text',required:false,help:'No coloques claves secretas en este campo.'}],test:'No hay una API oficial configurada; requiere importar catálogo autorizado' },
  facturama: {name:'Facturama · CFDI', category:'Facturación',summary:'Timbrado CFDI 4.0; requiere alta de emisor y configuración fiscal.',mode:true,docs:'https://facturama.elevio.help/es/articles/182-catalogo-de-formas-de-pago',
    fields:[{key:'username',label:'Usuario API',type:'text',required:true},{key:'password',label:'Contraseña API',type:'secret',required:true}],test:'Consulta catálogo SAT de formas de pago; no timbra facturas' },
  envia: {name:'Envia.com · Envíos',category:'Logística',summary:'Cotizaciones, guías y seguimiento de entregas físicas.',mode:true,docs:'https://docs.envia.com/docs/authentication',
    fields:[{key:'token',label:'API Token',type:'secret',required:true},{key:'originPostal',label:'CP de origen',type:'text',required:false,help:'Código postal desde el que se enviarán boletos.'}],test:'Consulta transportistas México; no compra guías' },
  storage: {name:'S3 compatible · Documentos',category:'Archivos',summary:'Almacenamiento privado de boletos oficiales y comprobantes; aún requiere conectar el servicio.',mode:false,docs:'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
    fields:[{key:'provider',label:'Proveedor',type:'select',options:['Amazon S3','Cloudflare R2','Otro S3 compatible'],required:true},{key:'bucket',label:'Bucket privado',type:'text',required:true},{key:'region',label:'Región',type:'text',required:true},{key:'endpoint',label:'Endpoint HTTPS (opcional)',type:'text',required:false,help:'Solo configuración. No se hacen peticiones al endpoint arbitrario.'},{key:'accessKeyId',label:'Access Key ID',type:'secret',required:true},{key:'secretAccessKey',label:'Secret Access Key',type:'secret',required:true}],test:'Validación de configuración; falta adaptador de archivos' },
  expo: {name:'Expo · Push móvil',category:'Notificaciones',summary:'Configuración para avisos push; credenciales de compilación se gestionan en EAS.',mode:false,docs:'https://docs.expo.dev/push-notifications/overview/',
    fields:[{key:'projectId',label:'Expo Project ID',type:'text',required:true},{key:'accessToken',label:'Expo Access Token (opcional)',type:'secret',required:false}],test:'Validación de formato; no envía notificaciones' },
});

export function sanitizedCatalog(){return Object.entries(INTEGRATIONS).map(([id,entry])=>({id,...entry}))}
export function sanitizedRecord(id,r={}){
 const entry=INTEGRATIONS[id]; const values={}; const saved={};
 for(const field of entry.fields){if(field.type==='secret'){saved[field.key]=!!r?.fields?.[field.key]}else{values[field.key]=r?.fields?.[field.key]??''}}
 return {id,mode:entry.mode?(r.mode==='live'?'live':'test'):null,configured:!!r.configured,updatedAt:r.updatedAt||null,testedAt:r.testedAt||null,testStatus:r.testStatus||'untested',testMessage:r.testMessage||'',values,saved,canTest:!['postal','storage','expo'].includes(id)};
}
export function validateFields(id, inputFields, previous){
 const schema=INTEGRATIONS[id];if(!schema)throw new Error('Integración no reconocida');
 const allowed=new Set(schema.fields.map(f=>f.key));if(Object.keys(inputFields||{}).some(k=>!allowed.has(k)))throw new Error('Campo no permitido');
 const fields={...(previous||{})};
 for(const field of schema.fields){let raw=inputFields?.[field.key];if(raw===undefined||raw===null)continue;
  if(typeof raw!=='string'||raw.length>2048)throw new Error('Valor incorrecto: '+field.label);
  raw=raw.trim();if(field.type==='secret'&&raw==='')continue;
  if(field.type==='email'&&raw&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw))throw new Error('Correo remitente inválido');
  if(field.type==='select'&&raw&&!field.options?.includes(raw))throw new Error('Opción inválida');
  if(field.key==='originPostal'&&raw&&!/^\d{5}$/.test(raw))throw new Error('Código postal debe tener 5 dígitos');
  if(field.key==='endpoint'&&raw&&(!raw.startsWith('https://')||/[\s<>'"\\]/.test(raw)))throw new Error('Endpoint debe usar HTTPS');
  fields[field.key]=raw;
 }
 const missing=schema.fields.filter(f=>f.required&&!fields[f.key]);
 return {fields,configured:missing.length===0,missing:missing.map(f=>f.label)};
}
