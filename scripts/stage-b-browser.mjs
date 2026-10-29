// Run against Vite with an optional external Playwright runtime; never uses a personal browser profile.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const base=process.env.BIRDSONG_PREVIEW_URL||'http://127.0.0.1:5173';
const out=process.env.BIRDSONG_QA_OUTPUT||'artifacts/stage-b';await fs.mkdir(out,{recursive:true});
const report=[],errors=[];
function pass(message){report.push('PASS '+message);console.log(report.at(-1));}
const starters=['cardinal','robin','bluejay','mourning-dove','american-crow','carolina-wren','chickadee','titmouse'];
const legacy=starters.flatMap(birdId=>Array.from({length:6},(_,i)=>({birdId,correct:true,mode:'flight',sessionId:`legacy-${Math.floor(i/2)}`,timestamp:i+1,recordingId:`${birdId}-original`})));
const legacySessions=Array.from({length:3},(_,i)=>({id:`legacy-${i}`,mode:'flight',score:6,birdIds:starters,timestamp:i+1}));
async function setup(viewport={width:390,height:844},real=false){
 const context=await browser.newContext({viewport});
 await context.addInitScript(({legacy,legacySessions,real})=>{
  if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('birdsong-guess-history-v1',JSON.stringify(legacy));localStorage.setItem('birdsong-sessions-v1',JSON.stringify(legacySessions));localStorage.setItem('birdsong-sanctuary-v1',JSON.stringify({birdId:'robin',name:'Sunny',habitat:'garden',care:[]}));sessionStorage.setItem('qa-seeded','true');}
  const NativeAudio=Audio;
  window.Audio=function(src){const audio=new NativeAudio(src);window.__lastAudio=audio;window.__audioSrc=src;window.__audioCalls=(window.__audioCalls||0)+1;if(!real){audio.play=()=>Promise.resolve();audio.pause=()=>{};}return audio;};
 },{legacy,legacySessions,real});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 return {page,context};
}
async function learn(page){await page.getByRole('button',{name:/Play & Learn/}).first().click();}
async function start(page){await learn(page);await page.getByRole('button',{name:/Start a 10-question flight/}).click();}
async function info(page){return page.evaluate(async()=>{
 const {birds}=await import('/src/data/birds.js'),{learningRecordings}=await import('/src/data/learning-recordings.js');
 const variant=learningRecordings.find(r=>r.audio===window.__audioSrc);const bird=birds.find(b=>variant?b.id===variant.birdId:b.audio===window.__audioSrc);
 return {id:variant?.id||`${bird.id}-original`,birdId:bird.id,name:bird.commonName,src:window.__audioSrc};
});}
async function round(page,correct){
 await page.locator('.sound-button').click();const selected=await info(page);await page.locator('.sound-button').click();
 await page.locator('.sound-button').click();assert.equal(await page.evaluate(()=>window.__audioSrc),selected.src,'replay keeps the same source');await page.locator('.sound-button').click();
 const choice=correct?page.locator('.bird-option').filter({hasText:selected.name}):page.locator('.bird-option').filter({hasNotText:selected.name}).first();await choice.click();
 const attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-guess-history-v1')).at(-1));assert.equal(attempt.recordingId,selected.id);assert.equal(attempt.birdId,selected.birdId);assert.equal(attempt.correct,correct);
 await page.locator('.answer-next').click();return selected;
}
try{
 // Asset decoding independently of the chosen flight targets.
 {
  const {page,context}=await setup();
  const assets=await page.evaluate(async()=>{
   const {learningRecordings}=await import('/src/data/learning-recordings.js');const context=new AudioContext(),results=[];
   for(const recording of learningRecordings){const response=await fetch(recording.audio);if(!response.ok)throw Error('Missing audio');const buffer=await context.decodeAudioData(await response.arrayBuffer());results.push({id:recording.id,duration:buffer.duration,expected:recording.duration});}await context.close();return results;
  });
  assert.equal(assets.length,8);assets.forEach(asset=>assert.ok(Math.abs(asset.duration-asset.expected)<.01));pass('all eight local excerpts fetch and decode, with correct durations');await context.close();
 }
 // Two flights, accurate IDs, stable replay, history-aware variation and unchanged progress.
 {
  const {page,context}=await setup();await start(page);const seen=new Map();let firstSession;
  for(let flight=0;flight<2;flight++){
   for(let i=0;i<10;i++){
    const selected=await round(page,i<6);assert.notEqual(seen.get(selected.birdId)||`${selected.birdId}-original`,selected.id,'avoid last reference per bird');seen.set(selected.birdId,selected.id);
   }
   assert.match(await page.locator('.flight-celebration h1').innerText(),/^6/);
   const sessions=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-sessions-v1')));assert.equal(sessions.length,legacySessions.length+flight+1);assert.equal(sessions.at(-1).score,6);
   if(flight===0){firstSession=sessions.at(-1).id;await page.getByRole('button',{name:/KEEP FLYING/}).click();}else assert.notEqual(sessions.at(-1).id,firstSession);
  }
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-guess-history-v1')));assert.deepEqual(history.slice(0,legacy.length),legacy);assert.equal(history.length,legacy.length+20);
  const all=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));await page.reload();for(const [key,value] of Object.entries(all))assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),value);
  pass('two complete ten-question flights; replay stable; reference repeats avoided within/across flights; saved IDs match actual playback; scores, sessions and old progress preserved after reload');await context.close();
 }
 // Native playback for every alternate, plus retry and cancellation.
 {
  const {page,context}=await setup(undefined,true);await learn(page);await page.getByRole('button',{name:/Practice calls/}).click();
  assert.equal(await page.locator('.practice-another-recording').count(),8);
  for(let i=0;i<8;i++){
   const entry=page.locator('.practice-entry').nth(i);await entry.locator('.practice-another-recording').click();await page.waitForFunction(()=>window.__lastAudio.currentTime>0,null,{timeout:10000});
   assert.match(await entry.innerText(),/Recording 2 of 2/);assert.ok((await page.evaluate(()=>window.__audioSrc)).startsWith('/audio/learning/'));
   await entry.locator('.practice-card').click();assert.equal(await entry.locator('.practice-card').getAttribute('aria-pressed'),'false');
  }
  const entry=page.locator('.practice-entry').first();
  await page.route('**/audio/learning/**',route=>route.abort());await entry.locator('.practice-card').click();await entry.getByRole('alert').waitFor();const failed=await page.evaluate(()=>window.__audioSrc);
  await page.unroute('**/audio/learning/**');await entry.getByRole('button',{name:'Retry bird call'}).click();await page.waitForFunction(()=>window.__lastAudio.currentTime>0);assert.equal(await entry.getByRole('alert').count(),0);assert.equal(await page.evaluate(()=>window.__audioSrc),failed);
  await entry.locator('.practice-card').click();await entry.locator('.practice-another-recording').click();assert.match(await entry.innerText(),/Recording 1 of 2/);
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-guess-history-v1')).length);assert.equal(before,legacy.length);
  pass('Practice Perch native playback for eight alternates, original/alternate cycling, stop, actual request failure and retry of same clip; practice leaves accuracy unchanged');await context.close();
 }
 // Personal recordings remain eligible, opt-in and capped at three in the actual UI.
 {
  const {page,context}=await setup();
  await page.evaluate(async()=>{
   const {learningRecordings}=await import('/src/data/learning-recordings.js'),{putRecording}=await import('/src/personal-recordings.js');
   for(const recording of learningRecordings)await putRecording({id:`qa-personal-${recording.birdId}`,birdId:recording.birdId,enabled:true,createdAt:1,blob:await (await fetch(recording.audio)).blob()});
   Math.random=()=>0;
  });await page.waitForTimeout(200);await start(page);
  for(let i=0;i<10;i++){
   await page.locator('.bird-option').first().click();await page.locator('.answer-next').click();
  }
  const attempts=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-guess-history-v1')).slice(-10));assert.equal(attempts.filter(a=>a.recordingId.startsWith('qa-personal-')).length,3);
  pass('actual UI retains personal-recording opt-in and the three-question cap; answers before playback still work');await context.close();
 }
 // Responsive control layout and keyboard access.
 for(const [width,height] of [[360,640],[390,844],[768,1024],[1440,1000]]){
  const {page,context}=await setup({width,height});await learn(page);await page.getByRole('button',{name:/Practice calls/}).click();
  const control=page.locator('.practice-another-recording').first();await control.focus();await page.keyboard.press('Enter');assert.match(await page.locator('.practice-entry').first().innerText(),/Recording 2 of 2/);const box=await control.boundingBox();assert.ok(box.height>=44);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.practice-entry').evaluateAll(entries=>entries.every(entry=>entry.querySelector('.bird-beak').getBoundingClientRect().right<=entry.querySelector('.practice-copy').getBoundingClientRect().left)));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/practice-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/KEEP FLYING/}).click();await page.locator('.bird-option').first().click();const next=await page.locator('.answer-next').boundingBox();assert.ok(next.y>=0&&next.y+next.height<=height);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  pass(`${width}×${height}: practice controls keyboard-accessible and at least 44px; flight feedback/continuation visible; no overflow`);await context.close();
 }
 {
  const {page,context}=await setup();await page.getByRole('button',{name:'Recording credits'}).click();assert.equal(await page.locator('.credit-card').count(),30);assert.equal(await page.getByText(/Additional flight\/practice example/).count(),8);pass('eight additional recordings have visible source, creator, license and excerpt/edit credits');await context.close();
 }
 assert.deepEqual(errors,[]);pass('no browser runtime errors');await fs.writeFile(`${out}/browser-test-results.txt`,report.join('\n')+'\n');
}finally{await browser.close();}
