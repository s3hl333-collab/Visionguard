const defaults = {enabled:true,conservative:false,mode:'overlay'};
const settings = await chrome.storage.local.get(defaults);
for (const key of Object.keys(defaults)) {
  const el = document.getElementById(key);
  if (key === 'mode') el.value = settings[key]; else el.checked = settings[key];
  el.addEventListener('change', () => chrome.storage.local.set({[key]:key === 'mode' ? el.value : el.checked}));
}
try {
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  const state = await chrome.tabs.sendMessage(tab.id,{type:'VG_STATUS'});
  document.getElementById('status').textContent = `${state.active ? 'Protection active: continuous cover. ' : ''}Analysis unavailable on YouTube. Coverage: 0%. No detected intervals. ${state.video ? 'Video recognized.' : 'Waiting for video.'}`;
} catch { document.getElementById('status').textContent = 'Open a YouTube video, or analyze a local file. No video analyzed.'; }
