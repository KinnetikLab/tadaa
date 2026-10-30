import pg from 'pg';
const { Pool } = pg;
let pool;
export function getPool(){
  if(!process.env.DATABASE_URL) return null;
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL, max:Number(process.env.DB_POOL_MAX||10), connectionTimeoutMillis:8000, idleTimeoutMillis:30000, ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined});
  return pool;
}
export async function databaseStatus(){
  const p=getPool();
  if(!p) return {configured:false,connected:false};
  try { await p.query('SELECT 1'); return {configured:true,connected:true}; }
  catch { return {configured:true,connected:false}; }
}
export async function closePool(){ if(pool){await pool.end();pool=null;} }
