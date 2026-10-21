import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import katex from 'katex'
import LearningView from './LearningView.vue'
import { learningTopics, learningSources } from '../content/learning'
import { reproductionTemplate, searchLearning, sourceById, topicMarkdown } from '../utils/learning'

async function renderTopic(id) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/learning/:topic?', component: LearningView }] })
  await router.push('/learning' + (id ? '/' + id : '')); await router.isReady()
  return renderToString(createSSRApp(LearningView).use(router))
}

describe('Study guides and research provenance', () => {
  it('searches nested subject text with multiple terms and resource categories', () => {
    expect(searchLearning(learningTopics, 'EFT Wilson').map(t => t.id)).toEqual(['eft'])
    expect(searchLearning(learningSources, 'Dirac', '计算工具')).toHaveLength(2)
    expect(searchLearning(learningSources, 'Dirac', '实验与文献')).toHaveLength(0)
    expect(searchLearning(learningTopics, 'not-a-real-topic')).toHaveLength(0)
    expect(searchLearning(learningTopics, '  ')).toHaveLength(5)
  })
  it.each(learningTopics)('renders $id with accessible equations and source links', async topic => {
    const html = await renderTopic(topic.id)
    expect(html).toContain(topic.title)
    expect(html).toContain('待学术审核')
    expect(html).toContain('假设、近似与适用范围')
    expect(html).toMatch(new RegExp(`<a(?=[^>]*href="/learning/${topic.id}")(?=[^>]*aria-current="page")[^>]*>`))
    for (const section of topic.sections) {
      expect(html).toContain(section.title)
      for (const id of section.sources) expect(html).toContain(sourceById(id).url)
      for (const formula of section.formulas || []) {
        expect(formula.latex).not.toMatch(/[\u0000-\u001f]/)
        expect(() => katex.renderToString(formula.latex, { throwOnError: true, trust: false })).not.toThrow()
        expect(html).toContain('<math')
      }
    }
    expect(html).not.toContain('katex-error')
  })
  it('pins kinematics formulas to the current PDG edition', () => {
    expect(sourceById('pdg').url).toBe('https://pdg.lbl.gov/2026/')
    expect(sourceById('kinematics').url).toBe('https://pdg.lbl.gov/2026/reviews/rpp2026-rev-kinematics.pdf')
  })
  it('handles an unknown deep link without silently showing the wrong topic', async () => {
    const html = await renderTopic('missing-guide')
    expect(html).toContain('没有这个学习专题')
    expect(html).not.toContain('id="note-conventions"')
  })
  it('exports readable notes retaining formula source, limitations and section provenance', () => {
    for (const topic of learningTopics) {
      const text = topicMarkdown(topic)
      expect(text).toContain('# ' + topic.title)
      expect(text).toContain('待学术审核')
      expect(text).toContain('学术维护者：待课题组指定')
      for (const section of topic.sections) {
        for (const id of section.sources) expect(text).toContain(sourceById(id).url)
        for (const formula of section.formulas || []) expect(text).toContain(formula.latex)
      }
      expect(text).toContain('## 假设、近似与适用范围')
      expect(text).toContain('- [ ] ')
    }
    expect(topicMarkdown(undefined)).toBe('')
    expect(reproductionTemplate()).toContain('不得默认标记已验证')
  })
  it('keeps identifiers unique and all source references on HTTPS primary domains', () => {
    expect(new Set(learningTopics.map(t => t.id)).size).toBe(learningTopics.length)
    expect(new Set(learningSources.map(t => t.id)).size).toBe(learningSources.length)
    for (const source of learningSources) expect(new URL(source.url).protocol).toBe('https:')
    for (const topic of learningTopics) for (const section of topic.sections) for (const id of section.sources) expect(sourceById(id)).toBeDefined()
  })
})
