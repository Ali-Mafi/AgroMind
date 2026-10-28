// Browser layout checks are approximations, not certification by email vendors.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE_PATH ?? (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright` : "playwright"));
const destination=path.resolve(process.argv[2] ?? "/tmp/agromind-email-previews");
const manifest=JSON.parse(readFileSync(path.join(destination,"manifest.json"),"utf8"));
const snapshots=path.join(destination,"screenshots");mkdirSync(snapshots,{recursive:true});
const results=[];
const engines=process.env.EMAIL_QA_ENGINES?.split(",") ?? ["chromium","webkit"];
for(const [engine,browserType] of Object.entries({chromium,webkit}).filter(([name])=>engines.includes(name))) {
  const browser=await browserType.launch({headless:true,...(engine === "chromium" && process.env.EMAIL_QA_CHROMIUM_PATH ? {executablePath:process.env.EMAIL_QA_CHROMIUM_PATH,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]} : {})});
  const widths=engine==="chromium"?[320,375,800]:[375,800];
  for(const item of manifest) for(const width of widths) for(const environment of engine==="chromium"?["light","dark","images-off","css-stripped"]:["light"]) {
    const page=await browser.newPage({viewport:{width,height:1000},colorScheme:environment==="dark"?"dark":"light"});
    const failedAssets=[];
    page.on("requestfailed",request=>failedAssets.push(request.url()));
    await page.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.origin==="https://email-preview.invalid"&&url.pathname.startsWith("/assets/")) {
        if(environment==="images-off") return route.abort();
        const file=path.join(destination,url.pathname.slice(1));
        return route.fulfill({body:readFileSync(file),contentType:file.endsWith(".jpg")?"image/jpeg":"image/png"});
      }
      return route.abort();
    });
    let html=readFileSync(path.join(destination,`${item.name}.html`),"utf8");
    if(environment==="css-stripped")html=html.replace(/<style>[\s\S]*?<\/style>/g,"");
    // Resolve bundled assets through a controlled origin; no external requests.
    html=html.replace("<head>",'<head><base href="https://email-preview.invalid/">');
    await page.setContent(html,{waitUntil:"load"});
    const geometry=await page.evaluate(()=>{
      const visible=(el)=>el.getBoundingClientRect().width&&el.getBoundingClientRect().height&&getComputedStyle(el).display!=="none";
      const cells=[...document.querySelectorAll("td")].filter(visible);
      const text=[...document.querySelectorAll("p,h1,h2,a,span")].filter(visible);
      const offCenter=[...document.querySelectorAll('img,table,[data-email-cta="primary"]')].filter(visible).filter(el=>{
        const rect=el.getBoundingClientRect(), parent=el.parentElement.getBoundingClientRect();
        return Math.abs(rect.x+rect.width/2-parent.x-parent.width/2)>2;
      }).map(el=>el.tagName);
      return {overflow:document.documentElement.scrollWidth>innerWidth,misaligned:[...cells,...text].filter(el=>getComputedStyle(el).textAlign!=="center").map(el=>el.tagName),offCenter, images:[...document.images].filter(el=>!el.complete||!el.naturalWidth).length,cta:!!document.querySelector('[data-email-cta="primary"]'),title:document.querySelector("h1")?.textContent};
    });
    assert.equal(geometry.overflow,false,`${engine}/${item.name}/${width}/${environment}: overflow`);
    assert.deepEqual(geometry.misaligned,[],`${engine}/${item.name}/${width}/${environment}: alignment`);
    assert.deepEqual(geometry.offCenter,[],`${engine}/${item.name}/${width}/${environment}: element centers`);
    assert.ok(geometry.cta&&geometry.title);
    if(environment!=="images-off") {assert.equal(geometry.images,0);assert.deepEqual(failedAssets,[]);}
    if(engine==="chromium"&&width!==320)await page.screenshot({path:path.join(snapshots,`${item.name}-${width}-${environment}.png`),fullPage:true});
    results.push({engine,name:item.name,width,environment,...geometry});
    await page.close();
  }
  await browser.close();
}
writeFileSync(path.join(destination,"qa-results.json"),JSON.stringify({checks:results.length,results},null,2));
console.log(`${results.length} browser checks passed; all visible text/cells centered, no horizontal overflow. ${engines.join("/")}, CSS-stripped and blocked-image checks are simulations.`);
