import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PublicHomeView from './PublicHomeView.vue'
import { lab, advisorProfile, collaborators, publications } from '../content/lab'

describe('Public academic website', () => {
  it('renders research and verified papers without a session or backend', async () => {
    const app = createSSRApp(PublicHomeView)
    app.component('router-link', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()) })
    const html = await renderToString(app)
    expect(html).toContain('高能粒子物理唯象学')
    expect(html).toContain('暂定名称')
    expect(html).toContain('href="/hub"')
    expect(html).toContain('BibTeX')
    expect(html).toContain('合作成员')
    expect(html).toContain('副教授 · 博士生导师')
    expect(html).toContain(advisorProfile.intro)
    for (const topic of advisorProfile.topics) expect(html).toContain(topic)
    expect(html).toContain('刘佳')
    expect(html).toContain('北京大学物理学院')
    expect(html).toContain('https://faculty.pku.edu.cn/liujia/zh_CN/index.htm')
    for (const paper of publications) expect(html).toContain(`https://arxiv.org/abs/${paper.id}`)
    expect(html).not.toContain('演示管理员')
    expect(html).not.toContain('邮箱')
    expect(html).not.toContain('办公地点')
  })
  it('keeps the public content profile limited to approved academic fields', () => {
    expect(Object.keys(lab).sort()).toEqual(['name', 'provisional', 'shortName', 'institution', 'field', 'english', 'advisor', 'source', 'intro'].sort())
    expect(JSON.stringify(lab)).not.toMatch(/[\w.-]+@[\w.-]+/)
    expect(Object.keys(advisorProfile).sort()).toEqual(['name', 'english', 'institution', 'title', 'field', 'topics', 'intro', 'source'].sort())
    expect(JSON.stringify(advisorProfile)).not.toMatch(/邮箱|电话|办公|履历|照片|[\w.-]+@[\w.-]+/)
    for (const person of collaborators) {
      expect(Object.keys(person).sort()).toEqual(['name', 'institution', 'field', 'topics', 'source'].sort())
      expect(JSON.stringify(person)).not.toMatch(/邮箱|电话|办公|履历|照片|[\w.-]+@[\w.-]+/)
    }
    expect(publications.every(p => /^\d{4}\.\d{4,5}$/.test(p.id))).toBe(true)
    expect(new Set(publications.map(p => p.id)).size).toBe(publications.length)
  })
})
