import crypto from 'node:crypto';

const ADMIN_HASH=process.env.TADAA_ADMIN_PASSWORD_HASH||'';
const SECRET=process.env.TADAA_SESSION_SECRET||'';
if(!/^scrypt:[a-fA-F0-9]{32}:[a-fA-F0-9]{128}$/.test(ADMIN_HASH))throw new Error('Falta TADAA_ADMIN_PASSWORD_HASH válido; genera el hash con el script.');
if(SECRET.length<48)throw new Error('Falta TADAA_SESSION_SECRET (mínimo 48 caracteres).');
const [_,salt,hash]=ADMIN_HASH.split(':');
const sessions=new Map();
const failures=new Map();
const duration=8*3600000;
const cookieName=process.env.NODE_ENV==='production'?'__Host-tadaa_admin':'tadaa_admin';
const cookieSecure=process.env.NODE_ENV==='production';
export function verifyPassword(pass){if(typeof pass!=='string'||pass.length>300)return false;
 try{const candidate=crypto.scryptSync(pass,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1});return crypto.timingSafeEqual(candidate,Buffer.from(hash,'hex'))}catch{return false}}
export function isRateLimited(ip){const record=failures.get(ip);return !!(record&&record.until>Date.now()&&record.count>=5)}
export function failedLogin(ip){const rec=failures.get(ip)||{count:0,until:0};if(rec.until<Date.now()){rec.count=0;rec.until=Date.now()+15*60*1000}rec.count++;failures.set(ip,rec)}
export function successfulLogin(ip){failures.delete(ip)}
export function createSession(res){const raw=crypto.randomBytes(32).toString('base64url');const csrf=crypto.randomBytes(24).toString('base64url');const expires=Date.now()+duration;const sig=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');sessions.set(raw,{csrf,expires});
 res.setHeader('Set-Cookie',`${cookieName}=${raw}.${sig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(duration/1000)}${cookieSecure?'; Secure':''}`);return {csrf,expires};}
export function currentSession(req){const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='));if(!cookie)return null;const val=cookie.slice(cookieName.length+1);const pos=val.lastIndexOf('.');if(pos<1)return null;const raw=val.slice(0,pos),sig=val.slice(pos+1);const expected=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{if(!crypto.timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex')))return null}catch{return null}const s=sessions.get(raw);if(!s||s.expires<Date.now()){sessions.delete(raw);return null}return {...s,token:raw};}
export function clearSession(req,res){const s=currentSession(req);if(s)sessions.delete(s.token);res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecure?'; Secure':''}`)}
export function csrfMatches(req,s){const val=String(req.headers['x-csrf-token']||'');return val.length>16&&val===s?.csrf}
