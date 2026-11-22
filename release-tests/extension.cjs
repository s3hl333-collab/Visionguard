/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS release runner. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const extension=path.join(process.env.VISION_GUARD_PROJECT || process.cwd(),'extension');
 const profile=require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'vision-guard-qa-'));
 const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 try{
 const manager=await context.newPage();await manager.goto('chrome://extensions');
 await manager.locator('extensions-item').first().waitFor();
 const id=await manager.locator('extensions-item').first().getAttribute('id');
 assert.ok(id);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`chrome-extension://${id}/local.html`);
 // Encoded fixture generated only in a headless browser; never displayed to users.
 const bytes=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=54;
  const ctx=canvas.getContext('2d'),stream=canvas.captureStream(30);
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];
  recorder.ondataavailable=e=>chunks.push(e.data);
  const finished=new Promise(resolve=>recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))));
  recorder.start();const start=performance.now();
  await new Promise(resolve=>{const timer=setInterval(()=>{const t=(performance.now()-start)/1000;ctx.fillStyle=t>=1&&t<3?(Math.floor(t*16)%2?'white':'black'):'#666';ctx.fillRect(0,0,96,54);if(t>=6){clearInterval(timer);recorder.stop();stream.getTracks().forEach(track=>track.stop());resolve();}},1000/30);});return finished;
 });
 await page.locator('#file').setInputFiles({name:'controlled.webm',mimeType:'video/webm',buffer:Buffer.from(bytes)});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Analysis complete'),{},{timeout:90000});
 const result=await page.locator('#timeline').textContent();assert.match(result,/potential hazard/);
 await page.locator('#play').click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>.1);
 await page.evaluate(()=>{document.querySelector('video').currentTime=2;});
 await page.waitForFunction(()=>!document.querySelector('#cover').hidden);
 assert.equal(await page.locator('video').evaluate(v=>v.paused),false);
 await page.evaluate(()=>{document.querySelector('video').currentTime=5.5;});
 await page.waitForFunction(()=>document.querySelector('#cover').hidden);
 await page.locator('#speed').selectOption('2');assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),2);
 await page.locator('#fullscreen').click();assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
 await page.evaluate(()=>document.exitFullscreen());
 await page.locator('#file').setInputFiles({name:'broken.webm',mimeType:'video/webm',buffer:Buffer.from('invalid')});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('unavailable'));
 assert.equal(await page.locator('#cover').isVisible(),true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({extensionId:id,intervals:result,checks:['encoded video analysis','hazard cover','playback continues','seek restoration','speed','fullscreen','invalid file fails covered'],errors},null,2));
 }finally{await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
