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
    expect(indexHtml).toContain("var publicScheme = validPublicSchemes.includes(savedPublicScheme) ? savedPublicScheme : 'quiet-research';")
    expect(indexHtml).toContain("var scheme = isPublicRoute ? publicScheme : (savedScheme ||")
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
    expect(indexHtml).toContain("if (bgType === 'clouds-static' && scheme !== 'quiet-research'")
    expect(indexHtml).not.toContain('</script>ipt>')
  })

  it('labels Quiet Research as the workspace default while preserving user choice', () => {
    expect(styleViewVue).toContain('协作空间默认使用 Quiet Research（Claude 风格）')
    expect(styleViewVue).toContain('已有的个人主题偏好会保留')
    expect(styleViewVue).toContain('v-for="scheme in colorSchemes"')
    expect(styleViewVue).toContain("scheme.id === 'quiet-research'")
    expect(styleViewVue).toContain('class="theme-default-badge">默认风格</span>')
    expect(styleViewVue).toContain('handleColorSchemeSelect(scheme)')
  })

  it('exposes an independent public skin selector on every public route', () => {
    const appVue = readFileSync(resolve(__dirname, '../App.vue'), 'utf-8')
    const themeSwitcher = readFileSync(resolve(__dirname, '../components/PublicThemeSwitcher.vue'), 'utf-8')
    const publicHomeView = readFileSync(resolve(__dirname, 'PublicHomeView.vue'), 'utf-8')
    const themeModule = readFileSync(resolve(__dirname, '../composables/useThemeStyle.js'), 'utf-8')
    expect(appVue).toContain('route.path !==')
    expect(publicHomeView).toContain('<PublicThemeSwitcher inline />')
    expect(themeSwitcher).toContain('aria-label="切换官网风格"')
    expect(themeSwitcher).toContain('class="theme-tuner-icon"')
    expect(themeSwitcher).toContain('var(--theme-tuner-ring')
    expect(themeSwitcher).toContain('var(--theme-tuner-core')
    expect(themeSwitcher).toContain('选择官网皮肤风格')
    expect(themeSwitcher).toContain('v-for="scheme in colorSchemes"')
    expect(themeModule).toContain("export const PUBLIC_COLOR_SCHEME_KEY = 'labhub_public_color_scheme'")
    expect(themeModule).toContain('actualScheme = publicColorScheme.value')
    expect(themeModule).toContain('function setPublicColorScheme(scheme)')
  })

  it('preserves the original collapsed icon rail in Quiet Research', () => {
    expect(indexCss).toMatch(/:root\[data-color-scheme="quiet-research"\] \.app-shell\.has-sidebar\.sidebar-collapsed\s*\{\s*padding-left:\s*88px;/)
    expect(indexCss).toMatch(/:root\[data-color-scheme="quiet-research"\] \.forecast-sidebar\.is-collapsed\s*\{\s*width:\s*88px;/)
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"] .forecast-sidebar.is-floating,')
    expect(indexCss).toMatch(/:root\[data-color-scheme="quiet-research"\] \.forecast-sidebar\.is-collapsed \.iso-pro \.iso-text\s*\{\s*display:\s*none;/)
  })

  it('allows dynamic and local backgrounds when Quiet Research is selected', () => {
    const appVue = readFileSync(resolve(__dirname, '../App.vue'), 'utf-8')
    expect(appVue).toContain("['galaxy', 'vanta-fog', 'custom-local', 'earth-orbit'].includes(currentBgType)")
    expect(appVue).not.toContain("currentColorScheme !== 'quiet-research'")
    expect(styleViewVue).toContain('{{ bg.description || bg.subtitle }}')
  })

  it('keeps the glass-style overlay active under Quiet Research theme specificity', () => {
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"][data-glass-style="frosted"] .app-shell .glass-card')
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"][data-glass-style="liquid"] .app-shell .glass-card')
    expect(indexCss).toContain(':root[data-color-scheme="quiet-research"][data-glass-style="solid"] .app-shell .glass-card')
  })

  it('uses BUAA HEP group branding in the font preview', () => {
    expect(styleViewVue).toContain('北航粒子物理研究组')
    expect(styleViewVue).toContain('Beihang University Particle Physics Phenomenology Group')
    expect(styleViewVue).not.toContain('天体物理与交叉科学课题组')
    expect(styleViewVue).not.toContain('Astrophysics and Interdisciplinary Science Research Group')
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
  it('uses a layered, readable cold Worldline palette and theme-derived tuner tokens', () => {
    const themeSwitcher = readFileSync(resolve(__dirname, '../components/PublicThemeSwitcher.vue'), 'utf-8')
    const themeModule = readFileSync(resolve(__dirname, '../composables/useThemeStyle.js'), 'utf-8')
    expect(indexCss).toContain('--worldline-cyan: #55e6f2;')
    expect(indexCss).toContain('--worldline-blue: #83a9ff;')
    expect(indexCss).toContain('--worldline-anomaly: #ff4d86;')
    expect(indexCss).toContain('--worldline-hardware: #87928d;')
    expect(indexCss).toContain('--worldline-device-coral: #e98278;')
    expect(indexCss).toContain('.lab-public .collision-figure::after')
    expect(indexCss).toContain('content: "FIELD MONITOR // 01";')
    expect(indexCss).toContain('--theme-tuner-core: var(--worldline-cyan);')
    expect(indexCss).toContain('--theme-tuner-ring: color-mix(in srgb, var(--text) 42%, var(--worldline-blue) 58%);')
    expect(indexCss).toContain('--theme-tuner-core: var(--accent);')
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"] .lab-public .public-header::after')
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"] .lab-public .research-tabs button.active::before')
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"] .lab-public .physics-resource-card {')
    expect(themeModule).toContain("colors: ['#07111d', '#55e6f2', '#102436']")
    expect(indexHtml).toContain("scheme === 'worldline-console' ? '#07111d'")
    expect(themeModule).toContain("actualScheme === 'worldline-console' ? '#07111d'")
    expect(themeSwitcher).toContain('stroke: var(--theme-tuner-ring')
    expect(themeSwitcher).toContain('stroke: var(--theme-tuner-core')
  })

  it('registers the optional Worldline Console skin and its accessible transition effect', () => {
    const themeModule = readFileSync(resolve(__dirname, '../composables/useThemeStyle.js'), 'utf-8')
    const worldlineEffects = readFileSync(resolve(__dirname, '../components/WorldlineEffects.vue'), 'utf-8')
    const appVue = readFileSync(resolve(__dirname, '../App.vue'), 'utf-8')
    expect(themeModule).toContain("id: 'worldline-console'")
    expect(indexHtml).toContain("'worldline-console'")
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"]')
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"][data-bg-style="paper"] body')
    expect(indexCss).toContain(':root[data-color-scheme="worldline-console"] button:active:not(:disabled)')
    expect(appVue).toContain('<WorldlineEffects />')
    expect(worldlineEffects).toContain('prefers-reduced-motion: reduce')
    expect(worldlineEffects).toContain('worldline-particle-canvas')
    expect(worldlineEffects).toContain('worldline-technical-backdrop')
    expect(worldlineEffects).toContain('worldline-gear-drawing')
    expect(worldlineEffects).toContain('SIGNAL TRACE / SCHEMATIC')
    expect(indexCss).toContain('.worldline-technical-backdrop')
    expect(indexCss).toContain('@keyframes worldline-gear-drift')
    expect(worldlineEffects).toContain("canvas.getContext('2d')")
    expect(worldlineEffects).toContain('function createClickSparks(x, y)')
    expect(worldlineEffects).toContain('trailPoints: []')
    expect(worldlineEffects).toContain('if (particle.trailPoints.length > 8) particle.trailPoints.shift()')
    expect(worldlineEffects).toContain('const count = Math.min(18, Math.max(0, 180 - burstParticles.length))')
    expect(worldlineEffects).toContain('const trailScale = particle.trailScale || 3.2')
    expect(worldlineEffects).toContain("window.addEventListener('pointermove', handlePointerMove")
    expect(worldlineEffects).toContain("window.addEventListener('pointerdown', handlePointerDown")
    expect(indexCss).toContain('.worldline-shift-overlay__flash')
    expect(indexCss).toContain('color-mix(in srgb, var(--worldline-screen) 96%, transparent);')
    expect(indexCss).toContain('@keyframes worldline-shift-flash')
    expect(indexCss).toContain('@keyframes worldline-dial-ignite')
    expect(indexCss).toContain('.worldline-backdrop-shift-wave__ring--outer')
    expect(indexCss).toContain('@keyframes worldline-backdrop-wave')
    expect(indexCss).toContain('.worldline-shift-overlay__dial-ticks')
    expect(indexCss).toContain('.worldline-shift-overlay__glitch--a')
    expect(worldlineEffects).toContain('世界线变动')
  })

})
