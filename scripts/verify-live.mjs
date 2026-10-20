import assert from 'node:assert/strict'
const base = process.argv[2] || 'https://buaa-hep-hub.pages.dev'
const request = async path => {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20000), cache: 'no-store' })
  return { response, text: await response.text() }
}
let healthy = false
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    const { response, text } = await request('/api/health')
    if (response.status === 200 && JSON.parse(text).status === 'healthy') { healthy = true; break }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 3000))
}
assert(healthy, 'Published API health check failed')
for (const path of ['/api/auth/me', '/api/resources/books', '/api/mailbox/sync-stream']) {
  const { response } = await request(path); assert.equal(response.status, 401, `Anonymous request must fail: ${path}`)
}
const home = await request('/')
assert.equal(home.response.status, 200)
assert(home.text.includes('application/ld+json') && home.text.includes('https://arxiv.org/abs/'), 'Published homepage must contain prerendered content and structured metadata')
assert((await request('/robots.txt')).text.includes('Disallow: /api/'))
assert((await request('/sitemap.xml')).text.includes('https://buaa-hep-hub.pages.dev/'))
const hub = await request('/hub'); assert(hub.response.headers.get('X-Robots-Tag')?.includes('noindex'))
console.log('Published site: health, public HTML, metadata and anonymous authorization checks passed.')
