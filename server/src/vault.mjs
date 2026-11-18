import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MASTER = process.env.TADAA_ENCRYPTION_KEY || '';
if(!/^[a-fA-F0-9]{64}$/.test(MASTER))throw new Error('Falta TADAA_ENCRYPTION_KEY (32 bytes hex). No se inicia servidor inseguro.');
const KEY=Buffer.from(MASTER,'hex');
const DATA_DIR=path.resolve(process.env.DATA_DIR||path.join(process.env.HOME||process.cwd(),'tadaa-private')); // Fuera del checkout de Git
const FILE=path.join(DATA_DIR,'integration-vault.enc.json');
const AUDIT=path.join(DATA_DIR,'integrations-audit.ndjson');
fs.mkdirSync(DATA_DIR,{recursive:true,mode:0o700});
try{fs.chmodSync(DATA_DIR,0o700)}catch{}
export const vaultPath=FILE;
export function readVault(){
 if(!fs.existsSync(FILE))return {version:1,integrations:{}};
 const obj=JSON.parse(fs.readFileSync(FILE,'utf8'));
 if(obj.version!==1||obj.algorithm!=='aes-256-gcm')throw new Error('Formato de bóveda incompatible');
 const dec=crypto.createDecipheriv('aes-256-gcm',KEY,Buffer.from(obj.iv,'base64'));
 dec.setAAD(Buffer.from('tadaa-v06-vault-v1'));dec.setAuthTag(Buffer.from(obj.tag,'base64'));
 return JSON.parse(Buffer.concat([dec.update(Buffer.from(obj.data,'base64')),dec.final()]).toString('utf8'));
}
export function saveVault(data){
 const iv=crypto.randomBytes(12);const enc=crypto.createCipheriv('aes-256-gcm',KEY,iv);
 enc.setAAD(Buffer.from('tadaa-v06-vault-v1'));
 const ciphertext=Buffer.concat([enc.update(JSON.stringify(data),'utf8'),enc.final()]);
 const blob=JSON.stringify({version:1,algorithm:'aes-256-gcm',iv:iv.toString('base64'),tag:enc.getAuthTag().toString('base64'),data:ciphertext.toString('base64')});
 const tmp=FILE+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
 try{fs.writeFileSync(tmp,blob,{mode:0o600,flag:'wx'});fs.renameSync(tmp,FILE);fs.chmodSync(FILE,0o600)}finally{if(fs.existsSync(tmp))fs.rmSync(tmp)}
}
export function writeAudit(entry){
 const event=JSON.stringify({time:new Date().toISOString(),...entry});
 fs.appendFileSync(AUDIT,event+'\n',{mode:0o600});
}
export function auditRecent(limit=30){if(!fs.existsSync(AUDIT))return [];const lines=fs.readFileSync(AUDIT,'utf8').trim().split('\n').filter(Boolean);return lines.slice(-Math.max(1,Math.min(100,limit))).reverse().map(s=>JSON.parse(s))}
