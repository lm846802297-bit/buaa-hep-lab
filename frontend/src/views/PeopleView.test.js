import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { publicPeople } from '../content/lab'
import PeopleView from './PeopleView.vue'

describe('public people directory', () => {
  it('renders only approved public profiles and their official sources', async () => {
    const app = createSSRApp(PeopleView)
    app.component('router-link', {
      props: ['to'],
      setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
    })
    const html = await renderToString(app)
    for (const person of publicPeople.filter(person => person.visibility === 'public')) {
      expect(html).toContain(person.name)
      expect(html).toContain(person.source_url)
    }
    expect(html).toContain('不是完整人员名册')
    expect(html).toContain('官方个人主页')
    expect(html).not.toContain('member@example.com')
  })
})
