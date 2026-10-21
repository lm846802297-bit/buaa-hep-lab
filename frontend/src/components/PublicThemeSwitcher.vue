<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useThemeStyle } from '../composables/useThemeStyle'

const props = defineProps({ inline: { type: Boolean, default: false } })
const { colorSchemes, publicColorScheme, setPublicColorScheme } = useThemeStyle()
const isOpen = ref(false)
const root = ref(null)
const activeSchemeName = computed(() => colorSchemes.find(scheme => scheme.id === publicColorScheme.value)?.name || 'Quiet Research')

function handleChange(event) {
  setPublicColorScheme(event.target.value)
  isOpen.value = false
}

function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

function onPointerDown(event) {
  if (isOpen.value && root.value && !root.value.contains(event.target)) closePanel()
}

function onKeydown(event) {
  if (event.key === 'Escape') closePanel()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="public-theme-switcher" :class="{ 'is-inline': props.inline, 'is-open': isOpen }">
    <button
      class="public-theme-trigger"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? 'public-theme-panel' : undefined"
      aria-label="切换官网风格"
      title="切换官网风格"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.3-3.5 1.7 1.7 0 0 1 1.1-3h1.4A4 4 0 0 0 21 10.5C21 6.4 16.97 3 12 3Z" />
        <circle cx="7.5" cy="10" r="1" />
        <circle cx="11" cy="6.8" r="1" />
        <circle cx="15.2" cy="7.8" r="1" />
      </svg>
      <span class="theme-trigger-dot" aria-hidden="true"></span>
    </button>

    <div v-if="isOpen" id="public-theme-panel" class="public-theme-panel" role="group" aria-label="官网外观设置">
      <div class="panel-heading">
        <div>
          <strong>官网风格</strong>
          <p>选择公开网站的显示风格</p>
        </div>
        <button class="panel-close" type="button" aria-label="关闭官网风格面板" @click="closePanel">×</button>
      </div>
      <label class="sr-only" for="public-theme-select">选择官网皮肤风格</label>
      <select
        id="public-theme-select"
        :value="publicColorScheme"
        aria-label="选择官网皮肤风格"
        @change="handleChange"
      >
        <option v-for="scheme in colorSchemes" :key="scheme.id" :value="scheme.id">
          {{ scheme.name }}
        </option>
      </select>
      <p class="theme-current" role="status">当前风格：{{ activeSchemeName }}</p>
    </div>
  </div>
</template>

<style scoped>
.public-theme-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10010;
}
.public-theme-switcher.is-inline {
  position: relative;
  top: auto;
  right: auto;
  z-index: 40;
  flex: 0 0 auto;
}
.public-theme-trigger {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 8px 22px rgb(0 0 0 / 14%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: pointer;
  transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
}
.public-theme-trigger svg { width: 21px; height: 21px; }
.public-theme-trigger:hover,
.public-theme-trigger[aria-expanded="true"] {
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%), 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
}
.public-theme-trigger:hover { transform: translateY(-1px); }
.public-theme-trigger:focus-visible,
.panel-close:focus-visible,
.public-theme-panel select:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
.theme-trigger-dot {
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 6px;
  height: 6px;
  border: 1px solid var(--surface);
  border-radius: 50%;
  background: var(--accent);
}
.public-theme-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  box-sizing: border-box;
  width: min(300px, calc(100vw - 28px));
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 18px 48px rgb(0 0 0 / 20%);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.panel-heading strong { display: block; font-size: 14px; font-weight: 600; }
.panel-heading p { margin: 5px 0 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
.panel-close {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.public-theme-panel select {
  display: block;
  width: 100%;
  min-height: 42px;
  margin: 0;
  padding: 8px 34px 8px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}
.theme-current { margin: 11px 0 0; color: var(--muted); font-size: 11px; line-height: 1.6; }
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 520px) {
  .public-theme-switcher:not(.is-inline) { top: 12px; right: 12px; }
  .public-theme-trigger { width: 42px; height: 42px; }
}
@media (prefers-reduced-motion: reduce) {
  .public-theme-trigger { transition: none; }
}
</style>
