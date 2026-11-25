import { getPool, closePool } from '../src/db.mjs';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../../web/experience/producer-deck.js', import.meta.url), 'utf8');
const deck = JSON.parse(source.slice(source.indexOf('=')+1).trim().replace(/;$/, ''));
const pool = getPool();
if (!pool) throw new Error('DATABASE_URL no configurada');
try {
 const result = await pool.query(`INSERT INTO partner_presentations(slug,title,subtitle,status,slides,theme) VALUES($1,$2,$3,'published',$4::jsonb,$5::jsonb) ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,slides=EXCLUDED.slides,status='published',updated_at=now() RETURNING slug`, ['productores-teatro-demo',deck.title,deck.subtitle,JSON.stringify(deck.slides),JSON.stringify({accent:'#D6FF35',background:'#050505'})]);
 console.log('Presentación actualizada:',result.rows[0].slug);
} finally { await closePool(); }
