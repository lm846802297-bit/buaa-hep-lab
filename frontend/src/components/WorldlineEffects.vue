<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { currentColorScheme, publicColorScheme } from '../composables/useThemeStyle'

const route = useRoute()
const particleCanvas = ref(null)
const isShifting = ref(false)
const reducedMotion = ref(false)
const shiftKey = ref(0)

const excludedRoutes = ['/login', '/setup', '/quick-share']
const isWorldlineActive = computed(() => {
  if (route.meta.public) return publicColorScheme.value === 'worldline-console'
  if (excludedRoutes.includes(route.path)) return false
  return currentColorScheme.value === 'worldline-console'
})
const showCanvas = computed(() => !reducedMotion.value && (isWorldlineActive.value || isShifting.value))

let mounted = false
let animationFrameId = null
let shiftTimerId = null
let mediaQuery = null
let resizeHandler = null
let visibilityHandler = null
let mediaChangeHandler = null
let context = null
let width = 0
let height = 0
let pixelRatio = 1
let lastFrameTime = 0
let ambientParticles = []
let burstParticles = []
let shockwaves = []
let localPulses = []
let pointer = { x: 0, y: 0, active: false }

const particleTones = [
  { color: '85, 230, 242', weight: 0.52 },
  { color: '131, 169, 255', weight: 0.35 },
  { color: '255, 77, 134', weight: 0.13 }
]

function pickTone() {
  const value = Math.random()
  let sum = 0
  for (const tone of particleTones) {
    sum += tone.weight
    if (value <= sum) return tone.color
  }
  return particleTones[0].color
}

function clearCanvas() {
  if (context && width > 0 && height > 0) context.clearRect(0, 0, width, height)
}

function resizeCanvas() {
  const canvas = particleCanvas.value
  if (!canvas || typeof window === 'undefined') return
  width = Math.max(1, window.innerWidth)
  height = Math.max(1, window.innerHeight)
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  const count = width < 640 ? 28 : Math.min(92, Math.max(52, Math.round(width * height / 18000)))
  ambientParticles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.20,
    radius: 0.55 + Math.random() * 1.25,
    phase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.35 + Math.random() * 0.75,
    tone: pickTone()
  }))
}

