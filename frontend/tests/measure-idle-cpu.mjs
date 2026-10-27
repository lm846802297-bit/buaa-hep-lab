// Idle CPU regression guard for the public site.
//
// The Worldline ambient particle layer used to burn a full CPU core at idle on every
// public route, because it called `shadowBlur` per particle on every animation frame.
// LCP/INP measurements never showed it: load was fine, the page simply never idled.
// This probe measures the missing signal — main-thread time while the page just sits
// there — and fails when a regression brings the idle cost back.
//
// Usage: node tests/measure-idle-cpu.mjs [--json out.json]
// Budget: desktop public routes must stay under MAX_CPU_PERCENT of one core.

import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const ROUTES = ['/', '/people', '/events']
const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { label: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 }
]
const IDLE_MS = 8000
const MAX_CPU_PERCENT = 15

const jsonIndex = process.argv.indexOf('--json')
const jsonOut = jsonIndex > -1 ? process.argv[jsonIndex + 1] : null

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = resolve(root, '.' + path)
    if (!file.startsWith(root)) { res.writeHead(403).end(); return }
    try { if (!(await stat(file)).isFile()) file = resolve(root, 'index.html') } catch { file = resolve(root, 'index.html') }
    const types = {
      '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml',
      '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2',
      '.json': 'application/json', '.webp': 'image/webp'
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(await readFile(file))
  } catch { res.writeHead(500).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ headless: true })
const results = []
let failed = false
try {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext(viewport)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const cdp = await context.newCDPSession(page)
      await cdp.send('Performance.enable')
      const readMetrics = async () => Object.fromEntries(
        (await cdp.send('Performance.getMetrics')).metrics.map(metric => [metric.name, metric.value])
      )

      await page.goto(base + route, { waitUntil: 'load', timeout: 120000 })
      await page.waitForTimeout(2500)

      const before = await readMetrics()
      const startedAt = Date.now()
      await page.evaluate(ms => new Promise(done => {
        window.__frames = 0
        const start = Date.now()
        const tick = () => {
          window.__frames += 1
          if (Date.now() - start < ms) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        setTimeout(done, ms + 150)
      }), IDLE_MS)
      const elapsedSeconds = (Date.now() - startedAt) / 1000
      const after = await readMetrics()
      const frames = await page.evaluate(() => window.__frames)

      const result = {
        viewport: viewport.label,
        route,
        cpuPercentOfOneCore: +(100 * (after.TaskDuration - before.TaskDuration) / elapsedSeconds).toFixed(1),
        scriptPercentOfOneCore: +(100 * (after.ScriptDuration - before.ScriptDuration) / elapsedSeconds).toFixed(2),
        fps: +(frames / elapsedSeconds).toFixed(1),
        errors
      }
      if (result.cpuPercentOfOneCore > MAX_CPU_PERCENT) failed = true
      results.push(result)
      console.log(`${result.viewport.padEnd(8)} ${route.padEnd(22)} cpu ${String(result.cpuPercentOfOneCore).padStart(5)}%  script ${String(result.scriptPercentOfOneCore).padStart(4)}%  fps ${result.fps}`)
      await context.close()
    }
  }
} finally {
  await browser.close()
  server.close()
}

if (jsonOut) await writeFile(jsonOut, JSON.stringify({ budgetPercent: MAX_CPU_PERCENT, idleMs: IDLE_MS, results }, null, 2))

const worst = Math.max(...results.map(result => result.cpuPercentOfOneCore))
if (failed) {
  console.error(`\nFAIL: idle CPU exceeded ${MAX_CPU_PERCENT}% of one core (worst ${worst}%).`)
  process.exit(1)
}
console.log(`\nPASS: worst idle CPU ${worst}% of one core (budget ${MAX_CPU_PERCENT}%).`)
