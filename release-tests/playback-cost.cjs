/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Chromium runner. */
const {chromium} = require('playwright');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {bundledFFmpeg} = require('./fast-prescan.cjs');

async function encodedMotion() {
  const browser = await chromium.launch({channel:'chromium',headless:true});
  try {
    const page = await browser.newPage();
    const stills = await page.evaluate(() => {
      const source = document.createElement('canvas');
      source.width = 1920; source.height = 1080;
      const ctx = source.getContext('2d');
      return Array.from({length:60}, (_,i) => {
        ctx.fillStyle = '#55616a'; ctx.fillRect(0,0,1920,1080);
        ctx.fillStyle = '#738795'; ctx.fillRect(i*24,310,300,240);
        return source.toDataURL('image/jpeg').split(',')[1];
      });
    });
    const frames = stills.map(s=>Buffer.from(s,'base64'));
    const input = Buffer.concat(Array.from({length:600},(_,i)=>frames[i%60]));
    const encoded = spawnSync(bundledFFmpeg(),['-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','60',
      '-i','pipe:0','-c:v','libvpx-vp9','-pix_fmt','yuv420p','-deadline','realtime','-cpu-used','8','-f','webm','pipe:1'],
      {input,windowsHide:true,maxBuffer:16*1024*1024});
    assert.equal(encoded.status,0,String(encoded.error || encoded.stderr));
    return 'data:video/webm;base64,' + encoded.stdout.toString('base64');
  } finally { await browser.close(); }
}

async function measure(extension, width, encoded, regional) {
  const native = extension === null;
  const context = await chromium.launchPersistentContext('', {channel:'chromium', headless:true,
    args:native ? [] : ['--disable-extensions-except='+extension,'--load-extension='+extension]});
  try {
    let control;
    if (!native) {
      const manager = await context.newPage();
      await manager.goto('chrome://extensions');
      const item = manager.locator('extensions-item').first();
      await item.waitFor();
      control = await context.newPage();
      await control.goto('chrome-extension://'+await item.getAttribute('id')+'/local.html');
      if (regional) await control.evaluate(() => chrome.storage.local.set({targetedPlayback:true}));
    }
    const page = await context.newPage();
    await page.route('https://www.youtube.com/watch?v=vg-cost', route => route.fulfill({
      contentType:'text/html', body:'<div id="movie_player"><video class="html5-main-video" muted></video></div>'}));
    await page.goto('https://www.youtube.com/watch?v=vg-cost');
    await page.evaluate(async ({width,encoded}) => {
      const video = document.querySelector('video');
      video.width = width; video.height = width*9/16;
      if (encoded) {
        video.src = encoded;
        await video.play();
        return;
      }
      const input = document.createElement('canvas');
      input.width = 1920; input.height = 1080;
      const ctx = input.getContext('2d', {alpha:false});
      const stream = input.captureStream(60);
      video.srcObject = stream;
      function draw(now) {
        ctx.fillStyle = '#55616a'; ctx.fillRect(0,0,input.width,input.height);
        ctx.fillStyle = '#738795'; ctx.fillRect((now / 4) % 1600,310,300,240);
        requestAnimationFrame(draw);
      }
      draw(performance.now());
      await video.play();
    }, {width,encoded});
    if (regional) await page.waitForFunction(() => document.querySelector('video')?.dataset.vgVisual === 'visible');
    else if (!native) await page.waitForFunction(() => document.querySelector('.vg-inspected-picture')?.hidden === false);
    const status = () => native ? null : control.evaluate(async () => {
      const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
      return chrome.tabs.sendMessage(tab.id,{type:'VG_STATUS'});
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const worlds = [];
    cdp.on('Runtime.executionContextCreated', ({context}) => worlds.push(context));
    await cdp.send('Runtime.enable');
    const world = native ? worlds.find(w=>w.auxData?.isDefault) :
      worlds.find(w=>w.origin.startsWith('chrome-extension://'));
    assert.ok(world,JSON.stringify(worlds));
    const evaluate = async expression => {
      const reply = await cdp.send('Runtime.evaluate',{contextId:world.id,expression,returnByValue:true});
      assert.ok(!reply.exceptionDetails,JSON.stringify(reply.exceptionDetails));
      return reply.result.value;
    };
    const taskMs = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='TaskDuration').value*1000;
    // Record actual inspected-picture draws in the content script's JS world.
    // Sample source and output counters on the same clock and in the same task.
    await evaluate(`(() => {
      const v = document.querySelector('video'), times = [];
      window.vgPerfSample = () => {
        const q = v.getVideoPlaybackQuality();
        return {dropped:q.droppedVideoFrames,total:q.totalVideoFrames,media:v.currentTime,times:times.slice()};
      };
      if (${!native && !regional}) {
        const canvas = document.querySelector('.vg-inspected-picture');
        const ctx = canvas.getContext('2d');
        const draw = ctx.drawImage;
        ctx.drawImage = function(...args) {
          draw.apply(this,args);
          times.push(performance.now());
        };
      }
    })()`);
    await page.waitForTimeout(1000);
    const before = await status(), first = await evaluate('vgPerfSample()'), begin = await taskMs();
    await page.waitForTimeout(5000);
    const end = await taskMs(), last = await evaluate('vgPerfSample()'), after = await status();
    const size = native ? null : await page.locator('.vg-inspected-picture').evaluate(c=>[c.width,c.height]);
    const dropped = last.dropped-first.dropped, total = last.total-first.total;
    const times = last.times.slice(first.times.length);
    const shown = native || regional ? total-dropped : times.length;
    const gaps = times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);
    assert.ok(shown > 50, JSON.stringify({before,after,shown}));
    if (!native) {
      assert.ok(after.checked >= after.shown);
      assert.equal(after.blocks,0,'Ordinary motion activated the filter');
      if (regional) {
        assert.ok(after.regional && after.checked-before.checked > 50);
        assert.equal(after.active,false);
      } else assert.equal(after.checked-before.checked,after.shown-before.shown,'Ordinary motion held an inspected frame');
    }
    console.log(JSON.stringify({extension:extension || 'native',regional,input:encoded?'VP9':'captureStream',viewportWidth:width,output:size,shown,
      dropped,total,mediaSeconds:+(last.media-first.media).toFixed(2),p95DrawGapMs:gaps.length ? +gaps[Math.floor(gaps.length*.95)].toFixed(1) : null,
      mainThreadMsPerShownFrame:+((end-begin)/shown).toFixed(3)}));
  } finally { await context.close(); }
}
(async () => {
  const encoded = process.env.VG_ENCODED === '1' ? await encodedMotion() : null;
  for (const extension of process.argv.slice(2).length ? process.argv.slice(2) : ['extension']) {
    const regional = extension === '--regional';
    for (const width of [480,960]) await measure(extension === '--native' ? null : path.resolve(regional ? 'extension' : extension),width,encoded,regional);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
