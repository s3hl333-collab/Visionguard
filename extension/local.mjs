import {Detector,covered} from './detector.mjs';
const $=id=>document.getElementById(id),video=$('video');
let intervals=[],ready=false,url,settings={enabled:true,mode:'overlay'},generation=0;
Object.assign(settings,await chrome.storage.local.get(settings));
chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;for(const key of Object.keys(settings))if(changes[key])settings[key]=changes[key].newValue;render();});
function render(){const active=!ready || (settings.enabled && covered(video.currentTime,intervals));$('cover').hidden=!(active && (!ready || settings.mode==='overlay'));video.style.filter=active && ready && settings.mode==='blur'?'blur(40px) brightness(.15)':'none';$('seek').value=video.currentTime;}
function tick(){render();requestAnimationFrame(tick);}tick();
function wait(target,event,action){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>done(new Error('Decode timeout')),15000);function done(error){clearTimeout(timer);target.removeEventListener(event,ok);target.removeEventListener('error',bad);if(error)reject(error);else resolve();}const ok=()=>done(),bad=()=>done(new Error('Unsupported or inaccessible video'));target.addEventListener(event,ok,{once:true});target.addEventListener('error',bad,{once:true});try{action();}catch(error){done(error);}});}
$('file').onchange=async()=>{
  const file=$('file').files[0];if(!file)return;const id=++generation;
  ready=false;video.pause();$('play').disabled=true;intervals=[];$('timeline').textContent='';render();
  video.removeAttribute('src');video.load();
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);const source=url;
  $('progress').value=0;
  const scan=document.createElement('video');scan.muted=true;scan.preload='auto';
  try{
    await wait(scan,'loadeddata',()=>{scan.src=source;});
    if(id!==generation)return;
    if(!Number.isFinite(scan.duration)||scan.duration<=0)throw Error('Finite duration required');
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=54;const ctx=canvas.getContext('2d',{willReadFrequently:true}),detector=new Detector();
    for(let t=0;t<scan.duration;t+=1/60){
      if(id!==generation)return;
      if(t>0)await wait(scan,'seeked',()=>{scan.currentTime=t;});
      if(id!==generation)return;
      ctx.drawImage(scan,0,0,96,54);detector.push(t,ctx.getImageData(0,0,96,54).data);
      const percent=Math.floor(t/scan.duration*100);
      if($('progress').value!==percent/100){$('progress').value=percent/100;$('status').textContent=`Analyzing ${percent}% — playback covered.`;}
    }
    if(id!==generation)return;
    intervals=detector.intervals.map(i=>({...i,end:Math.min(i.end,scan.duration)}));
    await wait(video,'loadeddata',()=>{video.src=source;});if(id!==generation)return;ready=true;$('play').disabled=false;$('seek').max=video.duration;$('progress').value=1;
    $('status').textContent=`Analysis complete: sampled entire duration at 60 samples/second. ${intervals.length} potential hazard intervals. Sampling is not exhaustive frame coverage.`;
    $('timeline').textContent=intervals.length?intervals.map(i=>`${i.start.toFixed(2)}–${i.end.toFixed(2)}s • potential hazard`).join('\n'):'No hazard detected by this experimental scan. This does not establish safety.';
  }catch(error){if(id===generation){$('status').textContent=`Partial coverage / analysis unavailable: ${error.message}. Visuals remain covered.`;}}
  finally{scan.removeAttribute('src');scan.load();}
};
$('play').onclick=()=>video.paused?video.play().catch(e=>{$('status').textContent=e.message;}):video.pause();
$('seek').oninput=()=>{video.currentTime=Number($('seek').value);render();};
$('speed').onchange=()=>{video.playbackRate=Number($('speed').value);};
$('fullscreen').onclick=()=>document.body.requestFullscreen().catch(error=>{$('status').textContent=`Fullscreen unavailable: ${error.message}`;});
video.addEventListener('seeking',render);
video.addEventListener('error',()=>{if(!video.getAttribute('src'))return;ready=false;render();$('play').disabled=true;$('status').textContent='Playback error. Visuals remain covered.';});
window.addEventListener('pagehide',()=>{generation++;video.pause();if(url)URL.revokeObjectURL(url);});
$('progress').setAttribute('aria-label','Video analysis progress');
