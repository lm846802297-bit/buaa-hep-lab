import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { directions, publications } from '../content/lab'

import ResearchTopicView from './ResearchTopicView.vue'

describe('public research topic pages', () => {
  it('renders the scientific question, methods, observables and linked papers', async () => {
    const app = createSSRApp(ResearchTopicView, { topic: 'dark' })
    app.component('router-link', {
      props: ['to'],
      setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
    })
    const html = await renderToString(app)
    const topic = directions.find(item => item.id === 'dark')
    expect(html).toContain(topic.title)
    expect(html).toContain(topic.question)
    expect(html).toContain(topic.methods)
    expect(html).toContain(topic.probes)
    expect(html).toContain('不声称独立复现论文计算')
    for (const id of topic.references) {
      const paper = publications.find(item => item.id === id)
      expect(html).toContain(paper.title)
      expect(html).toContain(paper.source_url)
    }
    expect(html).toContain('返回课题组首页')
  })

  it('renders a safe not-found state for an unknown public topic', async () => {
    const app = createSSRApp(ResearchTopicView, { topic: 'not-a-real-topic' })
    app.component('router-link', {
      props: ['to'],
      setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
    })
    const html = await renderToString(app)
    expect(html).toContain('没有找到这个研究专题')
    expect(html).not.toContain('相关代表论文')
  })
})
