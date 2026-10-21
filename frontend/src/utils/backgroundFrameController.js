export function freezeDynamicBackground(state) {
  if (!state.paused) return
  const type = state.type
  if (type !== 'galaxy' && type !== 'vanta-fog') return

  let frame = ''
  if (state.canvas) {
    try {
      frame = state.canvas.toDataURL()
    } catch (error) {
      console.warn('Could not snapshot the current background frame:', error)
    }
  }
  state.frozenFrame = frame || null

  if (type === 'galaxy') {
    if (frame) state.destroyGalaxy()
    else if (state.animateId) {
      state.cancelAnimationFrame(state.animateId)
      state.animateId = null
    }
    return
  }

  if (frame) state.destroyVantaFog()
  else if (state.vantaEffect && typeof state.vantaEffect.setOptions === 'function') {
    state.vantaEffect.setOptions({ speed: 0 })
  } else if (state.vantaEffect && typeof state.vantaEffect.pause === 'function') {
    state.vantaEffect.pause()
  }
}

export function resumeDynamicBackground(state) {
  if (state.paused) return
  const type = state.type
  const hadFrozenFrame = Boolean(state.frozenFrame)
  state.frozenFrame = null

  if (type === 'galaxy') {
    if (hadFrozenFrame || !state.renderer || !state.mesh) {
      state.initGalaxy().catch(state.onMediaLoaded)
    } else if (!state.animateId) {
      state.lastTimestamp = state.now()
      state.animateId = state.requestAnimationFrame(state.update)
    }
    return
  }

  if (type === 'vanta-fog') {
    if (hadFrozenFrame || !state.vantaEffect) {
      state.initVantaFog().catch(state.onMediaLoaded)
    } else if (typeof state.vantaEffect.play === 'function') {
      state.vantaEffect.play()
    } else if (typeof state.vantaEffect.setOptions === 'function') {
      state.vantaEffect.setOptions({ speed: state.path === '/login' ? 2.0 : 0.4 })
    }
  }
}
