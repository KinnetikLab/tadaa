import test from 'node:test';
import assert from 'node:assert/strict';
import {isClipCheckoutPaid,clampMembershipPromoDays,validSeatSelection,clipAmountFromMinor} from './ticketing-rules.mjs';

test('Clip payment only counts as paid after the verified completed status',()=>{
 assert.equal(isClipCheckoutPaid('CHECKOUT_COMPLETED'),true);
 assert.equal(isClipCheckoutPaid('CHECKOUT_CREATED'),false);
 assert.equal(isClipCheckoutPaid('COMPLETED'),false);
});
test('membership promotional access is clamped to 1..90 days',()=>{
 assert.equal(clampMembershipPromoDays(30),30);
 assert.equal(clampMembershipPromoDays(0),1);
 assert.equal(clampMembershipPromoDays(200),90);
 assert.equal(clampMembershipPromoDays('invalid'),30);
});
test('seat selection must match quantity and contain unique UUIDs',()=>{
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const uuid=x=>/^[0-9a-f-]{36}$/i.test(x);
 assert.equal(validSeatSelection([a,b],2,uuid),true);
 assert.equal(validSeatSelection([a,a],2,uuid),false);
 assert.equal(validSeatSelection([a],2,uuid),false);
});
test('Clip amount uses integer minor units and enforces one peso minimum',()=>{
 assert.equal(clipAmountFromMinor(1050),'10.50');
 assert.throws(()=>clipAmountFromMinor(99),/mínimo/);
 assert.throws(()=>clipAmountFromMinor(100.2),/mínimo/);
});
