import { describe, it, expect, vi } from 'vitest'
import worker from '../benchmarks/bcrypt/worker.mjs'
import { selectCosts, classifyFailure } from '../benchmarks/bcrypt/run-options.mjs'

const TEST_TOKEN = 'test-benchmark-token-for-unit-tests-only-1234567890'
const defaultPayload = { sample: 'test', cost: 6, bytes: 12, operation: 'hash' }
const call = (path, { token = TEST_TOKEN, envToken = TEST_TOKEN, method = 'POST', payload = defaultPayload } = {}) => {
  const headers = method === 'POST' ? { 'Content-Type': 'application/json' } : {}
  let body
  let requestPath = path
  if (method === 'POST') {
    const requestPayload = { ...payload }
    const sample = requestPayload.sample
    delete requestPayload.sample
    if (typeof sample === 'string') requestPath += `${requestPath.includes('?') ? '&' : '?'}${new URLSearchParams({ sample })}`
    if (token !== null) requestPayload.token = token
    body = JSON.stringify(requestPayload)
  }
  const request = new Request(`https://local.invalid${requestPath}`, { method, headers, ...(body === undefined ? {} : { body }) })
  const env = envToken === null ? undefined : { BENCHMARK_TOKEN: envToken }
  return worker.fetch(request, env)
}

describe('isolated public bcrypt benchmark', () => {
  it('requires an explicit single cost for Cloudflare and permits local all-cost baselines', () => {
    expect(selectCosts(undefined, 'node')).toEqual([6, 7, 8])
    expect(selectCosts('6', 'cloudflare')).toEqual([6])
    expect(selectCosts('7', 'cloudflare')).toEqual([7])
    expect(selectCosts('8', 'cloudflare')).toEqual([8])
    expect(() => selectCosts(undefined, 'cloudflare')).toThrow(/explicit --cost/)
    expect(() => selectCosts('6,7,8', 'cloudflare')).toThrow(/exactly one/)
    expect(() => selectCosts('9', 'node')).toThrow(/6, 7, or 8/)
  })
  it('classifies CPU-limit and other failures without dropping the original error', () => {
    expect(classifyFailure('HTTP 500: Error 1102: Worker exceeded resource limits')).toBe('cpu-limit')
    expect(classifyFailure('HTTP 500: exceededCpu')).toBe('cpu-limit')
    expect(classifyFailure('HTTP 403: Forbidden')).toBe('http-client-error')
    expect(classifyFailure('fetch failed: ECONNRESET')).toBe('network-error')
    expect(classifyFailure('The operation timed out')).toBe('timeout')
    expect(classifyFailure('Invalid benchmark response')).toBe('benchmark-error')
  })

  it('exercises control, hashing, and matching/mismatching compares at the byte boundary', async () => {
    for (const operation of ['control', 'hash', 'compare-match', 'compare-mismatch']) {
      const response = await call('/benchmark', { payload: { sample: 'test', cost: 6, bytes: 72, operation } })
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ benchmark: 'bcrypt-v1', sampleId: 'test', cost: 6, bytes: 72, operation, ok: true })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    }
  })
  it('logs structured non-secret correlation fields before bcrypt work', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const response = await call('/benchmark', { payload: { sample: 'trace_123', cost: 6, bytes: 12, operation: 'hash' } })
      expect(response.status).toBe(200)
      expect(log).toHaveBeenCalledWith({
        benchmark: 'bcrypt-v1',
        sampleId: 'trace_123',
        cost: 6,
        bytes: 12,
        operation: 'hash',
        event: 'start',
      })
      expect(JSON.stringify(log.mock.calls)).not.toContain(TEST_TOKEN)
    } finally {
      log.mockRestore()
    }
  })
  it('rejects unbounded costs and arbitrary inputs', async () => {
    for (const payload of [
      { sample: 'test', cost: 31, bytes: 72, operation: 'hash' },
      { sample: 'test', cost: 8, bytes: 10000, operation: 'hash' },
      { sample: 'test', cost: 6, bytes: 12, operation: 'other' },
    ]) {
      const response = await call('/benchmark', { payload })
      expect(response.status).toBe(400)
    }
  })
  it('requires a bounded sample identifier', async () => {
    expect((await call('/benchmark', { payload: { cost: 6, bytes: 12, operation: 'hash' } })).status).toBe(400)
  })
  it('rejects oversized request bodies before bcrypt', async () => {
    const response = await call('/benchmark', { payload: { ...defaultPayload, padding: 'x'.repeat(1100) } })
    expect(response.status).toBe(413)
  })
  it('does not accept a token from request headers or URL query parameters', async () => {
    const headerOnly = new Request('https://local.invalid/benchmark?sample=test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({ cost: 6, bytes: 12, operation: 'hash' }),
    })
    expect((await worker.fetch(headerOnly, { BENCHMARK_TOKEN: TEST_TOKEN })).status).toBe(404)

    const urlToken = new Request(`https://local.invalid/benchmark?sample=test&token=${TEST_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: 6, bytes: 12, operation: 'hash' }),
    })
    expect((await worker.fetch(urlToken, { BENCHMARK_TOKEN: TEST_TOKEN })).status).toBe(400)
  })
  it('fails closed when the benchmark secret is missing or incorrect', async () => {
    expect((await call('/benchmark', { token: null })).status).toBe(404)
    expect((await call('/benchmark', { envToken: null })).status).toBe(404)
    expect((await call('/benchmark', { envToken: 'short' })).status).toBe(404)
    expect((await call('/benchmark', { token: 'incorrect-token' })).status).toBe(404)
  })
  it('has no application API route or non-POST benchmark endpoint', async () => {
    expect((await call('/api/auth/login')).status).toBe(404)
    expect((await call('/benchmark', { method: 'GET' })).status).toBe(404)
  })
})
