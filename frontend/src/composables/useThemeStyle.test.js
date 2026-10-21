import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('useThemeStyle', () => {
  const STORAGE_KEY = 'laborbit_theme_style'
  let store = {}
  let attrs = {}

  beforeEach(() => {
    vi.resetModules()
    store = {}
    attrs = {}

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val) }),
      removeItem: vi.fn((key) => { delete store[key] }),
      clear: vi.fn(() => { store = {} })
    }

    // Mock window & document
    global.window = {}
    global.document = {
      createElement: vi.fn(() => ({})),
      documentElement: {
        setAttribute: vi.fn((k, v) => { attrs[k] = v }),
        getAttribute: vi.fn((k) => attrs[k] || null),
        removeAttribute: vi.fn((k) => { delete attrs[k] })
      }
    }
  })

  afterEach(() => {
    delete global.localStorage
    delete global.window
    delete global.document
  })

  it('defaults to the Quiet Research paper theme for first-time visitors', async () => {
    const { currentThemeStyle, currentColorScheme, currentBgType, currentGlassStyle } = await import('./useThemeStyle')
    expect(currentThemeStyle.value).toBe('paper')
    expect(currentColorScheme.value).toBe('quiet-research')
    expect(currentBgType.value).toBe('paper')
    expect(currentGlassStyle.value).toBe('solid')
  })

  it('allows changing theme style and persists to localStorage and DOM', async () => {
    const { useThemeStyle, currentThemeStyle } = await import('./useThemeStyle')
    const { setThemeStyle } = useThemeStyle()

    setThemeStyle('galaxy')
    expect(currentThemeStyle.value).toBe('galaxy')
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'galaxy')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme-style', 'galaxy')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-bg-style', 'galaxy')

    setThemeStyle('clouds-static')
    expect(currentThemeStyle.value).toBe('clouds-static')
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'clouds-static')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme-style', 'clouds-static')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-bg-style', 'clouds-static')
  })

  it('supports decoupled color schemes and backgrounds with DOM data attributes', async () => {
    const { useThemeStyle, currentColorScheme, currentBgType, colorSchemes, bgOptions } = await import('./useThemeStyle')
    const { setColorScheme, setBgType } = useThemeStyle()

    expect(colorSchemes).toHaveLength(4)
    expect(colorSchemes.map(s => s.id)).toEqual(['quiet-research', 'classic-cyan', 'obsidian-gray', 'nebula-purple'])
    expect(colorSchemes[0].baseColor).toBe('#F7F5F0')
    expect(colorSchemes[0].primaryColor).toBe('#B85E3F')
    expect(colorSchemes[0].colors).toBeDefined()
    expect(colorSchemes[0].colors.length).toBeGreaterThanOrEqual(3)

    expect(bgOptions).toHaveLength(5)
    expect(bgOptions.map(b => b.id)).toEqual(['paper', 'clouds-static', 'galaxy', 'vanta-fog', 'custom-local'])

    // Change color scheme to obsidian-gray
    setColorScheme('obsidian-gray')
    expect(currentColorScheme.value).toBe('obsidian-gray')
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_color_scheme', 'obsidian-gray')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-color-scheme', 'obsidian-gray')

    // Change background type to galaxy
    setBgType('galaxy')
    expect(currentBgType.value).toBe('galaxy')
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_bg_type', 'galaxy')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-bg-type', 'galaxy')
  })

  it('applies every appearance card option and persists its selected ID', async () => {
    const {
      useThemeStyle,
      colorSchemes,
      bgOptions,
      glassOptions,
      currentColorScheme,
      currentBgType,
      currentGlassStyle
    } = await import('./useThemeStyle')
    const { setColorScheme, setBgType, setGlassStyle } = useThemeStyle()

    for (const scheme of colorSchemes) {
      setColorScheme(scheme.id)
      expect(currentColorScheme.value).toBe(scheme.id)
      expect(store['laborbit_color_scheme']).toBe(scheme.id)
      expect(attrs['data-color-scheme']).toBe(scheme.id)
    }

    for (const bg of bgOptions) {
      setBgType(bg.id)
      expect(currentBgType.value).toBe(bg.id)
      expect(store['laborbit_bg_type']).toBe(bg.id)
      expect(attrs['data-bg-type']).toBe(bg.id)
    }

    for (const glass of glassOptions) {
      setGlassStyle(glass.id)
      expect(currentGlassStyle.value).toBe(glass.id)
      expect(store['laborbit_glass_style']).toBe(glass.id)
      expect(attrs['data-glass-style']).toBe(glass.id)
    }
  })

  it('keeps a selected workspace theme while public routes temporarily use Quiet Research', async () => {
    store['laborbit_color_scheme'] = 'obsidian-gray'
    store['laborbit_bg_type'] = 'galaxy'
    attrs['data-public-page'] = 'true'

    const { currentColorScheme, currentBgType, applyThemeToDOM } = await import('./useThemeStyle')

    // The active workspace preference remains dark even while the public page is rendered.
    expect(currentColorScheme.value).toBe('obsidian-gray')
    expect(currentBgType.value).toBe('galaxy')
    expect(attrs['data-color-scheme']).toBe('quiet-research')
    expect(attrs['data-bg-type']).toBe('paper')
    expect(localStorage.setItem).not.toHaveBeenCalledWith('laborbit_color_scheme', 'quiet-research')
    expect(localStorage.setItem).not.toHaveBeenCalledWith('laborbit_bg_type', 'paper')

    // Leaving the public routes restores the saved workspace theme and background.
    attrs['data-public-page'] = 'false'
    applyThemeToDOM(currentColorScheme.value, currentBgType.value)
    expect(attrs['data-color-scheme']).toBe('obsidian-gray')
    expect(attrs['data-bg-type']).toBe('galaxy')
  })

  it('migrates older labhub appearance keys only when the current preference is missing', async () => {
    store['laborbit_color_scheme'] = 'obsidian-gray'
    store['labhub_color_scheme'] = 'nebula-purple'
    store['labhub_bg_type'] = 'galaxy'
    store['labhub_theme_style'] = 'galaxy'
    store['labhub_glass_style'] = 'frosted'

    const { currentColorScheme, currentBgType, currentGlassStyle } = await import('./useThemeStyle')

    expect(currentColorScheme.value).toBe('obsidian-gray')
    expect(currentBgType.value).toBe('galaxy')
    expect(currentGlassStyle.value).toBe('frosted')
    expect(store['laborbit_color_scheme']).toBe('obsidian-gray')
    expect(store['laborbit_bg_type']).toBe('galaxy')
    expect(store['laborbit_theme_style']).toBe('galaxy')
    expect(store['laborbit_glass_style']).toBe('frosted')
  })

  it('supports toggling glass styles between liquid and frosted', async () => {
    const { useThemeStyle, currentGlassStyle, glassOptions, setGlassStyle } = await import('./useThemeStyle')
    expect(glassOptions).toHaveLength(3)
    expect(glassOptions.map(g => g.id)).toEqual(['solid', 'liquid', 'frosted'])

    setGlassStyle('frosted')
    expect(currentGlassStyle.value).toBe('frosted')
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_glass_style', 'frosted')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-glass-style', 'frosted')

    setGlassStyle('liquid')
    expect(currentGlassStyle.value).toBe('liquid')
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_glass_style', 'liquid')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-glass-style', 'liquid')
  })

  it('preserves existing appearance settings because legacy values may be intentional', async () => {
    const { migratePreviousDefaultUsers, DEFAULT_MIGRATION_KEY } = await import('./useThemeStyle')
    store['laborbit_color_scheme'] = 'obsidian-gray'
    store['laborbit_bg_type'] = 'earth-orbit'
    store['laborbit_theme_style'] = 'earth-orbit'
    store['laborbit_glass_style'] = 'liquid'
    delete store[DEFAULT_MIGRATION_KEY]

    migratePreviousDefaultUsers()

    expect(store['laborbit_color_scheme']).toBe('obsidian-gray')
    expect(store['laborbit_bg_type']).toBe('earth-orbit')
    expect(store['laborbit_theme_style']).toBe('earth-orbit')
    expect(store['laborbit_glass_style']).toBe('liquid')
    expect(store[DEFAULT_MIGRATION_KEY]).toBe('1')
  })

  it('keeps Quiet Research available alongside every pre-existing theme', async () => {
    const { colorSchemes } = await import('./useThemeStyle')
    expect(colorSchemes.map(s => s.id)).toEqual(['quiet-research', 'classic-cyan', 'obsidian-gray', 'nebula-purple'])
    expect(colorSchemes[0].name).toContain('Claude 风格')
  })

  it('keeps Quiet Research as the default for new users without stored preferences', async () => {
    const { DEFAULT_COLOR_SCHEME, DEFAULT_BG_TYPE, DEFAULT_GLASS_STYLE, currentColorScheme, currentBgType, currentGlassStyle } = await import('./useThemeStyle')
    expect(DEFAULT_COLOR_SCHEME).toBe('quiet-research')
    expect(DEFAULT_BG_TYPE).toBe('paper')
    expect(DEFAULT_GLASS_STYLE).toBe('solid')
    expect(currentColorScheme.value).toBe('quiet-research')
    expect(currentBgType.value).toBe('paper')
    expect(currentGlassStyle.value).toBe('solid')
  })

  it('preserves user custom color scheme and local media during migration', async () => {
    const { migratePreviousDefaultUsers, DEFAULT_MIGRATION_KEY } = await import('./useThemeStyle')
    store['laborbit_color_scheme'] = 'custom'
    store['laborbit_bg_type'] = 'custom-local'
    delete store[DEFAULT_MIGRATION_KEY]

    migratePreviousDefaultUsers()

    expect(store['laborbit_color_scheme']).toBe('custom')
    expect(store['laborbit_bg_type']).toBe('custom-local')
    expect(store[DEFAULT_MIGRATION_KEY]).toBe('1')
  })

  it('supports pausing/freezing background video and persists to localStorage', async () => {
    const { useThemeStyle, isBgVideoPaused } = await import('./useThemeStyle')
    const { setBgVideoPaused, toggleBgVideoPaused } = useThemeStyle()

    setBgVideoPaused(true)
    expect(isBgVideoPaused.value).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_bg_video_paused', 'true')

    toggleBgVideoPaused()
    expect(isBgVideoPaused.value).toBe(false)
    expect(localStorage.setItem).toHaveBeenCalledWith('laborbit_bg_video_paused', 'false')
  })
})
