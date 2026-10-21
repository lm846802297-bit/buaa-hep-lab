import { afterEach, describe, expect, it, vi } from 'vitest'
import { freezeDynamicBackground, resumeDynamicBackground } from './backgroundFrameController.js'

function makeState(overrides = {}) {
  return {
    paused: true,
    type: 'galaxy',
    canvas: { toDataURL: vi.fn(() => 'data:image/png;base64,frame') },
    frozenFrame: null,
    animateId: 12,
    cancelAnimationFrame: vi.fn(),
    requestAnimationFrame: vi.fn(() => 99),
    now: vi.fn(() => 123),
    destroyGalaxy: vi.fn(),
    destroyVantaFog: vi.fn(),
    vantaEffect: null,
    renderer: {},
    mesh: {},
    lastTimestamp: 0,
    update: vi.fn(),
    initGalaxy: vi.fn(() => Promise.resolve()),
    initVantaFog: vi.fn(() => Promise.resolve()),
    onMediaLoaded: vi.fn(),
    path: '/hub',
    ...overrides
  }
}

afterEach(() => vi.restoreAllMocks())

describe('dynamic background frame controller', () => {
  it('captures and releases a paused galaxy renderer', () => {
    const state = makeState()
    freezeDynamicBackground(state)
    expect(state.frozenFrame).toBe('data:image/png;base64,frame')
    expect(state.destroyGalaxy).toHaveBeenCalledOnce()
    expect(state.cancelAnimationFrame).not.toHaveBeenCalled()
  })

  it('stops galaxy animation when a frame cannot be captured', () => {
    const state = makeState({ canvas: { toDataURL: vi.fn(() => { throw new Error('tainted canvas') }) } })
    freezeDynamicBackground(state)
    expect(state.frozenFrame).toBeNull()
    expect(state.cancelAnimationFrame).toHaveBeenCalledWith(12)
    expect(state.animateId).toBeNull()
  })

  it('captures and releases a paused Vanta renderer', () => {
    const state = makeState({ type: 'vanta-fog' })
    freezeDynamicBackground(state)
    expect(state.frozenFrame).toBe('data:image/png;base64,frame')
    expect(state.destroyVantaFog).toHaveBeenCalledOnce()
  })

  it('reduces Vanta motion when its frame cannot be captured', () => {
    const setOptions = vi.fn()
    const state = makeState({
      type: 'vanta-fog',
      canvas: { toDataURL: vi.fn(() => { throw new Error('tainted canvas') }) },
      vantaEffect: { setOptions }
    })
    freezeDynamicBackground(state)
    expect(setOptions).toHaveBeenCalledWith({ speed: 0 })
    expect(state.destroyVantaFog).not.toHaveBeenCalled()
  })

  it('recreates a galaxy renderer after clearing a frozen frame', () => {
    const state = makeState({ paused: false, frozenFrame: 'data:image/png;base64,frame' })
    resumeDynamicBackground(state)
    expect(state.frozenFrame).toBeNull()
    expect(state.initGalaxy).toHaveBeenCalledOnce()
  })

  it('resumes an existing Vanta renderer when no snapshot was needed', () => {
    const play = vi.fn()
    const state = makeState({ paused: false, type: 'vanta-fog', vantaEffect: { play } })
    resumeDynamicBackground(state)
    expect(play).toHaveBeenCalledOnce()
  })
})
