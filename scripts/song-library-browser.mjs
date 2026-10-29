const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {writeChirpAttributions} from './local-audio-library.mjs';
const root=process.cwd(),base=process.env.BIRDSONG_PREVIEW_URL||'http://127.0.0.1:5173',out=root+'/artifacts/song-unlocks-and-workbench';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
const report=[],errors=[];const pass=message=>{report.push('PASS '+message);console.log(report.at(-1));};
function watch(page){page.on('pageerror',e=>errors.push(e.message));}
const approvedFile=root+'/src/data/dj-chirps.json',draftFile=root+'/.birdsong-library/drafts.json';
let testEntry;
try{
 // The familiar recording stays in flights until a third completed flight qualifies it.
 {
  const starters=['cardinal','robin','bluejay','mourning-dove','american-crow','carolina-wren','chickadee','titmouse'];
  const history=starters.flatMap(birdId=>Array.from({length:5},(_,i)=>({birdId,correct:true,mode:'flight',sessionId:i<3?'old-a':'old-b',timestamp:i+1,recordingId:`${birdId}-original`})));
  const sessions=['old-a','old-b'].map(id=>({id,mode:'flight',score:5,birdIds:starters,timestamp:1}));
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(({history,sessions})=>{
   if(!sessionStorage.getItem('seeded')){localStorage.setItem('birdsong-guess-history-v1',JSON.stringify(history));localStorage.setItem('birdsong-sessions-v1',JSON.stringify(sessions));sessionStorage.setItem('seeded','yes');}
   Math.random=()=>.99999;const NativeAudio=Audio;window.Audio=function(src){const audio=new NativeAudio(src);audio.play=()=>Promise.resolve();audio.pause=()=>{};window.__audioSrc=src;return audio;};
  },{history,sessions});
  const page=await context.newPage();watch(page);await page.goto(base);await page.getByRole('button',{name:/Play & Learn/}).first().click();await page.getByRole('button',{name:/Start a 10-question flight/}).click();
  async function answer(allWrong=false){await page.locator('.sound-button').click();const target=await page.evaluate(async()=>{const {birds}=await import('/src/data/birds.js'),{learningRecordings}=await import('/src/data/learning-recordings.js');const alternate=learningRecordings.find(r=>r.audio===window.__audioSrc);const bird=birds.find(b=>alternate?b.id===alternate.birdId:b.audio===window.__audioSrc);return {id:bird.id,name:bird.commonName,alternate:!!alternate};});await page.locator('.sound-button').click();const options=page.locator('.bird-option');await (target.id==='cardinal'&&!allWrong?options.filter({hasText:target.name}):options.filter({hasNotText:target.name}).first()).click();await page.locator('.answer-next').click();return target;}
  for(let i=0;i<10;i++)assert.equal((await answer()).alternate,false);
  await page.getByRole('region',{name:'New songs unlocked'}).waitFor();assert.equal(await page.locator('.song-reward').count(),1);assert.match(await page.locator('.song-reward').innerText(),/Northern Cardinal/);
  await page.getByRole('button',{name:'♪ Hear your new song',exact:true}).click();assert.match(await page.evaluate(()=>window.__audioSrc),/cardinal-xc121457/);
  await page.waitForTimeout(600);await page.screenshot({path:out+'/new-song-reward-390.png',fullPage:true});
  await page.getByRole('button',{name:/KEEP FLYING/}).click();let heardAlternate=false;for(let i=0;i<10;i++)if((await answer(true)).alternate)heardAlternate=true;assert.ok(heardAlternate);assert.equal(await page.locator('.song-rewards').count(),0);
  const unlocked=await page.evaluate(async()=>{const {songProgress}=await import('/src/song-progress.js');return songProgress(JSON.parse(localStorage.getItem('birdsong-guess-history-v1')),JSON.parse(localStorage.getItem('birdsong-sessions-v1')),'cardinal').unlocked;});assert.equal(unlocked,true);
  await page.getByRole('button',{name:'Return to Play & Learn',exact:true}).click();await page.getByRole('button',{name:/Practice calls/}).click();assert.equal(await page.locator('.practice-another-recording').count(),8);assert.ok(await page.getByText('✓ New song ready for flights').count());
  pass('familiar songs only before milestone; third completed flight unlocks Cardinal; earned-song celebration and playback; next flight includes alternate; later misses retain it; no repeat celebration; practice previews remain open');await context.close();
 }
 // Actual workbench draft-save, cross-browser reopen, trim, approval and DJ integration.
 {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();watch(page);
  await page.goto(base+'/?workbench=audio');await page.getByLabel('Song recording',{exact:true}).selectOption('cardinal-xc121457-v1');await page.getByRole('button',{name:'Suggest a chirp',exact:true}).waitFor();await page.getByRole('button',{name:'Suggest a chirp',exact:true}).click();
  await page.getByLabel('Chirp name',{exact:true}).fill('QA Cardinal chirp');await page.getByRole('button',{name:'▶ Preview chirp',exact:true}).click();await page.getByLabel('I previewed this cut and approve it as a DJ chirp.',{exact:true}).waitFor();await page.getByLabel('I previewed this cut and approve it as a DJ chirp.',{exact:true}).isEnabled();
  await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved in this project.',{exact:false}).waitFor();
  const data=await page.evaluate(async()=>await (await fetch('/__birdsong-library')).json());testEntry=data.drafts.find(d=>d.name==='QA Cardinal chirp');assert.ok(testEntry);await page.getByRole('link',{name:'Back to Birdsong',exact:false}).click();await context.close();
  const next=await browser.newContext({viewport:{width:390,height:844}});const editor=await next.newPage();watch(editor);await editor.goto(base+'/?workbench=audio');const draft=editor.locator('.library-grid article').filter({hasText:'QA Cardinal chirp'});await draft.getByRole('button',{name:'Edit draft',exact:true}).click();await editor.getByRole('button',{name:'Suggest a chirp',exact:true}).waitFor();
  await editor.getByRole('button',{name:'▶ Preview chirp',exact:true}).click();const confirm=editor.getByLabel('I previewed this cut and approve it as a DJ chirp.',{exact:true});await confirm.check();
  const oldStart=Number(await editor.getByRole('spinbutton',{name:'Workshop phrase start',exact:true}).inputValue());await editor.getByRole('button',{name:'Move selected phrase',exact:true}).focus();await editor.keyboard.press('ArrowLeft');assert.equal(await confirm.isChecked(),false);assert.equal(await confirm.isEnabled(),false);assert.ok(Number(await editor.getByRole('spinbutton',{name:'Workshop phrase start',exact:true}).inputValue())<=oldStart);
  await editor.getByRole('button',{name:'▶ Preview chirp',exact:true}).click();await confirm.check();await editor.getByRole('button',{name:'Add to DJ library',exact:true}).click();await editor.getByText('Chirp added to Birdsong’s DJ library.',{exact:false}).waitFor();
  const published=JSON.parse(await fs.readFile(approvedFile,'utf8')).find(d=>d.id===testEntry.id);assert.ok(published);assert.equal(published.birdId,'cardinal');assert.equal(published.sourceId,'cardinal-xc121457-v1');assert.match(published.note,/pitch unchanged/);
  const app=await next.newPage();watch(app);const urls=[];app.on('request',request=>urls.push(request.url()));await app.goto(base);await app.getByRole('button',{name:/Make Music/}).first().click();await app.getByRole('navigation',{name:'Music sections'}).getByRole('button',{name:'DJ station',exact:true}).click();
  assert.equal(await app.getByLabel('Sound source for lane 1',{exact:true}).inputValue(),'chirp:'+published.id);await app.getByRole('button',{name:/Preview lane 1:/}).click();await app.waitForFunction(()=>document.querySelector('.dj-audition').getAttribute('aria-pressed')==='true');await app.waitForTimeout(600);assert.ok(urls.some(url=>url.endsWith(published.audio)));
  await app.getByRole('button',{name:'▶ Play song',exact:true}).click();await app.getByRole('button',{name:'■ Stop song',exact:true}).waitFor();await app.getByRole('button',{name:'■ Stop song',exact:true}).click();
  await app.evaluate(()=>localStorage.setItem('birdsong-studio-mixes-v1',JSON.stringify([{name:'Legacy song',tempo:100,beat:'none',tracks:{'lane-0':{birdId:'cardinal',step:0,pitch:0,start:.2,length:2.5,volume:.55,enabled:true}}}])));
  await app.reload();await app.getByRole('button',{name:/Make Music/}).first().click();await app.getByRole('navigation',{name:'Music sections'}).getByRole('button',{name:'My saved songs',exact:true}).click();await app.getByRole('button',{name:'Open in DJ station →',exact:true}).click();assert.equal(await app.getByLabel('Sound source for lane 1',{exact:true}).inputValue(),'cardinal');
  pass('workbench native preview, loop, project draft save and reopening in another browser; keyboard trimming resets approval; promotion writes credited WAV; DJ defaults to approved chirp and plays it; legacy saved mixes retain original song source');
  const endpoint=await editor.evaluate(async()=>await (await fetch('/__birdsong-library')).json());
  assert.equal((await editor.request.post(base+'/__birdsong-library/save',{data:{}})).status(),403);
  assert.equal((await editor.request.post(base+'/__birdsong-library/save',{headers:{Origin:'https://example.invalid','X-Birdsong-Library-Token':endpoint.token},data:{}})).status(),403);pass('authoring writes reject missing token and foreign origin');
  await next.close();
 }
 assert.deepEqual(errors,[]);pass('no browser runtime errors');
 await fs.writeFile(out+'/browser-test-results.txt',report.join('\n')+'\n');
}finally{
 await browser.close();
 // Only the disposable QA entry is removed; author data present before this run is restored.
 if(testEntry){const approved=JSON.parse(await fs.readFile(approvedFile,'utf8'));const kept=approved.filter(entry=>entry.id!==testEntry.id);await fs.writeFile(approvedFile,JSON.stringify(kept,null,2)+'\n');await writeChirpAttributions(root,kept);const drafts=JSON.parse(await fs.readFile(draftFile,'utf8'));await fs.writeFile(draftFile,JSON.stringify(drafts.filter(entry=>entry.id!==testEntry.id),null,2)+'\n');}
 if(testEntry){await fs.rm(root+'/public/audio/chirps/'+testEntry.id+'.wav',{force:true});await fs.rm(root+'/.birdsong-library/audio/'+testEntry.id+'.wav',{force:true});}
}
