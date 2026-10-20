import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { readFile, writeFile } from 'node:fs/promises'
const outputDir = process.argv[2] || 'dist'

// Only the explicit public-content allowlist is rendered; no API or DB access.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: PublicHome } = await server.ssrLoadModule('/src/views/PublicHomeView.vue')
  const { lab, publications } = await server.ssrLoadModule('/src/content/lab.js')
  const app = createSSRApp(PublicHome)
  const base = process.env.GITHUB_PAGES === 'true' ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'lab-orbit'}/` : '/'
  app.component('router-link', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: base.replace(/\/$/, '') + props.to }, slots.default?.()) })
  const content = await renderToString(app)
  const manifest = JSON.parse(await readFile(`${outputDir}/.vite/manifest.json`, 'utf8'))
  const css = (manifest['src/views/PublicHomeView.vue']?.css || []).map(file => `<link rel="stylesheet" href="${base}${file}">`).join('\n')
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'ResearchOrganization', '@id': 'https://buaa-hep-hub.pages.dev/#group', name: `${lab.name}${lab.provisional ? '（暂定名称）' : ''}`, url: 'https://buaa-hep-hub.pages.dev/', description: lab.intro, parentOrganization: { '@type': 'CollegeOrUniversity', name: lab.institution } },
    { '@type': 'CollectionPage', url: 'https://buaa-hep-hub.pages.dev/', name: '研究方向与代表论文', mainEntity: { '@type': 'ItemList', itemListElement: publications.map((paper, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'ScholarlyArticle', name: paper.title, url: paper.source_url, identifier: `arXiv:${paper.id}`, author: paper.authors.map(name => ({ '@type': 'Person', name })), ...(paper.doi ? { sameAs: `https://doi.org/${paper.doi}` } : {}) } })) } },
  ] }).replace(/</g, '\\u003c')
  let html = await readFile(`${outputDir}/index.html`, 'utf8')
  html = html.replace('<div id="app"></div>', `<div id="app">${content}</div>`).replace('</head>', `${css}\n<script type="application/ld+json">${jsonld}</script>\n</head>`)
  if (process.env.VITE_DEMO_MODE === 'true') html = html.replace('content="index,follow"', 'content="noindex,nofollow"')
  await writeFile(`${outputDir}/index.html`, html)
  console.log('Prerendered approved public homepage without credentials or API access.')
} finally { await server.close() }
