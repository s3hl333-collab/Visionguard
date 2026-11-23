/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdtempSync, readdirSync, readFileSync, unlinkSync, rmdirSync, existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

// Everything is generated inside a private headless session and temp directory.
// The URLs below are fulfilled by Playwright, including the YouTube watch page.
const duration = 48;
const rate = 24;
const baseline = process.env.VG_BASELINE === '1';

function bundledFFmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const executable = chromium.executablePath();
  let browsers = path.dirname(executable);
  while (!/^chromium-\d+$/.test(path.basename(browsers))) {
    const parent = path.dirname(browsers);
    if (parent === browsers) throw Error('Set FFMPEG_PATH to the Playwright FFmpeg executable.');
    browsers = parent;
  }
  browsers = path.dirname(browsers);
  const build = readdirSync(browsers).filter(entry => /^ffmpeg-\d+$/.test(entry)).sort((a,b)=>Number(b.slice(7))-Number(a.slice(7)))[0];
  if (!build) throw Error('Install the Playwright Chromium and FFmpeg binaries.');
  const folder = path.join(browsers,build);
  const binary = readdirSync(folder).find(entry => /^ffmpeg-(win64\.exe|linux|mac.*)$/.test(entry));
  if (!binary) throw Error('Set FFMPEG_PATH to the Playwright FFmpeg executable.');
  return path.join(folder,binary);
}

