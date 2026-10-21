import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { directions, publications } from '../content/lab'
import { researchTopicDetails, researchTopicResources } from '../content/researchTopicDetails'
import { researchTopicDeepGuides } from '../content/researchTopicDeepGuides'

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
    for (const item of researchTopicDetails.dark.navigation) {
      expect(html).toContain(`href="#${item.target}"`)
      expect(html).toContain(`id="${item.target}"`)
      expect(html).toContain(item.label)
      expect(html).toContain(item.heading)
    }
    expect(html).toContain(`${topic.title} · 目录`)
    expect(html).toContain('非弹性暗物质与核反冲')
    expect(html).toContain('Ωχ h² ≈ 0.12')
    expect(html).toContain('https://lz.lbl.gov/')
    expect(html).toContain('target="_blank" rel="noopener noreferrer"')
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

  it('renders the detail and resource sections for all five topics', async () => {
    for (const topic of directions) {
      const app = createSSRApp(ResearchTopicView, { topic: topic.id })
      app.component('router-link', {
        props: ['to'],
        setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
      })
      const html = await renderToString(app)
      expect(html).toContain(topic.title)
      const navigation = researchTopicDetails[topic.id].navigation
      expect(navigation).toHaveLength(13)
      expect(new Set(navigation.map(item => item.target)).size).toBe(navigation.length)
      const topicTerms = {
        dark: '候选者与机制',
        neutrino: '质量与新相互作用',
        collider: '希格斯与顶夸克',
        phase: '有效势与泡成核',
        precision: 'Fisher 信息与自旋',
      }
      expect(navigation.some(item => item.label.includes(topicTerms[topic.id]))).toBe(true)
      for (const item of navigation) {
        expect(html).toContain(`href="#${item.target}"`)
        expect(html).toContain(`id="${item.target}"`)
        expect(html).toContain(item.label)
        expect(html).toContain(item.heading)
      }
      expect(html).toContain(researchTopicDetails[topic.id].mechanisms[0].title)
      expect(html).toContain('href="#topic-resources"')
    }
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
      const deepGuide = researchTopicDeepGuides[topic.id]
      expect(deepGuide, `missing deep guide for ${topic.id}`).toBeTruthy()
      expect(deepGuide.keyRelations.length).toBeGreaterThanOrEqual(3)
      const blueprint = deepGuide.analysisBlueprint
      expect(blueprint, `missing reproducible research blueprint for ${topic.id}`).toBeTruthy()
      expect(blueprint.steps.length).toBeGreaterThanOrEqual(5)
      expect(blueprint.validationChecks.length).toBeGreaterThanOrEqual(4)
      expect(blueprint.reportingChecklist.length).toBeGreaterThanOrEqual(4)
      expect(blueprint.question.length).toBeGreaterThanOrEqual(30)
      expect(blueprint.scope.length).toBeGreaterThanOrEqual(40)
      for (const step of blueprint.steps) {
        expect(step.title.length).toBeGreaterThanOrEqual(5)
        expect(step.detail.length).toBeGreaterThanOrEqual(40)
        expect(step.output.length).toBeGreaterThanOrEqual(10)
      }
      for (const check of blueprint.validationChecks) {
        expect(check.title.length).toBeGreaterThanOrEqual(4)
        expect(check.detail.length).toBeGreaterThanOrEqual(30)
      }
      expect(html).toContain(blueprint.title)
      expect(html).toContain('必须通过的物理与数值检查')
      const blueprintText = [
        blueprint.question,
        blueprint.scope,
        ...blueprint.steps.flatMap(step => [step.title, step.detail, step.output]),
        ...blueprint.validationChecks.flatMap(check => [check.title, check.detail]),
        ...blueprint.reportingChecklist,
      ].join(' ')
      const physicsMarkers = {
        dark: ['δ → 0', 'UV → EFT', '核反冲'],
        neutrino: ['Takagi', '质量平方差', '重中微子'],
        collider: ['Ward identity', 'cut-flow', 'nuisance'],
        phase: ['T_c', 'T_n', 'S₃/T', '标准模型基线'],
        precision: ['QFI', 'Fisher 信息', 'toy Monte Carlo'],
      }
      for (const marker of physicsMarkers[topic.id]) {
        expect(blueprintText, `missing topic-specific physics marker ${marker} in ${topic.id}`).toContain(marker)
      }
      expect(deepGuide.assumptions.length).toBeGreaterThanOrEqual(3)
      expect(deepGuide.researchQuestions.length).toBeGreaterThanOrEqual(3)
      expect(deepGuide.references.length).toBeGreaterThanOrEqual(2)
      for (const relation of deepGuide.keyRelations) {
        expect(relation.formula.length).toBeGreaterThanOrEqual(12)
        expect(relation.conditions.length).toBeGreaterThanOrEqual(20)
        expect(relation.doesNotMean.length).toBeGreaterThanOrEqual(20)
      }
      for (const reference of deepGuide.references) expect(new URL(reference.url).protocol).toBe('https:')
      for (const id of guide.resourceIds) expect(resourceIds.has(id), `unknown resource ${id} in ${topic.id}`).toBe(true)
    }
    for (const resource of researchTopicResources) {
      expect(resource.url).toMatch(/^https:\/\//)
      expect(resource.name).toBeTruthy()
      expect(resource.description.length).toBeGreaterThanOrEqual(20)
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
