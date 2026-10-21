import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { publicEvents, publicSeminarSeries } from '../content/lab'
import EventsView from './EventsView.vue'

describe('public academic events page', () => {
  it('keeps the public page independent of internal schedules and shows a safe empty state', async () => {
    expect(publicEvents).toEqual([])
    expect(publicSeminarSeries).toEqual([])
    const app = createSSRApp(EventsView)
    app.component('router-link', {
      props: ['to'],
      setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()),
    })
    const html = await renderToString(app)
    expect(html).toContain('目前没有已核验的近期公开活动')
    expect(html).toContain('内部组会排期')
    expect(html).toContain('暂无已核验的公开研讨会系列')
    expect(html).toContain('下载公开日历 (.ics)')
    expect(html).not.toContain('/api/seminars')
  })
})
