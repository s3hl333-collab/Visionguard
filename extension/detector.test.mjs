import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Detector,covered} from './detector.mjs';
function frame(value){const data=new Uint8ClampedArray(96*54*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}return data;}
test('known strobe interval is mapped before playback',()=>{const d=new Detector();for(let i=0;i<360;i++){const t=i/60;d.push(t,frame(t>=2 && t<4 ? (Math.floor(t*16)%2?255:0):100));}assert.equal(d.intervals.length,1);assert.ok(d.intervals[0].start<=2);assert.ok(d.intervals[0].end>=4);assert.ok(!covered(0,d.intervals));assert.ok(covered(3,d.intervals));assert.ok(!covered(5.9,d.intervals));});
test('steady content does not fabricate hazard intervals',()=>{const d=new Detector();for(let i=0;i<180;i++)d.push(i/60,frame(100));assert.deepEqual(d.intervals,[]);});
test('timestamp lookup handles seeks and speed independently',()=>{const intervals=[{start:2,end:4}];for(const [t,want] of [[3,true],[1,false],[4,true],[7,false],[2,true]])assert.equal(covered(t,intervals),want);});
test('rejects malformed frames and nonmonotonic time',()=>{const d=new Detector();assert.throws(()=>d.push(0,new Uint8Array(4)),RangeError);const e=new Detector();e.push(0,frame(100));assert.throws(()=>e.push(0,frame(100)),RangeError);assert.throws(()=>e.push(NaN,frame(100)),RangeError);});
test('binary lookup preserves inclusive interval boundaries',()=>{const intervals=Array.from({length:1000},(_,i)=>({start:i*3,end:i*3+1}));for(let t=0;t<3000;t+=.5)assert.equal(covered(t,intervals),intervals.some(i=>t>=i.start&&t<=i.end));assert.equal(covered(NaN,intervals),false);});

test('red-only transitions include the one-second boundary and expire after it', () => {
  const dark = frame(0);
  const red = frame(0);
  // Red intensity changes by >0.2 while luminance changes by <0.1.
  for (let i = 0; i < red.length; i += 4) red[i] = 135;

  function analyze(lastTransition) {
    const detector = new Detector();
    detector.push(0, dark);
    const times = [1, 1.2, 1.4, 1.6, 1.8, lastTransition];
    times.forEach((time, i) => detector.push(time, i % 2 ? dark : red));
    return detector.intervals;
  }

  assert.deepEqual(analyze(2), [{ start: 0.75, end: 2.5 }]);
  assert.deepEqual(analyze(2.01), []);
});

test('isolated changes can be covered before they form a repeated hazard', () => {
  const detector = new Detector();
  assert.equal(detector.candidateTransition, false);
  detector.push(0, frame(0));
  assert.equal(detector.candidateTransition, false);
  detector.push(0.1, frame(255));
  assert.equal(detector.candidateTransition, true);
  assert.deepEqual(detector.intervals, []);
  detector.push(0.2, frame(255));
  assert.equal(detector.candidateTransition, false);
  detector.push(0.3, frame(0));
  assert.equal(detector.candidateTransition, true);
});

test('candidate includes red changes of similar luminance and first-frame spatial patterns', () => {
  const green = frame(0);
  const red = frame(0);
  const stripes = frame(0);
  for (let i = 0; i < red.length; i += 4) {
    red[i] = 135;
    green[i + 1] = 76;
    if ((i / 4) % 2) stripes[i] = stripes[i + 1] = stripes[i + 2] = 255;
  }

  const chromatic = new Detector();
  chromatic.push(0, green);
  chromatic.push(0.03, red);
  assert.equal(chromatic.candidateTransition, true);
  assert.deepEqual(chromatic.intervals, []);

  const spatial = new Detector();
  spatial.push(0, stripes);
  assert.equal(spatial.candidateTransition, true);
  spatial.push(0.03, frame(64));
  spatial.push(0.06, frame(64));
  assert.equal(spatial.candidateTransition, false);
});

test('near-equal-luminance non-red swaps affect only candidates above the strict area cutoff', () => {
  // Pure green at 89 and blue at 255 both have relative luminance about 0.072.
  const green = frame(0);
  for (let i = 1; i < green.length; i += 4) green[i] = 89;
  function switched(count) {
    const result = green.slice();
    for (let i = 0; i < count * 4; i += 4) { result[i + 1] = 0; result[i + 2] = 255; }
    return result;
  }
  const small = new Detector();
  small.push(0, green);
  small.push(0.05, switched(259)); // 4.996% of the frame.
  assert.equal(small.candidateTransition, false);

  const large = new Detector();
  const swapped = switched(260);
  large.push(0, green);
  for (let i = 1; i <= 12; i++) {
    large.push(i / 20, i % 2 ? swapped : green);
    assert.equal(large.candidateTransition, true);
  }
  large.push(0.65, green);
  assert.equal(large.candidateTransition, false);
  assert.deepEqual(large.intervals, []);
});
