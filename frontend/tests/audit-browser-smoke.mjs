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
const browser = await chromium.launch()
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
    check(await page.getByRole('heading', { name: '团队与学术指导' }).isVisible(), `public people directory renders at ${width}px`)
    check(await page.locator('.person-card').count() === 2, 'only the two approved public academic profiles render')
    check(await page.locator('.person-card a[href^="https://"]').count() === 2, 'public people cards link to official profiles')
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `public people directory fits ${width}px`)
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(output, `people-${width}.png`), fullPage: true })
    await page.goto(`${base}/events`, { waitUntil: 'networkidle' })
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

  const loggedOut = await browser.newContext()
  const loginPage = await loggedOut.newPage()
  await loginPage.route('**/api/system/status', route => route.fulfill({ json: { initialized: true } }))
  for (const width of [390, 1440]) {
    await loginPage.setViewportSize({ width, height: 900 })
    await loginPage.goto(base + '/login', { waitUntil: 'networkidle' })
    await loginPage.getByRole('heading', { name: '欢迎登录' }).waitFor()
    check(await loginPage.getByLabel('登录邮箱').isVisible(), `login email field renders at ${width}px`)
    check(await loginPage.getByLabel('密码').isVisible(), `login password field renders at ${width}px`)
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
