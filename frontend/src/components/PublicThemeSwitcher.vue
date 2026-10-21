<script setup>
import { useThemeStyle } from '../composables/useThemeStyle'

const { colorSchemes, publicColorScheme, setPublicColorScheme } = useThemeStyle()

function handleChange(event) {
  setPublicColorScheme(event.target.value)
}
</script>

<template>
  <div class="public-theme-switcher" role="group" aria-label="官网外观设置">
    <span class="switcher-label" aria-hidden="true">官网风格</span>
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
  </div>
</template>

<style scoped>
.public-theme-switcher {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: calc(100vw - 24px);
  padding: 8px 10px 8px 13px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 8px 26px rgb(0 0 0 / 16%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.switcher-label {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}
.public-theme-switcher select {
  width: auto;
  max-width: min(230px, 58vw);
  min-height: 34px;
  margin: 0;
  padding: 6px 28px 6px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}
.public-theme-switcher select:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
@media (max-width: 520px) {
  .public-theme-switcher {
    right: 10px;
    bottom: 10px;
    gap: 6px;
    padding: 6px 7px 6px 10px;
  }
  .switcher-label { font-size: 10px; }
  .public-theme-switcher select { max-width: 58vw; font-size: 11px; }
}
</style>
