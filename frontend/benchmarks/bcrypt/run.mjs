import { parseArgs } from 'node:util'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cases, costs, operations } from './core.mjs'
import worker from './worker.mjs'

const { values } = parseArgs({ options: {
  runtime: { type: 'string', default: 'node' }, samples: { type: 'string' },
  warmup: { type: 'string' }, out: { type: 'string' }, url: { type: 'string' },
} })
// Cloudflare defaults to a small pilot to avoid accidentally issuing 1,320 remote requests.
const samples = Number(values.samples ?? (values.runtime === 'cloudflare' ? '1' : '50'))
const warmup = Number(values.warmup ?? (values.runtime === 'cloudflare' ? '1' : '5'))
if (!['node', 'workerd', 'cloudflare'].includes(values.runtime) || !Number.isInteger(samples) || samples < 1 || samples > 1000 || !Number.isInteger(warmup) || warmup < 0 || warmup > 100 || !values.out) {
  throw new Error('Use --runtime node|workerd|cloudflare --samples 1..1000 --warmup 0..100 --out file.json (defaults: node/workerd 50+5; cloudflare pilot 1+1)')
}
const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '../..')
let mf, invoke
if (values.runtime === 'cloudflare') {
  if (!values.url) throw new Error('Cloudflare runtime requires --url for your own isolated benchmark Worker')
  let endpoint
  try { endpoint = new URL(values.url) } catch { throw new Error('--url must be a valid HTTPS URL') }
  const benchmarkToken = process.env.BENCHMARK_TOKEN
  if (!benchmarkToken || benchmarkToken.length < 32) throw new Error('Set BENCHMARK_TOKEN (32+ characters) in the local environment; never pass it as a command-line argument')
  if (endpoint.protocol !== 'https:' || !/^buaa-hep-bcrypt-benchmark\.[a-z0-9-]+\.workers\.dev$/.test(endpoint.hostname) || endpoint.username || endpoint.password || endpoint.port || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) {
    throw new Error('Only the isolated buaa-hep-bcrypt-benchmark.<account-subdomain>.workers.dev origin is supported')
  }
  invoke = async params => {
    const response = await fetch(new URL(`/benchmark?${new URLSearchParams({ sample: params.sample })}`, endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cost: params.cost, bytes: params.bytes, operation: params.operation, token: benchmarkToken }), signal: AbortSignal.timeout(30000), cache: 'no-store', redirect: 'error' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    if (result.benchmark !== 'bcrypt-v1' || result.sampleId !== params.sample || result.cost !== Number(params.cost) || result.bytes !== Number(params.bytes) || result.operation !== params.operation || result.ok !== true) throw new Error('Invalid benchmark response')
  }
} else if (values.runtime === 'workerd') {
  const { build } = await import('esbuild')
  const { Miniflare, convertV4MiniflareOptions } = await import('miniflare')
  const bundle = await build({ entryPoints: [resolve(here, 'worker.mjs')], bundle: true, format: 'esm', platform: 'browser', write: false })
  mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-09-17', compatibilityFlags: ['nodejs_compat'],
    bindings: { BENCHMARK_TOKEN: 'local-workerd-benchmark-token-do-not-use-externally-2026' } }))
  invoke = async params => {
    const response = await mf.dispatchFetch(`http://benchmark.invalid/benchmark?${new URLSearchParams({ sample: params.sample })}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cost: params.cost, bytes: params.bytes, operation: params.operation, token: 'local-workerd-benchmark-token-do-not-use-externally-2026' }) })
    if (!response.ok) throw new Error(`Local runtime failure: ${response.status}`)
    const result = await response.json()
    if (result.benchmark !== 'bcrypt-v1' || result.sampleId !== params.sample || result.cost !== Number(params.cost) || result.bytes !== Number(params.bytes) || result.operation !== params.operation || result.ok !== true) throw new Error('Invalid local runtime benchmark response')
  }
} else {
  // Exercise the same Worker request/auth/validation/log/response path as workerd and Cloudflare.
  // This is still a Node process measurement, not a Cloudflare CPU measurement.
  const localToken = 'local-node-benchmark-token-do-not-use-externally-2026'
  invoke = async params => {
    const request = new Request(`http://benchmark.invalid/benchmark?${new URLSearchParams({ sample: params.sample })}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: params.cost, bytes: params.bytes, operation: params.operation, token: localToken }),
    })
    const response = await worker.fetch(request, { BENCHMARK_TOKEN: localToken })
    if (!response.ok) throw new Error(`Local Node Worker failure: ${response.status}`)
    const result = await response.json()
    if (result.benchmark !== 'bcrypt-v1' || result.sampleId !== params.sample || result.cost !== Number(params.cost) || result.bytes !== Number(params.bytes) || result.operation !== params.operation || result.ok !== true) throw new Error('Invalid benchmark response')
  }
}
const percentile = (values, p) => values.length ? [...values].sort((a, b) => a - b)[Math.ceil(p * values.length) - 1] : null
const distribution = values => ({ min: values.length ? Math.min(...values) : null, p50: percentile(values, .5), p95: percentile(values, .95), p99: percentile(values, .99), max: values.length ? Math.max(...values) : null })
const lock = JSON.parse(readFileSync(resolve(frontend, 'package-lock.json')))
const report = { schema: 1, startedAt: new Date().toISOString(), runtime: values.runtime, samplesPerCase: samples, warmupPerCase: warmup,
  environment: { os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length,
    node: process.version, bcryptjs: lock.packages['node_modules/bcryptjs'].version, wrangler: lock.packages['node_modules/wrangler'].version,
    workerd: lock.packages['node_modules/workerd']?.version, compatibilityDate: '2026-09-17', compatibilityFlags: ['nodejs_compat'],
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: frontend, encoding: 'utf8' }).trim() },
  sourceHashFormat: 'SHA-256 of UTF-8 source text normalized to LF',
  sourceSha256: Object.fromEntries(['core.mjs', 'fixtures.json', 'worker.mjs', 'run.mjs', 'wrangler.jsonc', '../../package-lock.json'].map(file => [file, createHash('sha256').update(readFileSync(resolve(here, file), 'utf8').replace(/\r\n/g, '\n')).digest('hex')])),
  timer: 'client process.hrtime.bigint; milliseconds; one operation per request; sequential; round-robin costs',
  cpuMetric: values.runtime === 'node' ? 'process.cpuUsage user+system; Node process only, not Worker CPU' : 'unavailable; wall/RTT must not be interpreted as Worker CPU',
  limitations: ['Synthetic public ASCII inputs: 12 and 72 UTF-8 bytes', 'Warmup excluded; warmup errors retained; no concurrency or cold-start claim', 'No production DB, route, account, credential or parameter changes', 'Cloudflare CPU telemetry, plan/limits, colo and full login overhead required before production approval'],
  rows: [], summaries: [] }
