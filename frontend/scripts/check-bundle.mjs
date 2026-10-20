import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { directions, publicPeople, publicEvents, publicSeminarSeries } from '../src/content/lab.js'

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const seen = new Set()
function add(key) {
  if (seen.has(key)) return
  seen.add(key)
  for (const dependency of manifest[key]?.imports || []) add(dependency)
}
add('index.html'); add('src/views/PublicHomeView.vue')
let gzipBytes = 0
for (const key of seen) {
  const item = manifest[key]
  assert(item, `Missing manifest record: ${key}`)
  assert(!/pdf|three|vanta|ogl|\/HomeView-|SeminarView|MailboxView|AssistantView|LearningView|StudyFormula/.test(item.file), `Internal dependency on public entry: ${item.file}`)
  if (item.file.endsWith('.js')) gzipBytes += gzipSync(await readFile(`dist/${item.file}`)).length
}
assert(gzipBytes <= 250000, `Public initial JavaScript gzip ${gzipBytes} exceeds 250000 bytes`)
const html = await readFile('dist/index.html', 'utf8')
assert(html.includes('conceptual') || html.includes('CONCEPTUAL'))
assert(html.includes('高能粒子物理唯象学') && html.includes('https://arxiv.org/abs/'), 'Missing prerendered public content')
assert(!html.includes('rel="preload" as="image"'), 'Global background preload must not return')

const publicRoutes = [
  ...directions.map(topic => ({ path: `research/${topic.id}`, title: `${topic.title} | BUAA HEP Hub`, content: topic.question })),
  { path: 'people', title: '团队与学术指导 | BUAA HEP Hub', content: '不是完整人员名册' },
  { path: 'events', title: '公开学术活动 | BUAA HEP Hub', content: '内部组会排期' },
]
const publicHtml = [html]
for (const route of publicRoutes) {
  const routeHtml = await readFile(`dist/${route.path}/index.html`, 'utf8')
  assert(routeHtml.includes(`<title>${route.title}</title>`), `Missing route-specific title for /${route.path}`)
  assert(routeHtml.includes(`<link rel="canonical" href="https://buaa-hep-hub.pages.dev/${route.path}" />`), `Missing canonical URL for /${route.path}`)
  assert(routeHtml.includes('content="index,follow"'), `Public route /${route.path} must be indexable`)
  assert(routeHtml.includes(route.content), `Missing prerendered content for /${route.path}`)
  publicHtml.push(routeHtml)
}
for (const person of publicPeople) {
  assert(person.visibility === 'public', `Non-public profile entered public allowlist: ${person.id}`)
}
for (const event of publicEvents) {
  assert(event.visibility === 'public', `Non-public event entered public allowlist: ${event.id}`)
}
for (const series of publicSeminarSeries) {
  assert(series.visibility === 'public', `Non-public seminar series entered public allowlist: ${series.id}`)
}
for (const page of publicHtml) {
  for (const forbidden of ['user_mail_configs', 'encrypted_password', 'user_cached_emails', 'meeting_url', 'recipient_ids']) {
    assert(!page.includes(forbidden), `Internal field ${forbidden} leaked into prerendered public HTML`)
  }
}
const headers = await readFile('dist/_headers', 'utf8')
const privateHeaderRules = [
  '/hub', '/hub/*',
  '/library', '/library/*',
  '/learning', '/learning/*',
  '/feedback', '/account', '/favorites',
  '/admin', '/admin/*',
  '/login', '/arxiv', '/seminars', '/resources', '/mailbox', '/notices',
  '/quick-share', '/setup',
  '/assistant', '/assistant/*',
  '/style', '/style/*',
]
const headerBlocks = headers.split(/\\n(?=\\/)/)
for (const route of privateHeaderRules) {
  const block = headerBlocks.find(item => item.split('\\n')[0].trim() === route)
  assert(block && /X-Robots-Tag:\\s*noindex,\\s*nofollow/i.test(block), `Missing HTTP noindex header rule for ${route}`)
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
for (const path of ['/', ...directions.map(topic => `/research/${topic.id}`), '/people', '/events']) {
  assert(sitemap.includes(`<loc>https://buaa-hep-hub.pages.dev${path === '/' ? '/' : path}</loc>`), `Sitemap is missing public route ${path}`)
}
for (const privatePath of ['/hub', '/library', '/seminars', '/mailbox', '/account', '/login']) {
  assert(!sitemap.includes(`<loc>https://buaa-hep-hub.pages.dev${privatePath}</loc>`), `Private route ${privatePath} must not appear in sitemap`)
}

console.log(JSON.stringify({ publicInitialGzipBytes: gzipBytes, ceilingBytes: 250000, dependencies: [...seen] }, null, 2))
seen.clear()
for (const key of ['index.html', 'src/views/HomeView.vue', 'src/composables/useSiteConfig.js', 'src/mock/demoAdapter.js',
  ...['Navbar', 'MobileHeader', 'MobileNavBar', 'FeedbackHost', 'NoticeScanBanner', 'ForecastAtmosphere', 'MidAutumnMooncakes', 'NationalDayCelebration', 'DemoModeBanner', 'WorkspaceSession'].map(name => `src/components/${name}.vue`)]) add(key)
let workbenchGzipBytes = 0
for (const key of seen) {
  const item = manifest[key]
  assert(item, `Missing workbench manifest record: ${key}`)
  if (item.file.endsWith('.js')) workbenchGzipBytes += gzipSync(await readFile(`dist/${item.file}`)).length
}
assert(workbenchGzipBytes <= 250000, `Workbench initial JavaScript gzip ${workbenchGzipBytes} exceeds 250000 bytes`)
console.log(JSON.stringify({ workbenchInitialGzipBytes: workbenchGzipBytes, ceilingBytes: 250000, conditions: 'existing account, default static clouds, no dialogs open; includes demo adapter for reproducible isolated measurements' }))
