const defaults = { enabled: true, conservative: false, mode: 'overlay', autoAnalyze: true };
const status = document.getElementById('status');
let tabId;
let lastStatus = '';
try {
  const settings = await chrome.storage.local.get(defaults);
  for (const key of Object.keys(defaults)) {
    const element = document.getElementById(key);
    if (key === 'mode') element.value = settings[key] === 'blur' ? 'blur' : 'overlay';
    else element.checked = typeof settings[key] === 'boolean' ? settings[key] : defaults[key];
    element.addEventListener('change', async () => {
      try { await chrome.storage.local.set({ [key]: key === 'mode' ? element.value : element.checked }); }
      catch { status.textContent = 'Settings could not be saved. Please reopen the extension.'; }
    });
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
} catch { status.textContent = 'Could not read settings or active tab.'; }
async function update() {
  try {
    const result = await chrome.tabs.sendMessage(tabId, { type: 'VG_STATUS' });
    const text = result.state === 'analyzing'
      ? 'Analyzing ' + Math.floor(result.progress * 100) + '% — picture covered and audio muted.'
      : result.message;
    if (text !== lastStatus) { status.textContent = text; lastStatus = text; }
    document.getElementById('progress').value = result.progress;
    document.getElementById('coverage').textContent = 'Observed timeline coverage: ' + Math.floor(result.coverage * 100) + '% · ' + result.intervals.length + ' potential hazard intervals · ' + result.gaps.length + ' covered gaps. Not a safety rating.';
    document.getElementById('timeline').textContent = result.intervals.length
      ? result.intervals.map(interval => interval.start.toFixed(2) + '–' + interval.end.toFixed(2) + 's').join('\n')
      : 'No hazards detected yet. This does not establish safety.';
    document.getElementById('scan').disabled = ['analyzing', 'preparing', 'rewinding'].includes(result.state);
    document.getElementById('stop').disabled = !['analyzing', 'preparing', 'rewinding'].includes(result.state);
  } catch {
    status.textContent = 'Open a YouTube video and reload its tab after updating the extension, or analyze a local video.';
    document.getElementById('scan').disabled = true;
    document.getElementById('stop').disabled = true;
  }
}
for (const [id, type] of [['scan', 'VG_SCAN'], ['stop', 'VG_STOP']]) {
  document.getElementById(id).addEventListener('click', async () => {
    try { await chrome.tabs.sendMessage(tabId, { type }); await update(); }
    catch { status.textContent = 'YouTube connection lost. Reload the video tab.'; }
  });
}
await update();
const timer = setInterval(update, 1000);
window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
