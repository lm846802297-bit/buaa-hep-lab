import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

// Render only explicit public-content allowlists. This script must never access API, D1 or member-only records.
const outputDir = process.argv[2] || 'dist'
const publicOrigin = 'https://buaa-hep-hub.pages.dev'
const isDemo = process.env.VITE_DEMO_MODE === 'true'
const base = process.env.GITHUB_PAGES === 'true'
  ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'lab-orbit'}/`
  : '/'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function routeUrl(path) {
  return `${publicOrigin}${path === '/' ? '/' : path}`
}

function routeCss(manifest, key) {
  return (manifest[key]?.css || []).map(file => `<link rel="stylesheet" href="${base}${file}">`).join('\n')
}

function routeJsonLd(kind, url, title, description, data = {}) {
  const item = {
    '@context': 'https://schema.org',
    '@type': kind,
    name: title,
    url,
    description,
    ...data,
  }
  return `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`
}

function withMetadata(template, { title, description, url, css, jsonld = '' }) {
  let html = template
    .replace('<div id="app"></div>', '<div id="app">__PUBLIC_SSR_CONTENT__</div>')
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${isDemo ? 'noindex,nofollow' : 'index,follow'}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace('</head>', `${css}\n${jsonld}\n</head>`)
  return html
}

async function renderPublicRoute(template, manifest, Component, props, meta, cssKey) {
  const app = createSSRApp(Component, props || {})
  app.component('router-link', {
    props: ['to'],
    setup: (linkProps, { slots }) => () => h('a', { href: `${base.replace(/\/$/, '')}${linkProps.to}` }, slots.default?.()),
  })
  const content = await renderToString(app)
  let html = withMetadata(template, {
    ...meta,
    css: routeCss(manifest, cssKey),
    jsonld: meta.jsonld || '',
  })
  html = html.replace('__PUBLIC_SSR_CONTENT__', content)
  const outputPath = meta.path === '/'
    ? join(outputDir, 'index.html')
    : join(outputDir, meta.path.replace(/^\//, ''), 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html)
  return outputPath
}

try {
  const { default: PublicHome } = await server.ssrLoadModule('/src/views/PublicHomeView.vue')
  const { default: ResearchTopic } = await server.ssrLoadModule('/src/views/ResearchTopicView.vue')
  const { default: PeopleView } = await server.ssrLoadModule('/src/views/PeopleView.vue')
  const { default: EventsView } = await server.ssrLoadModule('/src/views/EventsView.vue')
  const { lab, publications, directions, publicPeople, publicEvents } = await server.ssrLoadModule('/src/content/lab.js')
  const template = await readFile(`${outputDir}/index.html`, 'utf8')
  const manifest = JSON.parse(await readFile(`${outputDir}/.vite/manifest.json`, 'utf8'))

  const homeTitle = `${lab.name}${lab.provisional ? '（暂定）' : ''} | ${lab.field}`
  const homeDescription = '北京航空航天大学粒子物理研究组：研究方向、经确认的代表论文与公开科研资源。课题组名称暂定。'
  const homeJsonLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'ResearchOrganization', '@id': `${publicOrigin}/#group`, name: `${lab.name}${lab.provisional ? '（暂定名称）' : ''}`, url: `${publicOrigin}/`, description: lab.intro, parentOrganization: { '@type': 'CollegeOrUniversity', name: lab.institution } },
    { '@type': 'CollectionPage', url: `${publicOrigin}/`, name: '研究方向与代表论文', mainEntity: { '@type': 'ItemList', itemListElement: publications.map((paper, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'ScholarlyArticle', name: paper.title, url: paper.source_url, identifier: `arXiv:${paper.id}`, author: paper.authors.map(name => ({ '@type': 'Person', name })), ...(paper.doi ? { sameAs: `https://doi.org/${paper.doi}` } : {}) } })) } },
  ] }).replace(/</g, '\\u003c')}</script>`
  await renderPublicRoute(template, manifest, PublicHome, {}, {
    path: '/',
    title: homeTitle,
    description: homeDescription,
    url: routeUrl('/'),
    jsonld: homeJsonLd,
  }, 'src/views/PublicHomeView.vue')

  for (const topic of directions) {
    const path = `/research/${topic.id}`
    const title = `${topic.title} | BUAA HEP Hub`
    const description = `${topic.question} ${topic.detail}`
    const jsonld = routeJsonLd('Article', routeUrl(path), title, description, {
      about: topic.tags.map(name => ({ '@type': 'Thing', name })),
      citation: topic.references.map(id => publications.find(paper => paper.id === id)?.source_url).filter(Boolean),
    })
    await renderPublicRoute(template, manifest, ResearchTopic, { topic: topic.id }, {
      path, title, description, url: routeUrl(path), jsonld,
    }, 'src/views/ResearchTopicView.vue')
  }

  const peoplePath = '/people'
  await renderPublicRoute(template, manifest, PeopleView, {}, {
    path: peoplePath,
    title: '团队与学术指导 | BUAA HEP Hub',
    description: '仅展示已确认可公开的学术人员资料与官方个人主页；本页面不是完整人员名册。',
    url: routeUrl(peoplePath),
    jsonld: routeJsonLd('CollectionPage', routeUrl(peoplePath), '团队与学术指导 | BUAA HEP Hub', '已确认公开的学术人员资料。', {
      mainEntity: publicPeople.filter(person => person.visibility === 'public').map(person => ({ '@type': 'Person', name: person.name, url: person.source_url, affiliation: person.institution })),
    }),
  }, 'src/views/PeopleView.vue')

  const eventsPath = '/events'
  await renderPublicRoute(template, manifest, EventsView, {}, {
    path: eventsPath,
    title: '公开学术活动 | BUAA HEP Hub',
    description: '经过确认的公开报告、研讨会与会议。内部组会排期与会议链接不会自动公开。',
    url: routeUrl(eventsPath),
    jsonld: routeJsonLd('CollectionPage', routeUrl(eventsPath), '公开学术活动 | BUAA HEP Hub', '经过确认的公开报告、研讨会与会议。', {
      mainEntity: publicEvents.filter(event => event.visibility === 'public').map(event => ({ '@type': 'Event', name: event.title, startDate: event.start_at, endDate: event.end_at, url: event.source_url })),
    }),
  }, 'src/views/EventsView.vue')

  console.log(`Prerendered homepage, ${directions.length} research topics, public people directory and public events page without API or database access.`)
} finally {
  await server.close()
}
