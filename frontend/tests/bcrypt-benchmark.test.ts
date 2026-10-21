import { describe, it, expect, vi } from 'vitest'
import worker from '../benchmarks/bcrypt/worker.mjs'

const TEST_TOKEN = 'test-benchmark-token-for-unit-tests-only-1234567890'
const call = (path, { token = TEST_TOKEN, envToken = TEST_TOKEN, method = 'GET' } = {}) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const request = new Request(`https://local.invalid${path}`, { method, headers })
  const env = envToken === null ? undefined : { BENCHMARK_TOKEN: envToken }
  return worker.fetch(request, env)
}

describe('isolated public bcrypt benchmark', () => {
  it('exercises control, hashing, and matching/mismatching compares at the byte boundary', async () => {
    for (const operation of ['control', 'hash', 'compare-match', 'compare-mismatch']) {
      const response = await call(`/benchmark?sample=test&cost=6&bytes=72&operation=${operation}`)
      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result).toEqual({ benchmark: 'bcrypt-v1', sampleId: 'test', cost: 6, bytes: 72, operation, ok: true })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    }
  })
  it('logs a non-secret correlation marker before bcrypt work', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const response = await call('/benchmark?sample=trace_123&cost=6&bytes=12&operation=hash')
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
    for (const query of ['cost=31&bytes=72&operation=hash', 'cost=8&bytes=10000&operation=hash', 'cost=6&bytes=12&operation=other']) {
      const response = await call(`/benchmark?sample=test&${query}`)
      expect(response.status).toBe(400)
    }
  })
  it('requires a bounded sample identifier', async () => {
    expect((await call('/benchmark?cost=6&bytes=12&operation=hash')).status).toBe(400)
  })
  it('fails closed when the benchmark secret is missing or incorrect', async () => {
    const path = '/benchmark?sample=test&cost=6&bytes=12&operation=hash'
    expect((await call(path, { token: null })).status).toBe(404)
    expect((await call(path, { envToken: null })).status).toBe(404)
    expect((await call(path, { envToken: 'short' })).status).toBe(404)
    expect((await call(path, { token: 'incorrect-token' })).status).toBe(404)
  })
  it('has no application API route or write endpoint', async () => {
    expect((await call('/api/auth/login')).status).toBe(404)
    expect((await call('/benchmark', { method: 'POST' })).status).toBe(404)
  })
})
