<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { currentColorScheme, publicColorScheme } from '../composables/useThemeStyle'

const route = useRoute()
const particleCanvas = ref(null)
const isShifting = ref(false)
const reducedMotion = ref(false)
const shiftKey = ref(0)
const shiftPhase = ref('idle')

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
let burstTimerId = null
let phaseTimerIds = []
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
let impactFlashes = []
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

  const connectionBins = [[], [], [], []]
  for (let i = 0; i < ambientParticles.length; i += 1) {
    const a = ambientParticles[i]
    for (let j = i + 1; j < ambientParticles.length; j += 1) {
      const b = ambientParticles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance >= maxDistance) continue
      const bin = Math.min(3, Math.floor((1 - distance / maxDistance) * 4))
      connectionBins[bin].push(a.x, a.y, b.x, b.y)
    }
  }
  const connectionAlphas = [0.025, 0.052, 0.082, 0.12]
  for (let bin = 0; bin < connectionBins.length; bin += 1) {
    const lines = connectionBins[bin]
    if (!lines.length) continue
    ctx.beginPath()
    for (let i = 0; i < lines.length; i += 4) {
      ctx.moveTo(lines[i], lines[i + 1])
      ctx.lineTo(lines[i + 2], lines[i + 3])
    }
    ctx.strokeStyle = `rgba(85, 197, 225, ${connectionAlphas[bin]})`
    ctx.lineWidth = 0.65
    ctx.stroke()
  }

  if (pointer.active) {
    ctx.beginPath()
    for (const particle of ambientParticles) {
      const dx = particle.x - pointer.x
      const dy = particle.y - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 1 && distance < 152) {
        ctx.moveTo(pointer.x, pointer.y)
        ctx.lineTo(particle.x, particle.y)
      }
    }
    ctx.strokeStyle = 'rgba(85, 230, 242, 0.14)'
    ctx.lineWidth = 0.8
    ctx.stroke()
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
    pulse.radius += (pulse.speed || 3.4) * delta
    pulse.life -= (pulse.decay || 0.032) * delta
    if (pulse.life <= 0) {
      localPulses.splice(i, 1)
      continue
    }
    ctx.strokeStyle = `rgba(${pulse.tone}, ${pulse.life * (pulse.alpha || 0.52)})`
    ctx.lineWidth = pulse.width || 1.1
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
      curvature: (Math.random() - 0.5) * 0.032,
      trailScale: 2.4 + Math.random() * 2.4,
      trailPoints: [],
      phase: Math.random() * Math.PI * 2,
      life: 28 + Math.random() * 40,
      maxLife: 68,
      age: 0,
      hasCollided: false,
      radius: 0.7 + Math.random() * 1.9,
      tone
    }
  })
  shockwaves = [
    { radius: 8, speed: 7.5, life: 1, tone: '85, 230, 242' },
    { radius: 8, speed: 5.3, life: 0.82, tone: '131, 169, 255' },
    { radius: 8, speed: 3.6, life: 0.64, tone: '255, 77, 134' }
  ]
  impactFlashes = [
    { x: cx, y: cy, radius: 2, life: 0.95, tone: '85, 230, 242' },
    { x: cx + 2, y: cy - 1, radius: 1.2, life: 0.72, tone: '255, 77, 134' }
  ]
}

function createClickSparks(x, y) {
  const count = Math.min(18, Math.max(0, 180 - burstParticles.length))
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.3 + Math.random() * 3.3
    burstParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      curvature: (Math.random() - 0.5) * 0.032,
      trailScale: 2.8 + Math.random() * 2.4,
      trailPoints: [],
      phase: Math.random() * Math.PI * 2,
      life: 16 + Math.random() * 12,
      maxLife: 28,
      age: 0,
      hasCollided: false,
      radius: 0.8 + Math.random() * 1.3,
      tone: pickTone()
    })
  }
}

