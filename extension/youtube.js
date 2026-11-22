(() => {
  let settings = {enabled:true,conservative:false};
  const style = document.createElement('style');
  style.textContent = 'html[data-vg-cover] video{filter:brightness(0)!important;background:#000!important}';
  const apply = () => {
    if (!style.isConnected) (document.head || document.documentElement)?.append(style);
    document.documentElement?.toggleAttribute('data-vg-cover',settings.enabled && settings.conservative);
  };
  chrome.storage.local.get(settings).then(value => {settings=value;apply();});
  chrome.storage.onChanged.addListener((changes,area) => {
    if(area !== 'local') return;
    for (const key of ['enabled','conservative']) if(changes[key]) settings[key]=changes[key].newValue;
    apply();
  });
  new MutationObserver(apply).observe(document,{childList:true,subtree:true});
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if(message.type === 'VG_STATUS') {
      const video=document.querySelector('video');
      reply({active:settings.enabled && settings.conservative,video:!!video,time:video?.currentTime,duration:video?.duration,paused:video?.paused,coverage:0,intervals:[]});
    }
  });
})();
