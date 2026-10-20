import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

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
