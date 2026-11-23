/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node browser runner. */
const { chromium } = require('playwright');
const { generateFixture } = require('./fast-prescan.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const project = process.env.VISION_GUARD_PROJECT || process.cwd();
  const extension = path.resolve(project, 'extension');
  const context = await chromium.launchPersistentContext('', {channel:'chromium',headless:true,
    args:['--disable-extensions-except='+extension, '--load-extension='+extension]});
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const item = manager.locator('extensions-item').first();
    await item.waitFor();
    const control = await context.newPage();
    await control.goto('chrome-extension://'+await item.getAttribute('id')+'/local.html');
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'vg-before-display-'));
    const bytes = await generateFixture(control, temporary, {colorInterval:true, ordinaryFootage:true, researchCases:true});
    // Delete only the known, generated fixture as soon as its bytes are in memory.
    fs.unlinkSync(path.join(temporary,'fixture.webm'));
    fs.rmdirSync(temporary);
    const fixture = 'data:video/webm;base64,' + bytes.toString('base64');
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cross = 'https://vg-fixture.invalid/video.webm';
    await page.route(cross, route => route.fulfill({contentType:'video/webm',body:bytes}));
    await page.route('https://www.youtube.com/watch?v=vg-*', route => route.fulfill({contentType:'text/html',
      body:'<!doctype html><title>Controlled playback</title><div id="movie_player" style="position:relative"><video class="html5-main-video" width="480" height="270" controls src="'+(route.request().url().endsWith('blocked') ? cross : fixture)+'"></video></div>'}));
    await page.goto('https://www.youtube.com/watch?v=vg-test');
    const status = () => control.evaluate(async () => {
      const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
      return chrome.tabs.sendMessage(tab.id, {type:'VG_STATUS'});
    });
    await page.locator('video').waitFor();
    const started = performance.now();
    await page.locator('video').evaluate(v => v.play());
    await page.waitForFunction(() => {
      const canvas=document.querySelector('.vg-inspected-picture');
      return canvas && !canvas.hidden && canvas.getContext('2d').getImageData(10,10,1,1).data[0]>60;
    });
    const startupMs = Math.round(performance.now()-started);
    assert.ok(startupMs < 3500, 'First inspected picture should arrive during the opening seconds.');
    const bounds = await page.evaluate(() => {
      const video=document.querySelector('video'),canvas=document.querySelector('.vg-inspected-picture');
      const a=canvas.getBoundingClientRect(), b=video.getBoundingClientRect();
      return {dx:Math.abs(a.left-b.left),dy:Math.abs(a.top-b.top),w:Math.abs(a.width-b.width),h:Math.abs(a.height-b.height),mute:video.muted,rate:video.playbackRate,raw:getComputedStyle(video).filter};
    });
    assert.ok([bounds.dx,bounds.dy,bounds.w,bounds.h].every(d=>d<2),JSON.stringify(bounds));
    assert.deepEqual([bounds.mute,bounds.rate,bounds.raw],[false,1,'brightness(0)']);
    // Model two cache restores. Chromium automation may disable the real cache.
    for (let restore = 0; restore < 2; restore++) {
      await page.evaluate(() => {
        window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted:true}));
        if (document.querySelector('.vg-inspected-picture')) throw Error('Old canvas survived pagehide');
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}));
      });
      await page.waitForFunction(() => document.querySelector('.vg-inspected-picture')?.hidden === false);
      assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).filter), 'brightness(0)');
    }
    const ordinary = await page.evaluate(async () => {
      const video = document.querySelector('video');
      const picture = document.querySelector('.vg-inspected-picture');
      video.currentTime = 3.5;
      await new Promise(resolve => video.addEventListener('seeked', resolve, {once:true}));
      let samples = 0, blurred = 0, hidden = 0;
      const seen = new Set();
      await new Promise(resolve => {
        function poll() {
          if (video.currentTime >= 4 && video.currentTime < 10) {
            samples++;
            if (picture.hidden) hidden++;
            if (picture.hasAttribute('data-vg-trigger-blur')) blurred++;
            const pixels = picture.getContext('2d').getImageData(0, 24, 96, 1).data;
            seen.add(pixels.toString());
          }
          if (video.currentTime >= 10) resolve(); else requestAnimationFrame(poll);
        }
        poll();
      });
      return {samples, blurred, hidden, distinctRows:seen.size};
    });
    console.log('Ordinary cuts and motion', JSON.stringify(ordinary));
    assert.ok(ordinary.samples > 50 && ordinary.distinctRows > 48, JSON.stringify(ordinary));
    assert.deepEqual([ordinary.blurred, ordinary.hidden], [0,0]);
    // Watch actual canvas pixel values in the encoded strobe, including its first transition.
    async function checkInterval(start) {
      return page.evaluate(async start => {
      const video=document.querySelector('video'),canvas=document.querySelector('.vg-inspected-picture');
      let frames=0, exposed=0, blurred=0, rawVisible=0, firstBlur=null;
      const observed = new Set();
      const filteredPixels = new Set();
      const probe = document.createElement('canvas').getContext('2d',{willReadFrequently:true});
      video.currentTime=start-1.5;
      await new Promise(resolve=>{ const poll=()=>{
        if(getComputedStyle(video).filter!=='brightness(0)')rawVisible++;
        if(video.currentTime>=start && video.currentTime<start+2){
          frames++;
          probe.drawImage(video,0,0,1,1);
          observed.add(Array.from(probe.getImageData(0,0,1,1).data).slice(0,3).join('/'));
          if(!canvas.hidden && /blur\(28px\).*brightness\(0.35\)/.test(getComputedStyle(canvas).filter)){
            blurred++;
            firstBlur ??= video.currentTime;
            filteredPixels.add(canvas.getContext('2d').getImageData(10,10,1,1).data[0]);
          }
          if(!canvas.hidden){
            const pixel=canvas.getContext('2d').getImageData(10,10,1,1).data;
            // The gradual pulse can show its initial low-contrast steps.
            const maxLevel = start === 30 ? 139 : 110;
            if ([pixel[0],pixel[1],pixel[2]].some(channel=>channel < 94 || channel > maxLevel)) exposed++;
          }
        }
        if(video.currentTime>start+4.5)resolve();else requestAnimationFrame(poll);
      };poll();});
      return {start,frames,exposed,blurred,firstBlur,rawVisible,filteredLevels:[...filteredPixels],sourceColors:[...observed].slice(0,12),paused:video.paused,
        restored:!canvas.hidden && getComputedStyle(canvas).filter==='none'};
      },start);
    }
    const sample=[];
    const starts = [15,22,30,36];
    for(const start of starts){
      const result=await checkInterval(start);
      const deadline = start === 30 ? .32 : .15;
      assert.ok(result.blurred > result.frames*(1-deadline/2-.025) && result.firstBlur!==null && result.firstBlur<start+deadline && result.restored,JSON.stringify(result));
      assert.equal(result.filteredLevels.length, 1, 'Filtered picture must stay frozen');
      if (start === 30) assert.ok(result.sourceColors.length >= 3);
      assert.deepEqual([result.exposed,result.rawVisible,result.paused],[0,0,false]);
      sample.push(result);
    }
    const report=await status();
    const partial = await page.evaluate(async () => {
      const video = document.querySelector('video'), canvas = document.querySelector('.vg-inspected-picture');
      video.currentTime = 39.5;
      await new Promise(resolve=>video.addEventListener('seeked',resolve,{once:true}));
      let leftMax = 0, rightMax = 0;
      await new Promise(resolve => {
        function sample() {
          if (video.currentTime >= 40 && video.currentTime < 40.20 && !canvas.hidden) {
            const row = canvas.getContext('2d').getImageData(0,10,96,1).data;
            leftMax = Math.max(leftMax,row[10*4]);
            rightMax = Math.max(rightMax,row[80*4]);
          }
          if (video.currentTime >= 40.21) resolve(); else requestAnimationFrame(sample);
        }
        sample();
      });
      return {leftMax,rightMax};
    });
    assert.ok(partial.leftMax >= 94 && partial.leftMax <= 110 && partial.rightMax >= 113, JSON.stringify(partial));
    for (const start of starts) assert.ok(report.intervals.some(i=>Math.abs(i.start-start)<(start === 30 ? .32 : .15) && i.end>=start+2),JSON.stringify(report));
    await page.goto('https://www.youtube.com/watch?v=vg-blocked');
    await page.locator('video').evaluate(v=>v.play());
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.4);
    assert.equal((await status()).state,'unavailable');
    assert.equal(await page.locator('.vg-inspected-picture').isVisible(),false);
    assert.equal(await page.locator('video').evaluate(v=>getComputedStyle(v).filter),'brightness(0)');
    console.log(JSON.stringify({startupMs,fixtureDuration:48,sample,blocked:'covered',errors}));
    assert.deepEqual(errors,[]);
    await control.evaluate(() => chrome.storage.local.set({targetedPlayback:true}));
    await page.reload();
    await page.locator('video').evaluate(v => v.play());
    await page.waitForFunction(() => document.querySelector('video').currentTime > .4);
    assert.equal((await status()).state,'unavailable','Unreadable regional playback must stay covered');
    await page.goto('https://www.youtube.com/watch?v=vg-test');
    await page.locator('video').evaluate(v => {v.currentTime=3.5; return v.play();});
    await page.waitForFunction(() => document.querySelector('video').currentTime > 10);
    assert.equal((await status()).blocks,0,'Native playback dimmed an ordinary cut or moving subject');
    await page.locator('video').evaluate(v => {
      v.style.position='relative';
      v.style.zIndex='2';
      v.currentTime=42;
    });
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.vg-regional-mask');
      return !canvas.hidden && document.querySelector('video').currentTime > 43;
    });
    const onset = (await status()).intervals.at(-1).start - 43;
    assert.ok(onset >= 0 && onset < .42,'Local strobe dimming began at ' + onset);
    const mask = await page.evaluate(() => {
      const canvas = document.querySelector('.vg-regional-mask'), v = document.querySelector('video');
      const ctx = canvas.getContext('2d');
      return {left:ctx.getImageData(9,9,1,1).data[3],right:ctx.getImageData(80,9,1,1).data[3],
        maskVisible:!canvas.hidden, background:getComputedStyle(canvas).backgroundColor,
        filter:getComputedStyle(v).filter,paused:v.paused,rate:v.playbackRate};
    });
    assert.ok(mask.left >= 240 && mask.left < 255 && mask.right === 0, JSON.stringify(mask));
    assert.deepEqual([mask.maskVisible,mask.background,mask.filter,mask.paused,mask.rate],[true,'rgba(0, 0, 0, 0)','none',false,1]);
    // Stop on an actual bright source frame. Read a screenshot of the composed
    // player so an overlay hidden beneath a positive-z-index video fails here.
    await page.evaluate(async () => {
      const v = document.querySelector('video'), probe = document.createElement('canvas');
      probe.width=96; probe.height=54;
      const ctx = probe.getContext('2d',{willReadFrequently:true});
      await new Promise((resolve,reject) => {
        function check() {
          ctx.drawImage(v,0,0,96,54);
          if (ctx.getImageData(9,9,1,1).data[0] > 230) { v.pause(); resolve(); }
          else if (v.currentTime > 45) reject(Error('No bright frame sampled'));
          else v.requestVideoFrameCallback(check);
        }
        v.requestVideoFrameCallback(check);
      });
    });
    const screenshot = await page.screenshot({clip:await page.locator('video').boundingBox()});
    const composed = await control.evaluate(async encoded => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + encoded;
      await img.decode();
      const c = document.createElement('canvas'); c.width=96; c.height=54;
      const ctx = c.getContext('2d');
      ctx.drawImage(img,0,0,96,54);
      return [9,80].map(x=>ctx.getImageData(x,9,1,1).data[0]);
    },screenshot.toString('base64'));
    assert.ok(composed[0] <= 100 && composed[1] >= 98 && composed[1] <= 106,JSON.stringify(composed));
    await page.locator('video').evaluate(v => v.play());
    await page.waitForFunction(() => document.querySelector('video').currentTime > 45.7);
    assert.equal(await page.locator('.vg-regional-mask').isVisible(),false);
    assert.ok((await status()).blocks > 0);
    await page.waitForFunction(() => document.querySelector('video').currentTime > 46.7);
    const narrow = await page.locator('.vg-regional-mask').evaluate(c => {
      const ctx = c.getContext('2d');
      return [1,4,12].map(x=>ctx.getImageData(x,9,1,1).data[3]);
    });
    assert.ok(narrow[0] >= 240 && narrow[1] >= 240 && narrow[2] === 0,JSON.stringify(narrow));
    await control.evaluate(() => chrome.storage.local.set({conservative:true}));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('video')).filter === 'brightness(0)');
    await control.evaluate(() => chrome.storage.local.set({conservative:false}));
    console.log('Regional playback', JSON.stringify({mask,onset,composed,narrow}));
    if(process.env.VG_LIVE==='1'){
      await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#movie_player video')?.readyState>=2,null,{timeout:45000});
      const liveStart=performance.now();
      await page.locator('#movie_player video').first().evaluate(v=>v.play());
      await page.waitForFunction(()=>document.querySelector('#movie_player video')?.dataset.vgVisual==='visible',null,{timeout:20000});
      console.log('LIVE regional',JSON.stringify({timeToNativePictureMs:Math.round(performance.now()-liveStart),status:await status()}));
    }
  } finally { await context.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
