import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const output = resolve(process.env.AUDIT_OUTPUT_DIR || fileURLToPath(new URL('../test-results/audit', import.meta.url)))
await mkdir(output, { recursive: true })
const emailTrackerRequests = []
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://local.invalid').pathname
    if (pathname === '/email-tracker-pixel') {
      emailTrackerRequests.push(req.url)
      res.writeHead(204).end()
      return
    }
    let file = resolve(root, '.' + pathname)
    let statusCode = 200
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    try {
      const info = await stat(file)
      if (info.isDirectory()) file = resolve(file, 'index.html')
      const resolvedInfo = await stat(file)
      if (!resolvedInfo.isFile()) throw new Error('Not a file')
    } catch {
      // Cloudflare Pages serves a top-level 404.html as a real 404 instead of
      // applying its automatic SPA fallback. Model that distinction locally.
      const notFoundFile = resolve(root, '404.html')
      try {
        const notFoundInfo = await stat(notFoundFile)
        if (notFoundInfo.isFile()) {
          file = notFoundFile
          statusCode = 404
        } else {
          file = resolve(root, 'index.html')
        }
      } catch {
        file = resolve(root, 'index.html')
      }
    }
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    const data = await readFile(file)
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.json': 'application/json' }
    res.writeHead(statusCode, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(data)
  } catch { res.writeHead(500).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const checks = []
function check(value, message) { assert(value, message); checks.push(message) }
async function gotoDirectRoute(page, pathname, search = '') {
  let status = null
  const onResponse = response => {
    try {
      const url = new URL(response.url())
      if (url.origin === base && url.pathname === pathname && status === null) {
        status = response.status()
      }
    } catch {}
  }
  page.on('response', onResponse)
  try {
    await page.goto(base + pathname + search, { waitUntil: 'networkidle' })
  } finally {
    page.off('response', onResponse)
  }
  return status
}
try {
  const anonymous = await browser.newContext()
  const page = await anonymous.newPage()
  const requested = [], errors = [], consoleErrors = [], failedRequests = []
  page.on('request', req => requested.push(req.url()))
  page.on('pageerror', err => errors.push(err.message))
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('requestfailed', req => failedRequests.push(`${req.url()}: ${req.failure()?.errorText || 'request failed'}`))
  for (const width of [320, 360, 390, 768, 1024, 1440, 2048]) {
    await page.setViewportSize({ width, height: width === 2048 ? 768 : 900 })
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('.app-shell .lab-public').waitFor()
    check((await page.title()).includes('引力之外'), `homepage document title uses the brand at ${width}px`)
    check(await page.locator('meta[property="og:title"]').getAttribute('content') === await page.title(), `homepage Open Graph title matches the document title at ${width}px`)
    check(await page.locator('meta[name="twitter:title"]').getAttribute('content') === await page.title(), `homepage Twitter title matches the document title at ${width}px`)
    check(await page.locator('meta[property="og:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `homepage Open Graph description matches the page description at ${width}px`)
    check(await page.locator('meta[name="twitter:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `homepage Twitter description matches the page description at ${width}px`)
    if (width === 2048) {
      const composition = await page.locator('.worldline-home').evaluate(root => {
        const header = root.querySelector('.worldline-header').getBoundingClientRect()
        const hero = root.querySelector('.worldline-hero').getBoundingClientRect()
        const copy = root.querySelector('.worldline-copy').getBoundingClientRect()
        const figure = root.querySelector('.worldline-detector-figure').getBoundingClientRect()
        return { headerLeft: header.left, headerWidth: header.width, copyLeft: copy.left, figureLeft: figure.left, figureWidth: figure.width, heroLeft: hero.left, heroWidth: hero.width, viewportWidth: innerWidth }
      })
      check(Math.abs(composition.headerLeft - (2048 - 1216) / 2) < 3 && Math.abs(composition.headerWidth - 1216) < 3, '2048px reference layout centers the 1216px header')
      check(Math.abs(composition.copyLeft - ((2048 - 1216) / 2 + 96)) < 3, '2048px reference layout aligns the hero title 96px inside the header grid')
      check(Math.abs(composition.figureLeft - composition.heroLeft) < 3 && Math.abs(composition.figureWidth - composition.heroWidth) < 3, '2048px blueprint reference image spans the complete hero composition')
    }
    if (width === 1440) {
      const figure = page.locator('.worldline-detector-figure')
      const background = await figure.evaluate(el => getComputedStyle(el).backgroundImage)
      check(background.includes('/images/particle-accelerator-blueprint.avif'), 'homepage blueprint mode uses the optimized local reference artwork')
      check(await page.locator('.worldline-detector-photo').count() === 0, 'blueprint mode does not stack a second detector photograph over the complete reference image')
      const assetResponse = await page.evaluate(async () => {
        const response = await fetch('/images/particle-accelerator-blueprint.avif')
        const image = new Image()
        image.src = '/images/particle-accelerator-blueprint.avif'
        await image.decode()
        return { ok: response.ok, type: response.headers.get('content-type') || '', width: image.naturalWidth, height: image.naturalHeight }
      })
      check(assetResponse.ok && assetResponse.type.includes('image/avif') && assetResponse.width >= 600 && assetResponse.height > 0, 'local blueprint artwork decodes at its expected image dimensions with the correct AVIF content type')
      check((await figure.getAttribute('aria-label'))?.includes('暖白工程蓝图'), 'blueprint composition has an accessible text alternative')
      check(await page.locator('.public-header .nav-hub, .worldline-header .worldline-hub-link').count() === 1, 'homepage header has exactly one collaboration entry')
      check(await page.locator('.public-header .header-hub-cta, .worldline-header .header-hub-cta').count() === 0, 'homepage header does not duplicate the collaboration entry')
      check(await page.getByText('Scientific Atelier · 粒子加速器蓝图概念插画', { exact: true }).count() === 1, 'local blueprint artwork has an explicit source label')
      check(await page.getByRole('link', { name: 'CC BY 2.0' }).count() === 0, 'generated/reference artwork is not mislabeled with the CMS photograph license')
    }
    await page.locator('h1').click()
    check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible at ${width}px`)
    const tocLinks = page.locator('#public-section-nav-links')
    if (width > 1100) {
      check(await page.getByRole('navigation', { name: '页面目录' }).isVisible(), `section directory is visible at ${width}px`)
    } else {
      check(await page.getByRole('button', { name: '打开页面目录' }).isVisible(), `compact section directory is available at ${width}px`)
      check(!await tocLinks.isVisible(), `compact section directory starts collapsed at ${width}px`)
    }
    if (width === 768) {
      await page.getByRole('button', { name: '菜单', exact: true }).click()
      check(await page.getByRole('navigation', { name: '官网导航' }).isVisible(), 'tablet menu keeps all public navigation reachable')
      await page.getByRole('button', { name: '关闭菜单', exact: true }).click()
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `public page fits ${width}px viewport`)
    await page.screenshot({ path: resolve(output, `public-${width}.png`), fullPage: true })
    if (width === 390 || width === 1440 || width === 2048) await page.screenshot({ path: resolve(output, `public-${width}-first-screen.png`) })
    await page.locator('#about').screenshot({ path: resolve(output, `about-${width}.png`) })
    await page.locator('#research').screenshot({ path: resolve(output, `research-${width}.png`) })
    await page.locator('#physics-resources').screenshot({ path: resolve(output, `physics-resources-${width}.png`) })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  const desktopToc = page.getByRole('navigation', { name: '页面目录' })
  const researchTocLink = desktopToc.getByRole('link', { name: '研究方向', exact: true })
  await researchTocLink.click()
  check(new URL(page.url()).hash === '#research', 'desktop section directory updates the URL fragment')
  await page.waitForFunction(() => document.querySelector('#research')?.getBoundingClientRect().top < window.innerHeight * 0.5)
  await page.waitForFunction(() => document.querySelector('#public-section-nav-links a[aria-current="location"]')?.getAttribute('aria-label') === '研究方向')
  check(await researchTocLink.getAttribute('aria-current') === 'location', 'section directory tracks the active section after navigation')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  const publicSkinTrigger = page.getByRole('button', { name: '切换官网风格' })
  check(await publicSkinTrigger.isVisible(), 'public skin icon is visible in the homepage navigation')
  const themeIconBox = await publicSkinTrigger.boundingBox()
  const hubLinkBox = await page.locator('.public-header .nav-hub, .worldline-header .worldline-hub-link').boundingBox()
  check(Boolean(themeIconBox && hubLinkBox && themeIconBox.x >= hubLinkBox.x + hubLinkBox.width), 'homepage theme icon follows navigation without overlap')
  await publicSkinTrigger.click()
  const publicSkin = page.getByRole('combobox', { name: '选择官网皮肤风格' })
  check(await publicSkin.locator('option').count() === 5, 'public skin selector exposes all five appearance themes')
  await page.keyboard.press('Escape')
  check(await publicSkin.count() === 0, 'Escape closes the public theme popover')

  // Regression guard: the Worldline blueprint is one public skin, not a global
  // override. Each other saved palette must remain visibly distinct and remove
  // the Worldline-only layout class.
  const themeAccents = {}
  for (const [scheme, expectedAccent] of [
    ['quiet-research', '#b85e3f'],
    ['classic-cyan', '#c5e6df'],
    ['obsidian-gray', '#94a3b8'],
    ['nebula-purple', '#b89bf8'],
    ['worldline-console', '#263f5a']
  ]) {
    if (await publicSkin.count() === 0) await publicSkinTrigger.click()
    await publicSkin.selectOption(scheme)
    await page.waitForFunction(id => {
      const root = document.querySelector('.lab-public')
      return document.documentElement.getAttribute('data-color-scheme') === id
        && root?.classList.contains('worldline-theme') === (id === 'worldline-console')
    }, scheme)
    const visual = await page.locator('.lab-public').evaluate(el => ({
      accent: getComputedStyle(el).getPropertyValue('--accent').trim().toLowerCase(),
      worldline: el.classList.contains('worldline-theme')
    }))
    themeAccents[scheme] = visual.accent
    check(visual.worldline === (scheme === 'worldline-console'), scheme + ' activates only its own homepage layout')
    const heroModules = await page.locator('.lab-public').evaluate(root => ({
      worldline: Boolean(root.querySelector('.worldline-home')),
      selectedTheme: root.querySelector('[data-public-home-theme]')?.getAttribute('data-public-home-theme') || null
    }))
    check(heroModules.worldline === (scheme === 'worldline-console') && heroModules.selectedTheme === (scheme === 'worldline-console' ? null : scheme), scheme + ' mounts only its own hero implementation')
    check(visual.accent === expectedAccent, scheme + ' keeps its own accent palette: ' + visual.accent)
    const brand = page.locator('.worldline-header .worldline-brand, .public-header .public-brand')
    check(await brand.count() === 1, scheme + ' renders exactly one shared public brand link')
    check((await brand.locator('.brand-copy strong').textContent())?.trim() === '引力之外', scheme + ' renders the approved public brand name')
    check((await brand.locator('.brand-copy small').textContent())?.trim() === '高能理论与粒子唯象研究', scheme + ' renders the shared academic-focus subtitle')
  }
  check(new Set(Object.values(themeAccents)).size === 5, 'all five public themes retain distinct computed accents')

  // The hero ships a single published composition. The photo modes were removed because
  // their Wikimedia sources never resolved for visitors, so instead of switching modes we
  // assert the defects stay gone: no switcher, no stray <img>, and the blueprint artwork
  // still renders with its own attribution.
  const heroModeGroup = page.getByRole('group', { name: '首页右侧主视觉模式' })
  check(await heroModeGroup.count() === 0, 'homepage hero no longer offers a visual mode switcher')
  check(await page.locator('.worldline-detector-photo').count() === 0, 'hero renders no external photograph')
  check(await page.locator('img.detector-photo').count() === 0, 'alternate hero skins render no external photograph')
  check(await page.waitForFunction(() => getComputedStyle(document.querySelector('.worldline-detector-figure')).backgroundImage.includes('/images/particle-accelerator-blueprint.avif')).then(() => true).catch(() => false), 'blueprint artwork is the hero background')
  check(await page.getByText('Scientific Atelier · 粒子加速器蓝图概念插画', { exact: true }).count() === 1, 'blueprint identifies the local reference artwork')
  check(await page.locator('.worldline-image-credit a').count() === 0, 'blueprint does not invent an external attribution or license link')
  check(await page.evaluate(() => localStorage.getItem('labhub_public_hero_visual_mode')) === 'blueprint', 'hero records the single published visual mode')
  const staleModeReset = await page.evaluate(() => {
    localStorage.setItem('labhub_public_hero_visual_mode', 'photo')
    return localStorage.getItem('labhub_public_hero_visual_mode')
  })
  check(staleModeReset === 'photo', 'stale mode value can be seeded for the reset check')
  await page.reload({ waitUntil: 'load' })
  check(await page.waitForFunction(() => localStorage.getItem('labhub_public_hero_visual_mode') === 'blueprint').then(() => true).catch(() => false), 'a stale removed-mode value is reset to blueprint on load')

  const desktopBlueprint = await page.locator('.lab-public').evaluate(root => {
    const hero = root.querySelector('.worldline-hero') || root.querySelector('.public-hero')
    const copy = root.querySelector('.worldline-copy') || root.querySelector('.hero-copy')
    const figure = root.querySelector('.worldline-detector-figure') || root.querySelector('.collision-figure')
    const heroStyle = getComputedStyle(root.querySelector('.worldline-home') || hero)
    const figureStyle = getComputedStyle(figure)
    const copyBox = copy.getBoundingClientRect()
    const figureBox = figure.getBoundingClientRect()
    return {
      blueprint: root.querySelector('.worldline-home')?.classList.contains('visual-blueprint') || root.classList.contains('hero-visual-blueprint'),
      worldline: root.classList.contains('worldline-theme'),
      grid: heroStyle.backgroundImage.includes('linear-gradient'),
      figurePosition: figureStyle.position,
      figureBackground: figureStyle.backgroundImage,
      figureBackgroundSize: figureStyle.backgroundSize,
      figureBackgroundPosition: figureStyle.backgroundPosition,
      figureHasPhoto: Boolean(root.querySelector('.worldline-detector-photo')),
      copyWidth: copyBox.width,
      figureLeft: figureBox.left,
      heroLeft: hero.getBoundingClientRect().left,
      figureWidth: figureBox.width,
      heroWidth: hero.getBoundingClientRect().width
    }
  })
  check(desktopBlueprint.blueprint && desktopBlueprint.worldline, 'Worldline blueprint mode is active by default')
  check(desktopBlueprint.grid, 'Worldline shell retains its technical-paper grid fallback')
  check(desktopBlueprint.figurePosition === 'absolute' && Math.abs(desktopBlueprint.figureLeft - desktopBlueprint.heroLeft) < 3 && Math.abs(desktopBlueprint.figureWidth - desktopBlueprint.heroWidth) < 3, 'desktop blueprint art spans the full hero composition')
  check(desktopBlueprint.figureBackground.includes('/images/particle-accelerator-blueprint.avif') && !desktopBlueprint.figureHasPhoto, 'desktop blueprint mode uses one complete local image without duplicate photo layers')
  check(desktopBlueprint.figureBackgroundSize === 'auto 100%' && (desktopBlueprint.figureBackgroundPosition.startsWith('100%') || desktopBlueprint.figureBackgroundPosition.includes('right')), 'desktop blueprint mode preserves the full reference image aspect ratio without cropping')
  check(await page.getByText('Scientific Atelier · 粒子加速器蓝图概念插画', { exact: true }).isVisible(), 'blueprint source note remains visible without a false external license link')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(120)
  const mobileBlueprint = await page.locator('.worldline-detector-figure, .collision-figure').evaluate(figure => {
    const root = document.querySelector('.lab-public')
    const copy = (root.querySelector('.worldline-copy') || root.querySelector('.hero-copy')).getBoundingClientRect()
    const image = figure.getBoundingClientRect()
    return {
      figurePosition: getComputedStyle(figure).position,
      copyBottom: copy.bottom,
      figureTop: image.top,
      figureRight: image.right,
      viewportWidth: innerWidth,
      imageWidth: image.width
    }
  })
  check(mobileBlueprint.figurePosition === 'relative', 'mobile blueprint detector returns to document flow')
  check(mobileBlueprint.figureTop >= mobileBlueprint.copyBottom - 2, 'mobile blueprint detector does not cover the headline or action buttons')
  check(mobileBlueprint.figureRight <= mobileBlueprint.viewportWidth + 1 && mobileBlueprint.imageWidth > 0, 'mobile blueprint detector stays within the viewport')
  await page.setViewportSize({ width: 1440, height: 900 })
  await publicSkinTrigger.click()
  await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
  await page.evaluate(() => {
    window.__worldlineReadoutSnapshot = null
    window.__worldlineDecaySnapshot = null
    window.__worldlinePhaseLog = []
    window.__worldlinePhaseListener = event => {
      window.__worldlinePhaseLog.push(event.detail)
      if (event.detail !== 'readout' && event.detail !== 'decay') return
      // The reactive phase update is queued before this listener runs. Sample the
      // matching DOM/CSS state in the next microtask, before later test work/screenshots.
      queueMicrotask(() => {
        const overlay = document.querySelector('.worldline-shift-overlay')
        const hud = overlay?.querySelector('.worldline-shift-overlay__hud')
        const hudStyle = hud ? getComputedStyle(hud) : null
        if (event.detail === 'readout') {
          const backdrop = document.querySelector('.worldline-technical-backdrop')
          window.__worldlineReadoutSnapshot = {
            phase: overlay?.getAttribute('data-phase') || '',
            timelineActive: Boolean(overlay?.classList.contains('is-timeline-active')),
            backdropVisible: Boolean(backdrop && backdrop.getBoundingClientRect().width > 0),
            backdropShifting: Boolean(backdrop?.classList.contains('is-shifting')),
            ringCount: backdrop?.querySelectorAll('.worldline-backdrop-shift-wave__ring').length || 0,
            hudVisible: Boolean(hud && hud.getBoundingClientRect().width > 0 && hud.getBoundingClientRect().height > 0),
            hudOpacity: hudStyle ? Number(hudStyle.opacity) : null,
            hudAnimationName: hudStyle ? hudStyle.animationName : '',
            hudBackgroundColor: hudStyle ? hudStyle.backgroundColor : ''
          }
        } else {
          window.__worldlineDecaySnapshot = {
            phase: overlay?.getAttribute('data-phase') || '',
            animationName: hudStyle ? hudStyle.animationName : ''
          }
        }
      })
    }
    window.addEventListener('worldline:phase', window.__worldlinePhaseListener)
  })
  // Make the transition deterministic even when the browser profile already
  // remembers Worldline Console from a previous run.
  await page.locator('.worldline-particle-canvas').waitFor({ state: 'attached', timeout: 10000 })
  if (await publicSkin.inputValue() === 'worldline-console') {
    await publicSkin.selectOption('quiet-research')
    await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
    await page.evaluate(() => {
      window.__worldlineReadoutSnapshot = null
      window.__worldlineDecaySnapshot = null
      window.__worldlinePhaseLog = []
    })
    await publicSkinTrigger.click()
  }
  await publicSkin.selectOption('worldline-console')
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'public selector activates the worldline console palette')
  check(await page.evaluate(() => localStorage.getItem('labhub_public_color_scheme') === 'worldline-console' && localStorage.getItem('laborbit_color_scheme') !== 'worldline-console'), 'public theme persists separately from workspace preferences')
  const shiftOverlay = page.locator('.worldline-shift-overlay')
  await expect(shiftOverlay).toBeVisible()
  await expect(shiftOverlay).toHaveClass(/is-timeline-active/, { timeout: 1500 })
  await expect(shiftOverlay.locator('.worldline-shift-overlay__dial')).toBeVisible()
  await expect(shiftOverlay.locator('.worldline-shift-overlay__glitch')).toHaveCount(3)
  await expect(shiftOverlay.locator('.worldline-shift-overlay__hud')).toHaveCount(0)
  check(!(await shiftOverlay.innerText()).includes('世界线变动'), 'theme switching plays visual effects without the Worldline Shift text')
  await page.waitForFunction(() => window.__worldlinePhaseLog?.includes('disrupt'), null, { timeout: 1500 })
  await page.screenshot({ path: resolve(output, 'worldline-1440-theme-transition-no-hud.png') })
  await expect(shiftOverlay).toHaveCount(0, { timeout: 2500 })
  check(await page.locator('html').getAttribute('data-bg-style') === 'paper', 'public Worldline theme keeps the paper background independent from workspace preferences')
  const worldlineTuner = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const icon = document.querySelector('.theme-tuner-icon')
    const trigger = document.querySelector('.public-theme-trigger')
    return {
      background: root.getPropertyValue('--bg').trim().toLowerCase(),
      accent: root.getPropertyValue('--accent').trim().toLowerCase(),
      cyan: root.getPropertyValue('--worldline-cyan').trim().toLowerCase(),
      blue: root.getPropertyValue('--worldline-blue').trim().toLowerCase(),
      coreStroke: icon?.querySelector('.tuner-core') ? getComputedStyle(icon.querySelector('.tuner-core')).stroke : '',
      orbitStroke: icon?.querySelector('.tuner-orbit') ? getComputedStyle(icon.querySelector('.tuner-orbit')).stroke : '',
      buttonShadow: trigger ? getComputedStyle(trigger).boxShadow : 'none'
    }
  })
  check(worldlineTuner.background === '#f4f1e9', 'public Worldline theme uses the warm paper blueprint background')
  check(worldlineTuner.accent === '#29415d', 'Worldline blueprint uses a legible navy primary accent')
  check(worldlineTuner.cyan === '#527a82', 'Worldline blueprint uses a low-saturation blue-gray signal')
  check(worldlineTuner.blue === '#3b5c7a', 'Worldline blueprint uses a muted blue-gray orbit signal')
  check(worldlineTuner.coreStroke !== worldlineTuner.orbitStroke, 'Worldline tuner separates cyan core from electric-blue orbital lines')
  check(worldlineTuner.buttonShadow !== 'none', 'Worldline tuner uses its cold phosphor device-like shadow')
  const technicalBackdrop = page.locator('.worldline-technical-backdrop')
  const particleCanvas = page.locator('.worldline-particle-canvas')
  check(await particleCanvas.evaluate(el => el.classList.contains('is-visible')), 'worldline skin enables the ambient particle canvas')
  check(await particleCanvas.evaluate(el => el.width > 0 && el.height > 0), 'ambient particle canvas has a real drawing surface')
  check(await particleCanvas.evaluate(el => el.width <= innerWidth * 1.5 + 1 && el.height <= innerHeight * 1.5 + 1), 'particle canvas caps device-pixel-ratio at 1.5x for performance')
  check(!(await technicalBackdrop.evaluate(el => el.classList.contains('is-shifting'))), 'technical backdrop returns to idle after the theme transition')
  await page.screenshot({ path: resolve(output, 'worldline-1440-technical-backdrop.png') })
  await page.screenshot({ path: resolve(output, 'worldline-1440-first-screen.png') })
  await page.mouse.move(700, 150)
  await page.waitForTimeout(100)
  await page.screenshot({ path: resolve(output, 'worldline-1440-cursor-field.png') })
  await page.mouse.click(700, 150)
  await page.waitForTimeout(80)
  check(await particleCanvas.evaluate(el => getComputedStyle(el).pointerEvents === 'none'), 'particle field never intercepts real page clicks')
  await page.screenshot({ path: resolve(output, 'worldline-1440-click-pulse.png') })
  await page.locator('#research').screenshot({ path: resolve(output, 'worldline-1440-research.png') })
  await page.locator('#physics-resources').screenshot({ path: resolve(output, 'worldline-1440-resources.png') })
  await page.locator('#publications').screenshot({ path: resolve(output, 'worldline-1440-publications.png') })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  check(await page.evaluate(() => window.scrollY < 5), 'Worldline mobile first-screen capture starts at the top of the page')
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Worldline skin fits the 390px viewport without horizontal overflow')
  check(await technicalBackdrop.isVisible(), 'clockwork background remains enabled on the narrow mobile viewport')
  check(await technicalBackdrop.locator('.worldline-backdrop-gear--mobile-anchor').count() === 2, 'mobile viewport has dedicated central gear motifs')
  check(await technicalBackdrop.evaluate(el => Number(getComputedStyle(el).opacity) <= 0.2), 'clockwork drawings reduce opacity on mobile to protect readability')
  await page.screenshot({ path: resolve(output, 'worldline-390-first-screen.png') })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.evaluate(() => {
    window.__worldlineReadoutSnapshot = null
    window.__worldlineDecaySnapshot = null
    window.__worldlinePhaseLog = []
  })
  await page.bringToFront()
  await page.waitForFunction(() => document.visibilityState === 'visible')
  await page.locator('.topic-guide-entry').first().click()
  // Capture the short transition before waiting for the lazy-loaded destination view.
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await expect(page.locator('.worldline-shift-overlay__hud')).toBeVisible()
  await expect(page.locator('.research-topic-page')).toBeVisible()
  // The 1.8 s effect can finish while a lazy route chunk is resolving; assert the
  // captured phase state rather than requiring the transient overlay to remain mounted.
  await page.waitForFunction(() => window.__worldlineReadoutSnapshot, null, { timeout: 1500 })
  const readoutSnapshot = await page.evaluate(() => window.__worldlineReadoutSnapshot || null)
  check(Boolean(readoutSnapshot?.timelineActive), 'route-triggered worldline keyframes are active during the captured readout phase')
  check(readoutSnapshot?.phase === 'readout', 'route-triggered HUD snapshot belongs to the readout DOM phase: ' + readoutSnapshot?.phase)
  await page.screenshot({ path: resolve(output, 'worldline-1440-shift-readout.png') })
  check(Boolean(readoutSnapshot.backdropVisible), 'Worldline Console enables the clockwork and scientific-drawing background')
  check(Boolean(readoutSnapshot.backdropShifting), 'route-triggered transition activates the technical backdrop during readout')
  check(readoutSnapshot.ringCount === 2, 'route-triggered transition draws two expanding instrument-wave rings')
  check(Boolean(readoutSnapshot.hudVisible), 'route transition retains the HUD readout panel')
  check(readoutSnapshot.hudAnimationName === 'none', 'worldline HUD is phase-locked instead of racing a wall-clock fade')
  check(Number(readoutSnapshot.hudOpacity) >= 0.98, 'worldline HUD is fully readable during readout: ' + readoutSnapshot.hudOpacity)
  check(
    readoutSnapshot.hudBackgroundColor !== 'rgba(0, 0, 0, 0)'
      && readoutSnapshot.hudBackgroundColor !== 'transparent'
      && !/^rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(readoutSnapshot.hudBackgroundColor),
    'worldline shift HUD uses a light, high-contrast paper panel'
  )
  await page.waitForFunction(() => window.__worldlinePhaseLog?.includes('decay') && window.__worldlineDecaySnapshot, null, { timeout: 1500 })
  const decaySnapshot = await page.evaluate(() => window.__worldlineDecaySnapshot || null)
  check(decaySnapshot?.phase === 'decay', 'route-triggered HUD reaches the decay DOM phase: ' + decaySnapshot?.phase)
  check(decaySnapshot?.animationName === 'worldline-hud-decay', 'route-triggered HUD starts its dedicated decay animation: ' + decaySnapshot?.animationName)
  await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
  const phaseLog = await page.evaluate(() => {
    if (window.__worldlinePhaseListener) window.removeEventListener('worldline:phase', window.__worldlinePhaseListener)
    delete window.__worldlinePhaseListener
    return Array.isArray(window.__worldlinePhaseLog) ? window.__worldlinePhaseLog : []
  })
  const expectedPhases = ['ignite', 'propagate', 'disrupt', 'readout', 'decay', 'idle']
  const phasePositions = expectedPhases.map(phase => phaseLog.indexOf(phase))
  check(phasePositions.every((position, index) => position >= 0 && (index === 0 || position > phasePositions[index - 1])), 'route-triggered worldline timeline follows ignite → propagate → disrupt → readout → decay → idle')
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'Worldline Console palette persists on the detailed research-topic route')
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Worldline research-topic detail has no desktop horizontal overflow')
  await page.screenshot({ path: resolve(output, 'worldline-1440-topic-dark.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  const mobileTopicBreadcrumb = await page.evaluate(() => {
    const current = document.querySelector('.topic-breadcrumb [aria-current="page"]')
    const tuner = document.querySelector('.public-theme-trigger')
    const breadcrumb = document.querySelector('.topic-breadcrumb')
    if (!current || !tuner || !breadcrumb) return null
    const currentRect = current.getBoundingClientRect()
    const tunerRect = tuner.getBoundingClientRect()
    return {
      overlapsTuner: currentRect.right > tunerRect.left && currentRect.left < tunerRect.right && currentRect.bottom > tunerRect.top && currentRect.top < tunerRect.bottom,
      reservedRight: Number.parseFloat(getComputedStyle(breadcrumb).paddingRight)
    }
  })
  check(Boolean(mobileTopicBreadcrumb) && !mobileTopicBreadcrumb.overlapsTuner, 'mobile topic breadcrumb never overlaps the floating theme tuner')
  check(Number(mobileTopicBreadcrumb?.reservedRight) >= 56, 'mobile topic breadcrumb reserves space for the floating theme tuner')
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Worldline research-topic detail fits the 390px viewport')
  await page.screenshot({ path: resolve(output, 'worldline-390-topic-dark.png'), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle' })
  await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'Worldline Console persists when returning from a detailed topic')
  const firstResourceCard = page.locator('.physics-resource-card').first()
  await firstResourceCard.hover()
  const hoverShadow = await firstResourceCard.evaluate(el => getComputedStyle(el).boxShadow)
  check(hoverShadow !== 'none', 'worldline mode provides visible hover feedback on resource cards')
  const hoverSignal = await firstResourceCard.evaluate(el => getComputedStyle(el, '::after').animationName)
  check(hoverSignal === 'worldline-card-signal', 'worldline resource-card hover triggers a brief CRT signal sweep')
  await page.bringToFront()
  await page.waitForFunction(() => document.visibilityState === 'visible')
  await page.evaluate(() => {
    window.__peopleRoutePhases = []
    window.__peopleRouteStart = performance.now()
    window.addEventListener('worldline:phase', event => {
      window.__peopleRoutePhases.push({ phase: event.detail, at: Math.round(performance.now()) })
    })
  })
  await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '团队' }).click()
  await page.getByRole('heading', { name: '团队与学术指导' }).waitFor({ timeout: 10000 }).catch(async error => {
    const bodyText = (await page.locator('body').innerText()).slice(0, 300)
    throw new Error('public people route did not render; url=' + page.url() + '; pageErrors=' + errors.slice(-5).join(' | ') + '; consoleErrors=' + consoleErrors.slice(-5).join(' | ') + '; failedRequests=' + failedRequests.slice(-5).join(' | ') + '; body=' + bodyText + '; cause=' + error.message)
  })
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'worldline skin carries across public route navigation')
  try {
    // Route transitions use the same semantic cleanup contract as theme changes.
    // The browser can delay animation timers under CI load, so wait for idle before
    // asserting that Vue has removed the overlay.
    await page.waitForFunction(() =>
      Array.isArray(window.__peopleRoutePhases) &&
      window.__peopleRoutePhases.some(entry => entry.phase === 'idle'),
      null,
      { timeout: 6000 }
    )
    await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 1000 })
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const overlay = document.querySelector('.worldline-shift-overlay')
      return {
        route: location.pathname,
        elapsedMs: Math.round(performance.now() - (window.__peopleRouteStart || performance.now())),
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
        phases: window.__peopleRoutePhases || [],
        overlayPresent: Boolean(overlay),
        overlayPhase: overlay?.getAttribute('data-phase') || null,
        timelineActive: Boolean(overlay?.classList.contains('is-timeline-active')),
        hudPresent: Boolean(overlay?.querySelector('.worldline-shift-overlay__hud')),
        overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null
      }
    })
    throw new Error('Worldline people-route transition did not clean up: ' + JSON.stringify(diagnostic) + '; cause=' + error.message)
  }
  const peopleRoutePhases = await page.evaluate(() => (window.__peopleRoutePhases || []).map(entry => entry.phase))
  const expectedPeopleRoutePhases = ['ignite', 'propagate', 'disrupt', 'readout', 'decay', 'idle']
  check(expectedPeopleRoutePhases.every((phase, index) => {
    const currentIndex = peopleRoutePhases.indexOf(phase)
    const previousIndex = index === 0 ? -1 : peopleRoutePhases.indexOf(expectedPeopleRoutePhases[index - 1])
    return currentIndex > previousIndex
  }), 'worldline route transition completes all phases in order and cleans up')
  await page.screenshot({ path: resolve(output, 'worldline-1440-team.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Worldline team directory fits the 390px viewport')
  await page.screenshot({ path: resolve(output, 'worldline-390-team.png'), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  const peopleSkinTrigger = page.getByRole('button', { name: '切换官网风格' })
  check(await peopleSkinTrigger.isVisible(), 'public skin icon remains visible on the team directory')
  await peopleSkinTrigger.click()
  const peopleSkin = page.getByRole('combobox', { name: '选择官网皮肤风格' })
  check(await peopleSkin.count() === 1, 'public skin selector opens on the team directory')
  await peopleSkin.selectOption('quiet-research')
  check(await page.locator('html').getAttribute('data-color-scheme') === 'quiet-research', 'standard academic skin can be restored')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await expect(page.locator('.worldline-shift-overlay__hud')).toHaveCount(0)
  check(!(await page.locator('.worldline-shift-overlay').innerText()).includes('世界线变动'), 'switching away from Worldline Console keeps the transition visual-only')
  await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await peopleSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('worldline-console')
  check(await page.locator('.worldline-shift-overlay').count() === 0, 'reduced-motion preference suppresses worldline transition animation')
  check(!(await page.locator('.worldline-particle-canvas').evaluate(el => el.classList.contains('is-visible'))), 'reduced-motion preference also suppresses the ambient particle field')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await peopleSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('quiet-research')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await expect(page.locator('.worldline-shift-overlay__hud')).toHaveCount(0)
  check(!(await page.locator('.worldline-shift-overlay').innerText()).includes('世界线变动'), 'theme switching stays free of the Worldline Shift text')
  await expect(page.locator('.worldline-shift-overlay')).toHaveCount(0, { timeout: 2500 })
  await page.goto(base, { waitUntil: 'networkidle' })
  check(!requested.some(url => new URL(url).pathname.startsWith('/api/')), 'anonymous homepage does not access internal APIs')
  check(!await page.locator('.research-static').isVisible(), 'script-free research fallback stays hidden when interactive tabs are active')
  check(await page.locator('#research-guides .research-guide-card').count() === 5, 'all five detailed topic guides have dedicated discovery cards')
  check(await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '专题导读', exact: true }).count() === 1, 'header navigation exposes the topic guide directory')
  check(!requested.some(url => /pdf-|pdf\.worker|three\.module|vanta|ogl-|forecast-clouds/.test(url)), 'public page does not fetch PDF, WebGL or hidden cloud background')

  // The CRT card sweep is visual-only, scoped to Worldline Console, and respects reduced motion.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const sweepSkinTrigger = page.getByRole('button', { name: '切换官网风格' })
  await sweepSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('worldline-console')
  const sweepCard = page.locator('.physics-resource-card').first()
  await sweepCard.hover()
  const reducedSweep = await sweepCard.evaluate(el => {
    const style = getComputedStyle(el, '::after')
    const rawDuration = style.animationDuration.split(',')[0].trim()
    const durationMs = rawDuration.endsWith('ms') ? Number.parseFloat(rawDuration) : Number.parseFloat(rawDuration) * 1000
    return { animationName: style.animationName, durationMs }
  })
  check(reducedSweep.animationName === 'worldline-card-signal' && reducedSweep.durationMs <= 0.1,
    'CRT card sweep remains scoped to Worldline Console and is reduced to <=0.1ms for reduced-motion users: ' + JSON.stringify(reducedSweep))
  await sweepSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('quiet-research')
  await sweepCard.hover()
  const quietSweepAnimation = await sweepCard.evaluate(el => getComputedStyle(el, '::after').animationName)
  check(quietSweepAnimation === 'none', 'CRT card sweep is disabled under Quiet Research')
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  const tabs = page.getByRole('tab')
  for (let i = 0; i < 5; i++) {
    await tabs.nth(i).click()
    check(await page.locator('.research-explainer dt').allTextContents().then(text => text.join('/') === '研究问题/主要方法/实验联系'), `research direction ${i + 1} provides a structured explanation`)
    const evidenceCount = await page.locator('.research-evidence a').count()
     check(evidenceCount >= 2 && evidenceCount <= 4, `research direction ${i + 1} links 2–4 approved papers`)
    check(await page.locator('.topic-guide-entry').isVisible(), `research direction ${i + 1} exposes a prominent topic-guide entry`)
    check((await page.locator('.topic-guide-entry').getAttribute('href')) === '/research/' + ['dark', 'neutrino', 'collider', 'phase', 'precision'][i], `research direction ${i + 1} opens its matching detailed guide`)
  }
  await tabs.first().focus(); await page.keyboard.press('End')
  check(await tabs.last().getAttribute('aria-selected') === 'true', 'End selects last research tab')
  await expect(tabs.last()).toBeFocused(); checks.push('End moves keyboard focus')
  await page.keyboard.press('Home')
  check(await tabs.first().getAttribute('aria-selected') === 'true', 'Home selects first research tab')
  await page.keyboard.press('ArrowDown')
  check(await tabs.nth(1).getAttribute('aria-selected') === 'true', 'ArrowDown selects next research tab')
  await page.getByRole('searchbox').fill('nonexistent-paper-for-audit')
  check(await page.getByText('没有匹配的论文。').isVisible(), 'paper search shows an explicit no-results state')
  await page.getByRole('button', { name: '清除筛选' }).click()
  check(await page.locator('.public-paper').count() === 16, 'all 16 approved publications are available')
  await page.getByRole('combobox', { name: '论文年份' }).selectOption('2026')
  check((await page.locator('.paper-year').allTextContents()).every(text => text.includes('2026')), 'year selection filters the directory')
  await page.getByRole('combobox', { name: '论文年份' }).selectOption('all')
  await page.getByRole('searchbox').fill('10.1103/3m4t-pk9b')
  check(await page.locator('.public-paper').count() === 1, 'DOI search finds the correct paper')
  await page.getByRole('searchbox').fill('')
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: /导出 BibTeX/ }).click()
  const downloaded = await download
  check(downloaded.suggestedFilename().endsWith('.bib'), 'BibTeX download works')
  const bibtex = await readFile(await downloaded.path(), 'utf8')
  check((bibtex.match(/@article\{/g) || []).length === 13 && (bibtex.match(/@misc\{/g) || []).length === 3, 'BibTeX distinguishes 13 journal articles from 3 preprints')
  await page.getByRole('button', { name: '查看相关论文' }).click()
  check(await page.getByRole('button', { name: '中微子与新相互作用', exact: true }).getAttribute('aria-pressed') === 'true', 'research direction opens related paper filter')
  check(await page.locator('.physics-resource-card').count() === 9, 'all nine public physics resources render without login')
  await page.getByRole('button', { name: '计算与复现', exact: true }).click()
  check(await page.locator('.physics-resource-card').count() === 4, 'public physics resources filter computing tools')
  await page.getByRole('button', { name: '实验与数据', exact: true }).click()
  check(await page.locator('.physics-resource-card').count() === 2, 'public physics resources filter experimental data')
  await page.getByRole('button', { name: '全部资源', exact: true }).click()
  check(await page.locator('.physics-resource-card a').evaluateAll(links => links.every(link => link.href.startsWith('https:') && link.target === '_blank' && link.rel.includes('noopener') && link.rel.includes('noreferrer'))), 'public resource links use HTTPS and isolated external tabs')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced-motion preference is available')
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  const mobileTocToggle = page.getByRole('button', { name: '打开页面目录' })
  const mobileTocBox = await mobileTocToggle.boundingBox()
  check(Boolean(mobileTocBox && mobileTocBox.x >= 0 && mobileTocBox.x + mobileTocBox.width <= 320), 'mobile section directory toggle fits the viewport')
  await mobileTocToggle.click()
  check(await page.getByRole('button', { name: '关闭页面目录' }).getAttribute('aria-expanded') === 'true' && await page.locator('#public-section-nav-links').isVisible(), 'mobile section directory opens as a labelled panel')
  await page.locator('#public-section-nav-links').getByRole('link', { name: '专题导读', exact: true }).click()
  check(new URL(page.url()).hash === '#research-guides' && await page.getByRole('button', { name: '打开页面目录' }).getAttribute('aria-expanded') === 'false', 'mobile section directory exposes the topic guide entry')
  await page.getByRole('button', { name: '打开页面目录' }).click()
  await page.locator('#public-section-nav-links').getByRole('link', { name: '物理资源', exact: true }).click()
  check(new URL(page.url()).hash === '#physics-resources' && await page.getByRole('button', { name: '打开页面目录' }).getAttribute('aria-expanded') === 'false', 'mobile section directory navigates and closes')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  await page.getByRole('button', { name: '菜单', exact: true }).click()
  check(await page.getByRole('navigation', { name: '官网导航' }).isVisible(), 'mobile navigation expands')
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'expanded mobile menu fits viewport')
  await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '专题导读', exact: true }).click()
  check(new URL(page.url()).hash === '#research-guides' && await page.getByRole('button', { name: '菜单', exact: true }).getAttribute('aria-expanded') === 'false', 'mobile navigation exposes and reaches the topic guide directory')
  await page.getByRole('button', { name: '菜单', exact: true }).click()
  await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '物理资源', exact: true }).click()
  check(new URL(page.url()).hash === '#physics-resources' && await page.getByRole('button', { name: '菜单', exact: true }).getAttribute('aria-expanded') === 'false', 'mobile resource navigation reaches its section and closes the menu')
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base, { waitUntil: 'networkidle' })
    const firstGuideLink = page.locator('.topic-guide-entry')
    await firstGuideLink.scrollIntoViewIfNeeded()
    const previousScrollY = await page.evaluate(() => window.scrollY)
    check(previousScrollY > 100, `research guide navigation regression starts from a scrolled homepage at ${width}px`)
    check(await firstGuideLink.getAttribute('href') === '/research/dark', `homepage topic entry targets the expected research route at ${width}px`)
    await firstGuideLink.click()
    await page.waitForURL(url => url.pathname === '/research/dark', { timeout: 10000 })
    await page.locator('.research-topic-page').waitFor({ timeout: 10000 }).catch(async error => {
      const bodyText = (await page.locator('body').innerText()).slice(0, 300)
      throw new Error(`topic route did not render; url=${page.url()}; pageErrors=${errors.slice(-5).join(' | ')}; consoleErrors=${consoleErrors.slice(-5).join(' | ')}; failedRequests=${failedRequests.slice(-5).join(' | ')}; body=${bodyText}; cause=${error.message}`)
    })
    await page.waitForFunction(() => window.scrollY < 5)
    check(await page.evaluate(() => window.scrollY < 5), `opening a research topic resets reading position to the top at ${width}px`)
    const stickyExpected = await page.evaluate(() => window.innerWidth > 760 || CSS.supports('overflow-x', 'clip'))
    check(await page.locator('.topic-sidebar').evaluate(el => getComputedStyle(el).position) === (stickyExpected ? 'sticky' : 'static'), `topic directory uses a non-obstructing layout at ${width}px`)
    check(await page.locator('.topic-visual-panel img').evaluate(img => img.complete && img.naturalWidth > 0), `topic visual illustration loads at ${width}px`)
    if (width <= 980) {
      await page.locator('.topic-sidebar-toggle').click()
      check(await page.locator('.topic-local-nav').evaluate(el => el.classList.contains('is-open')), `mobile topic directory expands at ${width}px`)
    }
    await page.locator('.topic-local-nav a[href="#topic-assumptions"]').click()
    await page.waitForFunction(() => location.hash === '#topic-assumptions')
    await page.waitForFunction(() => {
      const top = document.querySelector('#topic-assumptions')?.getBoundingClientRect().top
      return top != null && top >= 0 && top < 140
    })
    check(await page.locator('#topic-assumptions').evaluate(el => {
      const top = el.getBoundingClientRect().top
      return top >= 0 && top < 140
    }), `in-page navigation aligns the selected section near the top at ${width}px`)
    await page.waitForFunction(() => document.querySelector('.topic-local-nav a[aria-current="location"]')?.getAttribute('href') === '#topic-assumptions')
    check(await page.locator('.topic-local-nav a[aria-current="location"]').getAttribute('href') === '#topic-assumptions', `topic directory highlights the selected section at ${width}px`)
    check(
      await page.locator('.topic-breadcrumb-home').isVisible()
        && await page.locator('.topic-breadcrumb-home').getAttribute('href') === '/',
      `breadcrumb exposes a visible home link at ${width}px`,
    )
    check(
      await page.locator('.topic-sidebar-home').isVisible()
        && await page.locator('.topic-sidebar-home').getAttribute('href') === '/',
      `topic directory exposes a visible home link at ${width}px`,
    )

    // A sequence of in-page directory clicks must replace the current fragment,
    // not create a stack of section entries that trap the browser Back button.
    if (width <= 980) {
      await page.locator('.topic-sidebar-toggle').click()
      check(
        await page.locator('.topic-local-nav').evaluate(el => el.classList.contains('is-open')),
        `topic directory reopens for history regression at ${width}px`,
      )
    }
    await page.locator('.topic-local-nav a[href="#topic-workflow"]').click()
    await page.waitForFunction(() => location.hash === '#topic-workflow')
    check(
      new URL(page.url()).hash === '#topic-workflow',
      `second topic directory selection updates the fragment at ${width}px`,
    )
    await page.goBack()
    await page.waitForURL(url => url.pathname === '/' && url.hash === '', { timeout: 10000 })
    check(
      new URL(page.url()).pathname === '/' && new URL(page.url()).hash === '',
      `browser Back leaves the topic after multiple directory clicks at ${width}px`,
    )

    // Re-enter the topic so the remaining layout checks still run against a
    // fresh topic navigation, not a page restored from the history stack.
    const reentryLink = page.locator('.topic-guide-entry').first()
    await reentryLink.scrollIntoViewIfNeeded()
    check(
      await reentryLink.getAttribute('href') === '/research/dark',
      `topic can be reopened from the homepage after browser Back at ${width}px`,
    )
    await reentryLink.click()
    await page.waitForURL(url => url.pathname === '/research/dark', { timeout: 10000 })
    await page.locator('.research-topic-page').waitFor({ timeout: 10000 })
    await page.waitForFunction(() => window.scrollY < 5)
    check(
      await page.evaluate(() => window.scrollY < 5),
      `reopened topic starts at the top after browser Back at ${width}px`,
    )

    // Recreate the reading position used by the existing sticky-sidebar test.
    if (width <= 980) await page.locator('.topic-sidebar-toggle').click()
    await page.locator('.topic-local-nav a[href="#topic-assumptions"]').click()
    await page.waitForFunction(() => location.hash === '#topic-assumptions')
    await page.waitForFunction(() => {
      const top = document.querySelector('#topic-assumptions')?.getBoundingClientRect().top
      return top != null && top >= 0 && top < 140
    })
    await page.waitForFunction(() => document.querySelector('.topic-local-nav a[aria-current="location"]')?.getAttribute('href') === '#topic-assumptions')

    if (stickyExpected) {
      const sidebarFitsViewport = await page.waitForFunction(() => {
        const element = document.querySelector('.topic-sidebar')
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top >= 0 && rect.top < 100 && rect.bottom <= window.innerHeight + 1
      }, null, { timeout: 10000 }).then(() => true).catch(() => false)
      const sidebarMetrics = await page.locator('.topic-sidebar').evaluate(el => {
        const rect = el.getBoundingClientRect()
        return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), viewport: window.innerHeight }
      })
      check(sidebarFitsViewport, `topic directory remains visible within the viewport while reading later sections at ${width}px: ${JSON.stringify(sidebarMetrics)}`)
    } else {
      check(await page.locator('.topic-sidebar').evaluate(el => getComputedStyle(el).position === 'static'), `legacy mobile layout keeps the topic directory in document flow at ${width}px`)
    }
    await page.locator('.topic-all-guides').click()
    await page.locator('#research-guides').waitFor()
    await page.waitForFunction(() => location.hash === '#research-guides')
    await page.waitForFunction(() => {
      const top = document.querySelector('#research-guides')?.getBoundingClientRect().top
      return top != null && top >= 0 && top < 200
    })
    check(await page.locator('#research-guides').evaluate(el => {
      const top = el.getBoundingClientRect().top
      return top >= 0 && top < 200
    }), `returning to all guides honors the destination fragment at ${width}px`)
    for (const topic of ['dark', 'neutrino', 'collider', 'phase', 'precision']) {
      await page.goto(`${base}/research/${topic}`, { waitUntil: 'networkidle' })
      await page.locator('.research-topic-page').waitFor()
      check((await page.title()).includes('引力之外'), `research topic ${topic} uses the brand in its title at ${width}px`)
      check(await page.locator('meta[property="og:title"]').getAttribute('content') === await page.title(), `research topic ${topic} Open Graph title matches its document title at ${width}px`)
      check(await page.locator('meta[name="twitter:title"]').getAttribute('content') === await page.title(), `research topic ${topic} Twitter title matches its document title at ${width}px`)
      check(await page.locator('meta[property="og:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `research topic ${topic} Open Graph description matches its document description at ${width}px`)
      check(await page.locator('meta[name="twitter:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `research topic ${topic} Twitter description matches its document description at ${width}px`)
      check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible on research topic ${topic}`)
      check(await page.locator('h1').isVisible(), `research topic ${topic} renders at ${width}px`)
      const illustration = page.locator('.topic-visual-panel img')
      await illustration.evaluate(img => img.decode())
      check(await illustration.evaluate(img => img.complete && img.naturalWidth > 0), `research topic ${topic} illustration loads at ${width}px`)
      if (width === 390 || width === 1440) {
        await page.locator('.topic-visual-wrapper').screenshot({ path: resolve(output, `research-topic-${topic}-illustration-${width}.png`) })
      }
      check((await illustration.getAttribute('alt'))?.length > 20, `research topic ${topic} illustration has descriptive alternative text`)
      if (width <= 600) {
        check(await page.locator('.topic-visual-labels').isVisible(), `research topic ${topic} exposes readable mobile illustration labels`)
        check(await page.locator('.topic-visual-labels li').count() >= 3, `research topic ${topic} shows at least three mobile illustration labels`)
        check(await page.locator('.topic-visual-panel figcaption').evaluate(el => el.getBoundingClientRect().top >= el.closest('.topic-visual-panel').querySelector('img').getBoundingClientRect().bottom - 1), `research topic ${topic} caption stays below the mobile artwork`)
      }
      check(await page.locator('.topic-section').count() >= 8, `research topic ${topic} includes the expanded physics guide, workflow, observables, papers and resources`)
      check(await page.locator('#topic-mechanisms').isVisible(), `research topic ${topic} explains its core physics mechanisms`)
      check(await page.locator('#topic-relations').isVisible(), `research topic ${topic} explains key relations and their validity conditions`)
      check(await page.locator('#topic-assumptions').isVisible(), `research topic ${topic} states assumptions and common failure modes`)
      check(await page.locator('#topic-questions').isVisible(), `research topic ${topic} offers research entry points`)
      check(await page.locator('#topic-source-notes').isVisible(), `research topic ${topic} links formula and method references`)
      check(await page.locator('#topic-workflow').isVisible(), `research topic ${topic} explains the model-to-evidence workflow`)
      check(await page.locator('#topic-interpretation').isVisible(), `research topic ${topic} distinguishes result interpretations`)
      check(await page.locator('.physics-card').count() >= 3, `research topic ${topic} has at least three physics focus cards`)
      check(await page.locator('.topic-local-nav a').count() >= 11, `research topic ${topic} has complete in-page navigation`)
      check(await page.locator('.topic-resource-card').count() >= 5, `research topic ${topic} links relevant physics resources`)
      const topicPaperCount = await page.locator('.topic-publications a[href^="https://arxiv.org/abs/"]').count()
      check(topicPaperCount >= 2 && topicPaperCount <= 4, `research topic ${topic} links 2–4 approved papers`)
      check(await page.locator('meta[name="robots"]').getAttribute('content') === 'index,follow', `research topic ${topic} is indexable`)
      check(await page.locator('link[rel="canonical"]').getAttribute('href') === `https://buaa-hep-hub.pages.dev/research/${topic}`, `research topic ${topic} has a route-specific canonical URL`)
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `research topic ${topic} fits ${width}px without horizontal overflow`)
      if (topic === 'dark') await page.screenshot({ path: resolve(output, `research-topic-dark-${width}.png`), fullPage: true })
    }
    await page.goto(`${base}/research/not-a-real-topic`, { waitUntil: 'networkidle' })
    check(await page.getByRole('heading', { name: '没有找到这个研究专题。' }).isVisible(), `unknown research topic has a recovery state at ${width}px`)
    await page.goto(`${base}/people`, { waitUntil: 'networkidle' })
    check((await page.title()).includes('引力之外'), `public people page title uses the brand at ${width}px`)
    check(await page.locator('meta[property="og:title"]').getAttribute('content') === await page.title(), `public people Open Graph title matches its document title at ${width}px`)
    check(await page.locator('meta[name="twitter:title"]').getAttribute('content') === await page.title(), `public people Twitter title matches its document title at ${width}px`)
    check(await page.locator('meta[property="og:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `public people Open Graph description matches its document description at ${width}px`)
    check(await page.locator('meta[name="twitter:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `public people Twitter description matches its document description at ${width}px`)
    check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible on team directory at ${width}px`)
    check(await page.getByRole('heading', { name: '团队与学术指导' }).isVisible(), `public people directory renders at ${width}px`)
    check(await page.locator('.person-card').count() === 2, 'only the two approved public academic profiles render')
    check(await page.locator('.person-card a[href^="https://"]').count() === 2, 'public people cards link to official profiles')
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `public people directory fits ${width}px`)
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(output, `people-${width}.png`), fullPage: true })
    await page.goto(`${base}/events`, { waitUntil: 'networkidle' })
    check((await page.title()).includes('引力之外'), `public events page title uses the brand at ${width}px`)
    check(await page.locator('meta[property="og:title"]').getAttribute('content') === await page.title(), `public events Open Graph title matches its document title at ${width}px`)
    check(await page.locator('meta[name="twitter:title"]').getAttribute('content') === await page.title(), `public events Twitter title matches its document title at ${width}px`)
    check(await page.locator('meta[property="og:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `public events Open Graph description matches its document description at ${width}px`)
    check(await page.locator('meta[name="twitter:description"]').getAttribute('content') === await page.locator('meta[name="description"]').getAttribute('content'), `public events Twitter description matches its document description at ${width}px`)
    check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible on events page at ${width}px`)
    check(await page.getByRole('heading', { name: '学术活动' }).isVisible(), `public events page renders at ${width}px`)
    check(await page.getByText('目前没有已核验的近期公开活动。组内内部组会不会自动发布到此页面。').isVisible(), 'no unreviewed or internal seminar records are shown publicly')
    check(await page.getByRole('button', { name: /下载公开日历/ }).isDisabled(), 'calendar export is disabled until a verified public event exists')
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `public events page fits ${width}px`)
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(output, `events-${width}.png`), fullPage: true })
  }
  check(!requested.some(url => new URL(url).pathname.startsWith('/api/')), 'public homepage, research, people and events pages never request internal APIs')
  check(errors.length === 0, `no public page runtime errors: ${errors.join('; ')}`)
  await anonymous.close()

  const nojs = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await nojs.newPage(); await staticPage.goto(base)
  check(await staticPage.locator('h1').isVisible(), 'public content renders with JavaScript disabled')
  check(await staticPage.locator('a[href="https://arxiv.org/abs/2210.09335"]').count() > 0, 'static HTML includes approved research links')
  check(await staticPage.locator('.research-static article').count() === 5, 'all five detailed research descriptions are readable without JavaScript')
  check(await staticPage.locator('.physics-resource-card a').count() === 9, 'all public resource links work without JavaScript')
  check((await staticPage.title()).includes('引力之外'), 'homepage has the brand in static HTML title')
  check(await staticPage.locator('meta[property="og:title"]').getAttribute('content') === await staticPage.title(), 'homepage Open Graph title matches the static HTML title')
  check(await staticPage.locator('meta[property="og:description"]').getAttribute('content') === await staticPage.locator('meta[name="description"]').getAttribute('content'), 'homepage Open Graph description matches the static page description')
  check(await staticPage.locator('meta[name="twitter:description"]').getAttribute('content') === await staticPage.locator('meta[name="description"]').getAttribute('content'), 'homepage Twitter description matches the static page description')
  for (const route of [
    { path: '/research/dark', heading: '暗物质与暗扇区' },
    { path: '/people', heading: '团队与学术指导' },
    { path: '/events', heading: '学术活动' },
  ]) {
    await staticPage.goto(base + route.path)
    check(await staticPage.getByRole('heading', { name: route.heading, exact: true }).isVisible(), `public route ${route.path} renders without JavaScript`)
    check(await staticPage.locator('link[rel="canonical"]').getAttribute('href') === `https://buaa-hep-hub.pages.dev${route.path}`, `public route ${route.path} has static canonical metadata`)
    check((await staticPage.title()).includes('引力之外'), `public route ${route.path} has a branded static title`)
    check(await staticPage.locator('meta[property="og:title"]').getAttribute('content') === await staticPage.title(), `public route ${route.path} Open Graph title matches its static title`)
    check(await staticPage.locator('meta[property="og:description"]').getAttribute('content') === await staticPage.locator('meta[name="description"]').getAttribute('content'), `public route ${route.path} Open Graph description matches its static description`)
  }
  await nojs.close()

  const privateContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const privatePage = await privateContext.newPage()
  const privateErrors = []; privatePage.on('pageerror', e => privateErrors.push(e.message))
  for (const route of ['/hub', '/seminars', '/resources', '/library', '/account']) {
    const directStatus = await gotoDirectRoute(privatePage, route, '?demo=1')
    check(directStatus === 200, `direct internal route ${route} returns HTTP 200`)
    await privatePage.locator('.app-shell.has-sidebar').waitFor()
    check(await privatePage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', `internal route ${route} is noindex`)
    check(await privatePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} fits 390px`)
  }
  await privatePage.setViewportSize({ width: 1440, height: 900 })
  for (const route of ['/hub', '/library', '/seminars']) {
    const directStatus = await gotoDirectRoute(privatePage, route, '?demo=1')
    check(directStatus === 200, `direct desktop route ${route} returns HTTP 200`)
    await privatePage.locator('.app-shell.has-sidebar').waitFor()
    check(await privatePage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', `internal route ${route} is noindex on desktop`)
    check(await privatePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} fits 1440px`)
    await privatePage.screenshot({ path: resolve(output, `internal-${route.slice(1)}-1440.png`), fullPage: true })
  }
  check(privateErrors.length === 0, `no internal route runtime errors: ${privateErrors.join('; ')}`)
  // Static, non-confidential learning notes use the existing workspace session.
  for (const width of [320, 390, 768, 1440]) {
    await privatePage.setViewportSize({ width, height: 900 })
    await privatePage.goto(base + '/learning/amplitudes?demo=1', { waitUntil: 'networkidle' })
    await privatePage.locator('.study-formula math').first().waitFor({ state: 'attached' })
    check(await privatePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `learning equations fit ${width}px without page overflow`)
    check(await privatePage.getByRole('heading', { name: '振幅、截面与衰变宽度', exact: true }).isVisible(), `learning deep link renders at ${width}px`)
    await privatePage.screenshot({ path: resolve(output, `learning-${width}.png`), fullPage: true })
  }
  check(await privatePage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', 'learning deep routes remain noindex')
  const studyLinks = privatePage.getByRole('navigation', { name: '学习专题', exact: true }).getByRole('link')
  check(await studyLinks.count() === 5, 'all five study topics are reachable')
  await studyLinks.last().focus(); await privatePage.keyboard.press('Enter')
  const feyncalcHeading = privatePage.getByRole('heading', { name: 'FeynCalc 与可复现计算', exact: true })
  await expect(feyncalcHeading).toBeFocused(); checks.push('keyboard topic navigation moves focus to the new article')
  check(await privatePage.locator('.learning-code').textContent().then(t => t.includes('DiracTrace')), 'FeynCalc example is readable with execution limits stated')
  const noteDownloadPromise = privatePage.waitForEvent('download')
  await privatePage.getByRole('button', { name: '下载本篇笔记' }).click()
  const noteDownload = await noteDownloadPromise
  const noteText = await readFile(await noteDownload.path(), 'utf8')
  check(noteText.includes('FeynCalc 与可复现计算') && noteText.includes('未在 Mathematica 中执行') && noteText.includes('https://feyncalc.github.io/'), 'downloaded notes retain selected topic, limitations and sources')
  await privatePage.getByRole('searchbox').fill('not-a-resource-or-topic')
  check(await privatePage.getByText('没有匹配的资源。', { exact: true }).isVisible(), 'learning search has an explicit empty state')
  check(await privatePage.locator('.learning-article').textContent().then(t => t.includes('FeynCalc 与可复现计算')), 'searching the index preserves the current article')
  await privatePage.getByRole('button', { name: '清除资源筛选' }).click()
  await privatePage.getByRole('combobox', { name: '资源类别' }).selectOption('计算工具')
  check(await privatePage.locator('.learning-resource').count() === 3, 'resource category filter selects only computing tools')
  const templateDownloadPromise = privatePage.waitForEvent('download')
  await privatePage.getByRole('button', { name: '下载复现记录模板' }).click()
  const templateDownload = await templateDownloadPromise
  check((await readFile(await templateDownload.path(), 'utf8')).includes('不得默认标记已验证'), 'reproduction template starts with unverified status')
  await privatePage.goto(base + '/learning/amplitudes', { waitUntil: 'networkidle' })
  const formulaDownloadPromise = privatePage.waitForEvent('download')
  await privatePage.getByRole('link', { name: /下载两体衰变 Python 基准/ }).click()
  const formulaDownload = await formulaDownloadPromise
  check((await readFile(await formulaDownload.path(), 'utf8')).includes('def angular_quadrature'), 'actual runnable benchmark download is served')
  await privatePage.goto(base + '/learning/missing-guide', { waitUntil: 'networkidle' })
  check(await privatePage.getByRole('heading', { name: '没有这个学习专题' }).isVisible(), 'unknown guide deep link shows recovery navigation')
  await privatePage.setViewportSize({ width: 390, height: 844 })
  for (const topic of ['standard-model', 'bsm-consistency', 'eft']) {
    await privatePage.goto(base + '/learning/' + topic, { waitUntil: 'networkidle' })
    await privatePage.locator('.study-formula math').first().waitFor({ state: 'attached' })
    check(await privatePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${topic} equations fit 390px`)
  }
  await privatePage.locator('.study-formula details').first().locator('summary').click()
  check(await privatePage.locator('.study-formula details').first().locator('code').isVisible(), 'formula LaTeX source can be expanded and selected')
  await privatePage.screenshot({ path: resolve(output, 'learning-390-first-screen.png') })
  check(privateErrors.length === 0, `no learning page runtime errors: ${privateErrors.join('; ')}`)
  await privateContext.close()

  const loggedOut = await browser.newContext()
  const loginPage = await loggedOut.newPage()
  await loginPage.route('**/api/system/status', route => route.fulfill({ json: { initialized: true } }))
  for (const width of [390, 1440]) {
    await loginPage.setViewportSize({ width, height: 900 })
    const loginStatus = await gotoDirectRoute(loginPage, '/login')
    check(loginStatus === 200, `direct login route returns HTTP 200 at ${width}px`)
    await loginPage.getByRole('heading', { name: '欢迎登录' }).waitFor()
    const loginForm = loginPage.locator('form').filter({ hasText: '登录邮箱' })
    check(await loginForm.locator('input[type="email"]').isVisible(), `login email field renders at ${width}px`)
    check(await loginForm.locator('input[type="password"]').isVisible(), `login password field renders at ${width}px`)
    check(await loginPage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', `login page is noindex at ${width}px`)
    check(await loginPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `login page fits ${width}px`)
    await loginPage.screenshot({ path: resolve(output, `login-${width}.png`), fullPage: true })
  }
  const anonymousHubStatus = await gotoDirectRoute(loginPage, '/hub')
  check(anonymousHubStatus === 200, 'direct anonymous /hub request returns the SPA document')
  await loginPage.waitForURL('**/login?redirect=**')
  check(loginPage.url().includes('/login'), 'anonymous workbench access redirects to login')
  await loginPage.goto(base + '/learning/eft')
  await loginPage.waitForURL('**/login?redirect=**')
  check(loginPage.url().includes('/login?redirect=/learning/eft'), 'anonymous learning navigation redirects to login with its target preserved')
  await loggedOut.close()
// Appearance compatibility audit: exercise every actionable theme card in Chromium.
  // Theme-transition assertions require animation to be enabled regardless of the host runner preference.
  // Reduced-motion behavior is covered separately with an explicitly reduced context above.
  const styleContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  await styleContext.addInitScript(() => {
    if (localStorage.getItem('__appearance_audit_seeded') === '1') return
    localStorage.setItem('labhub_force_demo', '1')
    localStorage.setItem('labhub_token', 'demo_jwt_token_laborbit_experience')
    localStorage.setItem('labhub_user', JSON.stringify({
      id: 1, name: '李华（演示管理员）', email: 'admin@example.invalid',
      role: 'admin', identity: 'teacher', tutorial_completed: true, is_tutorial_completed: true
    }))
    localStorage.setItem('sidebar_pinned', 'false')
    localStorage.setItem('labhub_sidebar_peeked', 'true')
    localStorage.setItem('labhub_pin_guided', 'true')
    localStorage.setItem('laborbit_color_scheme', 'quiet-research')
    localStorage.setItem('laborbit_bg_type', 'paper')
    localStorage.setItem('laborbit_glass_style', 'solid')
    localStorage.setItem('laborbit_bg_video_paused', 'false')
    localStorage.setItem('laborbit_bg_dim_percent_v2', '100')
    localStorage.setItem('laborbit_default_v20261021_quiet_research', '1')
    localStorage.setItem('__appearance_audit_seeded', '1')
  })
  const stylePage = await styleContext.newPage()
  stylePage.setDefaultTimeout(15000)
  const styleErrors = []
  stylePage.on('pageerror', e => styleErrors.push(e.message))
  await stylePage.goto(base + '/style', { waitUntil: 'networkidle' })
  // Keep timed Worldline transitions in a foreground tab so Chromium does not throttle cleanup timers.
  await stylePage.bringToFront()
  await stylePage.waitForFunction(() => document.visibilityState === 'visible')
  await stylePage.locator('#section-color .theme-card').first().waitFor()

  // Playwright starts the pointer at (0, 0), over the fixed rail. Move away and let its leave debounce settle before asserting the default collapsed state.
  await stylePage.mouse.move(520, 400)
  await stylePage.waitForTimeout(350)

  // Capture initial state before asserting so a failure distinguishes app state from CSS sizing.
  const sidebarState = await stylePage.evaluate(() => {
    const nav = document.querySelector('.forecast-sidebar')
    const shell = document.querySelector('.app-shell')
    return {
      scheme: document.documentElement.dataset.colorScheme,
      pinned: localStorage.getItem('sidebar_pinned'),
      navClasses: nav?.className || null,
      navWidth: nav ? Math.round(nav.getBoundingClientRect().width) : null,
      navCssWidth: nav ? getComputedStyle(nav).width : null,
      shellClasses: shell?.className || null,
      shellPaddingLeft: shell ? getComputedStyle(shell).paddingLeft : null,
      pinWrapperDisplay: nav ? getComputedStyle(nav.querySelector('.pin-anchor-wrapper')).display : null
    }
  })
  console.log('Appearance sidebar initial state: ' + JSON.stringify(sidebarState))
  await stylePage.screenshot({ path: resolve(output, 'style-initial-1440.png'), fullPage: true })
  check(sidebarState.scheme === 'quiet-research', 'Quiet Research scheme is active before sidebar checks')
  check(sidebarState.navClasses?.includes('is-collapsed'), 'unpinned sidebar starts collapsed')
  check(sidebarState.navWidth === 88, 'collapsed sidebar uses the 88px compact rail')
  check(parseFloat(sidebarState.shellPaddingLeft) === 88, 'collapsed sidebar preserves the 88px workspace offset')
  const sidebar = stylePage.locator('.forecast-sidebar')
  await sidebar.hover()
  await expect(sidebar).toHaveClass(/is-floating/)
  check(await stylePage.evaluate(() => {
    const nav = document.querySelector('.forecast-sidebar')
    const shell = document.querySelector('.app-shell')
    return Math.round(nav.getBoundingClientRect().width) === 248 &&
      Math.round(parseFloat(getComputedStyle(shell).paddingLeft)) === 88
  }), 'hover expands the sidebar without shifting the workspace')
  const pinButton = stylePage.locator('#tour-pin-sidebar')
  check(await pinButton.isVisible(), 'pin control remains visible after expanding Quiet Research sidebar')
  await pinButton.click()
  await expect(sidebar).not.toHaveClass(/is-collapsed/)
  check(await stylePage.evaluate(() => localStorage.getItem('sidebar_pinned') === 'true'), 'pinning the sidebar persists the selected state')
  await pinButton.click()
  await stylePage.mouse.move(520, 400)
  await stylePage.waitForTimeout(350)
  await expect(sidebar).toHaveClass(/is-collapsed/)
  check(await stylePage.evaluate(() => localStorage.getItem('sidebar_pinned') === 'false'), 'unpinning restores auto-collapse and persists the selected state')

  // All five color cards must change the root scheme and active card state.
  const schemeIds = ['quiet-research', 'classic-cyan', 'obsidian-gray', 'nebula-purple', 'worldline-console', 'custom']
  const schemeCards = stylePage.locator('#section-color .theme-card[role="button"]')
  check(await schemeCards.count() === schemeIds.length, 'all five color scheme cards render')
  for (let i = 0; i < schemeIds.length; i++) {
    if (schemeIds[i] === 'worldline-console' || schemeIds[i] === 'custom') {
      await stylePage.evaluate(() => {
        window.__themeShiftPhaseLog = []
        window.__themeShiftStartedAt = performance.now()
        window.__themeShiftListener = event => {
          window.__themeShiftPhaseLog.push({ phase: event.detail, at: Math.round(performance.now()) })
        }
        window.addEventListener('worldline:phase', window.__themeShiftListener)
      })
    }
    await schemeCards.nth(i).click()
    await expect(stylePage.locator('html')).toHaveAttribute('data-color-scheme', schemeIds[i])
    check(await schemeCards.nth(i).getAttribute('aria-pressed') === 'true', `color scheme card ${schemeIds[i]} updates its active state`)
    check(await stylePage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().length > 0), `color scheme ${schemeIds[i]} supplies an accent color`)
    if (schemeIds[i] === 'worldline-console' || schemeIds[i] === 'custom') {
      const themeTransition = stylePage.locator('.worldline-shift-overlay')
      try {
        // Capture both the phase event and the rendered overlay so failures tell
        // us whether the transition was never triggered or merely missed by the DOM assertion.
        await stylePage.waitForFunction(() =>
          Array.isArray(window.__themeShiftPhaseLog) &&
          window.__themeShiftPhaseLog.some(entry => entry.phase === 'ignite'),
          null,
          { timeout: 3000 }
        )
        await expect(themeTransition).toBeVisible({ timeout: 3000 })
        await expect(themeTransition.locator('.worldline-shift-overlay__hud')).toHaveCount(0)
        check(!(await themeTransition.innerText()).includes('世界线变动'), `theme card ${schemeIds[i]} transition contains no Worldline Shift text`)
        // Wait for the component's semantic end state instead of assuming that
        // the 1.8 s animation timer runs on wall-clock time under CI load.
        await stylePage.waitForFunction(() =>
          Array.isArray(window.__themeShiftPhaseLog) &&
          window.__themeShiftPhaseLog.some(entry => entry.phase === 'idle'),
          null,
          { timeout: 6000 }
        )
        const phases = await stylePage.evaluate(() => (window.__themeShiftPhaseLog || []).map(entry => entry.phase))
        const expectedPhases = ['ignite', 'propagate', 'disrupt', 'readout', 'decay', 'idle']
        check(
          phases.length === expectedPhases.length && expectedPhases.every((phase, index) => phases[index] === phase),
          `theme transition emits the complete phase sequence: ${phases.join(' -> ')}`
        )
        await expect(themeTransition).toHaveCount(0, { timeout: 1000 })
      } catch (error) {
        const diagnostic = await stylePage.evaluate(() => {
          const overlay = document.querySelector('.worldline-shift-overlay')
          return {
            elapsedMs: Math.round(performance.now() - (window.__themeShiftStartedAt || performance.now())),
            visibilityState: document.visibilityState,
            hasFocus: document.hasFocus(),
            phases: window.__themeShiftPhaseLog || [],
            overlayPresent: Boolean(overlay),
            overlayPhase: overlay?.getAttribute('data-phase') || null,
            timelineActive: Boolean(overlay?.classList.contains('is-timeline-active')),
            hudPresent: Boolean(overlay?.querySelector('.worldline-shift-overlay__hud')),
            overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
            colorScheme: document.documentElement.getAttribute('data-color-scheme'),
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          }
        })
        throw new Error('theme transition for ' + schemeIds[i] + ' was not observed or did not clean up: ' + JSON.stringify(diagnostic) + '; cause=' + error.message)
      } finally {
        await stylePage.evaluate(() => {
          if (window.__themeShiftListener) window.removeEventListener('worldline:phase', window.__themeShiftListener)
          delete window.__themeShiftListener
        })
      }
    }
  }

  // Custom theme presets, form editing, and save must all reach the real DOM/storage.
  await stylePage.getByRole('button', { name: '编辑', exact: true }).click()
  await stylePage.locator('.custom-theme-dialog-content').waitFor()
  check(await stylePage.locator('.custom-templates-grid .custom-tpl-btn').count() > 0, 'custom theme presets are available')
  await stylePage.locator('.custom-templates-grid .custom-tpl-btn').nth(1).click()
  await stylePage.locator('.custom-name-input').fill('Audit Theme')
  await stylePage.getByRole('button', { name: '保存并应用', exact: true }).click()
  await expect(stylePage.locator('.custom-theme-dialog-content')).toBeHidden()
  check(await stylePage.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('laborbit_custom_color_scheme') || 'null')
    return document.documentElement.dataset.colorScheme === 'custom' && saved?.name === 'Audit Theme'
  }), 'custom theme preset and edited name persist and apply')
  await schemeCards.nth(0).click()
  await expect(stylePage.locator('html')).toHaveAttribute('data-color-scheme', 'quiet-research')

  // The three glass cards must produce different, observable CSS behavior in Quiet Research.
  const glassCards = stylePage.locator('#section-glass .theme-card[role="button"]')
  const glassIds = ['solid', 'liquid', 'frosted']
  check(await glassCards.count() === glassIds.length, 'all three glass style cards render')
  await stylePage.evaluate(() => {
    const probe = document.createElement('div')
    probe.id = 'audit-glass-probe'
    probe.className = 'glass-card'
    probe.style.cssText = 'position:fixed;right:0;bottom:0;width:120px;height:80px;'
    document.querySelector('.app-shell').appendChild(probe)
  })
  for (let i = 0; i < glassIds.length; i++) {
    await glassCards.nth(i).click()
    await expect(stylePage.locator('html')).toHaveAttribute('data-glass-style', glassIds[i])
    check(await glassCards.nth(i).getAttribute('aria-pressed') === 'true', `glass style card ${glassIds[i]} updates its active state`)
    const glass = await stylePage.evaluate(() => {
      const el = document.querySelector('#audit-glass-probe')
      const css = getComputedStyle(el)
      return { backdrop: css.backdropFilter, background: css.backgroundColor }
    })
    if (glassIds[i] === 'solid') {
      check(glass.backdrop === 'none' && glass.background !== 'rgba(0, 0, 0, 0)', 'solid glass mode uses an opaque surface without blur')
    } else {
      check(glass.backdrop.includes('blur'), `${glassIds[i]} glass mode has a visible CSS fallback instead of a no-op`)
    }
  }
  await stylePage.evaluate(() => document.querySelector('#audit-glass-probe')?.remove())
  // Verify the real HomeView path also initializes liquid glass or retains its CSS fallback.
  await glassCards.nth(1).click()
  await stylePage.goto(base + '/hub', { waitUntil: 'networkidle' })
  await stylePage.locator('.forecast-right .glass-card').first().waitFor({ state: 'visible' })
  await stylePage.waitForTimeout(1200)
  const liquidHome = await stylePage.evaluate(() => {
    const container = document.querySelector('.forecast-right')
    const card = container?.querySelector('.glass-card')
    return {
      active: Boolean(container?.classList.contains('liquid-glass-active')),
      backdrop: card ? getComputedStyle(card).backdropFilter : ''
    }
  })
  check(liquidHome.active || liquidHome.backdrop.includes('blur'), 'liquid glass works on the HomeView or visibly falls back to CSS')
  await stylePage.goto(base + '/style', { waitUntil: 'networkidle' })
  await schemeCards.nth(0).click()

  // Background cards must change the selected mode and render the corresponding effect.
  const bgCards = stylePage.locator('#section-bg .theme-card[role="button"]')
  check(await bgCards.count() === 5, 'all five background cards render')
  await bgCards.nth(0).click()
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'paper', 'paper background card applies')
  check(await stylePage.locator('.forecast-atmosphere').count() === 0, 'paper mode does not mount the background renderer')

  await bgCards.nth(1).click()
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'clouds-static', 'static cloud background card applies')
  check(await stylePage.evaluate(() => document.documentElement.style.backgroundImage.includes('forecast-clouds-drift-seamless.jpg')), 'static cloud background applies a real image')

  await bgCards.nth(2).click()
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'galaxy', 'galaxy background card applies')
  await stylePage.locator('.galaxy-atmosphere-canvas canvas.is-rendered').waitFor({ state: 'visible', timeout: 20000 })
  // CSS transitions can remain at their start value while this tab is backgrounded.
  await stylePage.bringToFront()
  await stylePage.waitForFunction(() => document.visibilityState === 'visible')
  const dimSlider = stylePage.getByRole('slider', { name: '背景遮罩暗化程度' })
  await expect(dimSlider).toBeVisible()
  // A continuously animated background can keep Playwright's stability heuristic
  // waiting forever. Scroll instantly, focus the real range input, then use a real
  // keyboard event below to verify Vue state and rendered shade opacity.
  const sliderViewportState = await dimSlider.evaluate(el => {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    el.focus({ preventScroll: true })
    const rect = el.getBoundingClientRect()
    return {
      focused: document.activeElement === el,
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
    }
  })
  check(sliderViewportState.focused && sliderViewportState.inViewport, 'background dim slider can be focused and brought into the viewport')
  // Seed the native range position without firing input; the real keyboard action
  // below must update Vue state and the rendered shade opacity.
  await dimSlider.evaluate(el => {
    el.value = '19'
  })
  await stylePage.keyboard.press('ArrowRight')
  await stylePage.waitForFunction(() => {
    const shade = document.querySelector('.atmosphere-shade')
    return shade && Math.abs(Number(getComputedStyle(shade).opacity) - 0.2) < 0.02
  }, null, { timeout: 3000 }).catch(() => {})
  const dimState = await stylePage.evaluate(() => {
    const slider = document.querySelector('#bg-dim-slider')
    const shade = document.querySelector('.atmosphere-shade')
    return {
      sliderValue: slider?.value ?? null,
      rootInline: document.documentElement.style.getPropertyValue('--bg-dim'),
      rootComputed: getComputedStyle(document.documentElement).getPropertyValue('--bg-dim'),
      shadeOpacity: shade ? getComputedStyle(shade).opacity : null,
      shadeDimVar: shade ? getComputedStyle(shade).getPropertyValue('--bg-dim').trim() : null,
      shadeInlineOpacity: shade?.style.opacity ?? null,
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
      shadeClass: shade?.className ?? null,
      bgType: document.documentElement.dataset.bgType
    }
  })
  console.log('Background dim interaction state: ' + JSON.stringify(dimState))
  check(Number(dimState.sliderValue) === 20 &&
    Math.abs(Number(dimState.rootInline) - 0.2) < 0.02 &&
    Math.abs(Number(dimState.shadeOpacity) - 0.2) < 0.02,
    'background dim slider changes the visible overlay opacity')
  const dimResetButton = stylePage.locator('.bg-dim-reset-btn')
  await stylePage.bringToFront()
  // The page has continuously animated background layers; Playwright's locator scroll
  // waits for a stable bounding box and can time out before the occlusion audit runs.
  // Use a synchronous browser scroll, then still verify the real viewport and hit target.
  await dimResetButton.evaluate(button => {
    button.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
  })
  const resetHitTest = await dimResetButton.evaluate(button => {
    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const hit = document.elementFromPoint(x, y)
    return {
      button: button.className,
      x,
      y,
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth,
      hitTag: hit?.tagName ?? null,
      hitClass: typeof hit?.className === 'string' ? hit.className : '',
      hitIsButton: hit === button || button.contains(hit)
    }
  })
  console.log('Background dim reset hit test: ' + JSON.stringify(resetHitTest))
  check(resetHitTest.inViewport && resetHitTest.hitIsButton, 'background dim reset button is visible in the viewport and not obscured')
  // The hit-test above proves the target is unobstructed. Click its measured center
  // directly to avoid Playwright re-running auto-scroll on a continuously animated page.
  await stylePage.mouse.click(resetHitTest.x, resetHitTest.y)
  await stylePage.waitForFunction(() => {
    const shade = document.querySelector('.atmosphere-shade')
    return shade && Math.abs(Number(getComputedStyle(shade).opacity) - 0.35) < 0.02
  }, null, { timeout: 3000 }).catch(() => {})
  const dimResetState = await stylePage.evaluate(() => {
    const shade = document.querySelector('.atmosphere-shade')
    return {
      rootInline: document.documentElement.style.getPropertyValue('--bg-dim'),
      rootComputed: getComputedStyle(document.documentElement).getPropertyValue('--bg-dim'),
      shadeVariable: shade ? getComputedStyle(shade).getPropertyValue('--bg-dim') : null,
      parentVariable: shade?.parentElement ? getComputedStyle(shade.parentElement).getPropertyValue('--bg-dim') : null,
      shadeOpacity: shade ? getComputedStyle(shade).opacity : null,
      shadeInlineStyle: shade?.getAttribute('style') ?? null,
      shadeTransition: shade ? getComputedStyle(shade).transition : null,
      sliderValue: document.querySelector('#bg-dim-slider')?.value ?? null
    }
  })
  console.log('Background dim reset state: ' + JSON.stringify(dimResetState))
  check(Math.abs(Number(dimResetState.rootInline) - 0.35) < 0.02 &&
    Math.abs(Number(dimResetState.shadeOpacity) - 0.35) < 0.02 &&
    Number(dimResetState.sliderValue) === 35,
    'background dim reset restores the configured default')

  // The active WebGL background and smooth page scrolling can keep Playwright's
  // auto-scroll actionability wait from completing. Scroll instantly, inspect the
  // actual center hit target, then send a real pointer click at that measured point.
  const vantaCardHitTest = await bgCards.nth(3).evaluate(card => {
    card.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
    const rect = card.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const hit = document.elementFromPoint(x, y)
    return {
      x,
      y,
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth,
      hitTag: hit?.tagName ?? null,
      hitClass: typeof hit?.className === 'string' ? hit.className : '',
      hitIsCard: hit === card || card.contains(hit)
    }
  })
  console.log('Water-fog background card hit test: ' + JSON.stringify(vantaCardHitTest))
  check(vantaCardHitTest.inViewport && vantaCardHitTest.hitIsCard, 'water-fog background card is visible and not obscured')
  await stylePage.mouse.click(vantaCardHitTest.x, vantaCardHitTest.y)
  await expect(stylePage.locator('html')).toHaveAttribute('data-bg-type', 'vanta-fog', { timeout: 10000 })
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'vanta-fog', 'water-fog background card applies')
  await stylePage.locator('.vanta-atmosphere-canvas canvas.is-rendered').waitFor({ state: 'visible', timeout: 20000 })

  await bgCards.nth(0).click()
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'paper', 'paper background can be restored after dynamic effects')
  const bgPickerPromise = stylePage.waitForEvent('filechooser')
  await bgCards.nth(4).click()
  const bgPicker = await bgPickerPromise
  await bgPicker.setFiles({
    name: 'audit-background.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#b85e3f"/></svg>')
  })
  // FileChooser.setFiles resolves before the component's async IndexedDB save finishes.
  // Wait for the real reactive mode change rather than treating that expected async gap as a UI failure.
  await expect(stylePage.locator('html')).toHaveAttribute('data-bg-type', 'custom-local', { timeout: 10000 })
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'custom-local', 'local background upload selects the custom-local mode')
  await stylePage.locator('.forecast-atmosphere img.custom-bg-media').waitFor({ state: 'visible', timeout: 10000 })
  stylePage.once('dialog', dialog => dialog.accept())
  await stylePage.locator('.local-bg-actions').getByRole('button', { name: '清除', exact: true }).click()
  // The click handler awaits IndexedDB deletion before updating the active mode and card.
  await expect(stylePage.locator('html')).toHaveAttribute('data-bg-type', 'clouds-static', { timeout: 10000 })
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'clouds-static', 'clearing the local background restores the static background')
  const localBackgroundCard = stylePage.locator('#section-bg .theme-card').nth(4)
  await expect(localBackgroundCard).toContainText('未选择本地文件', { timeout: 10000 })
  check(await localBackgroundCard.textContent().then(t => t.includes('未选择本地文件')), 'clearing local background updates the card state')
  await bgCards.nth(0).click()

  // Test the font mode tabs and every local font slot with a real system font fixture.
  const fontCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    ...(process.platform === 'win32' && process.env.WINDIR
      ? [resolve(process.env.WINDIR, 'Fonts', 'arial.ttf')]
      : [])
  ]
  let fontFixture = null
  for (const candidate of fontCandidates) {
    try { fontFixture = await readFile(candidate); break } catch {}
  }
  check(Boolean(fontFixture), 'browser audit runner provides a local TTF fixture for testing font uploads')
  await stylePage.getByRole('tab', { name: /分离模式/ }).click()
  const splitFontCards = stylePage.locator('#section-font .split-font-card')
  check(await splitFontCards.count() === 2, 'split font mode exposes both independent font slots')
  for (const [index, filename] of [[0, 'audit-font-en.ttf'], [1, 'audit-font-zh.ttf']]) {
    const fontPickerPromise = stylePage.waitForEvent('filechooser')
    await splitFontCards.nth(index).locator('.slot-empty-box .upload-text').click()
    const fontPicker = await fontPickerPromise
    await fontPicker.setFiles({ name: filename, mimeType: 'font/ttf', buffer: fontFixture })
    await splitFontCards.nth(index).locator('.slot-info-box').waitFor({ state: 'visible', timeout: 15000 })
  }
  await expect(stylePage.locator('html')).toHaveAttribute('data-custom-font', 'split', { timeout: 15000 })
  check(await stylePage.evaluate(() => document.documentElement.dataset.customFont === 'split'), 'English and Chinese custom font slots both apply')
  stylePage.once('dialog', dialog => dialog.accept())
  await stylePage.getByRole('button', { name: '恢复系统默认字体方案', exact: true }).click()
  await expect(stylePage.locator('html')).not.toHaveAttribute('data-custom-font', /.+/)
  await stylePage.getByRole('tab', { name: /统一模式/ }).click()
  check(await stylePage.locator('#section-font .font-option-card').first().getAttribute('aria-pressed') === 'true', 'system default font card remains selectable')
  const unifiedFontPickerPromise = stylePage.waitForEvent('filechooser')
  await stylePage.locator('#section-font .font-option-card').nth(1).getByRole('button', { name: '选择字体', exact: true }).click()
  const unifiedFontPicker = await unifiedFontPickerPromise
  await unifiedFontPicker.setFiles({ name: 'audit-font-unified.ttf', mimeType: 'font/ttf', buffer: fontFixture })
  await expect(stylePage.locator('html')).toHaveAttribute('data-custom-font', 'unified')
  await stylePage.locator('#section-font .font-option-card').nth(1).getByRole('button', { name: '清除', exact: true }).click()
  await expect(stylePage.locator('html')).not.toHaveAttribute('data-custom-font', /.+/)
  check(await stylePage.evaluate(() => !document.documentElement.style.getPropertyValue('--font').includes('CustomUnifiedFont')), 'clearing the unified font restores the system font stack')

  // The native checkbox is intentionally visually hidden; interact with the visible switch surface.
  // The subsequent route and editor assertions verify that the real control still works end to end.
  await stylePage.locator('#section-home-layout .apple-switch').click()
  await stylePage.waitForURL('**/hub')
  await expect(stylePage.getByRole('button', { name: '完成', exact: true })).toBeVisible()
  check(await stylePage.locator('.edit-bar-info').textContent().then(t => t.includes('桌面排版编辑模式')), 'homepage layout switch opens the actual edit mode')
  await stylePage.getByRole('button', { name: '完成', exact: true }).click()
  await expect(stylePage.locator('.edit-bar-info')).toBeHidden()
  await stylePage.goto(base + '/style', { waitUntil: 'networkidle' })
  await stylePage.setViewportSize({ width: 390, height: 844 })
  check(await stylePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Quiet Research style page remains horizontally usable on mobile')
  check(styleErrors.length === 0, `appearance settings produce no browser runtime errors: ${styleErrors.join('; ')}`)
  await styleContext.close()

  // Browser-level regression: hostile email HTML must be inert, opaque-origin, and unable to fetch remote trackers.
  const emailAuditPage = await browser.newPage()
  try {
    await emailAuditPage.setContent('<!doctype html><html><body></body></html>')
    const hostileEmailHtml = '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'"></head><body><script>parent.__emailScriptExecuted = true</script><img src="' + base + '/email-tracker-pixel"><p id="email-body-text">Untrusted message</p></body></html>'
    await emailAuditPage.evaluate((html) => {
      const iframe = document.createElement('iframe')
      iframe.id = 'email-body'
      iframe.setAttribute('sandbox', '')
      iframe.setAttribute('referrerpolicy', 'no-referrer')
      iframe.srcdoc = html
      document.body.appendChild(iframe)
    }, hostileEmailHtml)
    await emailAuditPage.frameLocator('#email-body').locator('#email-body-text').waitFor()
    check(await emailAuditPage.evaluate(() => window.__emailScriptExecuted !== true), 'sandboxed email HTML cannot execute scripts in the parent page')
    const parentCanReadEmailDocument = await emailAuditPage.evaluate(() => {
      const frame = document.querySelector('#email-body')
      try { void frame.contentWindow.document.body; return true } catch { return false }
    })
    check(!parentCanReadEmailDocument, 'sandboxed email document has an opaque origin')
    await emailAuditPage.waitForTimeout(150)
    check(emailTrackerRequests.length === 0, 'email CSP blocks remote tracking images before they reach the server')
  } finally {
    await emailAuditPage.close()
  }
  // Exercise the real demo mailbox and its sanitized external-link behavior.
  await import('./email-link-browser.mjs')
  check(true, 'authenticated demo mailbox safely opens sanitized web links')
  await writeFile(resolve(output, 'browser-checks.json'), JSON.stringify({ checks, total: checks.length }, null, 2))
  console.log(`Browser verification: ${checks.length} checks passed.`)
} finally { await browser.close(); server.close() }
