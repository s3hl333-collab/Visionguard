// Experimental frame heuristics. These thresholds are not a clinical or WCAG assessment.
const WIDTH = 96;
const HEIGHT = 54;
const PIXELS = WIDTH * HEIGHT;
const AREA_CUTOFF = PIXELS * 0.05;
const CHANNEL_STEP = 64; // A quarter of the encoded 8-bit sRGB range.
const LINEAR = Float32Array.from({ length: 256 }, (_, value) => {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
});
// Retain double precision here so values at the original thresholds compare identically.
const RED_LUMA = Float64Array.from(LINEAR, value => value * 0.2126);
const GREEN_LUMA = Float64Array.from(LINEAR, value => value * 0.7152);
const BLUE_LUMA = Float64Array.from(LINEAR, value => value * 0.0722);

// Look for repeated light/dark pairs along a substantial part of a scan line.
// Comparing full periods allows the light and dark bars to have different widths.
function repeatedBands(light, start, stride, length) {
  let lastEdge = -1, previousWidth = 0, polarity = 0;
  let period = 0, periods = 0, span = 0;
  for (let x = 1, i = start + stride; x < length; x++, i += stride) {
    const delta = light[i] - light[i - stride];
    if (Math.abs(delta) < 0.45) continue;
    const sign = Math.sign(delta);
    const width = x - lastEdge;
    if (lastEdge >= 0 && sign !== polarity && previousWidth) {
      const observed = previousWidth + width;
      if (!period || Math.abs(observed - period) > period * 0.25) {
        period = observed;
        periods = 0;
        span = previousWidth;
      }
      span += width;
      periods++;
      if (periods >= 10 && span >= length / 3) return true;
    } else {
      period = periods = span = 0;
    }
    previousWidth = lastEdge >= 0 && sign !== polarity ? width : 0;
    lastEdge = x;
    polarity = sign;
  }
  return false;
}

function hasBandsAlongAxis(light, lines, length, lineStep, pixelStep) {
  const needed = Math.ceil(Math.ceil(lines / 4) / 3);
  let matches = 0;
  for (let line = 0; line < lines; line += 4) {
    if (repeatedBands(light, line * lineStep, pixelStep, length) && ++matches >= needed) return true;
  }
  return false;
}

function hasRegularBands(light) {
  return hasBandsAlongAxis(light, HEIGHT, WIDTH, WIDTH, 1) ||
    hasBandsAlongAxis(light, WIDTH, HEIGHT, 1, WIDTH);
}

class RecentTransitions {
  constructor(size) {
    this.times = new Float64Array(size).fill(-Infinity);
    this.oldest = 0;
  }

  record(time) {
    this.times[this.oldest] = time;
    this.oldest = (this.oldest + 1) % this.times.length;
  }

  fullInLastSecond(time, includeBoundary = false) {
    const span = time - this.times[this.oldest];
    // Round sub-microsecond jitter at a frame exactly one second away.
    return includeBoundary ? span <= 1 : span < 1 - 0.0000005;
  }
}

export class Detector {
  constructor() {
    this.luminance = new Float32Array(PIXELS);
    this.redIntensity = new Float32Array(PIXELS);
    this.previousRgb = new Uint32Array(PIXELS);
    this.luminanceTransitions = new RecentTransitions(7);
    this.redTransitions = new RecentTransitions(6);
    this.tileLevels = new Float64Array(TILE_COUNT);
    this.history = new LuminanceHistory();
    this.smoothTransitions = new RecentTransitions(7);
    this.smoothReversals = new RecentTransitions(6);
    this.lastSmoothSign = 0;
    this.lastReversalSign = 0;
    this.time = -Infinity;
    this.lastSign = 0;
    this.candidateTransition = false;
    this.intervals = [];
  }

