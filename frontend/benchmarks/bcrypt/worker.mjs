import { operations, runOperation } from './core.mjs'

const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
const notFound = () => new Response('Not found', { status: 404, headers: noStore })

async function readBoundedJson(request, maxBytes = 1024) {
  if (!request.body) throw new Error('Missing request body')
  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new RangeError('Benchmark payload too large')
      }
      chunks.push(value)
    }
  } finally {
    try { reader.releaseLock() } catch {}
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const payload = JSON.parse(new TextDecoder().decode(bytes))
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid JSON object')
  return payload
}

function equalSecret(actual, expected) {
  if (typeof actual !== 'string' || actual.length !== expected.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  return mismatch === 0
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/benchmark') return notFound()

    // Fail closed before parsing a public request if the secret is not configured.
    const token = env?.BENCHMARK_TOKEN
    if (typeof token !== 'string' || token.length < 32) return notFound()

    const mediaType = (request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase()
    if (mediaType !== 'application/json') return new Response('Unsupported media type', { status: 415, headers: noStore })

    let payload
    try {
      payload = await readBoundedJson(request)
    } catch (error) {
      if (error instanceof RangeError) return new Response('Payload too large', { status: 413, headers: noStore })
      return new Response('Invalid JSON payload', { status: 400, headers: noStore })
    }
    if (!equalSecret(payload.token, token)) return notFound()

    const sampleId = typeof payload.sample === 'string' ? payload.sample : ''
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sampleId)) return new Response('Invalid sample identifier', { status: 400, headers: noStore })
    const input = { cost: Number(payload.cost), bytes: Number(payload.bytes), operation: payload.operation }
    try {
      // Emit only allowlisted, non-secret metadata before bcrypt so CPU-limit terminations can be traced.
      // Never log the token or raw request body.
      console.log({
        benchmark: 'bcrypt-v1',
        sampleId,
        cost: Number.isFinite(input.cost) ? input.cost : null,
        bytes: Number.isFinite(input.bytes) ? input.bytes : null,
        operation: operations.includes(input.operation) ? input.operation : 'invalid',
        event: 'start',
      })
      const result = await runOperation(input)
      return Response.json({ benchmark: 'bcrypt-v1', sampleId, ...result }, { headers: noStore })
    } catch {
      return new Response('Invalid case or failed operation', { status: 400, headers: noStore })
    }
  },
}
