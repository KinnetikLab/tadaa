import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRfc,validRfc,rollGolden,nowState,discounted,folio,accountLevel,accountBadges} from './features.mjs';

test('RFC: normaliza y valida persona física y moral',()=>{
 assert.equal(normalizeRfc(' gode-561231-gr8 '),'GODE561231GR8');
 assert.ok(validRfc('GODE561231GR8'));
 assert.ok(validRfc('ABC010203AB9'));
 assert.ok(!validRfc('GODE561331GR8'),'mes 13 inválido');
 assert.ok(!validRfc('XXX'));
 assert.ok(!validRfc(''));
});
test('Golden: 1 de cada N con generador inyectable',()=>{
 assert.equal(rollGolden(100,()=>0),true);
 assert.equal(rollGolden(100,()=>57),false);
 assert.equal(rollGolden(1,()=>0),false,'odds < 2 desactiva');
 let wins=0;for(let i=0;i<20000;i++)if(rollGolden(100))wins++;
 assert.ok(wins>120&&wins<290,'≈1% en 20k tiradas: '+wins);
});
test('Now!: ventana upcoming/open/closed/off',()=>{
 const at=new Date('2026-12-01T20:00:00Z');
 assert.equal(nowState({enabled:true,opens_at:'2026-12-01T21:00:00Z'},at),'upcoming');
 assert.equal(nowState({enabled:true,opens_at:'2026-12-01T19:00:00Z',closes_at:'2026-12-01T22:00:00Z'},at),'open');
 assert.equal(nowState({enabled:true,opens_at:'2026-12-01T18:00:00Z',closes_at:'2026-12-01T19:00:00Z'},at),'closed');
 assert.equal(nowState({enabled:false,opens_at:'2026-12-01T19:00:00Z'},at),'off');
});
test('Membresía: $100 con 50% = $50',()=>{assert.equal(discounted(10000,50),5000);assert.equal(discounted(10000,0),10000)});
test('Folio legible',()=>assert.equal(folio('40ef25ab-1111-2222-3333-444455556666'),'TD-40EF25AB'));
test('Niveles e insignias',()=>{
 assert.equal(accountLevel({}).name,'Curioso');
 const l=accountLevel({tickets:4,attended:1});assert.equal(l.level,2);assert.ok(l.progress>=0&&l.progress<=100);
 assert.deepEqual(accountBadges({tickets:1,golden:1}).map(b=>b.key),['primer_plan','golden']);
});
