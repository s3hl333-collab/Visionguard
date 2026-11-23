/* global VisionGuardDetector */
(async () => {
  'use strict';
  const { instantPreview } = await chrome.storage.local.get({ instantPreview: true });
  if (instantPreview !== false) return;
  const { Detector, covered } = VisionGuardDetector;
  const BLOCK_SECONDS = 12;
  // Detector intervals can start 1.25s before the triggering sample. Scan beyond
  // both ends before releasing a block so events spanning a boundary are seen.
  const CONTEXT_SECONDS = 1.35;
  const settings = { enabled: true, conservative: false, mode: 'overlay', autoAnalyze: true, scanWholeVideo: false };
  const blocks = new Map();
  let loaded = false;
  let video = null;
  let player = null;
  let key = '';
  let source = '';
  let duration = 0;
  let state = 'waiting';
  let message = 'Waiting for a YouTube video.';
  let segment = null;
  let generation = 0;
  let frameId = null;
  let original = null;
  let learnedRate = 2;
  let interruptedByAd = false;
  let needsGesture = false;
  let nextLookupAt = 0;
  let lastAddress = '';
  let lastUi = '';
  let canvasContext = null;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 54;
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
  scanButton.textContent = 'Scan this position';
  scanButton.addEventListener('click', () => startAt(video?.currentTime || 0, true));
  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop scan (keep covered)';
  stopButton.addEventListener('click', () => stopScan());
  const note = document.createElement('small');
  note.textContent = 'Keep this tab visible while scanning. Coverage is experimental.';
  box.append(title, statusText, scanButton, stopButton, note);
  shadow.append(style, box);


  const isScanning = () => ['preparing', 'analyzing', 'rewinding'].includes(state);
  const inAd = () => player?.classList.contains('ad-showing') || player?.classList.contains('ad-interrupting');
  const blockIndex = time => settings.scanWholeVideo ? 0 : Math.floor(Math.max(0, Math.min(time, duration - 0.0001)) / BLOCK_SECONDS);
  const validSource = () => video && !video.mediaKeys && video.currentSrc === source && Math.abs(video.duration - duration) < 0.1;
  function setVisual(target, value) {
    if (target && target.dataset.vgVisual !== value) target.dataset.vgVisual = value;
  }
  function restorePlayback() {
    if (!original) return;
    original.video.muted = original.muted;
    original.video.playbackRate = original.rate;
    original = null;
  }
  function cancel() {
    generation++;
    if (frameId !== null) video?.cancelVideoFrameCallback(frameId);
    frameId = null;
    if (segment?.abort) segment.abort.abort();
  }
  function fail(reason, discard = false) {
    setVisual(video, 'cover');
    cancel();
    if (isScanning()) video?.pause();
    if (discard) blocks.clear();
    segment = null;
    state = 'unavailable';
    message = reason + ' Visuals stay covered.';
    restorePlayback();
    render();
  }
  function stopScan() {
    if (isScanning()) fail('Scan stopped.');
  }
  function getVideoKey() {
    const url = new URL(location.href);
    if (url.pathname === '/watch') return url.searchParams.get('v') || '';
    return /^\/shorts\/([^/]+)/.exec(url.pathname)?.[1] || '';
  }
  function bind(next, nextKey) {
    if (next === video && nextKey === key) return;
    if (video) setVisual(video, settings.enabled && nextKey ? 'cover' : 'visible');
    cancel();
    restorePlayback();
    video = next;
    key = nextKey;
    player = video?.closest('#movie_player') || null;
    source = '';
    duration = 0;
    state = 'waiting';
    message = 'Waiting to scan. Picture covered.';
    segment = null;
    learnedRate = 2;
    interruptedByAd = false;
    needsGesture = false;
    blocks.clear();
    if (video && key) video.disablePictureInPicture = true;
    render();
  }
  function seek(target, time, signal) {
    if (Math.abs(target.currentTime - time) < 0.015 && !target.seeking) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => end(new Error('Seek timed out.')), 15000);
      function end(error) {
        clearTimeout(timeout);
        target.removeEventListener('seeked', done);
        target.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
        if (error) reject(error); else resolve();
      }
      const done = () => end(Math.abs(target.currentTime - time) > 0.25 ? new Error('Player sought to a different position.') : null);
      const failed = () => end(new Error('Player seek failed.'));
      const aborted = () => end(new Error('Scan cancelled.'));
      signal.addEventListener('abort', aborted, { once: true });
      target.addEventListener('seeked', done, { once: true });
      target.addEventListener('error', failed, { once: true });
      try { target.currentTime = time; } catch (error) { end(error); }
    });
  }
  function readPixels() {
    if (!canvasContext) canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    if (!canvasContext) throw new Error('Canvas unavailable.');
    canvasContext.drawImage(video, 0, 0, 96, 54);
    return canvasContext.getImageData(0, 0, 96, 54).data;
  }
  function markGap(section, start, end) {
    // Scans run in timestamp order. Keep ranges sorted and merge adjacent gaps.
    start = Math.max(section.start, start);
    end = Math.min(section.end, end);
    if (end <= start) return;
    const last = section.gaps.at(-1);
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else section.gaps.push({start, end});
  }
  async function startAt(position, playAfter) {
    if (!loaded || !settings.enabled || !key || !video || isScanning()) return;
    if (document.hidden) { message = 'Return to this tab to scan.'; return; }
    if (inAd()) { interruptedByAd = true; fail('Waiting for the advertisement to finish.', true); return; }
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 2 || !video.requestVideoFrameCallback || video.mediaKeys) {
      fail('This video has no accessible finite timeline.'); return;
    }
    const target = video;
    if (!validSource()) { blocks.clear(); learnedRate = 2; }
    duration = video.duration;
    source = video.currentSrc;
    const resumeAt = Math.max(0, Math.min(position, duration - 0.001));
    const index = blockIndex(resumeAt);
    const start = settings.scanWholeVideo ? 0 : index * BLOCK_SECONDS;
    const end = settings.scanWholeVideo ? duration : Math.min(duration, start + BLOCK_SECONDS);
    blocks.delete(index);
    cancel();
    const token = generation;
    segment = { index, start, end, scanStart: Math.max(0,start-CONTEXT_SECONDS), scanEnd: Math.min(duration,end+CONTEXT_SECONDS),
      resumeAt, playAfter, abort: new AbortController(), detector: new Detector(), gaps: [],
      lastTime: -1, presented: null, dropped: null, samples: 0, lastFrameAt: performance.now(), rate: learnedRate };
    const section = segment;
    original = { video, muted: video.muted, rate: video.playbackRate };
    needsGesture = false;
    state = 'preparing';
    message = 'Preparing covered scan.';
    setVisual(target, 'cover');
    target.pause();
    target.muted = true;
    try {
      // Recreate the backing store for each source: a previously tainted canvas
      // otherwise remains unreadable even for a subsequent accessible video.
      canvas.width = 96;
      readPixels();
      await seek(target, section.scanStart, section.abort.signal);
      if (token !== generation) return;
      state = 'analyzing';
      section.lastFrameAt = performance.now();
      target.playbackRate = section.rate;
      const consume = (now, metadata) => {
        if (token !== generation || state !== 'analyzing') return;
        frameId = null;
        if (!validSource() || inAd()) { interruptedByAd = !!inAd(); fail('Player source changed during the scan.', true); return; }
        try {
          if (!sample(section, now, metadata)) return;
          if (section.lastTime >= section.scanEnd) { finish(section); return; }
          frameId = target.requestVideoFrameCallback(consume);
        } catch (error) { fail('Frame analysis failed: ' + error.message); }
      };
      frameId = target.requestVideoFrameCallback(consume);
      await target.play();
    } catch (error) {
      if (token !== generation) return;
      if (error.name === 'NotAllowedError' && state === 'analyzing') {
        needsGesture = true; message = 'Press YouTube Play to continue scanning.';
      } else fail(error.name === 'SecurityError' ? 'Chrome blocked pixel access for this video.' : error.message);
    }
  }
  function sample(section, now, metadata) {
    const time = metadata.mediaTime;
    if (time < section.lastTime - 0.001) { fail('Timeline changed during scan. Scan again from your chosen position.'); return false; }
    if (time === section.lastTime || time < section.scanStart - 0.04) return true;
    const dropped = video.getVideoPlaybackQuality?.().droppedVideoFrames ?? 0;
    const first = section.lastTime < 0;
    const lost = !first && (metadata.presentedFrames - section.presented > 1 ||
      dropped > section.dropped || time - section.lastTime > 0.12);
    if (lost || (first && time - section.scanStart > 0.06)) {
      markGap(section, (first ? section.scanStart : section.lastTime) - CONTEXT_SECONDS, time + CONTEXT_SECONDS);
      // Decoders may drop source frames before they reach the compositor.
      // Slow the scan immediately and retain the missed region as opaque.
      if (!first && section.rate > 1) {
        section.rate = 1;
        learnedRate = 1;
        video.playbackRate = 1;
      }
    }
    section.detector.push(time, readPixels());
    section.lastTime = time;
    section.presented = metadata.presentedFrames;
    section.dropped = dropped;
    section.samples++;
    section.lastFrameAt = now;
    return true;
  }
  async function finish(section) {
    if (state !== 'analyzing' || section !== segment) return;
    if (!section.samples || section.lastTime < section.scanEnd - 0.25) { fail('Scan ended before this section was analyzed.'); return; }
    if (section.scanEnd - section.lastTime > 0.06) markGap(section, section.lastTime-CONTEXT_SECONDS, section.scanEnd);
    const token = generation;
    if (frameId !== null) video.cancelVideoFrameCallback(frameId);
    frameId = null;
    state = 'rewinding';
    message = 'Returning to your playback position.';
    video.pause();
    try {
      await seek(video, section.resumeAt, section.abort.signal);
      if (token !== generation) return;
      if (!validSource() || inAd()) { fail('Player changed before replay.', true); return; }
      const hazards = section.detector.intervals.filter(i => i.end >= section.start && i.start < section.end)
        .map(i => ({ start:Math.max(i.start,section.start), end:Math.min(i.end,section.end) }));
      blocks.set(section.index, {start:section.start,end:section.end,hazards,gaps:section.gaps});
      restorePlayback();
      state = 'ready';
      message = section.end < duration ? 'Replaying scanned footage. The next section will scan at its boundary.' : 'Replaying scanned footage.';
      render();
      if (section.playAfter) await video.play();
    } catch (error) {
      if (token !== generation) return;
      if (state === 'ready') message = 'Press YouTube Play to resume.';
      else fail('Unable to return to the scanned section: ' + error.message);
    }
  }
  function visualAt(time) {
    if (!loaded) return 'cover';
    if (!settings.enabled || !key) return 'visible';
    if (settings.conservative || state !== 'ready' || document.hidden || inAd() || video.seeking || !validSource()) return 'cover';
    const ahead = Math.min(duration, time + Math.max(0.04, 0.12 * video.playbackRate));
    const active = blocks.get(blockIndex(time)), next = blocks.get(blockIndex(ahead));
    if (!active || !next || covered(time,active.gaps) || covered(ahead,next.gaps)) return 'cover';
    if (covered(time,active.hazards) || covered(ahead,next.hazards)) return settings.mode === 'blur' ? 'blur' : 'cover';
    return 'visible';
  }
  function render() {
    if (!video) { panel.remove(); return; }
    const visual = visualAt(video.currentTime);
    setVisual(video, visual);
    const host = document.fullscreenElement || document.body;
    if (host && panel.parentNode !== host) host.append(panel);
    const hidePanel = !settings.enabled || !key;
    if (panel.hidden !== hidePanel) panel.hidden = hidePanel;
    let text = message;
    if (state === 'analyzing' && segment) {
      const remaining = Math.ceil(Math.max(0,segment.scanEnd - Math.max(segment.scanStart,segment.lastTime)) / segment.rate);
      text = needsGesture || video.paused ? 'Press YouTube Play to continue scanning.' :
        'Scanning ' + Math.floor(segment.start) + '–' + Math.ceil(segment.end) + 's · about ' + remaining + 's remaining at ' + segment.rate + '×.';
    } else if (state === 'ready' && visual !== 'visible') text += ' Picture covered or filtered.';
    if (text !== lastUi) { statusText.textContent = text; lastUi = text; }
    const scanning = isScanning();
    if (scanButton.hidden !== scanning) scanButton.hidden = scanning;
    if (stopButton.hidden === scanning) stopButton.hidden = !scanning;
  }
  function syncPlayer(now) {
    const address = location.href;
    if (address !== lastAddress || !video?.isConnected || now >= nextLookupAt) {
      const nextKey = getVideoKey();
      const next = document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video');
      bind(next, nextKey);
      lastAddress = address;
      nextLookupAt = now + 250;
    }
  }
  function tick(now) {
    syncPlayer(now);
    if (video && key && settings.enabled && loaded) {
      if (inAd() && (state === 'ready' || isScanning())) {
        interruptedByAd = true;
        fail('Advertisement interrupted playback.', true);
      } else if (!inAd() && interruptedByAd) {
        interruptedByAd = false; state = 'waiting'; message = 'Preparing scan after advertisement.';
      }
      if (state === 'ready' && !validSource()) fail('Video source changed. Scan the new source before replay.', true);
      if (state === 'analyzing') {
        if (!video.muted) video.muted = true;
        if (video.playbackRate !== segment.rate) video.playbackRate = segment.rate;
        if (video.ended) finish(segment);
        else if (now - segment.lastFrameAt > 20000 && !video.paused) fail('No readable frames arrived for 20 seconds.');
      }
      if (state === 'waiting' && settings.autoAnalyze && !inAd() && video.readyState >= 2 && !document.hidden) {
        startAt(video.currentTime, true);
      } else if (state === 'ready' && !video.seeking && !video.ended && !blocks.has(blockIndex(video.currentTime))) {
        startAt(video.currentTime, !video.paused);
      }
    }
    render();
    requestAnimationFrame(tick);
  }
  document.addEventListener('seeking', event => {
    if (event.target === video && settings.enabled && key) setVisual(video,'cover');
    if (event.target === video && state === 'analyzing') fail('Position changed during scan. Scan again from this position.');
  }, true);
  document.addEventListener('seeked', event => { if (event.target === video) render(); }, true);
  document.addEventListener('playing', event => { if (event.target === video) needsGesture = false; }, true);
  document.addEventListener('error', event => { if (event.target === video) fail('Video playback failed.',true); }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isScanning()) fail('Tab hidden during scan. Return and select Scan this position.');
    render();
  });
  function configure(values) {
    for (const name of ['enabled','autoAnalyze','conservative','scanWholeVideo']) {
      if (typeof values[name] === 'boolean') settings[name] = values[name];
    }
    if ('mode' in values) settings.mode = values.mode === 'blur' ? 'blur' : 'overlay';
  }
  chrome.storage.local.get(settings).then(value => {
    configure(value); loaded = true;
  }).catch(() => { loaded = true; settings.autoAnalyze = false; fail('Unable to load settings.'); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const whole = settings.scanWholeVideo;
    configure(Object.fromEntries(Object.entries(changes).map(([name,change])=>[name,change.newValue])));
    if (!settings.enabled && isScanning()) stopScan();
    if (whole !== settings.scanWholeVideo) {
      if (isScanning()) stopScan();
      blocks.clear(); state = 'waiting'; segment = null;
    }
    if (!settings.enabled) document.querySelectorAll('video').forEach(other => setVisual(other,'visible'));
    render();
  });
  function snapshot() {
    const ordered = [...blocks.values()].sort((a,b)=>a.start-b.start);
    const intervals = ordered.flatMap(block=>block.hazards);
    const gaps = ordered.flatMap(block=>block.gaps);
    let scannedUntil = 0;
    let seconds = 0;
    for (const block of ordered) {
      if (block.start === scannedUntil) scannedUntil = block.end;
      seconds += block.end-block.start;
    }
    const active = state === 'analyzing' && segment;
    if (active) {
      seconds += Math.max(0,Math.min(active.end,active.lastTime)-active.start);
      gaps.push(...active.gaps);
    }
    const missing = gaps.reduce((sum,g)=>sum+g.end-g.start,0);
    const segmentProgress = segment ? Math.max(0,Math.min(1,(segment.lastTime-segment.scanStart)/(segment.scanEnd-segment.scanStart))) : 0;
    return {state,message:statusText.textContent || message,video:!!video,active:!!video && video.dataset.vgVisual!=='visible',
      duration,time:video?.currentTime || 0,progress:duration ? Math.min(1,seconds/duration) : 0,
      coverage:duration ? Math.max(0,(seconds-missing)/duration) : 0,intervals,gaps,scannedUntil,
      segmentStart:segment?.start ?? 0,segmentEnd:segment?.end ?? 0,segmentProgress:state==='ready'?1:segmentProgress,
      scanRate:segment?.rate ?? learnedRate,version:chrome.runtime.getManifest().version};
  }
  chrome.runtime.onMessage.addListener((request,sender,reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (request?.type === 'VG_STATUS') reply(snapshot());
    if (request?.type === 'VG_SCAN') { startAt(video?.currentTime || 0,true); reply({ok:true}); }
    if (request?.type === 'VG_STOP') { stopScan(); reply({ok:true}); }
  });
  requestAnimationFrame(tick);
})();
