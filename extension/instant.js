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
  let failure = '', state = 'waiting', message = 'Open a YouTube video.';
  const picture = document.createElement('canvas');
  picture.className = 'vg-inspected-picture';
  picture.setAttribute('aria-hidden', 'true');
  const output = picture.getContext('2d', {alpha:false});
  const player = () => document.querySelector('#movie_player');
  const watchKey = () => location.pathname === '/watch'
    ? new URLSearchParams(location.search).get('v') : location.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
  const isAd = () => player()?.matches('.ad-showing, .ad-interrupting');

  function conceal() {
    picture.hidden = true;
    picture.removeAttribute('data-vg-trigger-blur');
    if (video) video.dataset.vgVisual = 'cover';
  }
  function freshHistory() {
    hasInspectedPicture = false;
    triggerHold = false;
    detector = new FastDetector();
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
  }
  function layout() {
    if (!video?.isConnected || !video.parentElement) return;
    if (picture.parentNode !== video.parentNode) video.after(picture);
    // Sibling placement leaves YouTube controls, captions and fullscreen ownership intact.
    const parent = picture.offsetParent || video.offsetParent;
    const bounds = video.getBoundingClientRect();
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
    if (!video.requestVideoFrameCallback || typeof VideoFrame === 'undefined' || !output || !sampleContext) {
      unavailable('Frame inspection is unavailable in this browser.');
      return;
    }
    frameId = video.requestVideoFrameCallback(inspect);
  }
  function inspect(now, metadata) {
    frameId = null;
    if (!video || !settings.enabled || settings.conservative || document.hidden) return;
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
    let frame;
    try {
      const time = metadata.mediaTime;
      if (time <= previousTime || time - previousTime > Math.max(.45, .45 * video.playbackRate)) freshHistory();
      frame = new VideoFrame(video);
      sampleContext.drawImage(frame, 0, 0, 96, 54);
      const decision = detector.inspect(now, sampleContext.getImageData(0, 0, 96, 54).data);
      checked++;
      previousTime = time;
      triggerHold = decision === 'filter';
      state = 'instant';
      if (decision !== 'show' || now < startupUntil) {
        if (triggerHold && hasInspectedPicture && settings.instantFilter === 'blur') {
          // Keep the last accepted pixels. Never draw the triggering frame into the
          // visible canvas: blurring a changing field of color still allows flashes.
          picture.setAttribute('data-vg-trigger-blur', '');
          picture.hidden = false;
          message = 'Trigger detected · previous picture frozen, blurred and dimmed.';
        } else if (!triggerHold && hasInspectedPicture) {
          picture.removeAttribute('data-vg-trigger-blur');
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
        const scale = Math.min(1, 1280/frame.displayWidth, 720/frame.displayHeight);
        const width = Math.max(1,Math.round(frame.displayWidth*scale));
        const height = Math.max(1,Math.round(frame.displayHeight*scale));
        if (picture.width !== width || picture.height !== height) {picture.width=width; picture.height=height;}
        output.drawImage(frame, 0, 0, width, height);
        hasInspectedPicture = true;
        picture.removeAttribute('data-vg-trigger-blur');
        if (picture.hidden) {picture.hidden = false; layout();}
        shown++;
        message = 'Playing inspected frames.';
      }
    } catch (error) {
      unavailable(error.name === 'SecurityError' ? 'Chrome blocked frame access.' : 'Could not inspect this frame.');
    } finally {frame?.close();}
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
    video.disablePictureInPicture = settings.enabled || previousPipSetting;
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
