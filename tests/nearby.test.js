import test from 'node:test';
import assert from 'node:assert/strict';
import locations from '../api/location-search.js';
import nearby from '../api/nearby-birds.js';
function response() {
  return {code:200,headers:{}, setHeader(key,value){this.headers[key]=value;},status(code){this.code=code;return this;},json(payload){this.payload=payload;return this;}};
}
test('place lookup rejects short searches before contacting a provider', async t => {
  const request = {method:'GET',query:{q:' '}}; const res=response();
  const mock=t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not request');});
  await locations(request,res); assert.equal(res.code,400); assert.equal(mock.mock.callCount(),0);
});
test('US ZIP lookup returns a selection of named places with coordinates', async t => {
  let requested;
  t.mock.method(globalThis,'fetch',async url=>{requested=url;return {ok:true,json:async()=>({results:[{id:1,name:'Chicago',admin1:'Illinois',country:'United States',latitude:41.85,longitude:-87.65}]})};});
  const res=response();await locations({method:'GET',query:{q:'60614'}},res);
  assert.equal(requested.searchParams.get('countryCode'),'US');assert.equal(res.code,200);assert.equal(res.payload.places[0].label,'Chicago, Illinois, United States');assert.equal(res.payload.places[0].latitude,41.85);
});
test('provider failure returns a usable error instead of an empty result', async t => {
  t.mock.method(globalThis,'fetch',async()=>({ok:false}));const res=response();await locations({method:'GET',query:{q:'Chicago'}},res);assert.equal(res.code,502);
});
test('live nearby lookup rejects missing coordinates rather than treating them as zero', async t => {
  const mock=t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not request');});const res=response();await nearby({method:'GET',query:{},ebirdApiKey:'test-only'},res);assert.equal(res.code,400);assert.equal(mock.mock.callCount(),0);
});
test('nearby proxy rounds coordinates, clamps radius and returns only safe observation fields', async t => {
  let requested;
  t.mock.method(globalThis,'fetch',async url=>{requested=url;return {ok:true,json:async()=>[{speciesCode:'norcar',comName:'Northern Cardinal',sciName:'Cardinalis cardinalis',obsDt:'2026-10-08',lat:41.123456,lng:-87.123456,locName:'Private address'}]};});
  const res=response();await nearby({method:'GET',query:{lat:'41.123456',lng:'-87.123456',dist:'999',back:'7'},ebirdApiKey:'test-only'},res);
  assert.equal(res.code,200);assert.equal(requested.searchParams.get('lat'),'41.12');assert.equal(requested.searchParams.get('dist'),'50');assert.equal(res.payload.observations[0].locName,undefined);assert.equal(res.payload.observations[0].lat,undefined);
});