  push(time, rgba) {
    if (!Number.isFinite(time) || time < 0 || time <= this.time) {
      throw new RangeError('Frame timestamps must increase');
    }
    if (rgba.length !== PIXELS * 4) throw new RangeError('Expected a 96 by 54 RGBA frame');
    const hasPrevious = Number.isFinite(this.time);
    this.time = time;
    let up = 0;
    let down = 0;
    let red = 0;
    let colorSwaps = 0;
    const { luminance, redIntensity, previousRgb } = this;
    this.tileLevels.fill(0);

    for (let pixel = 0, offset = 0; pixel < PIXELS; pixel++, offset += 4) {
      const r = rgba[offset];
      const g = rgba[offset + 1];
      const b = rgba[offset + 2];
      const packed = (r << 16) | (g << 8) | b;
      const light = RED_LUMA[r] + GREEN_LUMA[g] + BLUE_LUMA[b];
      this.tileLevels[PIXEL_TILE[pixel]] += light;
      const linearRed = LINEAR[r];
      const saturated = linearRed / (linearRed + LINEAR[g] + LINEAR[b] || 1) >= 0.8
        ? linearRed : 0;

      // Read the previous frame's value before overwriting the same pixel's slot.
      if (hasPrevious) {
        const before = luminance[pixel];
        const delta = light - before;
        if (delta >= 0.1 && before < 0.8) up++;
        if (delta <= -0.1 && light < 0.8) down++;
        if (Math.abs(saturated - redIntensity[pixel]) > 0.2) red++;
        // Opposing channel changes catch strong hue shifts even at steady luminance.
        // Stop counting once enough pixels qualify; keep the complete next-frame history.
        const previous = previousRgb[pixel];
        if (colorSwaps <= AREA_CUTOFF && packed !== previous) {
          const dr = r - (previous >>> 16);
          const dg = g - ((previous >>> 8) & 255);
          const db = b - (previous & 255);
          // Channel spread detects a change in hue or saturation, including
          // gray-to-color onsets. A uniform brightness change has zero spread.
          if (Math.max(dr, dg, db) - Math.min(dr, dg, db) >= CHANNEL_STEP) {
            colorSwaps++;
          }
        }
      }
      luminance[pixel] = light;
      redIntensity[pixel] = saturated;
      previousRgb[pixel] = packed;
    }

    const sign = up > AREA_CUTOFF ? 1 : down > AREA_CUTOFF ? -1 : 0;
    const redChanged = red > AREA_CUTOFF;
    const striped = hasRegularBands(luminance);
    for (let tile = 0; tile < TILE_COUNT; tile++) this.tileLevels[tile] /= TILE_AREA;
    this.history.inspect(time * 1000, this.tileLevels);
    const smoothSign = this.history.changeSign;
    if (smoothSign && smoothSign !== this.lastSmoothSign) {
      this.smoothTransitions.record(time);
      this.lastSmoothSign = smoothSign;
    }
    const reversal = this.history.reversalSign;
    if (reversal && reversal !== this.lastReversalSign) {
      this.smoothReversals.record(time);
      this.lastReversalSign = reversal;
    }
    // Per-frame decision for callers checking a frame before displaying it.
    this.candidateTransition = sign !== 0 || redChanged || striped || colorSwaps > AREA_CUTOFF;
    if (sign && sign !== this.lastSign) {
      this.luminanceTransitions.record(time);
      this.lastSign = sign;
    }
    if (redChanged) this.redTransitions.record(time);
    if (striped || this.luminanceTransitions.fullInLastSecond(time) ||
        this.redTransitions.fullInLastSecond(time, true) ||
        (this.smoothTransitions.fullInLastSecond(time) && this.smoothReversals.fullInLastSecond(time))) {
      this.add(Math.max(0, time - 1.25), time + 0.5);
    }
  }

  add(start, end) {
    const last = this.intervals.at(-1);
    if (last && start <= last.end + 0.25) last.end = Math.max(last.end, end);
    else this.intervals.push({ start, end });
  }
}

// Fast playback distinguishes a cut from flicker by checking whether the same
// parts of the picture change direction again within the observation window.
const TILE_WIDTH = 12;
const TILE_HEIGHT = 9;
const TILE_AREA = TILE_WIDTH * TILE_HEIGHT;
const TILE_COUNT = PIXELS / TILE_AREA;
const PIXEL_TILE = Uint8Array.from({length:PIXELS}, (_, p) =>
  Math.floor(p / (WIDTH * TILE_HEIGHT)) * (WIDTH / TILE_WIDTH) + Math.floor((p % WIDTH) / TILE_WIDTH));
const MIN_CHANGED_TILES = Math.ceil(TILE_COUNT * 0.05);
const CONFIRM_MS = 220;
const RELEASE_MS = 280;

// Keep up to 100 ms of tile luminance at roughly 8 ms resolution. This catches
// a rapid excursion spread over several frames without accumulating slow drift.
const EXCURSION_MS = 100;
const HISTORY_SLOTS = 14;
class LuminanceHistory {
  constructor() {
    this.frames = Array.from({length:HISTORY_SLOTS}, () => new Float32Array(TILE_COUNT));
    this.times = new Float64Array(HISTORY_SLOTS).fill(-Infinity);
    this.signs = new Int8Array(TILE_COUNT);
    this.signTimes = new Float64Array(TILE_COUNT).fill(-Infinity);
    this.newest = HISTORY_SLOTS - 1;
    this.changeSign = 0;
    this.reversalSign = 0;
  }