async function generateFixture(page, folder, {colorInterval = false, ordinaryFootage = false, researchCases = false, seconds = duration, flashStart = 15} = {}) {
  const stills = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 54;
    const ctx = canvas.getContext('2d');
    return ['#666', '#000', '#fff', '#005900', '#0000ff'].map(color => {
      ctx.fillStyle = color; ctx.fillRect(0,0,96,54);
      return canvas.toDataURL('image/jpeg').split(',')[1];
    });
  });
  const jpeg = stills.map(still=>Buffer.from(still,'base64'));
  const research = researchCases ? await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 54;
    const ctx = canvas.getContext('2d');
    const images = [102,119,134,147,'bands'].map(level => {
      for (let y = 0; y < canvas.height; y++) {
        const v = level === 'bands' ? (Math.floor(y / 3) % 2 ? 232 : 32) : level;
        ctx.fillStyle = 'rgb(' + [v,v,v].join(',') + ')';
        ctx.fillRect(0, y, canvas.width, 1);
      }
      return canvas.toDataURL('image/jpeg').split(',')[1];
    });
    for (let i = 0; i < 6; i++) {
      const shade = 102 + i*4;
      ctx.fillStyle = 'rgb(' + [shade,shade,shade].join(',') + ')';
      ctx.fillRect(0,0,96,54);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,24,27);
      images.push(canvas.toDataURL('image/jpeg').split(',')[1]);
    }
    for (const left of [0,3]) {
      ctx.fillStyle = '#666'; ctx.fillRect(0,0,96,54);
      ctx.fillStyle = '#fff'; ctx.fillRect(left,0,3,24);
      images.push(canvas.toDataURL('image/jpeg').split(',')[1]);
    }
    for (let i=0; i<6; i++) {
      const shade = 102 + i*4;
      ctx.fillStyle = 'rgb(' + [shade,shade,shade].join(',') + ')'; ctx.fillRect(0,0,96,54);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,24,18); ctx.fillRect(72,36,24,18);
      images.push(canvas.toDataURL('image/jpeg').split(',')[1]);
    }
    return images;
  }) : [];
  const researchFrames = research.map(still => Buffer.from(still, 'base64'));
  const ordinary = ordinaryFootage ? await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 54;
    const ctx = canvas.getContext('2d');
    return Array.from({length:144}, (_, index) => {
      // Three shots, each two seconds long, with a moving foreground subject.
      ctx.fillStyle = ['#416857', '#bba391', '#465978'][Math.floor(index / 48)];
      ctx.fillRect(0, 0, 96, 54);
      ctx.fillStyle = '#ded3c5';
      ctx.fillRect((index * 2) % 120 - 24, 10, 24, 28);
      return canvas.toDataURL('image/jpeg').split(',')[1];
    });
  }) : [];
  const shots = ordinary.map(still=>Buffer.from(still,'base64'));
  const frames = Array.from({length: seconds * rate}, (_, frame) => {
    const t = frame / rate;
    if (researchCases && t >= 12 && t < 13) return researchFrames[13 + Math.min(5,frame - 12*rate)];
    if (researchCases && t >= 46 && t < 47.5) return researchFrames[11 + Math.floor(frame / 2) % 2];
    if (researchCases && t >= 43 && t < 45) return Math.floor(frame / 2) % 2 ? researchFrames[5] : jpeg[0];
    if (researchCases && t >= 40 && t < 41) return researchFrames[5 + Math.min(5,frame - 40*rate)];
    if (researchCases && t >= 30 && t < 32) return researchFrames[[0,1,2,3,2,1][frame % 6]];
    if (researchCases && t >= 36 && t < 38) return researchFrames[4];
    if (ordinaryFootage && t >= 4 && t < 10) return shots[frame - 4 * rate];
    if (colorInterval && t >= 22 && t < 24) return jpeg[3 + Math.floor(frame / 2) % 2];
    return t >= flashStart && t < flashStart + 2 ? jpeg[1 + Math.floor(frame / 2) % 2] : jpeg[0];
  });
  const output = path.join(folder,'fixture.webm');
  const proc = spawnSync(bundledFFmpeg(), ['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(rate),'-i','pipe:0','-c:v','libvpx-vp9','-pix_fmt','yuv420p','-g',String(rate),'-deadline','realtime','-cpu-used','8',output],{input:Buffer.concat(frames),windowsHide:true});
  assert.equal(proc.status,0,String(proc.error || proc.stderr));
  return readFileSync(output);
}

async function main() {
  const project = process.env.VISION_GUARD_PROJECT || process.cwd();
  const extension = path.resolve(project,'extension');
  const folder = mkdtempSync(path.join(os.tmpdir(),'vision-guard-fast-test-'));
  const context = await chromium.launchPersistentContext('', {
    channel:'chromium', headless:true, args:['--disable-extensions-except='+extension,'--load-extension='+extension],
  });
  try {
    const manager = await context.newPage(); await manager.goto('chrome://extensions');
    const item = manager.locator('extensions-item').first(); await item.waitFor();
    const control = await context.newPage(); await control.goto('chrome-extension://'+ await item.getAttribute('id') +'/local.html');
    if (!baseline) await control.evaluate(()=>chrome.storage.local.set({instantPreview:false,scanWholeVideo:false}));
    const bytes = await generateFixture(control,folder);
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const fixture = 'data:video/webm;base64,' + bytes.toString('base64');
    const crossOrigin = 'https://vg-fixture.invalid/video.webm';
    await context.route('**/*',route=>{
      const url = new URL(route.request().url());
      if(url.hostname==='www.youtube.com' && url.pathname==='/watch') {
        const media = url.searchParams.get('v')==='blocked' ? crossOrigin : fixture;
        return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Headless test</title><div id="movie_player"><video controls class="html5-main-video" width="480" height="270" src="'+media+'"></video></div>'});
      }
      if (url.href===crossOrigin) return route.fulfill({contentType:'video/webm',body:bytes});
      return route.abort();
    });
    await page.bringToFront();
    const status = () => control.evaluate(async()=>{
      const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
      return chrome.tabs.sendMessage(tab.id,{type:'VG_STATUS'});
    });
    const read = async (predicate,timeout=45000) => {
      const started=Date.now(); let result;
      while(Date.now()-started<timeout){
        result=await status();
        if(predicate(result))return result;
        if(result.state==='unavailable')throw Error(JSON.stringify(result));
        await page.waitForTimeout(80);
      }
      throw Error('Timed out. Last extension state: '+JSON.stringify(result));
    };
    const filter = () => page.locator('video').evaluate(v=>getComputedStyle(v).filter);
    const seek = t => page.locator('video').evaluate((v,t)=>{v.currentTime=t;},t);
    const cover = async () => {await page.waitForFunction(()=>getComputedStyle(document.querySelector('video')).filter==='brightness(0)');};
    const started=performance.now();
    await page.goto('https://www.youtube.com/watch?v=fast');
    await read(s=>s.state==='analyzing');
    assert.equal(await filter(),'brightness(0)');
    await page.evaluate(()=>{
      window.leakedScanFrames=0;
      const video=document.querySelector('video');
      const observe=()=>{
        if(video.muted && getComputedStyle(video).filter!=='brightness(0)')window.leakedScanFrames++;
        requestAnimationFrame(observe);
      };
      observe();
    });
    // Create one genuine missed-callback interval to verify its replay covering.
    await page.waitForFunction(()=>document.querySelector('video').currentTime>2);
    await page.evaluate(()=>{const end=performance.now()+400;while(performance.now()<end){ /* intentional decoder/callback gap */ }});
    const first=await read(s=>s.state==='ready',baseline?75000:35000);
    const startup=(performance.now()-started)/1000;
    console.log(JSON.stringify({baseline,wallSecondsToFirstReplay:+startup.toFixed(2),videoSeconds:duration,firstScanCoveredFraction:first.coverage,firstScanProgress:first.progress}));
    assert.equal(await page.locator('video').evaluate(v=>v.muted),false);
    assert.equal(await page.evaluate(()=>window.leakedScanFrames),0);
    if(baseline){assert.equal(first.progress,1);return;}
    assert.ok(startup<duration*.65,'First replay still took nearly a full pass');
    assert.ok(first.progress<1,'Full coverage reported for a partial pass');
    assert.ok(first.gaps.length>0,'Induced missing frames should produce a covered gap');
    const gap=first.gaps.find(g=>g.start<=2.8 && g.end>=2) || first.gaps[0];
    await seek((gap.start+gap.end)/2);
    await page.waitForFunction(()=>!document.querySelector('video').seeking);
    await cover();
    const nearBoundary=first.scannedUntil-.8;
    assert.ok(nearBoundary>1 && nearBoundary<20,'Expected a short first segment');
    await seek(nearBoundary);
    await read(s=>s.state==='analyzing' && s.segmentStart>1);
    assert.equal(await filter(),'brightness(0)');
    const second=await read(s=>s.state==='ready' && s.scannedUntil>first.scannedUntil);
    assert.ok(second.intervals.some(i=>i.start<=15 && i.end>=17),JSON.stringify(second));
    await seek(16);await page.waitForFunction(()=>!document.querySelector('video').seeking);await cover();
    // A foreground seek to an unknown block must start a covered scan there.
    await seek(40);await read(s=>s.state==='analyzing' && s.segmentStart>25);await cover();
    const recovered=await read(s=>s.state==='ready' && s.time>35);
    assert.ok(recovered.progress<1,'Seeking across an unvisited segment must not fill its coverage');
    assert.equal(await page.evaluate(()=>window.leakedScanFrames),0);
    await page.evaluate(()=>document.querySelector('#movie_player').classList.add('ad-showing'));
    await read(s=>s.state==='unavailable');await cover();
    await page.goto('https://www.youtube.com/watch?v=blocked');
    const blocked=await read(s=>s.state==='unavailable');
    assert.match(blocked.message,/pixel|access|frame/i);await cover();
    // Headless Chromium keeps background tabs 'visible'. Exercise the handler
    // with an explicit hidden-state simulation in the extension's isolated world.
    const session=await context.newCDPSession(page);
    const worlds=[];
    session.on('Runtime.executionContextCreated',({context})=>worlds.push(context));
    await session.send('Runtime.enable');
    await page.goto('https://www.youtube.com/watch?v=visibility');
    await read(s=>s.state==='analyzing');
    let simulated=false;
    for (const world of worlds.slice().reverse()) {
      if(world.auxData?.type!=='isolated')continue;
      try {
        const reply=await session.send('Runtime.evaluate',{contextId:world.id,expression:`
          (() => { if (typeof chrome==='undefined' || !chrome.runtime?.id) return false;
            Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
            document.dispatchEvent(new Event('visibilitychange')); return true;
          })()`});
        if(reply.result.value===true){simulated=true;break;}
      } catch(error) { if(!/context/i.test(error.message))throw error; }
    }
    assert.ok(simulated,'Expected the extension isolated world');
    const hidden=await read(s=>s.state==='unavailable');
    assert.match(hidden.message,/hidden/i);await cover();
    await session.detach();
    assert.deepEqual(errors,[]);
    console.log('PASS fast first playback, unscanned seek, automatic next segment, timestamp detection, retained coverage gaps, ad invalidation, refused cross-origin access and simulated hidden-tab interruption');
  }finally{
    await context.close();
    const generated=path.join(folder,'fixture.webm');
    if(existsSync(generated)) unlinkSync(generated);
    rmdirSync(folder);
  }
}

module.exports = { generateFixture, bundledFFmpeg };
if (require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
