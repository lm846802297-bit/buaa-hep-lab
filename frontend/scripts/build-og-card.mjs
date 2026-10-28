// Render the social share card (1200x630) from the site's own brand tokens.
// Deterministic output: same input always yields the same card, unlike generative images.
import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const brandSource = await readFile(resolve(root, 'src/content/brandIdentity.js'), 'utf-8')
const pick = key => brandSource.match(new RegExp(`${key}:\\s*'([^']+)'`))?.[1] || ''
const brand = {
  name: pick('name'),
  focus: pick('academicFocus'),
  english: pick('englishDescriptor'),
  chinese: pick('chineseDescriptor'),
  fraction: pick('fractionMark')
}

const W = 1200
const H = 630

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden}
  .card{
    position:relative;width:${W}px;height:${H}px;
    background:#F4F1E9;
    font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",system-ui,sans-serif;
    overflow:hidden;
  }
  /* engineering-paper grid, matching the public blueprint skin */
  .grid{position:absolute;inset:0;
    background-image:
      linear-gradient(to right, rgba(41,65,93,.055) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(41,65,93,.055) 1px, transparent 1px),
      linear-gradient(to right, rgba(41,65,93,.022) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(41,65,93,.022) 1px, transparent 1px);
    background-size:40px 40px,40px 40px,8px 8px,8px 8px;
  }
  .glow{position:absolute;width:760px;height:760px;right:-220px;top:-260px;
    background:radial-gradient(circle, rgba(41,65,93,.10), rgba(41,65,93,0) 62%);}
  .frame{position:absolute;inset:44px;border:1px solid rgba(41,65,93,.22)}
  .corner{position:absolute;width:26px;height:26px;border-color:rgba(41,65,93,.55);border-style:solid;border-width:0}
  .c1{top:44px;left:44px;border-top-width:2px;border-left-width:2px}
  .c2{top:44px;right:44px;border-top-width:2px;border-right-width:2px}
  .c3{bottom:44px;left:44px;border-bottom-width:2px;border-left-width:2px}
  .c4{bottom:44px;right:44px;border-bottom-width:2px;border-right-width:2px}
  .content{position:absolute;left:96px;top:112px;right:96px}
  .mark{display:flex;align-items:center;gap:14px;margin-bottom:30px}
  .frac{
    display:inline-flex;align-items:center;justify-content:center;
    width:44px;height:44px;border:1.5px solid #29415D;border-radius:6px;
    color:#29415D;font-size:13px;font-weight:700;letter-spacing:.02em;
    font-family:Georgia,"Times New Roman",serif;
  }
  .kicker{font-size:13px;letter-spacing:.30em;color:#5F6C79;font-weight:600}
  h1{margin:0 0 18px;font-size:82px;line-height:1.06;letter-spacing:-.02em;color:#202B38;font-weight:700}
  .focus{margin:0 0 14px;font-size:29px;line-height:1.4;color:#29415D;font-weight:600}
  .en{margin:0 0 26px;font-size:17px;letter-spacing:.04em;color:#5F6C79}
  .rule{width:88px;height:3px;background:#29415D;margin-bottom:24px}
  .desc{margin:0;font-size:19px;line-height:1.65;color:#3D4B5C;max-width:620px}
  .footer{position:absolute;left:96px;right:96px;bottom:74px;display:flex;
    justify-content:space-between;align-items:baseline;
    font-size:12px;letter-spacing:.20em;color:#5F6C79}
  .orb{position:absolute;right:96px;top:150px;width:250px;height:250px}
  svg{display:block}
</style></head><body>
<div class="card">
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="frame"></div>
  <div class="corner c1"></div><div class="corner c2"></div>
  <div class="corner c3"></div><div class="corner c4"></div>

  <div class="orb">
    <svg width="250" height="250" viewBox="0 0 250 250" fill="none">
      <circle cx="125" cy="125" r="103" stroke="#29415D" stroke-opacity=".26" stroke-width="1"/>
      <circle cx="125" cy="125" r="92" stroke="#29415D" stroke-opacity=".42" stroke-width=".8" stroke-dasharray="2 7"/>
      <circle cx="125" cy="125" r="62" stroke="#29415D" stroke-opacity=".20" stroke-width="1"/>
      <ellipse cx="125" cy="125" rx="103" ry="36" transform="rotate(-24 125 125)" stroke="#29415D" stroke-opacity=".34" stroke-width=".9"/>
      <ellipse cx="125" cy="125" rx="86" ry="28" transform="rotate(38 125 125)" stroke="#B96D49" stroke-opacity=".42" stroke-width=".9"/>
      <path d="M20 125h34M196 125h34M125 20v34M125 196v34" stroke="#29415D" stroke-opacity=".30" stroke-width="1"/>
      <circle cx="125" cy="125" r="6" fill="#29415D"/>
      <circle cx="207" cy="88" r="4" fill="#B96D49"/>
      <circle cx="61" cy="176" r="3" fill="#29415D" fill-opacity=".6"/>
    </svg>
  </div>

  <div class="content">
    <div class="mark">
      <span class="frac">${brand.fraction}</span>
      <span class="kicker">PARTICLE PHYSICS RESEARCH GROUP</span>
    </div>
    <h1>${brand.name}</h1>
    <p class="focus">${brand.focus}</p>
    <p class="en">${brand.english}</p>
    <div class="rule"></div>
    <p class="desc">${brand.chinese}</p>
  </div>

  <div class="footer">
    <span>BUAA HEP HUB</span>
    <span>buaa-hep-hub.pages.dev</span>
  </div>
</div>
</body></html>`

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  const out = process.argv[2] || resolve(root, 'public/images/og-card.png')
  await page.screenshot({ path: out, type: 'png' })
  const meta = await page.evaluate(() => ({
    text: document.querySelector('h1')?.textContent,
    focus: document.querySelector('.focus')?.textContent
  }))
  console.log(JSON.stringify({ out, brand, rendered: meta }))
} finally {
  await browser.close()
}