const runId = Date.now().toString(36)
try {
  for (const phase of ['warmup', 'measure']) {
    const rounds = phase === 'warmup' ? warmup : samples
    for (let round = 0; round < rounds; round++) {
      for (const bytes of cases) for (const operation of operations) for (let offset = 0; offset < costs.length; offset++) {
        const cost = costs[(round + offset) % costs.length]
        const sampleId = `${runId}_${phase}_${bytes}_${operation}_${cost}_${round}`
        const cpuStart = process.cpuUsage(), started = process.hrtime.bigint()
        let error = null
        try { await invoke({ cost: String(cost), bytes: String(bytes), operation, sample: sampleId }) } catch (e) { error = e.message }
        const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6
        const cpu = process.cpuUsage(cpuStart)
        report.rows.push({ phase, round, sampleId, bytes, operation, cost, elapsedMs, nodeCpuMs: values.runtime === 'node' ? (cpu.user + cpu.system) / 1000 : null, error })
      }
    }
  }
  for (const bytes of cases) for (const operation of operations) for (const cost of costs) {
    const rows = report.rows.filter(r => r.phase === 'measure' && r.bytes === bytes && r.operation === operation && r.cost === cost)
    const successes = rows.filter(r => !r.error)
    report.summaries.push({ bytes, operation, cost, attempts: rows.length, failures: rows.length - successes.length,
      wallMs: distribution(successes.map(r => r.elapsedMs)), nodeCpuMs: values.runtime === 'node' ? distribution(successes.map(r => r.nodeCpuMs)) : null })
  }
} finally {
  await mf?.dispose()
  report.finishedAt = new Date().toISOString()
  mkdirSync(dirname(resolve(values.out)), { recursive: true })
  // Keep each raw sample on one line so the evidence remains reviewable in Git.
  const { rows, ...metadata } = report
  writeFileSync(values.out, JSON.stringify(metadata, null, 2).slice(0, -2) + ',\n  "rows": [\n' + rows.map(row => '    ' + JSON.stringify(row)).join(',\n') + '\n  ]\n}\n')
}
console.log(JSON.stringify(report.summaries, null, 2))
if (report.rows.some(r => r.error)) process.exitCode = 1
