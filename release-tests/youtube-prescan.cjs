/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const project = process.env.VISION_GUARD_PROJECT || process.cwd();

(async () => {
  const extension = path.join(project, 'extension');
  const context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vg-prescan-')), {
    channel: 'chromium', headless: true,
    args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension],
  });
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    await manager.locator('extensions-item').first().waitFor();
    const id = await manager.locator('extensions-item').first().getAttribute('id');
    const control = await context.newPage();
    await control.goto('chrome-extension://' + id + '/local.html');
    await control.evaluate(() => chrome.storage.local.set({instantPreview:false, scanWholeVideo:true}));
    const bytes = await control.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 54;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      const result = new Promise(resolve => { recorder.onstop = async () => resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))); });
      recorder.start(); const start = performance.now();
      await new Promise(resolve => {
        const timer = setInterval(() => {
          const t = (performance.now() - start) / 1000;
          ctx.fillStyle = t >= 2 && t < 4 ? (Math.floor(t * 16) % 2 ? 'white' : 'black') : '#666';
          ctx.fillRect(0, 0, 96, 54);
          if (t >= 8) { clearInterval(timer); recorder.stop(); stream.getTracks().forEach(track => track.stop()); resolve(); }
        }, 1000 / 30);
      });
      return result;
    });
    const page = await context.newPage();
    const html = '<!doctype html><title>Controlled fixture</title><div id="movie_player"><video class="html5-main-video" width="640" height="360" controls src="data:video/webm;base64,' + Buffer.from(bytes).toString('base64') + '"></video></div>';
    await page.route('https://www.youtube.com/watch?v=vgfixture', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('https://www.youtube.com/watch?v=vgfixture');
    await page.bringToFront();
    const status = async () => control.evaluate(async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      return chrome.tabs.sendMessage(tabs[0].id, {type: 'VG_STATUS'});
    });
    async function until(predicate, timeout = 45000) {
      const started = Date.now(); let result;
      while (Date.now() - started < timeout) {
        result = await status();
        if (predicate(result)) return result;
        if (result.state === 'unavailable') throw new Error(JSON.stringify(result));
        await page.waitForTimeout(250);
      }
      throw new Error('Timeout: ' + JSON.stringify(result));
    }
    await until(result => result.state === 'analyzing');
    assert.equal(await page.locator('video').getAttribute('data-vg-visual'), 'cover');
    assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).filter), 'brightness(0)');
    assert.equal(await page.locator('video').evaluate(v => v.muted), true);
    const complete = await until(result => result.state === 'ready');
    assert.equal(await page.locator('video').evaluate(v => v.muted), false, 'original audio setting restored');
    assert.ok(complete.intervals.some(interval => interval.start <= 2 && interval.end >= 4), JSON.stringify(complete));
    await page.locator('video').evaluate(v => { v.currentTime = 3; });
    await page.waitForFunction(() => document.querySelector('video').dataset.vgVisual === 'cover');
    assert.equal(await page.locator('video').evaluate(v => v.paused), false);
    await page.locator('video').evaluate(v => { v.currentTime = 6.5; });
    await page.waitForFunction(() => document.querySelector('video').dataset.vgVisual === 'visible');
    const blurTime = complete.intervals.flatMap(interval => Array.from({length:Math.ceil((interval.end-interval.start)*10)}, (_,i)=>interval.start+i/10)).find(time => !complete.gaps.some(gap=>time>=gap.start-.2 && time<=gap.end+.2));
    if (blurTime !== undefined) {
      await control.evaluate(() => chrome.storage.local.set({mode:'blur'}));
      await page.locator('video').evaluate((v,time)=>{v.currentTime=time;},blurTime);
      await page.waitForFunction(()=>document.querySelector('video').dataset.vgVisual==='blur');
      assert.match(await page.locator('video').evaluate(v=>getComputedStyle(v).filter), /blur\(40px\)/);
      await control.evaluate(() => chrome.storage.local.set({mode:'overlay'}));
    }
    await page.evaluate(() => document.querySelector('#movie_player').classList.add('ad-showing'));
    await page.waitForFunction(() => document.querySelector('video').dataset.vgVisual === 'cover');
    await until(result => result.state === 'unavailable');
    console.log('FIXTURE', JSON.stringify(complete));
    // A video that plays but does not grant canvas pixel access must fail covered.
    await page.route('https://vg-media.invalid/fixture.webm', route => route.fulfill({ contentType: 'video/webm', body: Buffer.from(bytes) }));
    await page.route('https://www.youtube.com/watch?v=blocked', route => route.fulfill({ contentType: 'text/html', body: html.replace(/data:video\/webm;base64,[^"]+/, 'https://vg-media.invalid/fixture.webm') }));
    await page.goto('https://www.youtube.com/watch?v=blocked');
    const blocked = await until(result => result.state === 'unavailable');
    assert.match(blocked.message, /blocked pixel access/);
    assert.equal(await page.locator('video').getAttribute('data-vg-visual'), 'cover');
    console.log('CORS_FAILURE', blocked.message);
    // Actual YouTube, no stream extraction or security overrides.
    await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw', {waitUntil: 'domcontentloaded'});
    await page.bringToFront();
    const actual = await until(result => result.state === 'ready', 90000);
    console.log('REAL_YOUTUBE', JSON.stringify(actual));
    assert.equal(actual.progress, 1);
    assert.ok(actual.duration > 18 && actual.duration < 21);
  } finally { await context.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
