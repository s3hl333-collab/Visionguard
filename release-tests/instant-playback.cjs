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
    const bytes = await generateFixture(control, temporary, {colorInterval:true});
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
    // Watch actual canvas pixel values in the encoded strobe, including its first transition.
    async function checkInterval(start) {
      return page.evaluate(async start => {
      const video=document.querySelector('video'),canvas=document.querySelector('.vg-inspected-picture');
      let frames=0, exposed=0, blurred=0, rawVisible=0, firstBlur=null;
      const observed = new Set();
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
          }
          if(!canvas.hidden){
            const pixel=canvas.getContext('2d').getImageData(10,10,1,1).data;
            if ([pixel[0],pixel[1],pixel[2]].some(channel=>Math.abs(channel-102)>8)) exposed++;
          }
        }
        if(video.currentTime>start+4.5)resolve();else requestAnimationFrame(poll);
      };poll();});
      return {start,frames,exposed,blurred,firstBlur,rawVisible,sourceColors:[...observed].slice(0,12),paused:video.paused,
        restored:!canvas.hidden && getComputedStyle(canvas).filter==='none'};
      },start);
    }
    const sample=[];
    for(const start of [15,22]){
      const result=await checkInterval(start);
      assert.ok(result.blurred>result.frames*0.9 && result.firstBlur!==null && result.firstBlur<start+.15 && result.restored,JSON.stringify(result));
      assert.deepEqual([result.exposed,result.rawVisible,result.paused],[0,0,false]);
      sample.push(result);
    }
    const report=await status();
    for (const start of [15,22]) assert.ok(report.intervals.some(i=>Math.abs(i.start-start)<.15 && i.end>=start+2),JSON.stringify(report));
    await page.goto('https://www.youtube.com/watch?v=vg-blocked');
    await page.locator('video').evaluate(v=>v.play());
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.4);
    assert.equal((await status()).state,'unavailable');
    assert.equal(await page.locator('.vg-inspected-picture').isVisible(),false);
    assert.equal(await page.locator('video').evaluate(v=>getComputedStyle(v).filter),'brightness(0)');
    console.log(JSON.stringify({startupMs,fixtureDuration:48,sample,blocked:'covered',errors}));
    assert.deepEqual(errors,[]);
    if(process.env.VG_LIVE==='1'){
      await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#movie_player video')?.readyState>=2,null,{timeout:45000});
      const liveStart=performance.now();
      await page.locator('#movie_player video').first().evaluate(v=>v.play());
      await page.waitForFunction(()=>document.querySelector('.vg-inspected-picture')?.hidden===false,null,{timeout:20000});
      console.log('LIVE',JSON.stringify({timeToFirstInspectedMs:Math.round(performance.now()-liveStart),status:await status()}));
    }
  } finally { await context.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