function drawBurst(delta) {
  if (!context) return
  const ctx = context
  ctx.globalCompositeOperation = 'lighter'
  const cellSize = 12
  const collisionBins = new Map()
  let collisionsThisFrame = 0

  for (let i = burstParticles.length - 1; i >= 0; i -= 1) {
    const particle = burstParticles[i]
    const turn = (particle.curvature || 0) * delta
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const vx = particle.vx
    const vy = particle.vy
    const damping = Math.pow(0.986, delta)
    particle.vx = (vx * cos - vy * sin) * damping
    particle.vy = (vx * sin + vy * cos) * damping
    particle.x += particle.vx * delta
    particle.y += particle.vy * delta
    particle.age = (particle.age || 0) + delta
    particle.trailPoints ||= []
    particle.trailPoints.push({ x: particle.x, y: particle.y })
    if (particle.trailPoints.length > 8) particle.trailPoints.shift()
    particle.life -= delta
    if (particle.life <= 0) {
      burstParticles.splice(i, 1)
      continue
    }

    // Spatially bucket early burst particles so local collisions create brief, bounded flashes.
    const gridX = Math.floor(particle.x / cellSize)
    const gridY = Math.floor(particle.y / cellSize)
    if (particle.age <= 12 && !particle.hasCollided && collisionsThisFrame < 4) {
      for (let gx = gridX - 1; gx <= gridX + 1 && !particle.hasCollided; gx += 1) {
        for (let gy = gridY - 1; gy <= gridY + 1 && !particle.hasCollided; gy += 1) {
          const neighbors = collisionBins.get(String(gx) + ',' + String(gy)) || []
          for (const other of neighbors) {
            if (other.hasCollided || other.age > 12) continue
            const dx = particle.x - other.x
            const dy = particle.y - other.y
            if (dx * dx + dy * dy > 64) continue
            impactFlashes.push({
              x: (particle.x + other.x) / 2,
              y: (particle.y + other.y) / 2,
              radius: 1.2,
              life: 1,
              tone: particle.tone === other.tone ? particle.tone : '197, 251, 255'
            })
            if (impactFlashes.length > 12) impactFlashes.shift()
            particle.hasCollided = true
            other.hasCollided = true
            collisionsThisFrame += 1
            break
          }
        }
      }
    }
    const cellKey = String(gridX) + ',' + String(gridY)
    if (!collisionBins.has(cellKey)) collisionBins.set(cellKey, [])
    collisionBins.get(cellKey).push(particle)

    const pulse = 0.88 + 0.12 * Math.sin((particle.maxLife - particle.life) * 0.18 + (particle.phase || 0))
    const alpha = Math.min(1, particle.life / particle.maxLife) * 0.88 * pulse
    ctx.strokeStyle = `rgba(${particle.tone}, ${alpha})`
    ctx.lineWidth = Math.max(0.7, particle.radius * 0.86)
    ctx.beginPath()
    if (particle.trailPoints.length > 1) {
      const points = particle.trailPoints
      ctx.moveTo(points[0].x, points[0].y)
      for (let point = 1; point < points.length - 1; point += 1) {
        const current = points[point]
        const next = points[point + 1]
        ctx.quadraticCurveTo(
          current.x,
          current.y,
          (current.x + next.x) / 2,
          (current.y + next.y) / 2
        )
      }
      const last = points[points.length - 1]
      ctx.lineTo(last.x, last.y)
    } else {
      const trailScale = particle.trailScale || 3.2
      ctx.moveTo(particle.x - particle.vx * trailScale, particle.y - particle.vy * trailScale)
      ctx.lineTo(particle.x, particle.y)
    }
    ctx.stroke()
    ctx.fillStyle = `rgba(${particle.tone}, ${Math.min(1, alpha * 1.25)})`
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, Math.max(0.45, particle.radius * 0.62), 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = impactFlashes.length - 1; i >= 0; i -= 1) {
    const flash = impactFlashes[i]
    flash.radius += 3.2 * delta
    flash.life -= 0.085 * delta
    if (flash.life <= 0) {
      impactFlashes.splice(i, 1)
      continue
    }
    ctx.shadowColor = `rgba(${flash.tone}, ${flash.life})`
    ctx.shadowBlur = 12 * flash.life
    ctx.strokeStyle = `rgba(${flash.tone}, ${flash.life})`
    ctx.lineWidth = Math.max(0.7, 1.4 * flash.life)
    ctx.beginPath()
    ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(flash.x - flash.radius * 1.8, flash.y)
    ctx.lineTo(flash.x + flash.radius * 1.8, flash.y)
    ctx.moveTo(flash.x, flash.y - flash.radius * 1.8)
    ctx.lineTo(flash.x, flash.y + flash.radius * 1.8)
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
  ctx.shadowBlur = 0
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
  if (isShifting.value || burstParticles.length || shockwaves.length || impactFlashes.length) drawBurst(delta)

  if (isWorldlineActive.value || isShifting.value || burstParticles.length || shockwaves.length || impactFlashes.length) {
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

function clearShiftTimers() {
  if (typeof window === 'undefined') return
  if (shiftTimerId !== null) window.clearTimeout(shiftTimerId)
  if (burstTimerId !== null) window.clearTimeout(burstTimerId)
  phaseTimerIds.forEach(timerId => window.clearTimeout(timerId))
  shiftTimerId = null
  burstTimerId = null
  phaseTimerIds = []
}

function scheduleShiftPhase(delay, phase) {
  const timerId = window.setTimeout(() => {
    phaseTimerIds = phaseTimerIds.filter(id => id !== timerId)
    if (mounted && isShifting.value && !reducedMotion.value) shiftPhase.value = phase
  }, delay)
  phaseTimerIds.push(timerId)
}

function triggerShift() {
  if (!mounted || typeof window === 'undefined' || reducedMotion.value) return
  clearShiftTimers()
  shiftKey.value += 1
  isShifting.value = true
  shiftPhase.value = 'ignite'
  burstParticles = []
  shockwaves = []
  impactFlashes = []

  // One coordinated 1.32 s sequence: ignition -> propagation -> disruption -> readout -> decay.
  scheduleShiftPhase(100, 'propagate')
  scheduleShiftPhase(260, 'disrupt')
  scheduleShiftPhase(360, 'readout')
  scheduleShiftPhase(900, 'decay')

  burstTimerId = window.setTimeout(() => {
    burstTimerId = null
    if (!mounted || !isShifting.value || reducedMotion.value) return
    createBurst()
    startAnimation()
  }, 150)

  shiftTimerId = window.setTimeout(() => {
    isShifting.value = false
    shiftPhase.value = 'idle'
    shiftTimerId = null
    phaseTimerIds.forEach(timerId => window.clearTimeout(timerId))
    phaseTimerIds = []
  }, 1320)
  startAnimation()
}

function handleMotionPreferenceChange(event) {
  reducedMotion.value = event.matches
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    pointer.active = false
    clearShiftTimers()
    isShifting.value = false
    shiftPhase.value = 'idle'
    burstParticles = []
    shockwaves = []
    impactFlashes = []
    localPulses = []
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
  localPulses.push({ x: event.clientX, y: event.clientY, radius: 3, life: 1, tone: '85, 230, 242', speed: 4.2, decay: 0.04, alpha: 0.72, width: 1.35 })
  localPulses.push({ x: event.clientX, y: event.clientY, radius: 7, life: 0.72, tone: '255, 77, 134', speed: 3.1, decay: 0.035, alpha: 0.56, width: 0.9 })
  if (localPulses.length > 6) localPulses.splice(0, localPulses.length - 6)
  createClickSparks(event.clientX, event.clientY)
  startAnimation()
}

watch(isWorldlineActive, active => {
  if (!mounted) return
  if (!active) {
    pointer.active = false
    localPulses = []
  }
  if (active && !reducedMotion.value) startAnimation()
  else if (!active && !isShifting.value && !burstParticles.length && !shockwaves.length && !impactFlashes.length) stopAnimation()
})

watch(reducedMotion, reduced => {
  if (reduced) {
    pointer.active = false
    localPulses = []
    clearShiftTimers()
    isShifting.value = false
    shiftPhase.value = 'idle'
    burstParticles = []
    shockwaves = []
    impactFlashes = []
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
  window.addEventListener('pointerleave', handlePointerLeave)
  document.addEventListener('visibilitychange', visibilityHandler)
  resizeCanvas()
  if (showCanvas.value) startAnimation()
})

onBeforeUnmount(() => {
  mounted = false
  clearShiftTimers()
  stopAnimation()
  if (typeof window !== 'undefined') {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('blur', handlePointerLeave)
    window.removeEventListener('pointerleave', handlePointerLeave)
    if (mediaQuery && mediaChangeHandler) {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaChangeHandler)
      else mediaQuery.removeListener?.(mediaChangeHandler)
    }
  }
  if (visibilityHandler && typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibilityHandler)
})
</script>

<template>
  <svg v-if="isWorldlineActive" class="worldline-technical-backdrop" :class="{ 'is-shifting': isShifting }" :data-phase="shiftPhase" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="worldline-draft-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#83a9ff" stroke-opacity=".24" stroke-width=".55"/><path d="M16 0V32M0 16H32" fill="none" stroke="#55e6f2" stroke-opacity=".12" stroke-width=".35"/></pattern>
      <radialGradient id="worldline-backdrop-glow"><stop offset="0" stop-color="#55e6f2" stop-opacity=".12"/><stop offset="1" stop-color="#55e6f2" stop-opacity="0"/></radialGradient>
      <g id="worldline-gear-drawing" fill="none" stroke="currentColor"><circle r="112" stroke-width="1.2" stroke-dasharray="10 5"/><circle r="101" stroke-width=".65" stroke-dasharray="2 7"/><circle r="78"/><circle r="61" stroke-width=".6" stroke-dasharray="3 4"/><circle r="25" stroke-width="1.1"/><circle r="8"/><path d="M0-99V-27M0 27V99M-99 0H-27M27 0H99M-70-70L-19-19M19 19L70 70M70-70L19-19M-19 19L-70 70" stroke-width=".8"/><path d="M0-78L9-12L0 0L-9-12ZM78 0L12 9L0 0L12-9Z" stroke-width=".7"/><path d="M-5-116H5M-5 116H5M-116-5V5M116-5V5" stroke-width="3"/></g>
      <g id="worldline-drafting-reticle" fill="none" stroke="currentColor"><circle r="84" stroke-width=".8"/><circle r="68" stroke-width=".6" stroke-dasharray="2 5"/><circle r="36" stroke-width=".7"/><path d="M-112 0H112M0-112V112M-79-79L79 79M79-79L-79 79" stroke-width=".55"/><path d="M0-96L-5-84H5ZM96 0L84-5V5ZM0 96L-5 84H5ZM-96 0L-84-5V5Z" stroke-width=".8"/><circle r="4" stroke-width="1.2"/></g>
    </defs>
    <rect width="1600" height="1000" fill="url(#worldline-draft-grid)"/><ellipse cx="1180" cy="350" rx="390" ry="300" fill="url(#worldline-backdrop-glow)"/>
    <g v-if="isShifting" class="worldline-backdrop-shift-wave" fill="none" stroke="currentColor" aria-hidden="true">
      <circle class="worldline-backdrop-shift-wave__ring worldline-backdrop-shift-wave__ring--outer" cx="800" cy="500" r="72" stroke-width="1.2" stroke-dasharray="3 9"/>
      <circle class="worldline-backdrop-shift-wave__ring worldline-backdrop-shift-wave__ring--inner" cx="800" cy="500" r="48" stroke-width="1.8"/>
      <path d="M800 360V430M800 570V640M660 500H730M870 500H940M701 401L750 450M850 550L899 599M899 401L850 450M750 550L701 599" stroke-width=".9" stroke-dasharray="5 6"/>
      <circle cx="800" cy="500" r="5" fill="#ff4d86" stroke="none"/>
    </g>
    <g class="worldline-backdrop-drafting"><path d="M0 170H1600M0 500H1600M0 820H1600M240 0V1000M800 0V1000M1370 0V1000" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 9"/><path d="M70 90H430V390M1150 95H1515V420M75 690V920H450M1050 680H1515V930" fill="none" stroke="currentColor" stroke-width=".7"/><path d="M70 90h22m-22 0v22M430 390h-22m22 0v-22M1150 95h22m-22 0v22M1515 420h-22m22 0v-22M75 690h22m-22 0v22M450 920h-22m22 0v-22" stroke="currentColor" stroke-width="1.5"/></g>
    <g class="worldline-backdrop-gear" transform="translate(260 190) scale(1.18)"><g class="worldline-backdrop-gear-rotor"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear" transform="translate(510 110) scale(.56)"><g class="worldline-backdrop-gear-rotor worldline-backdrop-gear-rotor--reverse"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear worldline-backdrop-gear--mobile-anchor" transform="translate(800 190) scale(.43)"><g class="worldline-backdrop-gear-rotor"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear worldline-backdrop-gear--mobile-anchor" transform="translate(820 820) scale(.46)"><g class="worldline-backdrop-gear-rotor worldline-backdrop-gear-rotor--reverse"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear" transform="translate(1450 205) scale(.78)"><g class="worldline-backdrop-gear-rotor worldline-backdrop-gear-rotor--reverse"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear" transform="translate(145 785) scale(.46)"><g class="worldline-backdrop-gear-rotor"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-gear" transform="translate(1050 900) scale(.62)"><g class="worldline-backdrop-gear-rotor worldline-backdrop-gear-rotor--reverse"><use href="#worldline-gear-drawing"/></g></g>
    <g class="worldline-backdrop-reticle" transform="translate(810 300) scale(.82)"><use href="#worldline-drafting-reticle"/></g><g class="worldline-backdrop-reticle worldline-backdrop-reticle--slow" transform="translate(1210 735) scale(.72)"><use href="#worldline-drafting-reticle"/></g>
    <g class="worldline-backdrop-orbit"><ellipse cx="1110" cy="515" rx="310" ry="105" transform="rotate(-28 1110 515)" fill="none" stroke="currentColor" stroke-width=".9" stroke-dasharray="3 8"/><ellipse cx="1110" cy="515" rx="260" ry="76" transform="rotate(34 1110 515)" fill="none" stroke="#55e6f2" stroke-opacity=".68" stroke-width=".65"/><path d="M800 515C930 390 1090 660 1280 455S1480 390 1570 510" fill="none" stroke="#83a9ff" stroke-width="1.1" stroke-dasharray="5 8"/><circle cx="1280" cy="455" r="3" fill="#ff4d86" stroke="none"/><circle cx="1002" cy="481" r="2" fill="#55e6f2" stroke="none"/></g>
    <g class="worldline-backdrop-instrument" transform="translate(1260 110)"><rect width="245" height="126" rx="2" fill="#07111d" fill-opacity=".22" stroke="currentColor" stroke-width=".8"/><path d="M14 26H231M14 100H231M14 42H231M14 58H231M14 74H231M14 90H231" stroke="currentColor" stroke-opacity=".34" stroke-width=".45" stroke-dasharray="2 4"/><path d="M18 88L38 81L52 84L68 53L81 72L99 67L116 34L128 78L144 65L163 71L181 45L196 60L226 51" fill="none" stroke="#55e6f2" stroke-width="1.1"/><text x="14" y="16">SIGNAL TRACE / SCHEMATIC</text><text x="14" y="116">ILLUSTRATIVE DISPLAY · NOT DATA</text></g>
    <g class="worldline-backdrop-notes"><text x="75" y="145">FIELD NOTES / 01</text><text x="75" y="164">MODEL → OBSERVABLE</text><text x="480" y="390">SYMMETRY / CONSERVATION</text><text x="890" y="155">TEMPORAL REFERENCE</text><text x="1320" y="600">SIGNAL / TRACE</text><text x="75" y="955">FROM THE INFINITESIMAL TO THE INFINITE</text><text x="1230" y="955">WORLDLINE CONSOLE · VISUAL LAYER</text></g>
    <g class="worldline-backdrop-crosshairs" fill="none" stroke="currentColor"><path d="M680 650h52m-26-26v52M1530 765h42m-21-21v42M390 540h38m-19-19v38" stroke-width=".8"/><circle cx="706" cy="650" r="9" stroke-width=".65"/><circle cx="1551" cy="765" r="7" stroke-width=".65"/><circle cx="409" cy="540" r="5" stroke-width=".65"/><path d="M706 650L800 515M409 540L260 190M1551 765L1450 785" stroke-width=".5" stroke-dasharray="2 5"/></g>
  </svg>

  <canvas
    ref="particleCanvas"
    class="worldline-particle-canvas"
    :data-phase="shiftPhase"
    :class="{ 'is-visible': showCanvas }"
    aria-hidden="true"
  ></canvas>
  <div v-if="isShifting" :key="shiftKey" class="worldline-shift-overlay" :data-phase="shiftPhase" aria-hidden="true">
    <div class="worldline-shift-overlay__flash"></div>
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
