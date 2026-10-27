// Render-cost diagnostics for the built site.
//
// Usage (from frontend/, after `npm run build`):
//   node tests/diagnose-render-cost.mjs layers     [route] [--viewport 1440x900] [--seconds 6]
//   node tests/diagnose-render-cost.mjs profile    [route] [--seconds 5]
//   node tests/diagnose-render-cost.mjs visibility [route] [--selector canvas]
//
//   route defaults to "/".
//
// measure-idle-cpu.mjs is the pass/fail guard for the known regression (per-particle
// shadowBlur pinning a CPU core at idle). This tool is for finding the next one, and it
// answers two questions in order: which layer costs CPU, and is that layer even visible.
//
//   layers      disables one candidate layer at a time and re-measures idle CPU/fps, so
//               the responsible layer stands out by the biggest drop.
//   profile     CPU-profiles the idle page and attributes self time to functions; use it
//               when layers localizes the cost but you need the exact call site.
//   visibility  diffs screenshots with a layer shown vs removed at several scroll
//               positions. A layer that changes no pixels is decorative cost only.
//
// Example that found the 2026-10-27 regression:
//   layers -> hide-canvas drops 103% to 0.3%, so the cost is canvas rasterisation
//   profile -> all self time inside (program), no business JS, i.e. native drawing
//   visibility -> removing the canvas changed 0 pixels at the top of the page
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))

const TYPES = {
  '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json'
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = { command, route: null, viewport: '1440x900', seconds: 6, selector: 'canvas', json: null }
  const unknown = []
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]
    if (arg === '--viewport') options.viewport = rest[++i]
    else if (arg === '--seconds') options.seconds = Number(rest[++i])
    else if (arg === '--selector') options.selector = rest[++i]
    else if (arg === '--json') options.json = rest[++i]
    else if (arg.startsWith('--')) unknown.push(arg)
    else if (options.route === null) options.route = arg
    else unknown.push(arg)
  }

  // Fail loudly instead of building a nonsense URL. This caught a real footgun: `npm run
  // diagnose:render layers / --seconds 3` makes npm swallow `--seconds`, so the script
  // received "3" as a positional argument and tried to navigate to "http://host3".
  if (options.route !== null && !options.route.startsWith('/')) {
    console.error(`Unrecognised argument "${options.route}" where a route was expected.\n` +
      'Routes must start with "/", for example `/` or `/people`.\n' +
      'When running through npm, pass script arguments after "--":\n' +
      '  npm run diagnose:render -- layers / --seconds 3')
    process.exit(2)
  }
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}\n` +
      'When running through npm, pass script arguments after "--":\n' +
      '  npm run diagnose:render -- layers / --seconds 3')
    process.exit(2)
  }
  if (!Number.isFinite(options.seconds) || options.seconds < 1) {
    console.error('--seconds must be a number of at least 1.')
    process.exit(2)
  }

  options.route = options.route || '/'
  const [width, height] = String(options.viewport).split('x').map(Number)
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    console.error('--viewport must look like 1440x900.')
    process.exit(2)
  }
  options.size = { width, height }
  return options
}

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      let file = resolve(root, '.' + path)
      if (!file.startsWith(root)) { res.writeHead(403).end(); return }
      try { if (!(await stat(file)).isFile()) file = resolve(root, 'index.html') } catch { file = resolve(root, 'index.html') }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(await readFile(file))
    } catch { res.writeHead(500).end() }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return { server, base: `http://127.0.0.1:${server.address().port}` }
}

async function readMetrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics')
  return Object.fromEntries(metrics.map(metric => [metric.name, metric.value]))
}

// Idle cost: no scrolling, no interaction, just the page sitting there.
async function measureIdle(page, cdp, seconds) {
  const before = await readMetrics(cdp)
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
  }), seconds * 1000)
  const elapsed = (Date.now() - startedAt) / 1000
  const after = await readMetrics(cdp)
  const frames = await page.evaluate(() => window.__frames)
  return {
    cpuPercentOfOneCore: +(100 * (after.TaskDuration - before.TaskDuration) / elapsed).toFixed(1),
    scriptPercentOfOneCore: +(100 * (after.ScriptDuration - before.ScriptDuration) / elapsed).toFixed(2),
    fps: +(frames / elapsed).toFixed(1)
  }
}

