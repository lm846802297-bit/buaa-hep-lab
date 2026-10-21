import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const output = resolve(process.env.AUDIT_OUTPUT_DIR || fileURLToPath(new URL('../test-results/audit', import.meta.url)))
await mkdir(output, { recursive: true })
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://local.invalid').pathname
    let file = resolve(root, '.' + pathname)
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    try {
      const info = await stat(file)
      if (info.isDirectory()) file = resolve(file, 'index.html')
      else if (!info.isFile()) file = resolve(root, 'index.html')
    } catch { file = resolve(root, 'index.html') }
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
    const data = await readFile(file)
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.json': 'application/json' }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(data)
  } catch { res.writeHead(500).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const checks = []
function check(value, message) { assert(value, message); checks.push(message) }
try {
  const anonymous = await browser.newContext()
  const page = await anonymous.newPage()
  const requested = [], errors = []
  page.on('request', req => requested.push(req.url()))
  page.on('pageerror', err => errors.push(err.message))
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('.app-shell .lab-public').waitFor()
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
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(output, `public-${width}-first-screen.png`) })
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
  const hubLinkBox = await page.locator('.public-header .nav-hub').boundingBox()
  check(Boolean(themeIconBox && hubLinkBox && themeIconBox.x >= hubLinkBox.x + hubLinkBox.width), 'homepage theme icon follows navigation without overlap')
  await publicSkinTrigger.click()
  const publicSkin = page.getByRole('combobox', { name: '选择官网皮肤风格' })
  check(await publicSkin.locator('option').count() === 5, 'public skin selector exposes all five appearance themes')
  await page.keyboard.press('Escape')
  check(await publicSkin.count() === 0, 'Escape closes the public theme popover')
  await publicSkinTrigger.click()
  await publicSkin.selectOption('worldline-console')
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'public selector activates the worldline console palette')
  check(await page.evaluate(() => localStorage.getItem('labhub_public_color_scheme') === 'worldline-console' && localStorage.getItem('laborbit_color_scheme') !== 'worldline-console'), 'public theme persists separately from workspace preferences')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await page.waitForTimeout(950)
  check(await page.locator('.worldline-shift-overlay').count() === 0, 'worldline transition overlay exits cleanly')
  const firstResourceCard = page.locator('.physics-resource-card').first()
  await firstResourceCard.hover()
  const hoverShadow = await firstResourceCard.evaluate(el => getComputedStyle(el).boxShadow)
  check(hoverShadow !== 'none', 'worldline mode provides visible hover feedback on resource cards')
  await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '团队' }).click()
  await page.getByRole('heading', { name: '团队与学术指导' }).waitFor()
  check(await page.locator('html').getAttribute('data-color-scheme') === 'worldline-console', 'worldline skin carries across public route navigation')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await page.waitForTimeout(950)
  const peopleSkinTrigger = page.getByRole('button', { name: '切换官网风格' })
  check(await peopleSkinTrigger.isVisible(), 'public skin icon remains visible on the team directory')
  await peopleSkinTrigger.click()
  const peopleSkin = page.getByRole('combobox', { name: '选择官网皮肤风格' })
  check(await peopleSkin.count() === 1, 'public skin selector opens on the team directory')
  await peopleSkin.selectOption('quiet-research')
  check(await page.locator('html').getAttribute('data-color-scheme') === 'quiet-research', 'standard academic skin can be restored')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await page.waitForTimeout(950)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await peopleSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('worldline-console')
  check(await page.locator('.worldline-shift-overlay').count() === 0, 'reduced-motion preference suppresses worldline transition animation')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await peopleSkinTrigger.click()
  await page.getByRole('combobox', { name: '选择官网皮肤风格' }).selectOption('quiet-research')
  await expect(page.locator('.worldline-shift-overlay')).toBeVisible()
  await page.waitForTimeout(950)
  await page.goto(base, { waitUntil: 'networkidle' })
  check(!requested.some(url => new URL(url).pathname.startsWith('/api/')), 'anonymous homepage does not access internal APIs')
  check(!await page.locator('.research-static').isVisible(), 'script-free research fallback stays hidden when interactive tabs are active')
  check(!requested.some(url => /pdf-|pdf\.worker|three\.module|vanta|ogl-|forecast-clouds/.test(url)), 'public page does not fetch PDF, WebGL or hidden cloud background')
  const tabs = page.getByRole('tab')
  for (let i = 0; i < 5; i++) {
    await tabs.nth(i).click()
    check(await page.locator('.research-explainer dt').allTextContents().then(text => text.join('/') === '研究问题/主要方法/实验联系'), `research direction ${i + 1} provides a structured explanation`)
    check(await page.locator('.research-evidence a').count() === 2, `research direction ${i + 1} links two approved papers`)
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
  await page.locator('#public-section-nav-links').getByRole('link', { name: '物理资源', exact: true }).click()
  check(new URL(page.url()).hash === '#physics-resources' && await page.getByRole('button', { name: '打开页面目录' }).getAttribute('aria-expanded') === 'false', 'mobile section directory navigates and closes')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() => window.scrollY < 5)
  await page.getByRole('button', { name: '菜单', exact: true }).click()
  check(await page.getByRole('navigation', { name: '官网导航' }).isVisible(), 'mobile navigation expands')
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'expanded mobile menu fits viewport')
  await page.getByRole('navigation', { name: '官网导航' }).getByRole('link', { name: '物理资源', exact: true }).click()
  check(new URL(page.url()).hash === '#physics-resources' && await page.getByRole('button', { name: '菜单', exact: true }).getAttribute('aria-expanded') === 'false', 'mobile resource navigation reaches its section and closes the menu')
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const topic of ['dark', 'neutrino', 'collider', 'phase', 'precision']) {
      await page.goto(`${base}/research/${topic}`, { waitUntil: 'networkidle' })
      await page.locator('.research-topic-page').waitFor()
      check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible on research topic ${topic}`)
      check(await page.locator('h1').isVisible(), `research topic ${topic} renders at ${width}px`)
      check(await page.locator('.topic-section').count() === 4, `research topic ${topic} has motivation, methods, observables and papers`)
      check(await page.locator('.topic-publications a[href^="https://arxiv.org/abs/"]').count() === 2, `research topic ${topic} links its two selected papers`)
      check(await page.locator('meta[name="robots"]').getAttribute('content') === 'index,follow', `research topic ${topic} is indexable`)
      check(await page.locator('link[rel="canonical"]').getAttribute('href') === `https://buaa-hep-hub.pages.dev/research/${topic}`, `research topic ${topic} has a route-specific canonical URL`)
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `research topic ${topic} fits ${width}px without horizontal overflow`)
      if (topic === 'dark') await page.screenshot({ path: resolve(output, `research-topic-dark-${width}.png`), fullPage: true })
    }
    await page.goto(`${base}/research/not-a-real-topic`, { waitUntil: 'networkidle' })
    check(await page.getByRole('heading', { name: '没有找到这个研究专题。' }).isVisible(), `unknown research topic has a recovery state at ${width}px`)
    await page.goto(`${base}/people`, { waitUntil: 'networkidle' })
    check(await page.getByRole('button', { name: '切换官网风格' }).isVisible(), `public skin icon is visible on team directory at ${width}px`)
    check(await page.getByRole('heading', { name: '团队与学术指导' }).isVisible(), `public people directory renders at ${width}px`)
    check(await page.locator('.person-card').count() === 2, 'only the two approved public academic profiles render')
    check(await page.locator('.person-card a[href^="https://"]').count() === 2, 'public people cards link to official profiles')
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `public people directory fits ${width}px`)
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(output, `people-${width}.png`), fullPage: true })
    await page.goto(`${base}/events`, { waitUntil: 'networkidle' })
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
  for (const route of [
    { path: '/research/dark', heading: '暗物质与暗扇区' },
    { path: '/people', heading: '团队与学术指导' },
    { path: '/events', heading: '学术活动' },
  ]) {
    await staticPage.goto(base + route.path)
    check(await staticPage.getByRole('heading', { name: route.heading, exact: true }).isVisible(), `public route ${route.path} renders without JavaScript`)
    check(await staticPage.locator('link[rel="canonical"]').getAttribute('href') === `https://buaa-hep-hub.pages.dev${route.path}`, `public route ${route.path} has static canonical metadata`)
  }
  await nojs.close()

  const privateContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const privatePage = await privateContext.newPage()
  const privateErrors = []; privatePage.on('pageerror', e => privateErrors.push(e.message))
  for (const route of ['/hub', '/seminars', '/resources', '/library', '/account']) {
    await privatePage.goto(base + route + '?demo=1', { waitUntil: 'networkidle' })
    await privatePage.locator('.app-shell.has-sidebar').waitFor()
    check(await privatePage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', `internal route ${route} is noindex`)
    check(await privatePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} fits 390px`)
  }
  await privatePage.setViewportSize({ width: 1440, height: 900 })
  for (const route of ['/hub', '/library', '/seminars']) {
    await privatePage.goto(base + route + '?demo=1', { waitUntil: 'networkidle' })
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

  // Appearance compatibility audit: exercise every actionable theme card in Chromium.
  const styleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
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
    await schemeCards.nth(i).click()
    await expect(stylePage.locator('html')).toHaveAttribute('data-color-scheme', schemeIds[i])
    check(await schemeCards.nth(i).getAttribute('aria-pressed') === 'true', `color scheme card ${schemeIds[i]} updates its active state`)
    check(await stylePage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().length > 0), `color scheme ${schemeIds[i]} supplies an accent color`)
    if (schemeIds[i] === 'worldline-console') await stylePage.waitForTimeout(950)
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
  const dimSlider = stylePage.getByRole('slider', { name: '背景遮罩暗化程度' })
  await dimSlider.focus()
  await dimSlider.press('Home')
  for (let i = 0; i < 20; i++) await dimSlider.press('ArrowRight')
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
      shadeClass: shade?.className ?? null,
      bgType: document.documentElement.dataset.bgType
    }
  })
  console.log('Background dim interaction state: ' + JSON.stringify(dimState))
  check(Number(dimState.sliderValue) === 20 &&
    Math.abs(Number(dimState.rootInline) - 0.2) < 0.02 &&
    Math.abs(Number(dimState.shadeOpacity) - 0.2) < 0.02,
    'background dim slider changes the visible overlay opacity')
  await stylePage.locator('.bg-dim-reset-btn').click()
  await stylePage.waitForFunction(() => {
    const shade = document.querySelector('.atmosphere-shade')
    return shade && Math.abs(Number(getComputedStyle(shade).opacity) - 1) < 0.02
  }, null, { timeout: 3000 }).catch(() => {})
  const dimResetState = await stylePage.evaluate(() => {
    const shade = document.querySelector('.atmosphere-shade')
    return {
      rootInline: document.documentElement.style.getPropertyValue('--bg-dim'),
      rootComputed: getComputedStyle(document.documentElement).getPropertyValue('--bg-dim'),
      shadeOpacity: shade ? getComputedStyle(shade).opacity : null,
      sliderValue: document.querySelector('#bg-dim-slider')?.value ?? null
    }
  })
  console.log('Background dim reset state: ' + JSON.stringify(dimResetState))
  check(Number(dimResetState.rootInline) === 1 &&
    Math.abs(Number(dimResetState.shadeOpacity) - 1) < 0.02 &&
    Number(dimResetState.sliderValue) === 100,
    'background dim reset restores the configured default')

  await bgCards.nth(3).click()
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
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'custom-local', 'local background upload selects the custom-local mode')
  await stylePage.locator('.forecast-atmosphere img.custom-bg-media').waitFor({ state: 'visible', timeout: 10000 })
  stylePage.once('dialog', dialog => dialog.accept())
  await stylePage.locator('.local-bg-actions').getByRole('button', { name: '清除', exact: true }).click()
  check(await stylePage.locator('html').getAttribute('data-bg-type') === 'clouds-static', 'clearing the local background restores the static background')
  check(await stylePage.locator('#section-bg .theme-card').nth(4).textContent().then(t => t.includes('未选择本地文件')), 'clearing local background updates the card state')
  await bgCards.nth(0).click()

  // Test the font mode tabs and every local font slot with a real system font fixture.
  const fontCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
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

  // The homepage layout switch must route into a functioning editor and back out cleanly.
  await stylePage.locator('#section-home-layout input[type="checkbox"]').check()
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

  const loggedOut = await browser.newContext()
  const loginPage = await loggedOut.newPage()
  await loginPage.route('**/api/system/status', route => route.fulfill({ json: { initialized: true } }))
  for (const width of [390, 1440]) {
    await loginPage.setViewportSize({ width, height: 900 })
    await loginPage.goto(base + '/login', { waitUntil: 'networkidle' })
    await loginPage.getByRole('heading', { name: '欢迎登录' }).waitFor()
    const loginForm = loginPage.locator('form').filter({ hasText: '登录邮箱' })
    check(await loginForm.locator('input[type="email"]').isVisible(), `login email field renders at ${width}px`)
    check(await loginForm.locator('input[type="password"]').isVisible(), `login password field renders at ${width}px`)
    check(await loginPage.locator('meta[name="robots"]').getAttribute('content') === 'noindex,nofollow', `login page is noindex at ${width}px`)
    check(await loginPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `login page fits ${width}px`)
    await loginPage.screenshot({ path: resolve(output, `login-${width}.png`), fullPage: true })
  }
  await loginPage.goto(base + '/hub')
  await loginPage.waitForURL('**/login?redirect=**')
  check(loginPage.url().includes('/login'), 'anonymous workbench access redirects to login')
  await loginPage.goto(base + '/learning/eft')
  await loginPage.waitForURL('**/login?redirect=**')
  check(loginPage.url().includes('/login?redirect=/learning/eft'), 'anonymous learning navigation redirects to login with its target preserved')
  await loggedOut.close()
  await writeFile(resolve(output, 'browser-checks.json'), JSON.stringify({ checks, total: checks.length }, null, 2))
  console.log(`Browser verification: ${checks.length} checks passed.`)
} finally { await browser.close(); server.close() }
