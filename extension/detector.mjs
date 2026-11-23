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

class RecentTransitions {
  constructor() {
    this.times = new Float64Array(6).fill(-Infinity);
    this.oldest = 0;
  }

  record(time) {
    this.times[this.oldest] = time;
    this.oldest = (this.oldest + 1) % this.times.length;
  }

  sixInLastSecond(time) {
    return this.times[this.oldest] >= time - 1;
  }
}

export class Detector {
  constructor() {
    this.luminance = new Float32Array(PIXELS);
    this.redIntensity = new Float32Array(PIXELS);
    this.previousRgb = new Uint32Array(PIXELS);
    this.luminanceTransitions = new RecentTransitions();
    this.redTransitions = new RecentTransitions();
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
    let edges = 0;
    let colorSwaps = 0;
    const { luminance, redIntensity, previousRgb } = this;

    for (let pixel = 0, offset = 0; pixel < PIXELS; pixel++, offset += 4) {
      const r = rgba[offset];
      const g = rgba[offset + 1];
      const b = rgba[offset + 2];
      const packed = (r << 16) | (g << 8) | b;
      const light = RED_LUMA[r] + GREEN_LUMA[g] + BLUE_LUMA[b];
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
      if (pixel % WIDTH && Math.abs(light - luminance[pixel - 1]) > 0.5) edges++;
      luminance[pixel] = light;
      redIntensity[pixel] = saturated;
      previousRgb[pixel] = packed;
    }

    const sign = up > AREA_CUTOFF ? 1 : down > AREA_CUTOFF ? -1 : 0;
    const redChanged = red > AREA_CUTOFF;
    const striped = edges > PIXELS * 0.35;
    // Per-frame decision for callers checking a frame before displaying it.
    this.candidateTransition = sign !== 0 || redChanged || striped || colorSwaps > AREA_CUTOFF;
    if (sign && sign !== this.lastSign) {
      this.luminanceTransitions.record(time);
      this.lastSign = sign;
    }
    if (redChanged) this.redTransitions.record(time);
    if (striped || this.luminanceTransitions.sixInLastSecond(time) ||
        this.redTransitions.sixInLastSecond(time)) {
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
const MIN_CHANGED_TILES = Math.ceil(TILE_COUNT * 0.05);
const CONFIRM_MS = 220;
const RELEASE_MS = 280;

export class FastDetector {
  constructor() {
    this.previous = new Float64Array(TILE_COUNT * 4);
    this.direction = new Float64Array(TILE_COUNT * 3);
    this.changedAt = new Float64Array(TILE_COUNT).fill(-Infinity);
    this.hasPrevious = false;
    this.lastChange = -Infinity;
    this.holdUntil = -Infinity;
    this.filterUntil = -Infinity;
  }

  inspect(now, rgba) {
    let changed = 0, reversed = 0, edges = 0, tile = 0;
    for (let top = 0; top < HEIGHT; top += TILE_HEIGHT) {
      for (let left = 0; left < WIDTH; left += TILE_WIDTH, tile++) {
        let red = 0, green = 0, blue = 0, light = 0;
        for (let y = top; y < top + TILE_HEIGHT; y++) {
          let lastLight;
          let offset = (y * WIDTH + left) * 4;
          for (let x = 0; x < TILE_WIDTH; x++, offset += 4) {
            const r = rgba[offset], g = rgba[offset + 1], b = rgba[offset + 2];
            const luminance = RED_LUMA[r] + GREEN_LUMA[g] + BLUE_LUMA[b];
            if (x && Math.abs(luminance - lastLight) > 0.5) edges++;
            lastLight = luminance;
            red += r; green += g; blue += b; light += luminance;
          }
        }
        const i = tile * 4, j = tile * 3;
        const dr = red - this.previous[i];
        const dg = green - this.previous[i + 1];
        const db = blue - this.previous[i + 2];
        const brightness = Math.abs(light - this.previous[i + 3]);
        const chroma = Math.max(dr, dg, db) - Math.min(dr, dg, db);
        if (this.hasPrevious &&
            (brightness >= 0.1 * TILE_AREA || chroma >= CHANNEL_STEP * TILE_AREA)) {
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
      }
    }
    this.hasPrevious = true;
    if (changed >= MIN_CHANGED_TILES) {
      // Keep the current clean picture on a possible onset. Sustained motion
      // in one direction cannot continually extend this initial hold.
      if (now - this.lastChange > CONFIRM_MS) this.holdUntil = now + CONFIRM_MS;
      this.lastChange = now;
    }
    if (reversed >= MIN_CHANGED_TILES || edges > HEIGHT * (WIDTH - WIDTH / TILE_WIDTH) * 0.35) {
      this.filterUntil = now + RELEASE_MS;
    }
    if (now < this.filterUntil) return 'filter';
    if (now <= this.holdUntil) return 'hold';
    return 'show';
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
