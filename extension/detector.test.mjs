import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Detector,covered} from './detector.mjs';
function frame(value){const data=new Uint8ClampedArray(96*54*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}return data;}
test('known strobe interval is mapped before playback',()=>{const d=new Detector();for(let i=0;i<360;i++){const t=i/60;d.push(t,frame(t>=2 && t<4 ? (Math.floor(t*16)%2?255:0):100));}assert.equal(d.intervals.length,1);assert.ok(d.intervals[0].start<=2);assert.ok(d.intervals[0].end>=4);assert.ok(!covered(0,d.intervals));assert.ok(covered(3,d.intervals));assert.ok(!covered(5.9,d.intervals));});
test('steady content does not fabricate hazard intervals',()=>{const d=new Detector();for(let i=0;i<180;i++)d.push(i/60,frame(100));assert.deepEqual(d.intervals,[]);});
test('timestamp lookup handles seeks and speed independently',()=>{const intervals=[{start:2,end:4}];for(const [t,want] of [[3,true],[1,false],[4,true],[7,false],[2,true]])assert.equal(covered(t,intervals),want);});
test('rejects malformed frames and nonmonotonic time',()=>{const d=new Detector();assert.throws(()=>d.push(0,new Uint8Array(4)),RangeError);const e=new Detector();e.push(0,frame(100));assert.throws(()=>e.push(0,frame(100)),RangeError);assert.throws(()=>e.push(NaN,frame(100)),RangeError);});
test('binary lookup preserves inclusive interval boundaries',()=>{const intervals=Array.from({length:1000},(_,i)=>({start:i*3,end:i*3+1}));for(let t=0;t<3000;t+=.5)assert.equal(covered(t,intervals),intervals.some(i=>t>=i.start&&t<=i.end));assert.equal(covered(NaN,intervals),false);});