function drawAmbient(time, delta) {
  if (!context) return
  const ctx = context
  const maxDistance = width < 640 ? 88 : 132
  ctx.globalCompositeOperation = 'screen'

  for (const particle of ambientParticles) {
    particle.x += particle.vx * delta
    particle.y += particle.vy * delta
    if (pointer.active) {
      const dx = particle.x - pointer.x
      const dy = particle.y - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 1 && distance < 145) {
        const force = (1 - distance / 145) * 1.4 * delta
        particle.x += (dx / distance) * force
        particle.y += (dy / distance) * force
      }
    }
    if (particle.x < -8) particle.x = width + 8
    if (particle.x > width + 8) particle.x = -8
    if (particle.y < -8) particle.y = height + 8
    if (particle.y > height + 8) particle.y = -8
  }

  for (let i = 0; i < ambientParticles.length; i += 1) {
    const a = ambientParticles[i]
    for (let j = i + 1; j < ambientParticles.length; j += 1) {
      const b = ambientParticles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance >= maxDistance) continue
      const alpha = (1 - distance / maxDistance) * 0.12
      ctx.strokeStyle = `rgba(85, 197, 225, ${alpha})`
      ctx.lineWidth = 0.65
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  if (pointer.active) {
    for (const particle of ambientParticles) {
      const dx = particle.x - pointer.x
      const dy = particle.y - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 1 && distance < 152) {
        const alpha = (1 - distance / 152) * 0.24
        ctx.strokeStyle = `rgba(85, 230, 242, ${alpha})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(pointer.x, pointer.y)
        ctx.lineTo(particle.x, particle.y)
        ctx.stroke()
      }
    }
    const radius = 18 + 3 * Math.sin(time * 0.006)
    ctx.strokeStyle = 'rgba(85, 230, 242, 0.34)'
    ctx.lineWidth = 0.9
    ctx.beginPath()
    ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pointer.x - 26, pointer.y)
    ctx.lineTo(pointer.x - 12, pointer.y)
    ctx.moveTo(pointer.x + 12, pointer.y)
    ctx.lineTo(pointer.x + 26, pointer.y)
    ctx.moveTo(pointer.x, pointer.y - 26)
    ctx.lineTo(pointer.x, pointer.y - 12)
    ctx.moveTo(pointer.x, pointer.y + 12)
    ctx.lineTo(pointer.x, pointer.y + 26)
    ctx.stroke()
  }

  for (const particle of ambientParticles) {
    const pulse = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(time * 0.001 * particle.pulseSpeed + particle.phase))
    ctx.fillStyle = `rgba(${particle.tone}, ${0.20 + pulse * 0.36})`
    ctx.shadowColor = `rgba(${particle.tone}, 0.46)`
    ctx.shadowBlur = particle.radius > 1.2 ? 7 : 4
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.radius * (0.78 + pulse * 0.22), 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = localPulses.length - 1; i >= 0; i -= 1) {
    const pulse = localPulses[i]
    pulse.radius += 3.4 * delta
    pulse.life -= 0.032 * delta
    if (pulse.life <= 0) {
      localPulses.splice(i, 1)
      continue
    }
    ctx.strokeStyle = `rgba(${pulse.tone}, ${pulse.life * 0.52})`
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.globalCompositeOperation = 'source-over'
}

function createBurst() {
  if (width < 1 || height < 1) resizeCanvas()
  const cx = width / 2
  const cy = height / 2
  const count = width < 640 ? 68 : 132
  burstParticles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.8 + Math.random() * (width < 640 ? 4.0 : 6.8)
    const tone = pickTone()
    return {
      x: cx + (Math.random() - 0.5) * 12,
      y: cy + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 34 + Math.random() * 46,
      maxLife: 80,
      radius: 0.7 + Math.random() * 1.9,
      tone
    }
  })
  shockwaves = [
    { radius: 8, speed: 7.5, life: 1, tone: '85, 230, 242' },
    { radius: 8, speed: 5.3, life: 0.82, tone: '131, 169, 255' },
    { radius: 8, speed: 3.6, life: 0.64, tone: '255, 77, 134' }
  ]
}

function drawBurst(delta) {
  if (!context) return
  const ctx = context
  ctx.globalCompositeOperation = 'lighter'

  for (let i = burstParticles.length - 1; i >= 0; i -= 1) {
    const particle = burstParticles[i]
    particle.x += particle.vx * delta
    particle.y += particle.vy * delta
    particle.vx *= Math.pow(0.986, delta)
    particle.vy *= Math.pow(0.986, delta)
    particle.life -= delta
    if (particle.life <= 0) {
      burstParticles.splice(i, 1)
      continue
    }
    const alpha = Math.min(1, particle.life / particle.maxLife) * 0.88
    ctx.strokeStyle = `rgba(${particle.tone}, ${alpha})`
    ctx.lineWidth = particle.radius
    ctx.beginPath()
    ctx.moveTo(particle.x - particle.vx * 3.2, particle.y - particle.vy * 3.2)
    ctx.lineTo(particle.x, particle.y)
    ctx.stroke()
  }

  for (let i = shockwaves.length - 1; i >= 0; i -= 1) {
    const wave = shockwaves[i]
    wave.radius += wave.speed * delta
    wave.life -= 0.024 * delta
    if (wave.life <= 0) {
      shockwaves.splice(i, 1)
      continue
    }
    ctx.strokeStyle = `rgba(${wave.tone}, ${Math.max(0, wave.life * 0.48)})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, wave.radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function renderFrame(time) {
  animationFrameId = null
  if (!mounted || reducedMotion.value || document.visibilityState === 'hidden') {
    clearCanvas()
    return
  }
  if (!context) resizeCanvas()
  if (!context) return

  const delta = lastFrameTime ? Math.min(2.2, Math.max(0.5, (time - lastFrameTime) / 16.667)) : 1
  lastFrameTime = time
  clearCanvas()
  if (isWorldlineActive.value) drawAmbient(time, delta)
  if (isShifting.value || burstParticles.length || shockwaves.length) drawBurst(delta)

  if (isWorldlineActive.value || isShifting.value || burstParticles.length || shockwaves.length) {
    animationFrameId = window.requestAnimationFrame(renderFrame)
  } else {
    lastFrameTime = 0
  }
}

function startAnimation() {
  if (!mounted || reducedMotion.value || document.visibilityState === 'hidden' || animationFrameId !== null) return
  if (!context) resizeCanvas()
  if (!context) return
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function stopAnimation(clear = true) {
  if (animationFrameId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = null
  lastFrameTime = 0
  if (clear) clearCanvas()
}

function triggerShift() {
  if (!mounted || typeof window === 'undefined' || reducedMotion.value) return
  shiftKey.value += 1
  isShifting.value = true
  createBurst()
  if (shiftTimerId !== null) window.clearTimeout(shiftTimerId)
  shiftTimerId = window.setTimeout(() => {
    isShifting.value = false
    shiftTimerId = null
  }, 1320)
  startAnimation()
}

function handleMotionPreferenceChange(event) {
  reducedMotion.value = event.matches
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    pointer.active = false
    stopAnimation(false)
    return
  }
  if (showCanvas.value) startAnimation()
}

function handlePointerMove(event) {
  if (!isWorldlineActive.value || reducedMotion.value || event.pointerType === 'touch') return
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.active = true
}

function handlePointerLeave() {
  pointer.active = false
}

function handlePointerDown(event) {
  if (!isWorldlineActive.value || reducedMotion.value) return
  localPulses.push({ x: event.clientX, y: event.clientY, radius: 3, life: 1, tone: pickTone() })
  if (localPulses.length > 6) localPulses.shift()
  startAnimation()
}

watch(isWorldlineActive, active => {
  if (!mounted) return
  if (!active) {
    pointer.active = false
    localPulses = []
  }
  if (active && !reducedMotion.value) startAnimation()
  else if (!active && !isShifting.value && !burstParticles.length && !shockwaves.length) stopAnimation()
})

watch(reducedMotion, reduced => {
  if (reduced) {
    pointer.active = false
    localPulses = []
    if (shiftTimerId !== null && typeof window !== 'undefined') window.clearTimeout(shiftTimerId)
    shiftTimerId = null
    isShifting.value = false
    burstParticles = []
    shockwaves = []
    stopAnimation()
  } else if (showCanvas.value) {
    startAnimation()
  }
})

watch(() => route.path, (next, previous) => {
  if (next !== previous && isWorldlineActive.value) triggerShift()
})

watch([currentColorScheme, publicColorScheme], ([nextWorkspace, nextPublic], [previousWorkspace, previousPublic]) => {
  if (route.meta.public) {
    if (nextPublic !== previousPublic && (nextPublic === 'worldline-console' || previousPublic === 'worldline-console')) {
      triggerShift()
    }
    return
  }

  if (excludedRoutes.includes(route.path)) return
  if (nextWorkspace !== previousWorkspace && (nextWorkspace === 'worldline-console' || previousWorkspace === 'worldline-console')) {
    triggerShift()
  }
})

onMounted(() => {
  mounted = true
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = mediaQuery.matches
  mediaChangeHandler = handleMotionPreferenceChange
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaChangeHandler)
  else mediaQuery.addListener?.(mediaChangeHandler)

  resizeHandler = () => {
    resizeCanvas()
    if (showCanvas.value && !reducedMotion.value) startAnimation()
  }
  visibilityHandler = handleVisibilityChange
  window.addEventListener('resize', resizeHandler, { passive: true })
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  window.addEventListener('blur', handlePointerLeave)
  document.addEventListener('visibilitychange', visibilityHandler)
  resizeCanvas()
  if (showCanvas.value) startAnimation()
})

onBeforeUnmount(() => {
  mounted = false
  if (shiftTimerId !== null && typeof window !== 'undefined') window.clearTimeout(shiftTimerId)
  stopAnimation()
  if (typeof window !== 'undefined') {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('blur', handlePointerLeave)
    if (mediaQuery && mediaChangeHandler) {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaChangeHandler)
      else mediaQuery.removeListener?.(mediaChangeHandler)
    }
  }
  if (visibilityHandler && typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibilityHandler)
})
</script>

<template>
  <canvas
    ref="particleCanvas"
    class="worldline-particle-canvas"
    :class="{ 'is-visible': showCanvas }"
    aria-hidden="true"
  ></canvas>
  <div v-if="isShifting" :key="shiftKey" class="worldline-shift-overlay" aria-hidden="true">
    <div class="worldline-shift-overlay__dial">
      <span class="worldline-shift-overlay__dial-ring worldline-shift-overlay__dial-ring--outer"></span>
      <span class="worldline-shift-overlay__dial-ticks"></span>
      <span class="worldline-shift-overlay__dial-ring worldline-shift-overlay__dial-ring--inner"></span>
      <span class="worldline-shift-overlay__dial-cross"></span>
      <span class="worldline-shift-overlay__dial-core"></span>
    </div>
    <div class="worldline-shift-overlay__glitch worldline-shift-overlay__glitch--a"></div>
    <div class="worldline-shift-overlay__glitch worldline-shift-overlay__glitch--b"></div>
    <div class="worldline-shift-overlay__glitch worldline-shift-overlay__glitch--c"></div>
    <div class="worldline-shift-overlay__hud">
      <span>WORLDLINE SHIFT / FIELD RECONFIGURATION</span>
      <strong>世界线变动</strong>
      <div class="worldline-shift-overlay__meter"><span></span></div>
      <small>OBSERVATION STATE RECONFIGURED · VISUAL EVENT</small>
    </div>
  </div>
</template>
