import { describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import LoginView from './LoginView.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: {} }) }))
vi.mock('../composables/useSiteConfig', () => ({ useSiteConfig: () => ({ siteConfig: {} }) }))

describe('Member registration form', () => {
  it('requires only email, password and invite code', async () => {
    const app = createSSRApp(LoginView)
    app.component('router-link', { template: '<a><slot /></a>' })
    const html = await renderToString(app)
    const registration = html.split('flip-card__back')[1]
    const inputs = registration.match(/<input\b[^>]*>/g)
    expect(inputs).toHaveLength(5)
    expect(inputs.filter(input => /\srequired(?:\s|[=>])/.test(input))).toHaveLength(3)
    expect(inputs.find(input => input.includes('autocomplete="name"'))).not.toContain('required')
    expect(inputs.find(input => input.includes('autocomplete="nickname"'))).not.toContain('required')
    expect(inputs.find(input => input.includes('type="password"'))).toContain('minlength="6"')
    expect(registration).not.toContain('确认密码')
  })
})
