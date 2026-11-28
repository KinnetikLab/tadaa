// Convierte los mockups aprobados (design/mockups/*.dc.html) en plantillas de producción:
// rutas de imágenes locales, anchos fluidos y enlaces a rutas de la app. Genera web/tv-screens.js
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const src=path.join(root,'design/mockups'),out=path.join(root,'web/tv-screens.js');
const A={'26994cc14f5434330e2908761d2a8099':'img/tv/ev/inferno.webp','3a212457537b9f51ea6f7346c385439c':'img/tv/glitter.png','3deff8146b80bb3fb1485ea91d6f55e6':'img/tv/grain.png','52c32ef55d42f15d56b0cfb34f1a15f6':'img/tv/gold.webp','638dbc29de26c4783746a0bef23bebdd':'img/tv/ev/nocturno.webp','8e0bcf402dffa7cdf67f5b3be9f05c08':'img/tv/ev/morat.webp','940a3ed37e1bd1fb06f8379dc058b8a2':'img/tv/logo-tadaa.png','9bb3a5e0fcd00cd42c2ddaf0ca39bac7':'img/tv/video-demo.mp4','ae1aa772d43572f219610f484bc3660c':'img/tv/ev/bruno.webp','bf23baed004bb85668937804b7d495cc':'img/tv/ev/matilda.webp','bf2a75752b07f383213ec9a4d48dc00d':'img/tv/ev/bioparque.webp','c238803f93edbcfca0600e4470e86b80':'img/tv/blue-tall.webp','c9fbaa4f64161be324e770b5cd19f7f4':'img/tv/ev/queen.webp','e0912ca8104f4784a21d635acba18e3a':'img/tv/blue-wide.webp','fd6d958733bf058344285c28d805e194':'img/tv/ev/hoy.webp','09a59e710d1cffc28d148504d87fcc14':'img/tv/ev/inferno-emblem.svg'};
const R={Main:'inicio',DHome:'inicio',MExplorar:'explorar',DExplorar:'explorar',MEvento:'evento',DEvento:'evento',MAsientos:'asientos',MAddons:'addons',MRush:'now',DRush:'now',MWallet:'wallet',DWallet:'wallet',MPase:'pase',MCuenta:'cuenta',DCuenta:'cuenta',MLogro:'logro',MGolden:'golden',DGolden:'golden',MBaja:'baja',MCheckin:'staff',DPartner:'productor',DEmpresa:'empresa',DAdmin:'admin',DPitch:'pitch',RMembresia:'membresia'};
const screens={};
for(const f of fs.readdirSync(src).filter(x=>x.endsWith('.dc.html')).sort()){
 let s=fs.readFileSync(path.join(src,f),'utf8');const name=f.replace('.dc.html','');
 s=s.replace(/\/_blob\/([a-f0-9]{32})/g,(m,h)=>A[h]||m);
 s=s.replace(/href="([A-Za-z]+)\.dc\.html"/g,(m,n)=>`href="#${R[n]||n}" data-tv-link="${R[n]||n}"`);
 if(name.startsWith('D'))s=s.replace(/width: 1280px;/g,'width: 100%; max-width: 1280px;');
 s=s.replace('<script src="./support.js"></script>','');
 const css=[...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
 const body=(s.match(/<x-dc[^>]*>([\s\S]*?)<\/x-dc>/)||[])[1]||'';
 const tpl=body.replace(/<helmet>[\s\S]*?<\/helmet>/,'').trim();
 const code=(s.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/)||[])[1]||'';
 screens[name]={css,tpl,code};
}
fs.writeFileSync(out,'/* Generado por tools/build-vibrante.mjs desde design/mockups — no editar a mano. */\nwindow.TV_SCREENS='+JSON.stringify(screens).replace(/<\/script/g,'<\\/script')+';\n');
console.log('✓',Object.keys(screens).length,'pantallas →',path.relative(root,out),(fs.statSync(out).size/1024|0)+' KB');
