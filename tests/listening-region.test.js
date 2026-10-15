import test from 'node:test';
import assert from 'node:assert/strict';
import { regionalMatches, seasonWeek } from '../src/listening-region.js';
test('seasonal date input follows the BirdNET 48-bin year',()=>{
 assert.equal(seasonWeek(new Date(2026,0,1)),1);
 assert.equal(seasonWeek(new Date(2026,9,9)),38);
 assert.equal(seasonWeek(new Date(2026,11,31)),48);
});
test('range filtering removes unlikely species without boosting weak local evidence',()=>{
 const matches=[{scientificName:'Tyrannus couchii',score:.127},{scientificName:'Corvus brachyrhynchos',score:.129},{scientificName:'Thryothorus ludovicianus',score:.03}];
 const priors={'Tyrannus couchii':.00055,'Corvus brachyrhynchos':.98,'Thryothorus ludovicianus':.94};
 assert.equal(regionalMatches(matches,.1,'world',null).length,2);
 assert.deepEqual(regionalMatches(matches,.1,'alabama',priors),[matches[1]]);
 assert.deepEqual(regionalMatches(matches,.35,'alabama',priors),[]);
 assert.deepEqual(regionalMatches(matches,.1,'alabama',null),[]);
});
