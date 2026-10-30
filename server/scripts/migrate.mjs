import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from '../src/db.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir=path.resolve(here,'../migrations');
const pool=getPool();
if(!pool){console.error('Falta DATABASE_URL. En xCloud, selecciona PostgreSQL para el sitio Node.js y vuelve a ejecutar.');process.exit(1);}
try{
 await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 const files=(await fs.readdir(dir)).filter(x=>x.endsWith('.sql')).sort();
 for(const filename of files){
  const exists=await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1',[filename]);
  if(exists.rowCount) { console.log(`↷ ${filename}: ya aplicada`); continue; }
  const sql=await fs.readFile(path.join(dir,filename),'utf8');
  const client=await pool.connect();
  try { await client.query('BEGIN'); await client.query(sql); await client.query('INSERT INTO schema_migrations(filename) VALUES($1)',[filename]); await client.query('COMMIT'); console.log(`✓ ${filename}: aplicada`); }
  catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
 }
 console.log('✓ Migraciones completadas.');
}catch(e){console.error('Error de migración:',e.message);process.exitCode=1;}finally{await closePool();}
