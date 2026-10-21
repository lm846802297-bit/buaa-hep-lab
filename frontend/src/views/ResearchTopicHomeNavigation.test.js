import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ResearchTopicView from './ResearchTopicView.vue'

describe('research topic home navigation', () => {
  it('exposes a prominent home link at the top and in the topic index', async () => {
    const app = createSSRApp(ResearchTopicView, { topic: 'phase' })
    app.component('router-link', {
      props: ['to'],
      setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
    })

    const html = await renderToString(app)

    expect(html).toContain('class="topic-breadcrumb-home"')
    expect(html).toContain('class="topic-sidebar-home"')
    expect(html).toContain('返回课题组首页')
    expect((html.match(/href="\//g) || []).length).toBeGreaterThanOrEqual(2)
  })
})
