import crypto from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline';
const ask=async()=>{
 if(!process.stdin.isTTY)throw Error('Ejecuta este script en Terminal interactivo de macOS');
 return new Promise(resolve=>{const s=process.stdin;let password='';process.stdout.write('Contraseña nueva de administrador (mínimo 14 caracteres, no se mostrará): ');
 const prior=s.isRaw;s.setRawMode(true);s.resume();s.setEncoding('utf8');
 function handler(c){if(c==='\u0003'){s.setRawMode(prior);process.exit(130)}if(c==='\r'||c==='\n'){s.setRawMode(prior);s.removeListener('data',handler);console.log('');return resolve(password)}if(c==='\u007f'){password=password.slice(0,-1);return}password+=c}
 s.on('data',handler);
 });
};
const pwd=await ask();if(pwd.length<14){console.error('La contraseña debe tener al menos 14 caracteres.');process.exit(1)}
const salt=crypto.randomBytes(16);const passHash=crypto.scryptSync(pwd,salt,64,{N:16384,r:8,p:1});
const vars={TADAA_ENCRYPTION_KEY:crypto.randomBytes(32).toString('hex'),TADAA_SESSION_SECRET:crypto.randomBytes(48).toString('hex'),TADAA_ADMIN_PASSWORD_HASH:`scrypt:${salt.toString('hex')}:${passHash.toString('hex')}`};
const output=Object.entries(vars).map(([k,v])=>`${k}=${v}`).join('\n')+'\n';
const file='.secrets-generated.env';fs.writeFileSync(file,output,{mode:0o600,flag:'wx'});
console.log(`\n✓ Secretos generados en ${file} (modo 0600). NO subirlos a GitHub.\nCopia su contenido al panel Environment de xCloud, luego elimina el archivo local.\n`);
