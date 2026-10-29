// Uses an optional QA runtime; no gameplay dependency is added.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
const base=process.env.BIRDSONG_PREVIEW_URL || 'http://127.0.0.1:5173';
const folder=process.env.BIRDSONG_QA_OUTPUT || 'artifacts/stage-a';
await fs.mkdir(folder,{recursive:true});
const report=[]; const errors=[];
function passed(message){report.push(message);console.log(message);}
const starters=['cardinal','robin','bluejay','mourning-dove','american-crow','carolina-wren','chickadee','titmouse'];
async function setup(viewport, seed={}, real=false){
 const context=await browser.newContext({viewport});
 await context.addInitScript(({seed,real})=>{
   if(!sessionStorage.getItem('stage-a-seeded')){for(const [key,value] of Object.entries(seed))localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('stage-a-seeded','true');}
   const NativeAudio=window.Audio;
   window.Audio=function(src){
     const audio=new NativeAudio(src);window.__lastAudio=audio;window.__audioSrc=src;
     if(!real){audio.play=()=>window.__failAudio?Promise.reject(new Error('QA simulated failure')):Promise.resolve();audio.pause=()=>{};}
     return audio;
   };
 },{seed,real});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 return {page,context};
}
async function start(page){await page.getByRole('button',{name:/Play & Learn/}).first().click();await page.getByRole('button',{name:/Start a 10-question flight/}).click();}
async function target(page){
 await page.locator('.sound-button').click();
 const bird=await page.evaluate(async()=>{const {birds}=await import('/src/data/birds.js');const {learningRecordings}=await import('/src/data/learning-recordings.js');const variant=learningRecordings.find(r=>r.audio===window.__audioSrc);return birds.find(b=>variant?b.id===variant.birdId:b.audio===window.__audioSrc);});
 assert.ok(bird,'audio matches an existing bird');
 await page.locator('.sound-button').click();return bird;
}
async function choose(page,correct){const bird=await target(page);const choices=page.locator('.bird-option');const choice=correct?choices.filter({hasText:bird.commonName}):choices.filter({hasNotText:bird.commonName}).first();await choice.click();assert.equal(await page.locator('.bird-option:disabled').count(),4);return bird;}
async function noOverflow(page,label){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' has no horizontal overflow');}
async function nextVisible(page,height){const box=await page.locator('.answer-next').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=height,'Next Bird within viewport');}
async function finish(page,score){for(let i=0;i<10;i++){await choose(page,i<score);await page.locator('.answer-next').click();}assert.match(await page.locator('.flight-celebration h1').innerText(),new RegExp('^'+score));}
try{
 // Mobile, tablet and desktop answer states with actual keyboard and layout checks.
 for(const [width,height] of [[360,640],[390,844],[768,1024],[1440,1000]]){
  const {page,context}=await setup({width,height});await start(page);
  assert.equal(await page.locator('.bird-option:not(:disabled)').count(),4);
  await page.locator('.bird-option').first().focus();await page.keyboard.press('Enter');
  await nextVisible(page,height);await noOverflow(page,'feedback '+width);
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/flight-${width}-feedback.png`,fullPage:true});
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'answer-next');
  await page.keyboard.press('Enter');assert.match(await page.locator('.round-counter').innerText(),/Round 2/);
  await choose(page,true);await nextVisible(page,height);
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/flight-${width}-correct.png`,fullPage:true});
  await noOverflow(page,'correct '+width);
  passed(`PASS ${width}×${height}: four illustrated choices, answer before playback, correct feedback, Next Bird in viewport, keyboard progression, no overflow`);
  await context.close();
 }
 // Audio error + retry and lifecycle (controlled promise failure, followed by native local audio below).
 {
  const {page,context}=await setup({width:390,height:844});await start(page);
  await page.evaluate(()=>window.__failAudio=true);await page.locator('.sound-button').click();
  await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/couldn’t play/);
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/flight-audio-retry.png`,fullPage:true});
  await page.evaluate(()=>window.__failAudio=false);await page.getByRole('button',{name:'Retry bird call'}).click();
  assert.equal(await page.getByRole('alert').count(),0);assert.equal(await page.locator('.sound-button').getAttribute('aria-pressed'),'true');
  await page.locator('.sound-button').click();await page.locator('.sound-button').click();
  await page.evaluate(()=>window.__lastAudio.onended());await page.waitForFunction(()=>document.querySelector('.sound-button').getAttribute('aria-pressed')==='false');assert.equal(await page.locator('.sound-button').getAttribute('aria-pressed'),'false');
  passed('PASS audio failure message, retry, manual stop/replay, natural end state');await context.close();
 }
 // A perfect flight earns a real collection reward and only newly earned badges.
 {
  const history=starters.flatMap(birdId=>Array.from({length:3},()=>({birdId,correct:true,sessionId:'earlier-flight',mode:'flight',timestamp:1})));
  const seed={'birdsong-guess-history-v1':history,'birdsong-sessions-v1':[], 'birdsong-reset-at-v1':123,'birdsong-spotted-v1':['cardinal']};
  const {page,context}=await setup({width:390,height:844},seed);await start(page);await finish(page,10);
  assert.equal(await page.locator('.unlock-card .bird-eastern-bluebird').count(),1);
  assert.match(await page.locator('.badge-rewards').innerText(),/First Flight/);assert.match(await page.locator('.badge-rewards').innerText(),/Sharp Ears/);
  assert.ok(await page.locator('.recognized-bird').count()>0);
  await noOverflow(page,'perfect rewards');
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/results-390-perfect-rewards.png`,fullPage:true});
  for(const [width,height] of [[360,640],[768,1024],[1440,1000]]){await page.setViewportSize({width,height});await noOverflow(page,'results '+width);await page.waitForTimeout(650);await page.screenshot({path:`${folder}/results-${width}-perfect-rewards.png`,fullPage:true});}
  await page.setViewportSize({width:390,height:844});
  const saved=await page.evaluate(()=>({history:JSON.parse(localStorage.getItem('birdsong-guess-history-v1')),sessions:JSON.parse(localStorage.getItem('birdsong-sessions-v1')),flock:JSON.parse(localStorage.getItem('birdsong-discovered-v3')),spotted:JSON.parse(localStorage.getItem('birdsong-spotted-v1'))}));
  assert.deepEqual(saved.history.slice(0,history.length),history);assert.equal(saved.history.length,history.length+10);assert.equal(saved.sessions.length,1);assert.equal(saved.flock.filter(x=>x==='eastern-bluebird').length,1);assert.deepEqual(saved.spotted,['cardinal']);
  await page.getByRole('button',{name:/Visit your Eastern Bluebird/}).click();assert.equal(await page.locator('.practice-card .bird-eastern-bluebird').count(),1);assert.match(await page.locator('h2').innerText(),/new Flock friend/);
  await page.getByRole('button',{name:/KEEP FLYING/}).click();assert.match(await page.locator('.round-counter').innerText(),/Round 1/);
  await finish(page,0);assert.equal(await page.locator('.badge-rewards').filter({hasText:'First Flight'}).count(),0);assert.equal(await page.locator('.badge-rewards').filter({hasText:'Sharp Ears'}).count(),0);assert.equal(await page.locator('.unlock-card').count(),0);
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/results-390-low-followup.png`,fullPage:true});
  const idsBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-sessions-v1')).map(s=>s.id));
  await page.getByRole('button',{name:/KEEP FLYING/}).click();assert.match(await page.locator('.round-counter').innerText(),/Round 1/);assert.match(await page.locator('.score').innerText(),/0 pts/);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-sessions-v1')).map(s=>s.id)),idsBefore);
  await finish(page,0);const idsAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-sessions-v1')).map(s=>s.id));assert.equal(new Set(idsAfter).size,3);
  await page.getByRole('button',{name:/Practice the .*birds? you missed/}).click();assert.ok(await page.locator('.practice-card').count()>0);await page.getByRole('button',{name:/KEEP FLYING/}).click();assert.match(await page.locator('.round-counter').innerText(),/Round 1/);
  await page.getByRole('button',{name:'Return to Play & Learn',exact:true}).click();await page.getByRole('heading',{name:'Play & Learn.',exact:true}).waitFor();
  passed('PASS perfect + low + no-reward flights; earned Eastern Bluebird artwork; recognition milestones; new First Flight/Sharp Ears badges; no repeat awards; saved history/ownership preserved; visit earned bird; missed practice → regular flight; Keep Flying → new session; return to Play & Learn');await context.close();
 }
 // Existing recognition, badges, ownership and unrelated progress survive a no-reward flight and reload.
 {
  const catalog=await (async()=>{const {page,context}=await setup({width:390,height:844});const ids=await page.evaluate(async()=>(await import('/src/data/birds.js')).birds.map(b=>b.id));await context.close();return ids;})();
  const history=catalog.flatMap(birdId=>Array.from({length:6},(_,i)=>({birdId,correct:i>0,sessionId:i<4?'old-a':'old-b',mode:'flight',timestamp:i+1})));
  const sessions=[{id:'old-a',mode:'flight',score:10,birdIds:starters,timestamp:1},{id:'old-comparison',mode:'sound-alikes',pairId:'cardinal-finch',score:6,timestamp:1}];
  const companion={birdId:'robin',name:'Sunny',habitat:'garden',care:[]};
  const claims=[{id:'field-notes',birdId:'eastern-bluebird'}];
  const seed={'birdsong-discovered-v3':catalog,'birdsong-guess-history-v1':history,'birdsong-sessions-v1':sessions,'birdsong-spotted-v1':['robin'],'birdsong-sanctuary-v1':companion,'birdsong-world-milestones-v1':claims};
  const {page,context}=await setup({width:390,height:844},seed);await start(page);await finish(page,0);
  assert.equal(await page.locator('.badge-rewards,.recognition-rewards,.unlock-card').count(),0);await noOverflow(page,'no rewards');
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/results-390-low-no-rewards.png`,fullPage:true});
  const stored=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
  await page.reload();
  for(const [key,value] of Object.entries(stored))assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),value);
  passed('PASS no-new-reward result; existing badges not announced again; complete saved progress unchanged on reload (including companion and collection history)');await context.close();
 }
 // An 8/10 flight retains every proposed secondary action.
 {
  const {page,context}=await setup({width:390,height:844});await start(page);await finish(page,8);
  for(const name of [/KEEP FLYING/,/Practice the .*birds? you missed/,/Visit your Eastern Bluebird/,/Return to Play & Learn/]) assert.ok(await page.getByRole('button',{name}).count()>0);
  assert.equal(await page.locator('.perfect-flight').count(),0);assert.equal(await page.locator('.high-flight').count(),1);
  await page.waitForTimeout(650);await page.screenshot({path:`${folder}/results-390-high-all-actions.png`,fullPage:true});await noOverflow(page,'high score');
  await page.getByRole('button',{name:/KEEP FLYING/}).click();await finish(page,8);
  assert.equal(await page.locator('.unlock-card .bird-nuthatch').count(),1);
  const flock=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-discovered-v3')));
  assert.equal(flock.filter(id=>id==='eastern-bluebird').length,1);assert.equal(flock.filter(id=>id==='nuthatch').length,1);
  assert.equal(await page.locator('.badge-rewards').filter({hasText:'First Flight'}).count(),0);
  passed('PASS 8/10 high-score reward and full secondary action hierarchy; subsequent qualifying flight welcomes the next bird without duplicating ownership or First Flight');await context.close();
 }
 // Native playback: choose a local reference call through the planner and allow actual Chrome audio decoding.
 {
  const {page,context}=await setup({width:390,height:844},{},true);await start(page);
  let tested=false;
  for(let i=0;i<10&&!tested;i++){
   await page.locator('.sound-button').click();const src=await page.evaluate(()=>window.__audioSrc);
   if(!src.startsWith('http')){
    await page.waitForFunction(()=>window.__lastAudio.currentTime>0,{},{timeout:10000});
    await page.locator('.sound-button').click();assert.equal(await page.locator('.sound-button').getAttribute('aria-pressed'),'false');
    await page.locator('.sound-button').click();await page.waitForFunction(()=>window.__lastAudio.currentTime>0,{},{timeout:10000});await page.locator('.sound-button').click();
    const audioPattern=/\/(?:src\/assets\/audio|audio\/learning)\//;await page.route(audioPattern,route=>route.abort());await page.locator('.sound-button').click();await page.getByRole('alert').waitFor();
    await page.unroute(audioPattern);await page.getByRole('button',{name:'Retry bird call'}).click();
    await page.waitForFunction(()=>window.__lastAudio.currentTime>0,{},{timeout:10000});assert.equal(await page.getByRole('alert').count(),0);tested=true;
   }else{
    await page.locator('.bird-option').first().click();await page.locator('.answer-next').click();
   }
  }
  assert.ok(tested);passed('PASS native Chrome playback and replay: existing local OGG decoded and playback time advanced; aborted audio request showed error and native retry succeeded');await context.close();
 }
 assert.deepEqual(errors,[]);passed('PASS no browser runtime errors');
 await fs.writeFile(`${folder}/browser-test-results.txt`,report.join('\n')+'\n');
}finally{await browser.close();}