// Pixel diff done inside the browser so this tool needs no image library.
async function diffScreenshots(page, bufferA, bufferB) {
  return page.evaluate(async ([a, b]) => {
    const load = src => new Promise((done, fail) => {
      const image = new Image()
      image.onload = () => done(image)
      image.onerror = fail
      image.src = 'data:image/png;base64,' + src
    })
    const [imageA, imageB] = await Promise.all([load(a), load(b)])
    const width = Math.min(imageA.width, imageB.width)
    const height = Math.min(imageA.height, imageB.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(imageA, 0, 0)
    const dataA = ctx.getImageData(0, 0, width, height).data
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(imageB, 0, 0)
    const dataB = ctx.getImageData(0, 0, width, height).data
    let sum = 0
    let max = 0
    let changed = 0
    for (let i = 0; i < dataA.length; i += 4) {
      const delta = Math.max(
        Math.abs(dataA[i] - dataB[i]),
        Math.abs(dataA[i + 1] - dataB[i + 1]),
        Math.abs(dataA[i + 2] - dataB[i + 2])
      )
      sum += delta
      if (delta > max) max = delta
      if (delta > 2) changed += 1
    }
    const pixels = dataA.length / 4
    return {
      meanAbs: +(sum / pixels).toFixed(3),
      maxDelta: max,
      changedPixels: changed,
      changedPercent: +(100 * changed / pixels).toFixed(3)
    }
  }, [bufferA.toString('base64'), bufferB.toString('base64')])
}

async function openPage(browser, base, options) {
  const context = await browser.newContext({ viewport: options.size, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  await page.goto(base + options.route, { waitUntil: 'load', timeout: 120000 })
  await page.waitForTimeout(2500)
  return { context, page, cdp, errors }
}

// Candidate layers. Each entry isolates one mechanism that commonly costs idle CPU.
const LAYER_EXPERIMENTS = [
  ['baseline', () => {}],
  ['hide-canvas', () => { for (const el of document.querySelectorAll('canvas')) el.style.display = 'none' }],
  ['hide-svg-backdrop', () => { for (const el of document.querySelectorAll('svg[aria-hidden="true"]')) el.style.display = 'none' }],
  ['no-css-animations', () => {
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'
    document.head.appendChild(style)
  }],
  ['no-backdrop-filter', () => {
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
    document.head.appendChild(style)
  }],
  ['no-filter', () => {
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{filter:none!important}'
    document.head.appendChild(style)
  }],
  ['no-blend-mode', () => {
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{mix-blend-mode:normal!important;isolation:auto!important}'
    document.head.appendChild(style)
  }],
  ['no-shadow', () => {
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{box-shadow:none!important;text-shadow:none!important}'
    document.head.appendChild(style)
  }]
]

async function runLayers(browser, base, options) {
  const results = []
  for (const [name, disable] of LAYER_EXPERIMENTS) {
    const { context, page, cdp, errors } = await openPage(browser, base, options)
    await page.evaluate(disable)
    await page.waitForTimeout(700)
    const idle = await measureIdle(page, cdp, options.seconds)
    results.push({ layer: name, ...idle, errors })
    console.log(`${name.padEnd(20)} cpu ${String(idle.cpuPercentOfOneCore).padStart(6)}%  script ${String(idle.scriptPercentOfOneCore).padStart(5)}%  fps ${idle.fps}`)
    await context.close()
  }

  const baseline = results.find(result => result.layer === 'baseline')
  const ranked = results
    .filter(result => result.layer !== 'baseline')
    .map(result => ({ ...result, savings: +(baseline.cpuPercentOfOneCore - result.cpuPercentOfOneCore).toFixed(1) }))
    .sort((a, b) => b.savings - a.savings)

  if (baseline.cpuPercentOfOneCore < 10) {
    console.log(`\nBaseline idle CPU is already ${baseline.cpuPercentOfOneCore}% of one core; nothing dominates.`)
  } else if (ranked[0]) {
    console.log(`\nBiggest single-layer saving: ${ranked[0].layer} (${ranked[0].savings} points). ${ranked[0].layer === 'hide-canvas' ? 'Look for expensive per-frame canvas drawing (shadowBlur, large blurs, filters per element).' : ''}`)
  }
  return { baseline, ranked, results }
}

async function runProfile(browser, base, options) {
  const { context, page, cdp, errors } = await openPage(browser, base, options)
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 100 })
  await cdp.send('Profiler.start')
  await page.waitForTimeout(options.seconds * 1000)
  const { profile } = await cdp.send('Profiler.stop')

  const byId = new Map(profile.nodes.map(node => [node.id, node]))
  const samples = profile.samples.length || 1
  const sampleInterval = (profile.endTime - profile.startTime) / 1000 / samples
  const selfTime = new Map()
  for (const id of profile.samples) {
    const node = byId.get(id)
    if (!node) continue
    const frame = node.callFrame
    const key = `${frame.functionName || '(anonymous)'} @ ${(frame.url || '').split('/').pop().split('?')[0] || 'native'}:${frame.lineNumber + 1}`
    selfTime.set(key, (selfTime.get(key) || 0) + sampleInterval)
  }
  const rows = [...selfTime.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, ms]) => ({ name, selfMs: +ms.toFixed(1), percentOfWall: +(100 * ms / (options.seconds * 1000)).toFixed(1) }))

  console.table(rows)

  // Idle samples are the page doing nothing, which is the healthy case; they must not be
  // counted as drawing cost. Only busy samples describe what the page spends on work.
  const idlePercent = rows
    .filter(row => row.name.startsWith('(idle)'))
    .reduce((sum, row) => sum + row.percentOfWall, 0)
  const busyPercent = +(100 - idlePercent).toFixed(1)

  if (idlePercent > 80) {
    console.log(`\n${idlePercent.toFixed(0)}% of wall time is idle (${busyPercent}% busy): the page is behaving at standby. Nothing to chase here; use measure-idle-cpu.mjs as the regression guard instead.`)
    return { rows, idlePercent, busyPercent, verdict: 'idle-page-healthy', errors }
  }

  const nativePercent = rows
    .filter(row => !row.name.startsWith('(idle)') && (row.name.includes('@ native') || row.name.startsWith('(program)')))
    .reduce((sum, row) => sum + row.percentOfWall, 0)
  const busyShare = busyPercent > 0 ? +(100 * nativePercent / busyPercent).toFixed(0) : 0
  const verdict = busyShare > 50 ? 'native-drawing' : 'script'
  if (verdict === 'native-drawing') {
    console.log(`\n${busyShare}% of busy time is native drawing, not business JS. Optimising JS logic will not help; reduce drawing work instead.`)
  } else {
    console.log(`\n${100 - busyShare}% of busy time is script execution. The cost is in JS, so look at the top frames above.`)
  }
  return { rows, idlePercent, busyPercent, nativePercent, busyShare, verdict, errors }
}

