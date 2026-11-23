import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import PublicHome from './PublicHomeView.vue'
import People from './PeopleView.vue'
import Events from './EventsView.vue'
import ResearchTopic from './ResearchTopicView.vue'

const routes = [
  { path: '/', name: 'PublicHome', component: PublicHome, meta: { public: true } },
  { path: '/people', name: 'PublicPeople', component: People, meta: { public: true } },
  { path: '/events', name: 'PublicEvents', component: Events, meta: { public: true } },
  { path: '/research/:topic', name: 'ResearchTopic', component: ResearchTopic, props: true, meta: { public: true } },
  // The home page links here. Keep its real route out of this public-shell test.
  { path: '/hub', component: { render: () => h('div') } },
]

describe('Public routes in the live Vue application shell', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {} }, setAttribute() {} } })
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each(['/', '/people', '/events', '/research/dark'])('has one main landmark and a valid skip destination: %s', async path => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push(path)
    const html = await renderToString(createSSRApp(App).use(router))
    const mains = [...html.matchAll(/<main\b[^>]*>/g)].map(match => match[0])
    expect(mains).toHaveLength(1)
    expect(mains[0]).toContain('id="main-content"')
    expect(html).toContain('href="#main-content"')
    if (path !== '/') {
      expect(mains[0]).toContain('tabindex="-1"')
      expect(html).toMatch(/<div class="public-workspace"><main\b/)
    }
  })

  it('preserves the existing Worldline content layer for both shell wrappers', () => {
    const css = postcss.parse(readFileSync(new URL('../index.css', import.meta.url), 'utf8'))
    const originalSelector = ':root[data-color-scheme="worldline-console"] .app-shell > main'
    const publicWrapper = 'html[data-color-scheme="worldline-console"] .app-shell > .public-workspace'
    const stackingRule = css.nodes.find(node => node.type === 'rule' && node.selectors.includes(originalSelector))
    expect(stackingRule?.selectors).toContain(publicWrapper)
    expect(Object.fromEntries(stackingRule.nodes.map(node => [node.prop, node.value]))).toMatchObject({
      position: 'relative', 'z-index': '2',
    })
  })
})
