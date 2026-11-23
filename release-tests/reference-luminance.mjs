// Offline numeric comparison. No test sequence is played or written as video.
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {Detector, FastDetector} from '../extension/detector.mjs';

const directory = process.argv[2];
if (!directory) throw Error('Pass the path to the TRACE lum_flash_patterns/rel_lum directory.');
const names = (await readdir(directory)).filter(name => name.endsWith('_srgba.csv')).sort();
assert.equal(names.length, 234, 'Expected the complete reference suite at revision ef78542');
const frames = new Map();
const groups = {};
for (const name of names) {
  const rows = (await readFile(path.join(directory, name), 'utf8')).trim().split(/\r?\n/);
  assert.equal(rows.shift(), 'sRGBA,r,g,b,a');
  const fast = new FastDetector(), scan = new Detector();
  let filtered = false;
  for (const [index, row] of rows.entries()) {
    // The upstream generator uses CSV row order for playback timing.
    const [, r, g, b, a] = row.split(',').map(Number);
    assert.ok([r,g,b].every(value => Number.isInteger(value) && value >= 0 && value <= 255));
    assert.equal(a, 255);
    const key = r * 65536 + g * 256 + b;
    if (!frames.has(key)) {
      const pixels = new Uint8ClampedArray(96 * 54 * 4);
      for (let i = 0; i < pixels.length; i += 4) pixels.set([r,g,b,a], i);
      frames.set(key, pixels);
    }
    const pixels = frames.get(key);
    const decision = fast.inspect(index * 1000 / 30, pixels);
    filtered ||= decision === 'filter';
    scan.push(index / 30, pixels);
  }
  const totals = groups[name[0]] ??= {sequences:0, fastFiltered:0, scanFlagged:0};
  totals.sequences++;
  if (filtered) totals.fastFiltered++;
  if (scan.intervals.length) totals.scanFlagged++;
}
console.table(groups);
