/* global VisionGuardDetector */
(() => {
  'use strict';
  const { Detector, covered } = VisionGuardDetector;
  const settings = { enabled: true, conservative: false, mode: 'overlay', autoAnalyze: true };
  let loaded = false;
  let video = null;
  let identity = '';
  let source = '';
  let state = 'waiting';
  let message = 'Waiting for a YouTube video.';
  let detector = null;
  let duration = 0;
  let progress = 0;
  let intervals = [];
  let gaps = [];
  let lastTime = -1;
  let lastPresented = null;
  let callbackId = null;
  let generation = 0;
  let original = null;
  let lastFrameAt = 0;
  let lastUi = '';
  let replaySeeking = false;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 54;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const panel = document.createElement('div');
  panel.id = 'vision-guard-status';
  const shadow = panel.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{position:fixed;right:16px;bottom:18px;z-index:2147483647;max-width:360px;font:13px system-ui;color:#eee}section{background:#151515;border:1px solid #666;border-radius:10px;padding:12px;box-shadow:0 4px 20px #0008}p{margin:5px 0;line-height:1.5}button{background:#263c48;color:#fff;border:1px solid #8aa7b8;border-radius:5px;padding:7px;margin:6px 6px 0 0;cursor:pointer}button:focus-visible{outline:3px solid #8ad7ff}small{color:#c0c0c0}';
  const box = document.createElement('section');
  const title = document.createElement('strong');
  title.textContent = 'VISION GUARD';
  const statusText = document.createElement('p');
  statusText.setAttribute('role', 'status');
  const scanButton = document.createElement('button');
  scanButton.textContent = 'Scan from beginning';
  scanButton.addEventListener('click', () => startScan());
  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop scan (keep covered)';
  stopButton.addEventListener('click', () => stopScan());
  const note = document.createElement('small');
  note.textContent = 'Experimental; not seizure prevention. Keep this tab visible while scanning.';
  box.append(title, statusText, scanButton, stopButton, note);
  shadow.append(style, box);

  function videoId() {
    const url = new URL(location.href);
    return url.searchParams.get('v') || (/^\/shorts\/([^/]+)/.exec(url.pathname)?.[1] ?? '');
  }
  function advertisement() {
    return !!document.querySelector('#movie_player.ad-showing, #movie_player.ad-interrupting');
  }
  function markGap(start, end) {
    start = Math.max(0, start);
    end = Math.min(duration, end);
    if (end <= start) return;
    const previous = gaps.at(-1);
    if (previous && start <= previous.end) previous.end = Math.max(previous.end, end);
    else gaps.push({ start, end });
  }
  function restoreAudio() {
    if (!original) return;
    original.video.muted = original.muted;
    original.video.playbackRate = original.rate;
    original = null;
  }
  function cancelFrames() {
    generation++;
    if (video && callbackId !== null) video.cancelVideoFrameCallback(callbackId);
    callbackId = null;
  }
  function fail(reason) {
    cancelFrames();
    state = 'unavailable';
    message = reason + ' Visuals remain covered.';
    restoreAudio();
    render();
  }
  function stopScan() {
    if (!['analyzing', 'preparing', 'rewinding'].includes(state)) return;
    video?.pause();
    fail('Scan stopped. Coverage is incomplete.');
  }
  function reset(next, key) {
    cancelFrames();
    restoreAudio();
    video = next;
    identity = key;
    source = next?.currentSrc || '';
    state = 'waiting';
    message = 'Preparing covered pre-scan. A full pass is required before viewing.';
    duration = 0;
    progress = 0;
    intervals = [];
    gaps = [];
    detector = null;
    replaySeeking = false;
    if (video) video.disablePictureInPicture = true;
  }
  function seekToStart(target, signal) {
    return new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => {
        clearTimeout(timer);
        target.removeEventListener('seeked', done);
        target.removeEventListener('error', failed);
      };
      const done = () => {
        cleanup();
        if (signal !== generation) reject(new Error('Video changed.'));
        else resolve();
      };
      const failed = () => { cleanup(); reject(new Error('Unable to seek this video.')); };
      if (target.currentTime < 0.02 && !target.seeking) return resolve();
      target.addEventListener('seeked', done, { once: true });
      target.addEventListener('error', failed, { once: true });
      timer = setTimeout(failed, 15000);
      try { target.currentTime = 0; } catch { failed(); }
    });
  }
  async function startScan() {
    if (!loaded || !settings.enabled || !video || ['preparing', 'analyzing', 'rewinding'].includes(state)) return;
    if (advertisement()) { message = 'Waiting for the advertisement to finish; visuals covered.'; render(); return; }
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 2) {
      fail('A loaded, finite-duration video is required. Live streams are unsupported.');
      return;
    }
    if (!context || !video.requestVideoFrameCallback || video.mediaKeys) {
      fail('This video or browser does not support accessible frame analysis.');
      return;
    }
    cancelFrames();
    const token = generation;
    const target = video;
    duration = target.duration;
    source = target.currentSrc;
    original = { video: target, muted: target.muted, rate: target.playbackRate };
    state = 'preparing';
    message = 'Preparing scan: visuals covered, audio muted. Allow approximately the video duration.';
    intervals = [];
    gaps = [];
    progress = 0;
    detector = new Detector();
    lastTime = -1;
    lastPresented = null;
    render();
    target.muted = true;
    target.playbackRate = 1;
    try {
      // Test actual browser access. Never bypass CORS or DRM.
      context.drawImage(target, 0, 0, 96, 54);
      context.getImageData(0, 0, 96, 54);
      await seekToStart(target, token);
      if (token !== generation) return;
      state = 'analyzing';
      lastFrameAt = performance.now();
      callbackId = target.requestVideoFrameCallback((now, metadata) => analyzeFrame(token, now, metadata));
      await target.play();
    } catch (error) {
      if (token === generation) fail(error.name === 'SecurityError'
        ? 'Chrome blocked pixel access for this video.'
        : 'Cannot start the scan: ' + error.message);
    }
  }
  function analyzeFrame(token, now, metadata) {
    if (token !== generation || state !== 'analyzing') return;
    callbackId = null;
    try {
      if (advertisement() || video.currentSrc !== source || Math.abs(video.duration - duration) > 0.2) {
        fail('The source changed or an advertisement interrupted the scan. Restart the scan afterward.');
        return;
      }
      const time = metadata.mediaTime;
      if (time > lastTime) {
        // Presented frame counts track callback gaps. Decoder counters can run ahead
        // of presentation and must not be mistaken for missing observed frames.
        if (lastTime < 0 && time > 0.08) markGap(0, time + 0.25);
        if (lastTime >= 0 && (time - lastTime > 0.12 ||
          (lastPresented !== null && metadata.presentedFrames - lastPresented > 1))) {
          markGap(lastTime - 0.25, time + 0.25);
        }
        context.drawImage(video, 0, 0, 96, 54);
        detector.push(time, context.getImageData(0, 0, 96, 54).data);
        lastTime = time;
        lastPresented = metadata.presentedFrames;
        progress = Math.min(time / duration, 1);
        intervals = detector.intervals.map(item => ({ start: item.start, end: Math.min(item.end, duration) }));
        lastFrameAt = now;
      } else if (time < lastTime - 0.1) {
        fail('Playback moved backward during analysis. Restart the full scan.');
        return;
      }
      callbackId = video.requestVideoFrameCallback((nextNow, nextMetadata) => analyzeFrame(token, nextNow, nextMetadata));
    } catch (error) {
      fail('Frame analysis failed: ' + error.message);
    }
  }
  async function finishScan() {
    if (state !== 'analyzing') return;
    if (lastTime < 0 || lastTime < duration - 0.25) {
      fail('The scan ended without reaching the last frames.');
      return;
    }
    cancelFrames();
    const token = generation;
    const target = video;
    state = 'rewinding';
    message = 'Scan finished. Returning to the beginning with visuals covered.';
    progress = 1;
    render();
    try {
      await seekToStart(target, token);
      if (token !== generation) return;
      restoreAudio();
      state = 'ready';
      message = gaps.length ? 'Scan finished with gaps. Unanalyzed gaps stay opaque during replay.' : 'Scan finished. Replaying with timestamp-based protection.';
      render();
      await target.play();
    } catch (error) {
      if (token === generation) {
        if (state === 'ready') message = 'Scan finished. Press YouTube Play to begin protected replay.';
        else fail('Could not rewind: ' + error.message);
      }
    }
  }
  function render() {
    if (!video) { panel.remove(); return; }
    const mustCover = loaded && settings.enabled && (settings.conservative || state !== 'ready' ||
      document.hidden || advertisement() || video.seeking || replaySeeking || covered(video.currentTime, gaps));
    // Enter slightly early at high playback speeds. Rendering is still not frame-exact.
    const hazard = state === 'ready' && (covered(video.currentTime, intervals) ||
      covered(video.currentTime + 0.15 * video.playbackRate, intervals));
    const visual = !loaded || mustCover ? 'cover' :
      settings.enabled && hazard ? (settings.mode === 'blur' ? 'blur' : 'cover') : 'visible';
    if (video.dataset.vgVisual !== visual) video.dataset.vgVisual = visual;
    for (const other of document.querySelectorAll('video')) {
      if (other !== video && !settings.enabled) other.dataset.vgVisual = 'visible';
    }
    const host = document.fullscreenElement || document.body;
    if (host && panel.parentNode !== host) host.append(panel);
    panel.hidden = !settings.enabled;
    let text = message;
    if (state === 'analyzing') {
      const remaining = Math.ceil(Math.max(0, duration - lastTime));
      text = 'Analyzing ' + Math.floor(progress * 100) + '% · approximately ' + remaining + ' seconds remaining. Picture covered; audio muted.' +
        (video.paused ? ' Press YouTube Play to resume scanning.' : '');
    } else if (state === 'ready') {
      text = message + ' ' + intervals.length + ' potential hazard intervals. ' +
        (visual === 'visible' ? 'No cover at this timestamp.' : 'Visual protection active.');
    }
    if (text !== lastUi) { statusText.textContent = text; lastUi = text; }
    scanButton.hidden = ['analyzing', 'preparing', 'rewinding'].includes(state);
    stopButton.hidden = !['analyzing', 'preparing', 'rewinding'].includes(state);
  }
  function tick() {
    const next = document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video');
    const key = videoId();
    if (next !== video || key !== identity) reset(next, key);
    if (video && loaded && settings.enabled && key) {
      if (state === 'ready' && (advertisement() || video.currentSrc !== source || Math.abs(video.duration - duration) > 0.2)) {
        fail('Video source changed. Previous timestamps were discarded; scan again.');
        intervals = [];
        gaps = [];
      }
      if (state === 'analyzing') {
        video.muted = true;
        if (video.playbackRate !== 1) video.playbackRate = 1;
        if (video.ended) finishScan();
        else if (performance.now() - lastFrameAt > 20000 && !video.paused) fail('No frames arrived for 20 seconds. Check buffering and restart.');
      }
      if (state === 'waiting' && settings.autoAnalyze && !advertisement() && video.readyState >= 2) startScan();
    }
    render();
    requestAnimationFrame(tick);
  }
  // Immediate seek masking; don't wait for the next animation frame.
  document.addEventListener('seeking', event => {
    if (event.target === video && state === 'ready') { replaySeeking = true; render(); }
  }, true);
  document.addEventListener('seeked', event => {
    if (event.target === video) { replaySeeking = false; render(); }
  }, true);
  document.addEventListener('error', event => {
    if (event.target === video) fail('Video playback failed.');
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ['analyzing', 'preparing'].includes(state)) {
      video?.pause();
      fail('The scan was interrupted when this tab became hidden. Keep the tab visible and restart.');
    }
    render();
  });
  chrome.storage.local.get(settings).then(value => {
    for (const key of ['enabled', 'conservative', 'autoAnalyze']) {
      if (typeof value[key] === 'boolean') settings[key] = value[key];
    }
    settings.mode = value.mode === 'blur' ? 'blur' : 'overlay';
    loaded = true;
  }).catch(() => { loaded = true; fail('Settings could not be loaded.'); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of ['enabled', 'conservative', 'autoAnalyze']) {
      if (typeof changes[key]?.newValue === 'boolean') settings[key] = changes[key].newValue;
    }
    if (changes.mode) settings.mode = changes.mode.newValue === 'blur' ? 'blur' : 'overlay';
    if (!settings.enabled && ['analyzing', 'preparing', 'rewinding'].includes(state)) stopScan();
    render();
  });
  chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (request?.type === 'VG_SCAN') { startScan(); reply({ ok: true }); }
    if (request?.type === 'VG_STOP') { stopScan(); reply({ ok: true }); }
    if (request?.type === 'VG_STATUS') {
      const gapDuration = gaps.reduce((sum, gap) => sum + gap.end - gap.start, 0);
      reply({ state, message, progress, duration, time: video?.currentTime || 0,
        video: !!video, active: video?.dataset.vgVisual !== 'visible',
        coverage: duration ? Math.max(0, progress - gapDuration / duration) : 0,
        intervals, gaps, version: '0.2.0' });
    }
  });
  tick();
})();
