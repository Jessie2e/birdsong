// Isolated browser QA: simulated capture + BirdNET worker; native WAV decoding/resampling.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const out='artifacts/auto-find';await fs.mkdir(out,{recursive:true});const results=[];
try{
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});
  await context.addInitScript(()=>{
   window.qa={duration:4,analyses:0,stopped:0,autoStop:false,failCapture:false,failAnalysis:false};
   const originalTimeout=window.setTimeout.bind(window);
   window.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===45000&&qa.autoStop?200:ms,...args);
   window.Worker=class{
    constructor(){window.qa.worker=this;}
    postMessage(data){if(data.type==='load')setTimeout(()=>this.onmessage?.({data:{type:'ready'}}),10);
     if(data.type==='analyze'){qa.analyses++;qa.stoppedBeforeAnalysis=qa.stopped>0;qa.pcmLength=data.pcm.length;setTimeout(()=>this.onmessage?.({data:qa.failAnalysis?{type:'error'}:{type:'results',matches:[],segments:[]}}),60);}}
    terminate(){this.onmessage=null;}
   };
   Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
    const ac=new AudioContext();qa.captureContext=ac;const dest=ac.createMediaStreamDestination();
    const track=dest.stream.getAudioTracks()[0];const stop=track.stop.bind(track);track.stop=()=>{qa.stopped++;stop();void ac.close();};return dest.stream;
   }});
   window.MediaRecorder=class{
    static isTypeSupported(){return true;}
    constructor(){this.state='inactive';this.mimeType='audio/wav';this.audioBitsPerSecond=768000;}
    start(){this.state='recording';}
    stop(){if(this.state!=='recording')return;this.state='inactive';queueMicrotask(()=>{
     if(qa.failCapture){this.onerror?.();this.onstop?.();return;}
     const rate=48000,n=Math.round(rate*qa.duration),bytes=new ArrayBuffer(44+n*2),v=new DataView(bytes);
     const str=(offset,text)=>[...text].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
     str(0,'RIFF');v.setUint32(4,36+n*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*2,true);
     for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(i*2*Math.PI*900/rate)*2000,true);
     this.ondataavailable?.({data:new Blob([bytes],{type:'audio/wav'})});this.onstop?.();
    });}
   };
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button',{name:/Explore/}).first().click();
  await page.getByRole('button',{name:/Listen outside/}).click();
  await page.getByRole('button',{name:/Load listening kit/}).click();
  const record=page.getByRole('button',{name:/Record birdsong|Stop recording/}),find=page.locator('.flock-analyze');
  await record.waitFor();
  async function recordAndStop(){await record.click();await page.getByRole('heading',{name:/Listening ·/}).waitFor();await record.click();}
  await recordAndStop();await page.waitForFunction(()=>qa.analyses===1);await page.getByText('Your suggestions are ready.',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>qa.stoppedBeforeAnalysis),true);assert.equal(await page.evaluate(()=>qa.pcmLength),192000);
  await find.click();await page.waitForFunction(()=>qa.analyses===2);await page.getByText('Your suggestions are ready.',{exact:false}).waitFor();
  await page.evaluate(()=>{qa.duration=45;qa.autoStop=true;});await record.click();await page.waitForFunction(()=>qa.analyses===3);await page.getByText('Your suggestions are ready.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>qa.pcmLength),2160000);
  await page.evaluate(()=>{qa.duration=1;qa.autoStop=false;});await recordAndStop();await page.getByText('Choose a recording between 3 and 45 seconds.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>qa.analyses),3);assert.equal(await find.isEnabled(),true);
  await page.evaluate(()=>{qa.duration=4;qa.failAnalysis=true;});await recordAndStop();await page.getByText('We couldn’t analyze that recording. Try again, or reload the listening kit.',{exact:true}).waitFor();
  await page.evaluate(()=>{qa.failAnalysis=false;});await find.click();await page.getByText('Your suggestions are ready.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>qa.analyses),5);
  await page.evaluate(()=>{qa.failCapture=true;});await recordAndStop();await page.getByText('Recording stopped unexpectedly. Please try again.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>qa.analyses),5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`${out}/listening-${viewport.width}.png`,fullPage:true});
  // Leaving while recording must release the mic without starting an analysis.
  await page.evaluate(()=>{qa.failCapture=false;});await record.click();await page.getByRole('heading',{name:/Listening ·/}).waitFor();await page.getByRole('button',{name:'← Explore',exact:true}).click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>qa.analyses),5);
  assert.deepEqual(errors,[]);results.push(`PASS ${viewport.width}×${viewport.height}: automatic manual-stop and 45-second-stop analysis, mic released first, native PCM conversion, short clip validation, model error/retry, capture failure, unmount cleanup, no overflow or page errors.`);console.log(results.at(-1));await context.close();
 }
 await fs.writeFile(`${out}/results.txt`,results.join('\n')+'\n');
}finally{await browser.close();}