  inspect(now, levels) {
    let rising = 0, falling = 0, reversedUp = 0, reversedDown = 0;
    for (let tile = 0; tile < TILE_COUNT; tile++) {
      let slot = this.newest;
      for (let age = 0; age < HISTORY_SLOTS && now - this.times[slot] <= EXCURSION_MS; age++) {
        const earlier = this.frames[slot][tile];
        const delta = levels[tile] - earlier;
        if (Math.abs(delta) >= 0.1 && Math.min(earlier, levels[tile]) < 0.8) {
          const sign = Math.sign(delta);
          const reversed = this.signs[tile] === -sign && now - this.signTimes[tile] <= CONFIRM_MS;
          if (sign > 0) { rising++; if (reversed) reversedUp++; }
          else { falling++; if (reversed) reversedDown++; }
          this.signs[tile] = sign;
          this.signTimes[tile] = now;
          break;
        }
        slot = (slot + HISTORY_SLOTS - 1) % HISTORY_SLOTS;
      }
    }
    if (now - this.times[this.newest] >= 8) {
      this.newest = (this.newest + 1) % HISTORY_SLOTS;
      this.times[this.newest] = now;
      this.frames[this.newest].set(levels);
    }
    // This additional channel requires a coherent quarter of the sampled frame.
    // The abrupt-change channel still handles smaller localized transitions.
    this.changeSign = Math.max(rising, falling) >= TILE_COUNT / 4 ? Math.sign(rising - falling) : 0;
    this.reversalSign = Math.max(reversedUp, reversedDown) >= TILE_COUNT / 4 ? Math.sign(reversedUp - reversedDown) : 0;
    if (this.reversalSign) return 'filter';
    return this.changeSign ? 'hold' : 'show';
  }
}

export class FastDetector {
  constructor() {
    this.previous = new Float64Array(TILE_COUNT * 4);
    this.direction = new Float64Array(TILE_COUNT * 3);
    this.changedAt = new Float64Array(TILE_COUNT).fill(-Infinity);
    this.hasPrevious = false;
    this.light = new Float32Array(PIXELS);
    this.tileLevels = new Float32Array(TILE_COUNT);
    this.history = new LuminanceHistory();
    this.lastChange = -Infinity;
    this.holdUntil = -Infinity;
    this.holdStartedAt = -Infinity;
    this.filterUntil = -Infinity;
  }

  // During confirmation, keep the last inspected pixels in every region that
  // changed since onset. Add a tile on each side for downsampling boundaries.
  pendingBounds(width, height) {
    const since = this.holdStartedAt;
    const cols = WIDTH / TILE_WIDTH, rows = HEIGHT / TILE_HEIGHT;
    let left = cols, top = rows, right = 0, bottom = 0;
    for (let tile = 0; tile < TILE_COUNT; tile++) {
      if (this.changedAt[tile] < since && this.history.signTimes[tile] < since) continue;
      const x = tile % cols, y = Math.floor(tile / cols);
      left = Math.min(left, x-1); right = Math.max(right, x+2);
      top = Math.min(top, y-1); bottom = Math.max(bottom, y+2);
    }
    if (right <= left || bottom <= top) return null;
    const x = Math.max(0, Math.floor(left * width / cols));
    const y = Math.max(0, Math.floor(top * height / rows));
    const w = Math.min(width, Math.ceil(right * width / cols)) - x;
    const h = Math.min(height, Math.ceil(bottom * height / rows)) - y;
    return w === width && h === height ? null : {x,y,w,h};
  }

