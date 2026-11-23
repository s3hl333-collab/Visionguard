/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS release runner. */
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VISION_GUARD_SITE_URL || 'http://localhost:3100');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('link',{name:'Download Vision Guard for Chrome',exact:true}).first().click();
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'vision-guard-extension.zip');
 const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
 const project=process.env.VISION_GUARD_PROJECT || process.cwd();
 assert.equal(hash(fs.readFileSync(await download.path())),hash(fs.readFileSync(require('node:path').join(project,'public/downloads/vision-guard-extension.zip'))));
 const desktop=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 await page.setViewportSize({width:700,height:900});
 const menu=page.getByRole('button',{name:'Toggle menu'});
 await menu.focus();
 await menu.press('Enter');
 const sections=page.getByRole('navigation',{name:'Page sections'});
 assert.ok(await sections.getByRole('link',{name:'FAQ'}).isVisible());
 await sections.getByRole('link',{name:'FAQ'}).click();
 assert.equal(new URL(page.url()).hash,'#faq');
 assert.equal(await menu.getAttribute('aria-expanded'),'false');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Toggle menu'}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Toggle menu"]').getAttribute('aria-expanded')==='true');
 const mobile=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 console.log(JSON.stringify({download:'hash matches packaged ZIP',errors,desktop:desktop.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),mobile:mobile.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))},null,2));
 assert.deepEqual(errors,[]);assert.equal(desktop.violations.length,0);assert.equal(mobile.violations.length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
