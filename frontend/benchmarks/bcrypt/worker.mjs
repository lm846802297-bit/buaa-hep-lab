import { runOperation } from './core.mjs'

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
      const result = await runOperation(input)
      // Only public sample IDs and fixed benchmark parameters are logged; never log the token.
      console.log(JSON.stringify({ benchmark: 'bcrypt-v1', sampleId, ...result }))
      return Response.json({ benchmark: 'bcrypt-v1', sampleId, ...result }, { headers: noStore })
    } catch {
      return new Response('Invalid case or failed operation', { status: 400, headers: noStore })
    }
  },
}
