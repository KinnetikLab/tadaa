import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizedRecord,validateFields,INTEGRATIONS} from './catalog.mjs';

test('never includes API secrets in response metadata',()=>{
 const r=sanitizedRecord('clip',{fields:{apiKey:'my-secret-token'},configured:true,testStatus:'passed'});
 assert.equal(r.values.apiKey,undefined);assert.equal(r.saved.apiKey,true);
 assert.equal(JSON.stringify(r).includes('my-secret-token'),false);
});
test('retains existing secret if submitted blank',()=>{
 const r=validateFields('clip',{apiKey:''},{apiKey:'existing-key'});
 assert.equal(r.fields.apiKey,'existing-key');assert.equal(r.configured,true);
});
test('rejects unknown field and invalid email',()=>{
 assert.throws(()=>validateFields('resend',{apiKey:'abc',fromEmail:'bad@'},{}),/inválido/);
 assert.throws(()=>validateFields('clip',{unexpected:'hello'},{}),/no permitido/);
});
test('has the desired service catalog',()=>{
 for(const id of ['clip','twilio','resend','googlemaps','postal','facturama','envia','storage','expo'])assert.ok(INTEGRATIONS[id]);
});
