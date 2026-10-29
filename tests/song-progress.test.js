import test from 'node:test';
import assert from 'node:assert/strict';
import {songProgress,unlockedSongRecordings} from '../src/song-progress.js';
import {variedReferenceRounds} from '../src/flight-recordings.js';
const sessions=Array.from({length:3},(_,i)=>({id:`s${i}`,mode:'flight'}));
const history=Array.from({length:6},(_,i)=>({birdId:'cardinal',mode:'flight',sessionId:`s${Math.floor(i/2)}`,correct:true,recordingId:'cardinal-original'}));
const alternate=[{id:'cardinal-extra',birdId:'cardinal',audio:'extra'}];

test('six consecutive familiar-song successes across three completed flights unlock one extra song',()=>{
 assert.equal(songProgress(history.slice(0,5),sessions,'cardinal').unlocked,false);
 assert.equal(songProgress(history,sessions.slice(0,2),'cardinal').unlocked,false);
 assert.equal(songProgress(history.map(a=>({...a,sessionId:'s0'})),sessions,'cardinal').unlocked,false);
 assert.equal(songProgress(history,sessions,'cardinal').unlocked,true);
 assert.deepEqual(unlockedSongRecordings(history,sessions,alternate),alternate);
 assert.equal(unlockedSongRecordings(history,sessions,[...alternate,{id:'future',birdId:'cardinal',audio:'third'}]).length,1);
});
test('wrong answers break an unearned streak; earned repertoire is permanent',()=>{
 const miss={...history[2],correct:false};
 assert.equal(songProgress([...history.slice(0,3),miss,...history.slice(3)],sessions,'cardinal').unlocked,false);
 assert.equal(songProgress([...history,miss],sessions,'cardinal').unlocked,true);
});
test('nearby, practice, personal, alternate and unfinished-flight answers do not advance the goal',()=>{
 for(const update of [{mode:'nearby'},{mode:'practice'},{recordingId:'personal'},{recordingId:'cardinal-extra'},{sessionId:'unfinished'}])assert.equal(songProgress(history.map(a=>({...a,...update})),sessions,'cardinal').unlocked,false);
 const missedPersonal={...history[2],correct:false,recordingId:'personal'};
 assert.equal(songProgress([...history.slice(0,3),missedPersonal,...history.slice(3)],sessions,'cardinal').unlocked,false);
 assert.equal(songProgress(history.map(({recordingId,...a})=>a),sessions,'cardinal').unlocked,true);
});
test('normal flight planning uses only familiar recordings until the completed-flight milestone',()=>{
 const round={correct:{id:'cardinal',audio:'original'},options:[]};
 assert.equal(variedReferenceRounds([round],history,unlockedSongRecordings(history,[],alternate),()=>0)[0].correct.audio,'original');
 assert.equal(variedReferenceRounds([round],history,unlockedSongRecordings(history,sessions,alternate),()=>0)[0].correct.audio,'extra');
 assert.equal(songProgress(history,sessions,'robin').unlocked,false);
});
