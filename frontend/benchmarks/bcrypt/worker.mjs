import { operations, runOperation } from './core.mjs'

const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
const notFound = () => new Response('Not found', { status: 404, headers: noStore })

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method !== 'GET' || url.pathname !== '/benchmark') return notFound()

    // Fail closed: an unconfigured or unauthorized public workers.dev endpoint must not run bcrypt.
    const token = env?.BENCHMARK_TOKEN
    if (typeof token !== 'string' || token.length < 32 || request.headers.get('Authorization') !== `Bearer ${token}`) {
      return notFound()
    }

    const sampleId = url.searchParams.get('sample') || ''
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sampleId)) return new Response('Invalid sample identifier', { status: 400, headers: noStore })
    const input = { cost: Number(url.searchParams.get('cost')), bytes: Number(url.searchParams.get('bytes')), operation: url.searchParams.get('operation') }
    try {
      // Log a safe correlation marker before bcrypt work so CPU-limit terminations can be traced.
      // Never log the Authorization token or user-controlled free-form data.
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
