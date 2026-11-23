/* global VisionGuardDetector */
// The source video remains black. Only a checked snapshot can reach the output canvas.
(async () => {
  const settings = await chrome.storage.local.get({instantPreview: true, enabled: true, conservative: false, instantFilter: 'blur'});
  if (!settings.instantPreview) return;
  const { FastDetector } = VisionGuardDetector;
  let video, key, source, frameId, resize, events, sample, sampleContext;
  let detector, previousTime, startupUntil, checked, shown, coveredAt, history, blocks;
  let previousPipSetting = false;
  let hasInspectedPicture = false;
  let triggerHold = false;
  let snapshot, capture;
  let targetWidth = 1280, targetHeight = 720;
  let sourceWidth = 0, sourceHeight = 0;
  let cachedUrl, cachedKey;
  let failure = '', state = 'waiting', message = 'Open a YouTube video.';
  const picture = document.createElement('canvas');
  picture.className = 'vg-inspected-picture';
  picture.setAttribute('aria-hidden', 'true');
  const output = picture.getContext('2d', {alpha:false});
  const player = () => document.querySelector('#movie_player');
  function watchKey() {
    if (cachedUrl !== location.href) {
      cachedUrl = location.href;
      cachedKey = location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') :
        location.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
    }
    return cachedKey;
  }
  const isAd = () => player()?.matches('.ad-showing, .ad-interrupting');

  function conceal() {
    picture.hidden = true;
    picture.removeAttribute('data-vg-trigger-blur');
    if (video) video.dataset.vgVisual = 'cover';
  }
  function freshHistory() {
    hasInspectedPicture = false;
    triggerHold = false;
    if (!detector || previousTime !== -1) detector = new FastDetector();
    previousTime = -1;
    startupUntil = performance.now() + 100;
    coveredAt = null;
    conceal();
  }
  function newSource() {
    source = video.currentSrc;
    failure = '';
    checked = 0;
    shown = 0;
    blocks = 0;
    history = [];
    freshHistory();
    // A canvas that was tainted by an earlier source cannot be reused.
    sample = document.createElement('canvas');
    sample.width = 96;
    sample.height = 54;
    sampleContext = sample.getContext('2d', {willReadFrequently:true, alpha:false});
    snapshot = document.createElement('canvas');
    capture = snapshot.getContext('2d', {alpha:false});
  }
  function layout() {
    if (!video?.isConnected || !video.parentElement) return;
    if (picture.parentNode !== video.parentNode) video.after(picture);
    // Sibling placement leaves YouTube controls, captions and fullscreen ownership intact.
    const parent = picture.offsetParent || video.offsetParent;
    const bounds = video.getBoundingClientRect();
    if (bounds.width && bounds.height) {
      targetWidth = Math.ceil(bounds.width * devicePixelRatio);
      targetHeight = Math.ceil(bounds.height * devicePixelRatio);
    }
    const anchor = parent?.getBoundingClientRect();
    const left = bounds.left - (anchor?.left || 0) + (parent?.scrollLeft || 0) - (parent?.clientLeft || 0);
    const top = bounds.top - (anchor?.top || 0) + (parent?.scrollTop || 0) - (parent?.clientTop || 0);
    Object.assign(picture.style, {left:left+'px', top:top+'px', width:bounds.width+'px', height:bounds.height+'px',
      objectFit:getComputedStyle(video).objectFit, objectPosition:getComputedStyle(video).objectPosition});
  }
  function unavailable(reason) {
    failure = reason;
    state = 'unavailable';
    message = reason + ' Picture covered.';
    conceal();
  }
  function queueFrame() {
    if (frameId != null || !video || !settings.enabled || settings.conservative || document.hidden || failure) return;
    if (!video.requestVideoFrameCallback || !capture || !output || !sampleContext) {
      unavailable('Frame inspection is unavailable in this browser.');
      return;
    }
    frameId = video.requestVideoFrameCallback(inspect);
  }
  function inspect(now, metadata) {
    frameId = null;
    if (!video || failure || !settings.enabled || settings.conservative || document.hidden) return;
    if (!video.isConnected || watchKey() !== key || source !== video.currentSrc) { reconcile(); return; }
    if (video.seeking || video.readyState < 2 || isAd()) {
      freshHistory();
      state = 'waiting';
      message = 'Waiting for an inspectable video frame. Picture covered.';
      queueFrame();
      return;
    }
    if (video.mediaKeys || document.pictureInPictureElement === video) {
      unavailable('Encrypted video and picture-in-picture are unsupported.');
      return;
    }
    let decoded;
    try {
      // Reserve the next callback before performing this frame's readback.
      queueFrame();
      const time = metadata.mediaTime;
      if (time <= previousTime || time - previousTime > Math.max(.45, .45 * video.playbackRate)) freshHistory();
      // Capture once. Inspection and presentation read the same private snapshot.
      const vw = video.videoWidth, vh = video.videoHeight;
      const scale = Math.min(1, 1280/vw, 720/vh, Math.max(targetWidth/vw, targetHeight/vh, 96/vw, 54/vh));
      const width = Math.max(1, Math.round(vw * scale)), height = Math.max(1, Math.round(vh * scale));
      // A second large canvas blit can miss presentation deadlines. Retain the
      // decoded frame directly for larger players on browsers that support it.
      if (width * height >= 960 * 540 && typeof VideoFrame !== 'undefined') {
        decoded = new VideoFrame(video);
      } else {
        if (snapshot.width !== width) snapshot.width = width;
        if (snapshot.height !== height) snapshot.height = height;
        capture.drawImage(video, 0, 0, width, height);
      }
      const image = decoded || snapshot;
      sampleContext.drawImage(image, 0, 0, 96, 54);
      const decision = detector.inspect(now, sampleContext.getImageData(0, 0, 96, 54).data);
      checked++;
      previousTime = time;
      triggerHold = decision === 'filter';
      state = 'instant';
      if (decision !== 'show' || now < startupUntil) {
        if (triggerHold && hasInspectedPicture && settings.instantFilter === 'blur') {
          // Keep the last accepted pixels. Never draw the triggering frame into the
          // visible canvas: blurring a changing field of color still allows flashes.
          picture.toggleAttribute('data-vg-trigger-blur', true);
          if (picture.hidden) picture.hidden = false;
          message = 'Trigger detected · previous picture frozen, blurred and dimmed.';
        } else if (!triggerHold && hasInspectedPicture) {
          picture.removeAttribute('data-vg-trigger-blur');
          if (decision === 'hold' && !picture.hidden && sourceWidth === vw && sourceHeight === vh &&
              picture.width === width && picture.height === height) {
            const pending = detector.pendingBounds(width, height);
            if (pending) {
              output.save();
              try {
                output.beginPath();
                output.rect(0, 0, width, height);
                output.rect(pending.x, pending.y, pending.w, pending.h);
                output.clip('evenodd');
                output.drawImage(image, 0, 0, width, height);
              } finally { output.restore(); }
            }
          }
          message = 'Checking a scene change.';
        } else {
          conceal();
          message = triggerHold ? 'Trigger detected · picture covered.' : 'Checking the first frames.';
        }
        if (!triggerHold) { coveredAt = null; return queueFrame(); }
        if (coveredAt === null) {
          blocks++;
          coveredAt = {start:time, end:time};
          history.push(coveredAt);
          if (history.length > 100) history.shift();
        }
        coveredAt.end = time;
      } else {
        coveredAt = null;
        sourceWidth = vw;
        sourceHeight = vh;
        if (picture.width !== width || picture.height !== height) {picture.width=width; picture.height=height;}
        output.drawImage(image, 0, 0, width, height);
        hasInspectedPicture = true;
        picture.removeAttribute('data-vg-trigger-blur');
        if (picture.hidden) {picture.hidden = false; layout();}
        shown++;
        message = 'Playing inspected frames.';
      }
    } catch (error) {
      unavailable(error.name === 'SecurityError' ? 'Chrome blocked frame access.' : 'Could not inspect this frame.');
    } finally { decoded?.close(); }
    queueFrame();
  }
  function detach() {
    if (frameId != null) video?.cancelVideoFrameCallback(frameId);
    frameId = null;
    events?.abort();
    resize?.disconnect();
    picture.remove();
    if (video) {
      delete video.dataset.vgVisual;
      video.disablePictureInPicture = previousPipSetting;
    }
    video = null;
  }
  function attach(next, identity) {
    detach();
    video = next;
    key = identity;
    state = 'waiting';
    message = 'Waiting for playback.';
    if (!video) return;
    previousPipSetting = video.disablePictureInPicture;
    newSource();
    events = new AbortController();
    const listen = (name, fn) => video.addEventListener(name, fn, {signal:events.signal});
    for (const name of ['seeking','emptied','loadstart']) listen(name, freshHistory);
    listen('play', queueFrame);
    listen('enterpictureinpicture', () => {
      conceal();
      if (settings.enabled && document.pictureInPictureElement === video) {
        document.exitPictureInPicture().catch(() => unavailable('Exit picture-in-picture to resume inspection.'));
      }
    });
    listen('loadeddata', () => { newSource(); queueFrame(); });
    listen('error', () => unavailable('Video playback failed.'));
    resize = new ResizeObserver(layout);
    resize.observe(video);
    layout();
  }
  function reconcile() {
    const identity = watchKey();
    const next = identity ? (player()?.querySelector('video.html5-main-video') || document.querySelector('video')) : null;
    document.documentElement?.toggleAttribute('data-vg-instant-bypass', !settings.enabled || !identity);
    document.documentElement?.toggleAttribute('data-vg-instant-on', settings.enabled && !!identity);
    if (next !== video || identity !== key) attach(next || null, identity);
    if (!video) return;
    const disablePip = settings.enabled || previousPipSetting;
    if (video.disablePictureInPicture !== disablePip) video.disablePictureInPicture = disablePip;
    if (!settings.enabled) {picture.hidden=true; state='disabled'; message='Protection is off.'; return;}
    if (settings.conservative) {conceal(); state='covered'; message='Continuous cover is enabled.'; return;}
    if (video.currentSrc !== source) newSource();
    if (isAd() || document.hidden) {conceal(); return;}
    queueFrame();
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.instantFilter) {
      settings.instantFilter = changes.instantFilter.newValue === 'overlay' ? 'overlay' : 'blur';
      if (settings.instantFilter === 'overlay' && triggerHold) conceal();
    }
    if (!changes.enabled && !changes.conservative) return;
    for (const name of ['enabled','conservative']) if (typeof changes[name]?.newValue === 'boolean') settings[name]=changes[name].newValue;
    if (video) freshHistory();
    reconcile();
  });
  document.addEventListener('visibilitychange', () => {if (video) freshHistory(); reconcile();});
  document.addEventListener('yt-navigate-start', () => {
    if (settings.enabled) document.documentElement?.removeAttribute('data-vg-instant-bypass');
    if (video) freshHistory();
  });
  document.addEventListener('yt-navigate-finish', reconcile);
  document.addEventListener('fullscreenchange', layout);
  chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (sender.id !== chrome.runtime.id || request?.type !== 'VG_STATUS') return;
    reply({strategy:'instant', state, message, video:!!video, checked:checked || 0, shown:shown || 0,
      active:!!video && settings.enabled && (picture.hidden || picture.hasAttribute('data-vg-trigger-blur')), blocks:blocks || 0, intervals:history || []});
  });
  reconcile();
  let timer = setInterval(reconcile, 250);
  window.addEventListener('pagehide', () => {
    clearInterval(timer);
    detach();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    reconcile();
    timer = setInterval(reconcile, 250);
  });
})().catch(() => { /* The document-start stylesheet keeps video pixels covered on initialization failure. */ });
