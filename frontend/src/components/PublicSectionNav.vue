<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({ keepArtClear: Boolean })

const sections = [
  { id: 'top', number: '00', label: '首页' },
  { id: 'research', number: '01', label: '研究方向' },
  { id: 'research-guides', number: '02', label: '专题导读' },
  { id: 'publications', number: '03', label: '代表成果' },
  { id: 'physics-resources', number: '04', label: '物理资源' },
  { id: 'about', number: '05', label: '关于我们' },
  { id: 'collaboration', number: '06', label: '组内协作' },
]

const activeId = ref('top')
const isOpen = ref(false)
let animationFrame = 0

function updateActiveSection() {
  if (typeof window === 'undefined') return
  const threshold = Math.min(window.innerHeight * 0.32, 260)
  let current = sections[0].id

  for (const section of sections) {
    const element = document.getElementById(section.id)
    if (element && element.getBoundingClientRect().top <= threshold) current = section.id
  }

  activeId.value = current
}

function scheduleActiveSectionUpdate() {
  if (typeof window === 'undefined' || animationFrame) return
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = 0
    updateActiveSection()
  })
}

function navigateTo(id) {
  const target = document.getElementById(id)
  isOpen.value = false
  if (!target) return

  activeId.value = id
  const hash = `#${id}`
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  const initialHash = window.location.hash.slice(1)
  if (sections.some(section => section.id === initialHash)) activeId.value = initialHash

  window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true })
  window.addEventListener('resize', scheduleActiveSectionUpdate, { passive: true })
  window.addEventListener('popstate', scheduleActiveSectionUpdate)
  window.addEventListener('hashchange', scheduleActiveSectionUpdate)
  scheduleActiveSectionUpdate()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', scheduleActiveSectionUpdate)
  window.removeEventListener('resize', scheduleActiveSectionUpdate)
  window.removeEventListener('popstate', scheduleActiveSectionUpdate)
  window.removeEventListener('hashchange', scheduleActiveSectionUpdate)
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <Teleport to="body">
    <aside class="public-section-nav" :class="{ 'public-section-nav--art-clear': keepArtClear }" aria-label="页面快捷目录">
    <span class="public-section-nav__title" aria-hidden="true">目录</span>
    <button
      class="public-section-nav__toggle"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="public-section-nav-links"
      :aria-label="isOpen ? '关闭页面目录' : '打开页面目录'"
      @click="isOpen = !isOpen"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 6.5h14M5 12h14M5 17.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
      <span>目录</span>
    </button>

    <nav id="public-section-nav-links" class="public-section-nav__links" :class="{ 'is-open': isOpen }" aria-label="页面目录">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        :class="{ 'is-active': activeId === section.id }"
        :aria-label="section.label"
        :aria-current="activeId === section.id ? 'location' : undefined"
        @click.prevent="navigateTo(section.id)"
      >
        <span class="public-section-nav__number">{{ section.number }}</span>
        <span class="public-section-nav__label">{{ section.label }}</span>
      </a>
    </nav>
    </aside>
  </Teleport>
</template>

<style scoped>
.public-section-nav {
  position: fixed;
  z-index: 55;
  top: 50%;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  transform: translateY(-50%);
  color: var(--text);
}

.public-section-nav__title {
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: .14em;
}

.public-section-nav__links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.public-section-nav__links a {
  position: relative;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, #f6f4ee 86%, transparent);
  color: #263f5a;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease;
}

.public-section-nav__links a:hover,
.public-section-nav__links a:focus-visible,
.public-section-nav__links a.is-active {
  border-color: var(--accent);
  background: var(--raised);
  color: var(--accent);
}

.public-section-nav__links a:hover,
.public-section-nav__links a:focus-visible {
  transform: translateX(-2px);
}

.public-section-nav__label {
  position: absolute;
  top: 50%;
  right: calc(100% + 9px);
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-solid);
  box-shadow: var(--shadow);
  color: var(--text);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(4px, -50%);
  transition: opacity .16s ease, transform .16s ease;
}

.public-section-nav__links a:hover .public-section-nav__label,
.public-section-nav__links a:focus-visible .public-section-nav__label {
  opacity: 1;
  transform: translate(0, -50%);
}

.public-section-nav__toggle {
  display: none;
}

/* Keep the Worldline detector pixels clear of the blurred navigation glass. */
@media (min-width: 821px) {
  .public-section-nav--art-clear { right: auto; left: 12px; }
}
@media (min-width: 1101px) {
  .public-section-nav--art-clear .public-section-nav__label {
    left: calc(100% + 9px);
    right: auto;
    transform: translate(-4px, -50%);
  }
  .public-section-nav--art-clear .public-section-nav__links a:hover .public-section-nav__label,
  .public-section-nav--art-clear .public-section-nav__links a:focus-visible .public-section-nav__label {
    transform: translate(0, -50%);
  }
}

@media (max-width: 1100px) {
  .public-section-nav {
    top: auto;
    right: 16px;
    bottom: max(18px, env(safe-area-inset-bottom, 0px));
    align-items: flex-end;
    transform: none;
  }

  .public-section-nav__title {
    display: none;
  }

  .public-section-nav__toggle {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 15px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--panel-solid);
    box-shadow: var(--shadow);
    color: var(--text);
    font-size: 13px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .public-section-nav__toggle svg {
    width: 17px;
    height: 17px;
  }

  .public-section-nav__links {
    position: absolute;
    right: 0;
    bottom: calc(100% + 10px);
    display: none;
    width: 188px;
    align-items: stretch;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--panel-solid);
    box-shadow: var(--shadow);
  }

  .public-section-nav__links.is-open {
    display: flex;
  }

  .public-section-nav__links a {
    display: flex;
    width: 100%;
    height: auto;
    min-height: 42px;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 10px;
    background: transparent;
    font-size: 13px;
    transform: none;
  }

  .public-section-nav__links a:hover,
  .public-section-nav__links a:focus-visible,
  .public-section-nav__links a.is-active {
    background: var(--raised);
  }

  .public-section-nav__number {
    width: 22px;
    color: var(--muted);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }

  .public-section-nav__label {
    position: static;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    font-size: 13px;
    opacity: 1;
    transform: none;
  }
}

@media (min-width: 821px) and (max-width: 1100px) {
  .public-section-nav.public-section-nav--art-clear { right: auto; left: 16px; align-items: flex-start; }
  .public-section-nav--art-clear .public-section-nav__links { right: auto; left: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .public-section-nav__links a,
  .public-section-nav__label {
    transition: none;
  }
}
</style>
