// Read-only DJ QA. Uses isolated browser data and native Web Audio; never modifies approved assets.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BIRDSONG_PREVIEW_URL||'http://127.0.0.1:5173',out=process.env.BIRDSONG_QA_OUTPUT||'artifacts/dj-chirps';await fs.mkdir(out,{recursive:true});
const chirps=JSON.parse(await fs.readFile('src/data/dj-chirps.json','utf8'));
const expected=Object.fromEntries(chirps.map(c=>[c.birdId,c]));const report=[];const pass=s=>{report.push('PASS '+s);console.log(report.at(-1));};
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});await context.addInitScript(()=>{
   window.qa={sounds:[],active:0,fail:false};
   const fetchNative=fetch;window.fetch=(...args)=>qa.fail&&String(args[0]).includes('/audio/chirps/')?Promise.resolve(new Response('',{status:503})):fetchNative(...args);
   const Native=AudioContext;window.AudioContext=class extends Native{createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source);source.start=(...args)=>{let peak=0;const samples=source.buffer?.getChannelData(0)||[];for(const n of samples)peak=Math.max(peak,Math.abs(n));qa.sounds.push({duration:source.buffer?.duration,peak,gain:source.playbackRate.value});qa.active++;source.addEventListener('ended',()=>qa.active--,{once:true});start(...args);};source.stop=(...args)=>stop(...args);return source;}};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function dj(){await page.goto(base);await page.getByRole('button',{name:/Make Music/}).first().click();await page.getByRole('navigation',{name:'Music sections'}).getByRole('button',{name:'DJ station',exact:true}).click();}
  await dj();
  for(const [index,id]of ['cardinal','bluejay','robin','carolina-wren'].entries())assert.equal(await page.getByLabel(`Sound source for lane ${index+1}`,{exact:true}).inputValue(),'chirp:'+expected[id].id);
  const lane=page.locator('.studio-voice').first();await lane.locator('summary').click();const source=page.getByLabel('Sound source for lane 1',{exact:true});
  for(const clip of chirps){await source.selectOption('chirp:'+clip.id);const before=await page.evaluate(()=>qa.sounds.length);await page.getByRole('button',{name:/Preview lane 1:/}).click();await page.waitForFunction(n=>qa.sounds.length>n,before);const sound=await page.evaluate(()=>qa.sounds.at(-1));assert.ok(Math.abs(sound.duration-clip.duration)<.002);assert.ok(sound.peak>.00001);assert.equal(sound.gain,1);await page.waitForFunction(()=>document.querySelector('.dj-audition').getAttribute('aria-pressed')==='false');}
  // A new source loads its own audio; longer originals remain available.
  await source.selectOption('cardinal');await page.getByRole('button',{name:/Preview lane 1:/}).click();await page.waitForFunction(()=>qa.sounds.at(-1).duration>2);await page.getByRole('button',{name:/Preview lane 1:/}).click();await page.waitForFunction(()=>qa.active===0);
  await source.selectOption('chirp:'+expected.cardinal.id);await page.locator('.studio-transport select').nth(1).selectOption('woodland');await page.locator('.studio-transport select').nth(0).selectOption('120');
  await page.getByRole('button',{name:'▶ Play song',exact:true}).click();await page.getByRole('button',{name:'■ Stop song',exact:true}).waitFor();assert.equal(await source.isDisabled(),true);
  await page.waitForTimeout(4600);assert.ok(await page.evaluate(()=>qa.sounds.length>10));await page.getByRole('button',{name:'■ Stop song',exact:true}).click();await page.waitForFunction(()=>qa.active===0);
  await page.getByLabel('Song name',{exact:true}).fill('Approved chirp mix');await page.getByRole('button',{name:'Save song',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('birdsong-studio-mixes-v1')));assert.equal(saved[0].tracks['lane-0'].birdId,'chirp:'+expected.cardinal.id);assert.equal(saved[0].tempo,120);assert.equal(saved[0].beat,'woodland');
  await dj();await page.locator('.studio-save select').selectOption('Approved chirp mix');assert.equal(await source.inputValue(),'chirp:'+expected.cardinal.id);assert.equal(await page.locator('.studio-transport select').nth(0).inputValue(),'120');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`${out}/dj-${viewport.width}.png`,fullPage:true});
  // Existing recipes retain original source IDs after deployment.
  await page.evaluate(()=>{const mixes=JSON.parse(localStorage.getItem('birdsong-studio-mixes-v1'));mixes.push({name:'Legacy original',tempo:100,beat:'none',tracks:{'lane-0':{birdId:'cardinal',step:0,pitch:0,start:.2,length:2.5,volume:.55,enabled:true}}});localStorage.setItem('birdsong-studio-mixes-v1',JSON.stringify(mixes));});
  await dj();await page.locator('.studio-save select').selectOption('Legacy original');assert.equal(await source.inputValue(),'cardinal');
  // Uncached failure offers retry and recovers without changing the saved recipe.
  await page.reload();await page.evaluate(()=>{qa.fail=true;});await page.getByRole('button',{name:/Make Music/}).first().click();await page.getByRole('navigation',{name:'Music sections'}).getByRole('button',{name:'DJ station',exact:true}).click();await page.getByRole('button',{name:/Preview lane 1:/}).click();await page.getByRole('alert').filter({hasText:'This lane couldn’t preview.'}).waitFor();await page.evaluate(()=>{qa.fail=false;});await page.getByRole('button',{name:/Preview lane 1:/}).click();await page.waitForFunction(()=>qa.sounds.length>0);
  assert.deepEqual(errors,[]);pass(`${viewport.width}×${viewport.height}: all ${chirps.length} chirps decode and play with correct durations and nonzero audio; four default lanes use latest approved cuts; originals playable; loop/beat/stop; source loading failure/retry; saved chirp and legacy mixes; no overflow/runtime errors.`);await context.close();
 }
 await fs.writeFile(out+'/results.txt',report.join('\n')+'\n');
}finally{await browser.close();}
