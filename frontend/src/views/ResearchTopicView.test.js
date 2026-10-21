import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { directions, publications } from '../content/lab'
import { researchTopicDetails, researchTopicResources } from '../content/researchTopicDetails'

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
    expect(html).toContain('本页导航')
    expect(html).toContain('核心物理机制与研究对象')
    expect(html).toContain('非弹性暗物质与核反冲')
    expect(html).toContain('Ωχ h² ≈ 0.12')
    expect(html).toContain('https://lz.lbl.gov/')
    expect(html).toContain('target="_blank" rel="noopener noreferrer"')
    expect(html).toContain('从理论模型到可检验结论')
    expect(html).toContain('结果应该如何判读')
    expect(html).toContain('本方向常用的专业资源')
    expect(html).toContain('LUX-ZEPLIN (LZ)')
    expect(html).toContain('PandaX')
    expect(html).toContain('不声称独立复现论文计算')
    for (const id of topic.references) {
      const paper = publications.find(item => item.id === id)
      expect(html).toContain(paper.title)
      expect(html).toContain(paper.source_url)
    }
    expect(html).toContain('返回课题组首页')
  })

  it('provides valid physics guidance and curated external resources for every public topic', () => {
    const resourceIds = new Set(researchTopicResources.map(resource => resource.id))
    expect(researchTopicResources.length).toBeGreaterThanOrEqual(15)
    expect(resourceIds.size).toBe(researchTopicResources.length)
    for (const topic of directions) {
      const guide = researchTopicDetails[topic.id]
      expect(guide, `missing physics guide for ${topic.id}`).toBeTruthy()
      expect(guide.mechanisms.length).toBeGreaterThanOrEqual(3)
      expect(guide.workflow.length).toBeGreaterThanOrEqual(3)
      expect(guide.interpretation.length).toBeGreaterThanOrEqual(3)
      expect(guide.resourceIds.length).toBeGreaterThanOrEqual(5)
      for (const id of guide.resourceIds) expect(resourceIds.has(id), `unknown resource ${id} in ${topic.id}`).toBe(true)
    }
    for (const resource of researchTopicResources) {
      expect(resource.url).toMatch(/^https:\/\//)
      expect(resource.name).toBeTruthy()
      expect(resource.description.length).toBeGreaterThan(20)
    }
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
