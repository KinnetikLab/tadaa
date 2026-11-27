// Landings de obras y presentaciones por prospecto (gestor de pitch).
//   node server/scripts/seed-pitch.mjs          → crea lo que falte (no pisa ediciones hechas en Studio)
//   node server/scripts/seed-pitch.mjs --force  → reescribe las landings con los JSON de server/seeds/landings
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getPool,closePool} from '../src/db.mjs';

const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','seeds','landings');
const force=process.argv.includes('--force');
const DECKS=[
  {slug:'gou-producciones',prospect:'Gou Producciones',contact_name:'Equipo Gou',landing_slug:'kinky-boots',status:'sent',message:'Preparamos esta propuesta pensando en Kinky Boots y en la temporada 2027 en el CCT1.'},
  {slug:'mejor-teatro',prospect:'Mejor Teatro',contact_name:'Equipo Mejor Teatro',landing_slug:'back-to-the-future',status:'sent',message:'Así se vería Back to the Future — The Musical en TADAA!: un minisitio que se siente como la obra y vende como boletera.'},
  {slug:'six-flags',prospect:'Six Flags México',contact_name:'Equipo Six Flags',landing_slug:null,status:'draft',message:'Una propuesta para llevar Six Flags a nuevas audiencias: pases con tarifa preferencial, lanzamientos y eventos corporativos.',config:{variant:'atraccion',card:{title:'Six Flags México',when:'Parque de diversiones · CDMX'}}},
  {slug:'demo',prospect:'Tu productora',landing_slug:'la-jaula-de-las-locas',status:'draft',message:'Presentación de ejemplo con La Jaula de las Locas.'}
];
const pool=getPool();if(!pool)throw new Error('DATABASE_URL no configurada');
const c=await pool.connect();
try{
  await c.query('BEGIN');
  let L=0,D=0;
  for(const f of (await fs.readdir(dir)).filter(x=>x.endsWith('.json')).sort()){
    const slug=f.replace(/\.json$/,'');const cfg=JSON.parse(await fs.readFile(path.join(dir,f),'utf8'));
    const r=await c.query(`INSERT INTO show_landings(slug,title,config,status) VALUES($1,$2,$3,'published')
      ON CONFLICT(slug) DO ${force?`UPDATE SET title=EXCLUDED.title,config=EXCLUDED.config,updated_at=now()`:'NOTHING'} RETURNING id`,[slug,cfg.title,JSON.stringify(cfg)]);
    L+=r.rowCount;
  }
  for(const d of DECKS){const r=await c.query(`INSERT INTO pitch_decks(slug,prospect,contact_name,landing_slug,status,message,config) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(slug) DO NOTHING RETURNING id`,[d.slug,d.prospect,d.contact_name||null,d.landing_slug,d.status,d.message,JSON.stringify(d.config||{})]);D+=r.rowCount}
  await c.query('COMMIT');
  console.log(`✓ Pitch listo: ${L} landings${force?' (reescritas)':' nuevas'}, ${D} presentaciones nuevas.`);
  console.log('  Presentaciones: index.html#pitch/gou-producciones · index.html#pitch/mejor-teatro · Landings: landings/?s=kinky-boots');
}catch(e){await c.query('ROLLBACK');throw e}finally{c.release();await closePool()}
