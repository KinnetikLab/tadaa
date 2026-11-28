import test from 'node:test';
import assert from 'node:assert/strict';
import {newCode,passPayload,verifyPass,inviteLink,icsFor,slugify} from './invitations.mjs';

const id='3f2b6c1e-9a1d-4c3e-8f00-1234567890ab';
test('código de sorteo con forma TD-XXXX-XXXX sin caracteres ambiguos',()=>{const c=newCode();assert.match(c,/^TD-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)});
test('QR del pase: válido 2 minutos, rechaza firmas alteradas y vencidos',()=>{const now=Date.now(),m=Math.floor(now/60000);
 assert.deepEqual(verifyPass(passPayload(id,m),now),{passId:id});assert.deepEqual(verifyPass(passPayload(id,m-2),now),{passId:id});
 assert.deepEqual(verifyPass(passPayload(id,m-5),now),{expired:true});assert.equal(verifyPass(passPayload(id,m).slice(0,-1)+'x',now),null);assert.equal(verifyPass('basura'),null)});
test('enlace e ics',()=>{assert.equal(inviteLink('/experience/minisitios/bttf/','abc'),'/experience/minisitios/bttf/?inv=abc');assert.equal(inviteLink('/experience/landings/?s=kb','abc'),'/experience/landings/?s=kb&inv=abc');
 const ics=icsFor({title:'X',start:'2026-12-01T18:00:00Z',url:'https://meet.jit.si/a'});assert.match(ics,/DTSTART:20261201T180000Z/);assert.match(ics,/DTEND:20261201T183000Z/);assert.equal(slugify('Volver al Futuro: El Musical'),'volver-al-futuro-el-musical')});
