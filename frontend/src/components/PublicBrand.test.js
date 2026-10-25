import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PublicBrand from './PublicBrand.vue'
import { publicBrandIdentity } from '../content/brandIdentity'

describe('public brand identity', () => {
  it('renders the Chinese brand, academic focus and 1/6 motif', async () => {
    const html = await renderToString(createSSRApp(PublicBrand))
    expect(html).toContain(`aria-label="${publicBrandIdentity.name}首页"`)
    expect(html).toContain(`<strong>${publicBrandIdentity.name}</strong>`)
    expect(html).toContain(`<small>${publicBrandIdentity.academicFocus}</small>`)
    expect(html).toContain(publicBrandIdentity.fractionMark)
  })

  it('preserves the Worldline header hook while sharing the same identity', async () => {
    const html = await renderToString(createSSRApp(PublicBrand, { variant: 'worldline' }))
    expect(html).toContain('class="worldline-brand"')
    expect(html).toContain('class="worldline-brand-mark"')
    expect(html).toContain(publicBrandIdentity.name)
    expect(html).toContain(publicBrandIdentity.academicFocus)
  })
})