async function runVisibility(browser, base, options) {
  const positions = [0, 900, 1800, 2700]
  const { context, page, cdp, errors } = await openPage(browser, base, options)
  const exists = await page.locator(options.selector).count()
  if (!exists) {
    console.log(`Selector "${options.selector}" matches nothing on ${options.route}.`)
    await context.close()
    return { findings: [], errors }
  }

  const findings = []
  for (const y of positions) {
    await page.evaluate(value => window.scrollTo(0, value), y)
    await page.waitForTimeout(1200)
    const withLayer = await page.screenshot({ type: 'png' })
    const hidden = await page.evaluate(selector => {
      const elements = [...document.querySelectorAll(selector)]
      const previous = elements.map(element => element.getAttribute('style'))
      for (const element of elements) element.style.visibility = 'hidden'
      return previous
    }, options.selector)
    await page.waitForTimeout(400)
    const withoutLayer = await page.screenshot({ type: 'png' })
    await page.evaluate(([selector, previous]) => {
      const elements = [...document.querySelectorAll(selector)]
      elements.forEach((element, index) => {
        if (previous[index] == null) element.removeAttribute('style')
        else element.setAttribute('style', previous[index])
      })
    }, [options.selector, hidden])

    const diff = await diffScreenshots(page, withLayer, withoutLayer)
    findings.push({ scrollY: y, ...diff })
    console.log(`scrollY ${String(y).padStart(4)}  meanAbs ${String(diff.meanAbs).padStart(6)}  max ${String(diff.maxDelta).padStart(3)}  changed ${String(diff.changedPercent).padStart(7)}%`)
  }

  const invisible = findings.filter(finding => finding.changedPercent < 0.01)
  if (invisible.length) {
    console.log(`\n${invisible.length}/${findings.length} scroll positions show no visible contribution from "${options.selector}". That layer is decorative cost at those positions; weigh it against its CPU price before removing it, since it may still matter lower on the page.`)
  }
  await context.close()
  return { findings, errors }
}

const options = parseArgs(process.argv.slice(2))
if (!['layers', 'profile', 'visibility'].includes(options.command)) {
  console.error('Usage: node tests/diagnose-render-cost.mjs <layers|profile|visibility> [route] [--viewport 1440x900] [--seconds 6] [--selector canvas]')
  process.exit(2)
}

const { server, base } = await startServer()
const browser = await chromium.launch({ headless: true })
let output
try {
  if (options.command === 'layers') output = await runLayers(browser, base, options)
  else if (options.command === 'profile') output = await runProfile(browser, base, options)
  else output = await runVisibility(browser, base, options)
} finally {
  await browser.close()
  server.close()
}

const payload = { command: options.command, route: options.route, viewport: options.viewport, seconds: options.seconds, ...output }
if (options.json) {
  await writeFile(options.json, JSON.stringify(payload, null, 2))
  console.log(`\nWrote ${options.json}`)
}
if (payload.errors?.length) {
  console.log(`\nPage errors: ${payload.errors.join('; ')}`)
}
