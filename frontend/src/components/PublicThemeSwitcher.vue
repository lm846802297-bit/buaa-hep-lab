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
      <svg class="theme-tuner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle class="tuner-orbit" cx="12" cy="12" r="7.85" />
        <path class="tuner-axis" d="M12 2.9v2.35 M12 18.75v2.35 M2.9 12h2.35 M18.75 12h2.35" />
        <path class="tuner-core" d="M12 8.55 13.25 10.75 15.45 12 13.25 13.25 12 15.45 10.75 13.25 8.55 12 10.75 10.75Z" />
        <circle class="tuner-node" cx="6.15" cy="7.15" r="1.35" />
        <circle class="tuner-node" cx="17.85" cy="16.85" r="1.35" />
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
  border: 1px solid var(--theme-tuner-button-border, color-mix(in srgb, var(--line) 70%, var(--accent) 30%));
  border-radius: 14px;
  background: var(--theme-tuner-button-background, linear-gradient(145deg, color-mix(in srgb, var(--surface) 92%, var(--accent) 8%), var(--surface)));
  color: var(--text);
  box-shadow: var(--theme-tuner-button-shadow, 0 6px 18px rgb(0 0 0 / 12%), inset 0 1px 0 rgb(255 255 255 / 8%));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease;
}
.theme-tuner-icon {
  width: 23px;
  height: 23px;
  overflow: visible;
  transition: transform .2s cubic-bezier(.2, .75, .25, 1);
}
.tuner-orbit { stroke: var(--theme-tuner-ring, color-mix(in srgb, currentColor 74%, var(--accent) 26%)); stroke-width: 1.3; opacity: .9; }
.tuner-axis { stroke: var(--theme-tuner-axis, color-mix(in srgb, currentColor 52%, transparent)); stroke-width: 1.2; }
.tuner-core {
  stroke: var(--theme-tuner-core, var(--accent));
  stroke-width: 1.3;
  fill: var(--theme-tuner-core-fill, color-mix(in srgb, var(--accent) 16%, transparent));
  transition: fill .18s ease;
}
.tuner-node { fill: var(--theme-tuner-node, var(--accent)); stroke: var(--theme-tuner-node-stroke, var(--surface)); stroke-width: 1.1; }
.public-theme-trigger:hover,
.public-theme-trigger[aria-expanded="true"] {
  border-color: var(--theme-tuner-node, var(--accent));
  box-shadow: var(--theme-tuner-button-hover-shadow, 0 8px 24px rgb(0 0 0 / 16%), 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent), inset 0 1px 0 rgb(255 255 255 / 10%));
}
.public-theme-trigger:hover { transform: translateY(-1px); }
.public-theme-trigger:hover .theme-tuner-icon { transform: rotate(-6deg); }
.public-theme-trigger:hover .tuner-core,
.public-theme-trigger[aria-expanded="true"] .tuner-core { fill: var(--theme-tuner-core-hover-fill, color-mix(in srgb, var(--accent) 25%, transparent)); }
.public-theme-trigger:active { transform: scale(.97); }
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
  background: var(--theme-tuner-node, var(--accent));
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
  .public-theme-trigger,
  .theme-tuner-icon,
  .tuner-core { transition: none; }
  .public-theme-trigger:hover,
  .public-theme-trigger:active,
  .public-theme-trigger:hover .theme-tuner-icon { transform: none; }
}
</style>
