import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Scroll Anti-Flicker Architecture & Theme Colors', () => {
  const indexCss = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')
  const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8')
  const baseDialogVue = readFileSync(resolve(__dirname, '../components/BaseDialog.vue'), 'utf-8')
  const noticesVue = readFileSync(resolve(__dirname, 'NoticesView.vue'), 'utf-8')
  const noticeMarqueeVue = readFileSync(resolve(__dirname, '../components/NoticeMarquee.vue'), 'utf-8')
  const assistantVue = readFileSync(resolve(__dirname, 'AssistantView.vue'), 'utf-8')
  const styleViewVue = readFileSync(resolve(__dirname, 'StyleView.vue'), 'utf-8')

  it('uses Quiet Research on public routes and preserves the selected workspace theme', () => {
    expect(indexHtml).toContain("localStorage.getItem('laborbit_color_scheme')")
    expect(indexHtml).toContain("localStorage.getItem('labhub_color_scheme')")
    expect(indexHtml).toContain("var scheme = isPublicRoute ? 'quiet-research' : (savedScheme ||")
    expect(indexHtml).toContain("routePath === '/'")
    expect(indexHtml).toContain("routePath === '/people'")
    expect(indexHtml).toContain("routePath === '/events'")
    expect(indexHtml).toContain("routePath.startsWith('/research/')")
    expect(indexHtml).toContain('doc.dataset.publicPage = String(isPublicRoute)')
    expect(indexHtml).toContain("var bgType = isPublicRoute ? 'paper' : (")
    expect(indexHtml).toContain("['paper', 'galaxy', 'vanta-fog', 'clouds-static', 'custom-local'].includes(savedBg)")
    expect(indexHtml).toContain("var bgHex = scheme === 'quiet-research' ? '#F7F5F0'")
    expect(indexHtml).toContain('name="theme-color" content="#F7F5F0"')
    expect(indexHtml).toContain('name="color-scheme" content="light dark"')
    expect(indexHtml).toContain("if (bgType === 'clouds-static' && doc.dataset.publicPage !== 'true')")
    expect(indexHtml).not.toContain('</script>ipt>')
  })

  it('keeps the compact sidebar and background controls independent of Quiet Research', () => {
    expect(indexCss).toContain('--sidebar: 88px;')
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"][data-glass-style="solid"] .glass-card')
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"][data-glass-style="frosted"] .glass-card')
    expect(indexCss).not.toContain(':root[data-color-scheme="quiet-research"] .forecast-atmosphere {\n  display: none !important;')
    expect(indexHtml).toContain("if (bgType === 'clouds-static' && doc.dataset.publicPage !== 'true')")
  })

  it('labels Quiet Research as the workspace default while preserving user choice', () => {
    expect(styleViewVue).toContain('协作空间默认使用 Quiet Research（Claude 风格）')
    expect(styleViewVue).toContain('已有的个人主题偏好会保留')
    expect(styleViewVue).toContain('v-for="scheme in colorSchemes"')
    expect(styleViewVue).toContain("scheme.id === 'quiet-research'")
    expect(styleViewVue).toContain('class="theme-default-badge">默认风格</span>')
    expect(styleViewVue).toContain('handleColorSchemeSelect(scheme)')
  })

  it('defines --panel-solid in :root and classic-cyan', () => {
    expect(indexCss).toContain('--panel-solid: #0c0a1a;')
    expect(indexCss).toContain('--panel-solid: #152f38;')
  })

  it('decouples .dialog-frame scrolling and removes backdrop-filter', () => {
    // .dialog-frame must NOT have backdrop-filter (flicker cause)
    const dialogFrameRegex = /\.dialog-frame\s*\{([^}]+)\}/
    const match = indexCss.match(dialogFrameRegex)
    expect(match).toBeTruthy()
    const content = match[1]
    expect(content).not.toContain('backdrop-filter:blur')
    expect(content).toContain('overflow:hidden')
    expect(content).toContain('isolation:isolate')
    expect(content).toContain('--panel-solid')
  })

  it('ensures .dialog-content is the dedicated scrolling container with overscroll-behavior: contain', () => {
    const dialogContentRegex = /\.dialog-content\s*\{([^}]+)\}/
    const match = indexCss.match(dialogContentRegex)
    expect(match).toBeTruthy()
    const content = match[1]
    expect(content).toContain('overflow-y:auto')
    expect(content).toContain('overscroll-behavior:contain')
  })

  it('ensures BaseDialog clears GSAP transform on animation completion', () => {
    expect(baseDialogVue).toContain("clearProps: 'transform'")
  })

  it('ensures Notices search input does not use hardcoded sky blue #06b6d4 for focus', () => {
    expect(noticesVue).not.toContain('border-bottom-color: var(--primary, #06b6d4)')
    expect(noticesVue).toContain('border-bottom-color: var(--accent) !important;')
    expect(noticesVue).toContain('color: var(--accent) !important;')
  })

  it('ensures modal cards in NoticesView, NoticeMarquee, and AssistantView have panel-solid and isolation', () => {
    expect(noticesVue).toContain('background: var(--panel-solid, #0c0a1a);')
    expect(noticesVue).toContain('isolation: isolate;')
    expect(noticeMarqueeVue).toContain('background: var(--panel-solid, #0c0a1a);')
    expect(noticeMarqueeVue).toContain('isolation: isolate;')
    expect(assistantVue).toContain('background: var(--panel-solid, #0c0a1a);')
    expect(assistantVue).toContain('isolation: isolate;')
  })

  it('ensures dialog window is unified with custom colors and not hardcoded to cyan', () => {
    // index.css should NOT have hardcoded #152f38 on dialog-frame under vanta-fog
    expect(indexCss).not.toContain('[data-theme-style="vanta-fog"] .dialog-frame { background: #152f38; }')
    expect(indexCss).not.toContain('[data-theme-style="vanta-fog"] .dialog-heading { background: #18323b; }')
    // custom scheme must explicitly bind dialog-frame to --panel-solid
    expect(indexCss).toContain('[data-color-scheme="custom"] .dialog-frame')
    // BaseDialog must support and bind frameStyle
    expect(baseDialogVue).toContain('frameStyle: [Object, String]')
    expect(baseDialogVue).toContain(':style="frameStyle"')
  })
})
