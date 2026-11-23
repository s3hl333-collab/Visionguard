const defaults = { enabled:true, conservative:false, mode:'overlay', instantFilter:'blur', autoAnalyze:true, instantPreview:true, scanWholeVideo:false };
const byId = id => document.getElementById(id);
const status = byId('status');
let tabId;
let connected = false;

function displayStrategy(strategy) {
  byId('fast-filter-control').hidden = strategy !== 'instant';
  byId('prescan-controls').hidden = strategy === 'instant';
  byId('scan-actions').hidden = strategy === 'instant';
  byId('timeline-title').textContent = strategy === 'instant' ? 'Recently covered moments' : 'Detected intervals';
  byId('strategy-info').textContent = {
    instant:'Checks each frame before drawing it. An isolated cut may briefly hold the clear picture. Rapid reversals and dense stripes activate the filter. Playback keeps its original audio and speed.',
    segments:'Scans a short section, plays it, then covers and mutes the picture while preparing the next section.',
    whole:'Scans the whole video first. Replay then runs without section breaks.'
  }[strategy];
}

try {
  const saved = await chrome.storage.local.get(defaults);
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  tabId = tab?.id;
  const strategy = byId('strategy');
  strategy.value = saved.instantPreview !== false ? 'instant' : saved.scanWholeVideo ? 'whole' : 'segments';
  displayStrategy(strategy.value);
  strategy.addEventListener('change', async () => {
    try {
      await chrome.storage.local.set({instantPreview:strategy.value === 'instant',scanWholeVideo:strategy.value === 'whole'});
      displayStrategy(strategy.value);
      if (connected) await chrome.tabs.reload(tabId);
      status.textContent = 'Mode saved. The new mode starts when the YouTube tab loads.';
    } catch { status.textContent = 'Could not apply this mode. Reload the video tab.'; }
  });
  for (const name of ['enabled','conservative','mode','autoAnalyze','instantFilter']) {
    const element = byId(name);
    if (name === 'mode') element.value = saved.mode === 'blur' ? 'blur' : 'overlay';
    else if (name === 'instantFilter') element.value = saved.instantFilter === 'overlay' ? 'overlay' : 'blur';
    else element.checked = saved[name] === true;
    element.addEventListener('change', async () => {
      try { await chrome.storage.local.set({[name]:element.tagName === 'SELECT' ? element.value : element.checked}); }
      catch { status.textContent = 'Could not save this setting.'; }
    });
  }
} catch { status.textContent = 'Could not open extension settings.'; }

async function update() {
  try {
    const result = await chrome.tabs.sendMessage(tabId, {type:'VG_STATUS'});
    connected = true;
    if (status.textContent !== result.message) status.textContent = result.message;
    const instant = result.strategy === 'instant';
    byId('progress').hidden = instant;
    if (!instant) byId('progress').value = result.segmentProgress ?? result.progress ?? 0;
    byId('coverage').textContent = instant
      ? result.checked + ' frames inspected during playback · ' + result.shown + ' displayed'
      : Math.floor(result.coverage * 100) + '% of video analyzed · ' + result.intervals.length + ' potential hazard intervals';
    byId('timeline').textContent = result.intervals.length
      ? result.intervals.map(i => i.start.toFixed(2)+'–'+i.end.toFixed(2)+' s').join('\n')
      : instant ? 'No covered moments recorded in this session.' : 'No hazard intervals recorded.';
    const scanning = ['analyzing','preparing','rewinding'].includes(result.state);
    byId('scan').disabled = scanning || !result.video;
    byId('stop').disabled = !scanning;
  } catch {
    connected = false;
    status.textContent = 'Open a YouTube video or reload the tab after updating.';
    byId('progress').hidden = true;
    byId('coverage').textContent = '';
    byId('scan').disabled = byId('stop').disabled = true;
  }
}
for (const [id, type] of [['scan','VG_SCAN'],['stop','VG_STOP']]) {
  byId(id).addEventListener('click', async () => {
    try { await chrome.tabs.sendMessage(tabId,{type}); await update(); }
    catch { status.textContent = 'Reload this YouTube tab to reconnect.'; }
  });
}
await update();
const timer = setInterval(update, 1000);
window.addEventListener('pagehide', () => clearInterval(timer), {once:true});
