import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
const label = process.argv[2] || 'after'
const root = fileURLToPath(new URL('../dist', import.meta.url))
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = resolve(root, '.' + path)
    if (!file.startsWith(root)) { res.writeHead(403).end(); return }
    try { if (!(await stat(file)).isFile()) file = resolve(root, 'index.html') } catch { file = resolve(root, 'index.html') }
    const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' }
    const data = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data)
  } catch { res.writeHead(500).end() }
})
await new Promise(r => server.listen(4199, '127.0.0.1', r))
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const route of ['/', '/hub?demo=1']) for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 100000 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.addInitScript(() => {
      window.__lcp = 0; window.__interaction = []
      new PerformanceObserver(l => { window.__lcp = l.getEntries().at(-1).startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId) window.__interaction.push(e.duration) }).observe({ type: 'event', durationThreshold: 16, buffered: true })
    })
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await page.goto('http://127.0.0.1:4199' + route, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(1000)
    const initial = await page.evaluate(() => performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, type: r.initiatorType })))
    let jsBytes = 0, gzipBytes = 0
    for (const name of new Set(initial.filter(r => r.name.endsWith('.js')).map(r => r.name))) { const data = await readFile(resolve(root, '.' + name)); jsBytes += data.length; gzipBytes += gzipSync(data).length }
    if (route === '/') await page.getByRole('tab').nth(1).click()
    else await page.locator('main button').first().click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(300)
    const timing = await page.evaluate(() => ({ lcp: window.__lcp, labInteractionMax: Math.max(0, ...window.__interaction), domContentLoaded: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd }))
    results.push({ route, run, requests: initial.length, jsBytes, gzipBytes, initialResources: initial, ...timing, errors })
    console.log(JSON.stringify({ label, ...results.at(-1), initialResources: undefined }))
    await context.close()
  }
  await writeFile(new URL('../../docs/audit/performance-' + label + '.json', import.meta.url), JSON.stringify({ conditions: 'Chromium, 390x844, cold context, CPU 4x slowdown, 150ms latency, 200KB/s; uncompressed static localhost; hub uses isolated fictitious demo data; EventTiming is laboratory timing, not field INP', results }, null, 2))
} finally { await browser.close(); server.close() }
