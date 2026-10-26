import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../dist', import.meta.url))
let trackingRequests = 0
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://local.invalid').pathname
  if (pathname === '/email-tracker') { trackingRequests++; res.writeHead(204).end(); return }
  if (pathname === '/email-target') {
    res.writeHead(200, { 'content-type': 'text/html' }).end('<title>Opened target</title><script>window.destinationWorks=true</script>')
    return
  }
  let file = resolve(root, '.' + pathname)
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return }
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = resolve(file, 'index.html')
    else if (!info.isFile()) file = resolve(root, 'index.html')
  } catch { file = resolve(root, 'index.html') }
  try {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.json': 'application/json' }
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(await readFile(file))
  } catch { res.writeHead(500).end() }
})
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  await context.addInitScript(({ baseUrl }) => {
    if (location.protocol !== 'http:') return
    localStorage.setItem('labhub_force_demo', '1')
    localStorage.setItem('labhub_token', 'demo_jwt_token_laborbit_experience')
    localStorage.setItem('labhub_user', JSON.stringify({ id: 1, name: 'Demo', email: 'demo@example.invalid', role: 'admin', identity: 'teacher', tutorial_completed: true, is_tutorial_completed: true }))
    localStorage.setItem('laborbit_demo_version_v5', 'buaa-hep-1')
    const html = `<meta http-equiv="refresh" content="0;url=${baseUrl}/email-tracker"><base href="${baseUrl}"><p>Security fixture</p><img src="${baseUrl}/email-tracker"><script>parent.__emailScriptExecuted=true</script><a id="allowed" href="${baseUrl}/email-target" target="_blank" rel="opener" ping="${baseUrl}/email-tracker">Open research link</a><a id="unsafe" href="javascript:alert(1)">Unsafe link</a><a id="relative" href="/email-target">Relative link</a><a id="credentials" href="http://user:password@127.0.0.1/email-target">Credentials link</a><svg><a id="svg-link" href="${baseUrl}/email-target"><text>SVG link</text></a></svg>`
    const emails = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, subject: i === 0 ? 'Security email fixture' : `Fixture ${i}`, sender_name: 'Demo sender', sender_email: 'demo@example.invalid', snippet: 'Synthetic email for browser checks', body_text: 'Synthetic email', body_html: i === 0 ? html : '<p>Fixture</p>', received_at: '2026-01-01T00:00:00Z', is_read: false, has_attachments: false }))
    localStorage.setItem('laborbit_demo_emails', JSON.stringify(emails))
  }, { baseUrl: base })
  const page = await context.newPage()
  await page.goto(`${base}/mailbox?demo=1`, { waitUntil: 'networkidle' })
  await page.getByText('Security email fixture', { exact: true }).first().click()
  const frame = page.frameLocator('iframe[title="邮件正文（隔离显示）"]')
  await frame.locator('#allowed').waitFor()
  await page.waitForTimeout(250)
  assert.equal(await page.evaluate(() => window.__emailScriptExecuted === true), false, 'email scripts must not run')
  assert.equal(trackingRequests, 0, 'remote email images must not load')
  assert.equal(await frame.locator('#allowed').getAttribute('target'), '_blank')
  assert.equal(await frame.locator('#allowed').getAttribute('rel'), 'noopener noreferrer')
  assert.equal(await frame.locator('#allowed').getAttribute('ping'), null)
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 4000 }),
    frame.locator('#allowed').click(),
  ])
  await popup.waitForLoadState('domcontentloaded')
  assert.equal(new URL(popup.url()).pathname, '/email-target')
  assert.equal(await popup.evaluate(() => window.opener), null, 'opened links must have no opener')
  assert.equal(await popup.evaluate(() => window.destinationWorks), true, 'destination scripts must work')
  assert.equal(await frame.locator('#unsafe').getAttribute('href'), null, 'non-HTTP links must not remain active')
  assert.equal(await frame.locator('#relative').getAttribute('href'), null, 'relative links must not resolve to the application origin')
  assert.equal(await frame.locator('#credentials').getAttribute('href'), null, 'URLs with credentials must not remain active')
  assert.equal(await frame.locator('#svg-link').getAttribute('href'), null, 'unsupported SVG links must not remain active')
  assert.equal(trackingRequests, 0, 'link tracking must not be sent')
  await context.close()
  console.log('Authenticated demo mailbox: safe link and isolation checks passed.')
} finally {
  await browser.close()
  await new Promise(resolveClose => server.close(resolveClose))
}
