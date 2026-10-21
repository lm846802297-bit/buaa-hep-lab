import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PublicHomeView from './PublicHomeView.vue'
import { lab, advisorProfile, collaborators, publications, directions, publicResources } from '../content/lab'

describe('Public academic website', () => {
  it('renders research and verified papers without a session or backend', async () => {
    const app = createSSRApp(PublicHomeView)
    app.component('router-link', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()) })
    const html = await renderToString(app)
    expect(html).toContain('高能粒子物理唯象学')
    expect(html).toContain('暂定名称')
    expect(html).toContain('href="/hub"')
    expect(html).toContain('BibTeX')
    expect(html).toContain('aria-label="导师：王小平"')
    expect(html).toContain('aria-label="学术指导：刘佳"')
    expect(html).not.toContain('合作成员')
    expect(html).toContain('副教授 · 博士生导师')
    expect(html).toContain(advisorProfile.intro)
    for (const topic of advisorProfile.topics) expect(html).toContain(topic)
    expect(html).toContain('刘佳')
    expect(html).toContain('北京大学物理学院')
    expect(html).toContain('长聘副教授')
    expect(html).toContain('Jia Liu')
    for (const person of collaborators) {
      expect(html).toContain(person.intro)
      for (const topic of person.topics) expect(html).toContain(topic)
      for (const highlight of person.highlights) expect(html).toContain(highlight)
    }
    expect(html).toContain('https://faculty.pku.edu.cn/liujia/zh_CN/index.htm')
    for (const paper of publications) expect(html).toContain(`https://arxiv.org/abs/${paper.id}`)
    expect(html).toContain('id="physics-resources"')
    for (const resource of publicResources) {
      expect(html).toContain(resource.url)
      expect(html).toContain(resource.description)
    }
    // Static rendering includes the full, script-free descriptions of every direction.
    for (const direction of directions) {
      for (const key of ['question', 'methods', 'probes']) expect(html).toContain(direction[key])
    }
    expect(html).not.toContain('演示管理员')
    expect(html).not.toContain('邮箱')
    expect(html).not.toContain('办公地点')
  })
  it('keeps the public content profile limited to approved academic fields', () => {
    expect(Object.keys(lab).sort()).toEqual(['name', 'provisional', 'shortName', 'institution', 'field', 'english', 'advisor', 'source', 'intro'].sort())
    expect(JSON.stringify(lab)).not.toMatch(/[\w.-]+@[\w.-]+/)
    expect(Object.keys(advisorProfile).sort()).toEqual(['name', 'groupRole', 'english', 'institution', 'title', 'field', 'topics', 'intro', 'source'].sort())
    expect(JSON.stringify(advisorProfile)).not.toMatch(/邮箱|电话|办公|履历|照片|[\w.-]+@[\w.-]+/)
    for (const person of collaborators) {
      expect(Object.keys(person).sort()).toEqual(['name', 'english', 'groupRole', 'institution', 'title', 'field', 'intro', 'highlights', 'topics', 'source'].sort())
      expect(JSON.stringify(person)).not.toMatch(/邮箱|电话|办公|履历|照片|[\w.-]+@[\w.-]+/)
    }
    expect(publications.every(p => /^\d{4}\.\d{4,5}$/.test(p.id))).toBe(true)
    expect(new Set(publications.map(p => p.id)).size).toBe(publications.length)
    for (const direction of directions) {
      expect(direction.references.length).toBeGreaterThanOrEqual(2)
      expect(direction.references.length).toBeLessThanOrEqual(4)
      for (const id of direction.references) expect(publications.find(p => p.id === id)?.categories).toContain(direction.id)
    }
    expect(publicResources).toHaveLength(9)
    expect(new Set(publicResources.map(resource => resource.url)).size).toBe(publicResources.length)
    for (const resource of publicResources) {
      expect(Object.keys(resource).sort()).toEqual(['id', 'name', 'category', 'url', 'description'].sort())
      expect(new URL(resource.url).protocol).toBe('https:')
      expect(JSON.stringify(resource)).not.toMatch(/邮箱|电话|办公|[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/)
    }
  })
})
