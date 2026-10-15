import test from 'node:test';
import assert from 'node:assert/strict';
import {claimMilestone,arrangementEligible,careProgress,localDay} from '../src/world-progress.js';
import {starterBirds,unlockOrder} from '../src/flock.js';
test('every route uses the same next bird and one milestone cannot be farmed',()=>{
 const first=claimMilestone('field-note',starterBirds,[],123);assert.equal(first.birdId,'eastern-bluebird');assert.equal(first.createdAt,123);assert.equal(claimMilestone('field-note',starterBirds,[first]),null);
 const next=claimMilestone('first-arrangement',starterBirds,[first]);assert.equal(next.birdId,'nuthatch');assert.equal(claimMilestone('unknown',starterBirds,[]),null);
});
test('previously welcomed birds are preserved, including a fully collected catalog',()=>{
 assert.equal(claimMilestone('field-note',[...starterBirds,'eastern-bluebird'],[]).birdId,'nuthatch');assert.equal(claimMilestone('field-note',unlockOrder,[]).birdId,null);
});
test('music rewards require three distinct enabled phrases rather than duplicate lanes',()=>{
 const a={birdId:'cardinal',start:0,length:2,pitch:0,enabled:true};assert.equal(arrangementEligible({a,b:a,c:a}),false);assert.equal(arrangementEligible({a,b:{...a,start:1},c:{...a,pitch:2}}),true);assert.equal(arrangementEligible({a,b:{...a,start:1},c:{...a,pitch:2,enabled:false}}),false);
});
test('companion days are distinct local calendar days, with no streak requirement',()=>{
 assert.equal(careProgress([{day:'2026-10-01',action:'visit'},{day:'2026-10-01',action:'listen'},{day:'2026-10-09',action:'visit'},{day:'2026-10-15',action:'listen'}]),3);assert.equal(localDay(new Date(2026,0,2,23,55)),'2026-01-02');
});
