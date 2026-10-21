<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { currentColorScheme, publicColorScheme } from '../composables/useThemeStyle'

const route = useRoute()
const isShifting = ref(false)
const shiftKey = ref(0)
let timerId = null

function isWorldlineActive() {
  if (route.meta.public) return publicColorScheme.value === 'worldline-console'
  if (['/login', '/setup', '/quick-share'].includes(route.path)) return false
  return currentColorScheme.value === 'worldline-console'
}

function triggerShift() {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  shiftKey.value += 1
  isShifting.value = true
  if (timerId !== null) window.clearTimeout(timerId)
  timerId = window.setTimeout(() => {
    isShifting.value = false
    timerId = null
  }, 920)
}

watch(() => route.path, (next, previous) => {
  if (next !== previous && isWorldlineActive()) triggerShift()
})

watch([currentColorScheme, publicColorScheme], ([nextWorkspace, nextPublic], [previousWorkspace, previousPublic]) => {
  if (route.meta.public) {
    if (nextPublic !== previousPublic && (nextPublic === 'worldline-console' || previousPublic === 'worldline-console')) {
      triggerShift()
    }
    return
  }

  if (['/login', '/setup', '/quick-share'].includes(route.path)) return
  if (nextWorkspace !== previousWorkspace && (nextWorkspace === 'worldline-console' || previousWorkspace === 'worldline-console')) {
    triggerShift()
  }
})

onBeforeUnmount(() => {
  if (timerId !== null && typeof window !== 'undefined') window.clearTimeout(timerId)
})
</script>

<template>
  <div v-if="isShifting" :key="shiftKey" class="worldline-shift-overlay" aria-hidden="true">
    <div class="worldline-shift-overlay__hud">
      <span>WORLDLINE SHIFT / SYSTEM EVENT</span>
      <strong>世界线变动</strong>
      <small>观测状态已更新 · OBSERVATION UPDATED</small>
    </div>
  </div>
</template>
