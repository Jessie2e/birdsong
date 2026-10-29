import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {audioCredits} from '../src/audio-credits.js';

export function librarySource(id) {
  return audioCredits.find(source => (source.id || `${source.birdId}-original`) === id);
}
async function readJSON(file) {try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return [];throw error;}}
async function atomic(file,content) {await mkdir(path.dirname(file),{recursive:true});const temporary=`${file}.${randomUUID()}.tmp`;await writeFile(temporary,content);await rename(temporary,file);}
export function validateChirp(payload) {
  const source=librarySource(payload.sourceId);
  if(!source)throw Error('Choose an existing Birdsong recording.');
  if(!['draft','approved'].includes(payload.status))throw Error('Choose draft or approved.');
  if(typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>80)throw Error('Use a chirp name of 1–80 characters.');
  if(!Number.isFinite(payload.start)||!Number.isFinite(payload.end)||payload.start<0||payload.end-payload.start<.0499||payload.end-payload.start>3.001)throw Error('Select a chirp between 0.05 and 3 seconds.');
  if(source.duration&&payload.end>source.duration+.001)throw Error('Selection exceeds the source recording.');
  if(!Number.isFinite(payload.volume)||payload.volume<=0||payload.volume>2)throw Error('Choose a volume above zero, up to 200%.');
  if(payload.status==='approved'&&payload.confirmed!==true)throw Error('Preview and approve the chirp before adding it to the DJ library.');
  if(typeof payload.audioBase64!=='string'||payload.audioBase64.length>600000||!/^[A-Za-z0-9+/]+={0,2}$/.test(payload.audioBase64))throw Error('Invalid audio data.');
  const bytes=Buffer.from(payload.audioBase64,'base64');
  if(bytes.length<4844||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.toString('ascii',12,16)!=='fmt '||bytes.readUInt32LE(16)!==16||bytes.readUInt16LE(20)!==1||bytes.readUInt16LE(22)!==1||bytes.readUInt32LE(24)!==48000||bytes.readUInt16LE(34)!==16||bytes.toString('ascii',36,40)!=='data'||bytes.readUInt32LE(40)!==bytes.length-44||bytes.readUInt32LE(4)!==bytes.length-8)throw Error('Expected a mono, 48 kHz PCM WAV chirp.');
  const duration=(bytes.length-44)/96000;
  if(Math.abs(duration-(payload.end-payload.start))>.002||duration>3.001)throw Error('Rendered duration does not match the selected phrase.');
  let peak=0;for(let offset=44;offset+1<bytes.length;offset+=2)peak=Math.max(peak,Math.abs(bytes.readInt16LE(offset)));
  if(!peak)throw Error('This chirp is silent. Choose an audible moment.');
  return {source,bytes,duration};
}
export async function writeChirpAttributions(root,entries) {
  const content='# Birdsong approved DJ chirps\n\nAudio assets retain the individual source licenses below, separate from application code.\n\n'+entries.map(entry=>`## ${entry.name}\n\n- File: ${entry.audio.split('/').at(-1)}\n- Creator: ${entry.creator}\n- Source: ${entry.sourceUrl}\n- License: ${entry.license}${entry.licenseUrl?' — '+entry.licenseUrl:''}\n- Changes: ${entry.note}\n- SHA-256: ${entry.sha256}\n`).join('\n');
  await atomic(path.join(root,'public/audio/chirps/ATTRIBUTIONS.md'),content);
}
export async function saveLibraryChirp(root,payload) {
  const {source,bytes,duration}=validateChirp(payload);
  const approvedFile=path.join(root,'src/data/dj-chirps.json'),draftFile=path.join(root,'.birdsong-library/drafts.json');
  const approved=await readJSON(approvedFile),drafts=await readJSON(draftFile);
  if(payload.draftId&&!drafts.some(d=>d.id===payload.draftId))throw Error('Draft not found. Save a new copy instead.');
  const id=payload.draftId||`chirp-${randomUUID()}`;
  if(!/^chirp-[a-f0-9-]{36}$/.test(id))throw Error('Invalid chirp ID.');
  const published=payload.status==='approved';
  const audio=published?`/audio/chirps/${id}.wav`:`/__birdsong-library/audio/${id}.wav`;
  const originStart=(source.excerptStart||0)+payload.start,originEnd=(source.excerptStart||0)+payload.end;
  const entry={id,birdId:source.birdId,name:payload.name.trim(),audio,duration,sourceId:payload.sourceId,sourceUrl:source.sourceUrl,creator:source.creator,license:source.license,...(source.licenseUrl?{licenseUrl:source.licenseUrl}:{}),source:source.source,sourceStart:payload.start,sourceEnd:payload.end,volume:payload.volume,edited:true,note:`DJ chirp: original source ${originStart.toFixed(3)}–${originEnd.toFixed(3)}s; mono 48 kHz WAV, volume ${Math.round(payload.volume*100)}%, short fades, pitch unchanged.${source.edited?' Source was already an edited learning excerpt.':''}`,createdAt:drafts.find(d=>d.id===id)?.createdAt||Date.now(),updatedAt:Date.now(),sha256:createHash('sha256').update(bytes).digest('hex')};
  await atomic(path.join(root,published?'public/audio/chirps':'.birdsong-library/audio',`${id}.wav`),bytes);
  if(published){await writeChirpAttributions(root,[...approved,entry]);await atomic(approvedFile,JSON.stringify([...approved,entry],null,2)+'\n');if(payload.draftId)await atomic(draftFile,JSON.stringify(drafts.filter(d=>d.id!==id),null,2)+'\n');}
  else await atomic(draftFile,JSON.stringify([...drafts.filter(d=>d.id!==id),entry],null,2)+'\n');
  return entry;
}
export default function localAudioLibrary(root) {
  const token=randomBytes(24).toString('hex');let queue=Promise.resolve();
  return {name:'birdsong-local-audio-library',configureServer(server){
    server.middlewares.use(async(req,res,next)=>{
      const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/__birdsong-library'))return next();
      const host=req.headers.host||'',origin=req.headers.origin;
      const local=/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const reply=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
      if(!local||(origin&&origin!==`http://${host}`&&origin!==`https://${host}`))return reply(403,{error:'The authoring library is available only on this local preview.'});
      try{
        if(req.method==='GET'&&url.pathname==='/__birdsong-library')return reply(200,{token,approved:await readJSON(path.join(root,'src/data/dj-chirps.json')),drafts:await readJSON(path.join(root,'.birdsong-library/drafts.json'))});
        const match=url.pathname.match(/^\/__birdsong-library\/audio\/(chirp-[a-f0-9-]{36})\.wav$/);
        if(req.method==='GET'&&match){const bytes=await readFile(path.join(root,'.birdsong-library/audio',match[1]+'.wav'));res.setHeader('Content-Type','audio/wav');res.setHeader('Cache-Control','no-store');return res.end(bytes);}
        if(req.method!=='POST'||url.pathname!=='/__birdsong-library/save')return reply(404,{error:'Not found.'});
        if(req.headers['x-birdsong-library-token']!==token||!req.headers['content-type']?.startsWith('application/json'))return reply(403,{error:'Refresh the workbench before saving.'});
        let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>700000)return reply(413,{error:'The chirp is too large.'});body+=chunk.toString();}
        const payload=JSON.parse(body);const task=queue.then(()=>saveLibraryChirp(root,payload));queue=task.catch(()=>{});return reply(200,{entry:await task});
      }catch(error){reply(error.code==='ENOENT'?404:400,{error:error.message||'This chirp couldn’t save.'});}
    });
  }};
}