  inspect(now, rgba) {
    let changed = 0, reversed = 0, tile = 0;
    for (let top = 0; top < HEIGHT; top += TILE_HEIGHT) {
      for (let left = 0; left < WIDTH; left += TILE_WIDTH, tile++) {
        let red = 0, green = 0, blue = 0, light = 0;
        for (let y = top; y < top + TILE_HEIGHT; y++) {
          let offset = (y * WIDTH + left) * 4;
          for (let x = 0; x < TILE_WIDTH; x++, offset += 4) {
            const r = rgba[offset], g = rgba[offset + 1], b = rgba[offset + 2];
            const luminance = RED_LUMA[r] + GREEN_LUMA[g] + BLUE_LUMA[b];
            this.light[offset / 4] = luminance;
            red += r; green += g; blue += b; light += luminance;
          }
        }
        const i = tile * 4, j = tile * 3;
        const dr = red - this.previous[i];
        const dg = green - this.previous[i + 1];
        const db = blue - this.previous[i + 2];
        const previousLight = this.previous[i + 3];
        const brightnessChange = Math.abs(light - previousLight) >= 0.1 * TILE_AREA &&
          Math.min(light, previousLight) < 0.8 * TILE_AREA;
        const chroma = Math.max(dr, dg, db) - Math.min(dr, dg, db);
        if (this.hasPrevious &&
            (brightnessChange || chroma >= CHANNEL_STEP * TILE_AREA)) {
          changed++;
          const dot = dr * this.direction[j] + dg * this.direction[j + 1] + db * this.direction[j + 2];
          if (now - this.changedAt[tile] <= CONFIRM_MS && dot < 0) reversed++;
          this.direction[j] = dr;
          this.direction[j + 1] = dg;
          this.direction[j + 2] = db;
          this.changedAt[tile] = now;
        }
        this.previous[i] = red;
        this.previous[i + 1] = green;
        this.previous[i + 2] = blue;
        this.previous[i + 3] = light;
        this.tileLevels[tile] = light / TILE_AREA;
      }
    }
    this.hasPrevious = true;
    const swing = this.history.inspect(now, this.tileLevels);
    if (changed >= MIN_CHANGED_TILES || swing !== 'show') {
      // Keep the current clean picture on a possible onset. Sustained motion
      // in one direction cannot continually extend this initial hold.
      if (now - this.lastChange > CONFIRM_MS) {
        this.holdStartedAt = now;
        this.holdUntil = now + CONFIRM_MS;
      }
      this.lastChange = now;
    }
    if (reversed >= MIN_CHANGED_TILES || swing === 'filter' || hasRegularBands(this.light)) {
      this.filterUntil = now + RELEASE_MS;
    }
    if (now < this.filterUntil) return 'filter';
    if (now <= this.holdUntil) return 'hold';
    return 'show';
  }
}

// Independent hysteresis and transition windows keep a moving cut in one part
// of the frame from completing a flash sequence in a different part.
class TileSwings {
  constructor(count, threshold) {
    this.threshold = threshold;
    this.extreme = new Float64Array(count).fill(NaN);
    this.direction = new Int8Array(count);
    this.next = new Uint8Array(count);
    this.times = new Float64Array(count * 7).fill(-Infinity);
  }

  push(tile, value, now) {
    const extreme = this.extreme[tile];
    const direction = this.direction[tile];
    if (Number.isNaN(extreme) || (value - extreme) * direction > 0) {
      this.extreme[tile] = value;
      return false;
    }
    if (Math.abs(value - extreme) < this.threshold) return false;
    this.direction[tile] = Math.sign(value - extreme);
    this.extreme[tile] = value;
    const base = tile * 7;
    const slot = this.next[tile];
    this.times[base + slot] = now;
    this.next[tile] = (slot + 1) % 7;
    return now - this.times[base + this.next[tile]] < 1000;
  }
}

export class RegionalFlashDetector {
  constructor() {
    this.cols = WIDTH / 6;
    this.rows = HEIGHT / 6;
    const tiles = this.cols * this.rows;
    this.luma = new TileSwings(tiles, 0.1);
    this.red = new TileSwings(tiles, 0.2);
    this.until = new Float64Array(tiles).fill(-Infinity);
    this.opacity = new Uint8Array(tiles);
  }

  inspect(now, rgba) {
    let active = 0;
    for (let tile = 0; tile < this.opacity.length; tile++) {
      const left = (tile % this.cols) * 6;
      const top = Math.floor(tile / this.cols) * 6;
      let light = 0, red = 0;
      for (let y = top; y < top + 6; y++) {
        let i = 4 * (y * WIDTH + left);
        for (let x = 0; x < 6; x++, i += 4) {
          const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
          light += RED_LUMA[r] + GREEN_LUMA[g] + BLUE_LUMA[b];
          if (LINEAR[r] > 0 && LINEAR[r] >= 4 * (LINEAR[g] + LINEAR[b])) red += LINEAR[r];
        }
      }
      // Changes wholly above 0.8 cannot complete a general flash here.
      const swing = this.luma.push(tile, Math.min(0.9, light / 36), now);
      const redSwing = this.red.push(tile, red / 36, now);
      if (swing || redSwing) this.until[tile] = now + 280;
      // A neutral veil compresses both bright and dark phases. Release gently.
      this.opacity[tile] = Math.round(228 * Math.max(0, Math.min(1, (this.until[tile] + 180 - now) / 180)));
      if (this.opacity[tile]) active++;
    }
    return active;
  }
}

export function covered(time, intervals) {
  if (!Number.isFinite(time)) return false;
  let low = 0;
  let high = intervals.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const interval = intervals[mid];
    if (time < interval.start) high = mid - 1;
    else if (time > interval.end) low = mid + 1;
    else return true;
  }
  return false;
}
