import { costs } from './core.mjs'

// A remote run on Workers Free must never mix costs: isolate each cost so
// CPU-limit outcomes can be retained and interpreted without masking other groups.
export function selectCosts(value, runtime) {
  if (value === undefined) {
    if (runtime === 'cloudflare') {
      throw new Error('Cloudflare runtime requires an explicit --cost 6|7|8; run each cost separately')
    }
    return [...costs]
  }
  if (!/^(6|7|8)$/.test(value)) {
    throw new Error('--cost must be exactly one of 6, 7, or 8; run each cost separately')
  }
  return [Number(value)]
}

export function classifyFailure(error) {
  const message = error instanceof Error ? error.message : String(error)
  if (/\b1102\b|exceededCpu|exceeded CPU time limit|worker exceeded resource limits|exceeded cpu time limits/i.test(message)) return 'cpu-limit'
  if (/timeout|timed out|AbortError|TimeoutError/i.test(message)) return 'timeout'
  if (/fetch failed|ECONN|ENOTFOUND|network|socket hang up/i.test(message)) return 'network-error'
  if (/\bHTTP 5\d\d\b/.test(message)) return 'http-server-error'
  if (/\bHTTP 4\d\d\b/.test(message)) return 'http-client-error'
  return 'benchmark-error'
}
