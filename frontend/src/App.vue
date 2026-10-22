<script setup>
import { computed, ref, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
const Navbar = defineAsyncComponent(() => import('./components/Navbar.vue'))
const MobileHeader = defineAsyncComponent(() => import('./components/MobileHeader.vue'))
const MobileNavBar = defineAsyncComponent(() => import('./components/MobileNavBar.vue'))
const FeedbackHost = defineAsyncComponent(() => import('./components/FeedbackHost.vue'))
const NoticeScanBanner = defineAsyncComponent(() => import('./components/NoticeScanBanner.vue'))
const PublicThemeSwitcher = defineAsyncComponent(() => import('./components/PublicThemeSwitcher.vue'))
const WorldlineEffects = defineAsyncComponent(() => import('./components/WorldlineEffects.vue'))
const ForecastAtmosphere = defineAsyncComponent(() => import('./components/ForecastAtmosphere.vue'))
const MidAutumnMooncakes = defineAsyncComponent(() => import('./components/MidAutumnMooncakes.vue'))
const NationalDayCelebration = defineAsyncComponent(() => import('./components/NationalDayCelebration.vue'))
const SystemTutorialModal = defineAsyncComponent(() => import('./components/SystemTutorialModal.vue'))
const DemoModeBanner = defineAsyncComponent(() => import('./components/DemoModeBanner.vue'))
import { enterPage, leavePage } from './composables/motion'
import { useTutorial } from './composables/useTutorial'
import { isDemoMode } from './mock/isDemo'
import { applyThemeToDOM, currentBgType, currentColorScheme } from './composables/useThemeStyle'

const WorkspaceSession = defineAsyncComponent(() => import('./components/WorkspaceSession.vue'))

const route = useRoute()
const isPublic = computed(() => !!route.meta.public)
watch(isPublic, value => {
  document.documentElement.dataset.publicPage = String(value)
  // Keep the public site on its brand theme, then restore the user's selected
  // workspace theme automatically when navigating back into the collaboration area.
  applyThemeToDOM(currentColorScheme.value, currentBgType.value)
}, { immediate: true })
const showNavbar = computed(() => !isPublic.value && !['/login', '/quick-share', '/setup'].includes(route.path))
const isHome = computed(() => route.path === '/hub')
const isAssistant = computed(() => route.path === '/assistant')
const isDemo = computed(() => isDemoMode())
const isExcludedRoute = computed(() => isPublic.value || ['/setup', '/login', '/quick-share'].includes(route.path))

const isPinned = ref(localStorage.getItem('sidebar_pinned') === 'true')

const { openTutorial, closeTutorial, showTutorial } = useTutorial()
let checkedTutorialToken = null
let tutorialCheckToken = null
let tutorialCheckPromise = null

function tutorialIsCompleted(user) {
  const value = user?.tutorial_completed ?? user?.is_tutorial_completed
  return value === true || value === 1 || value === '1'
}

function cachedTutorialBelongsToUser(cachedUser, user) {
  if (!cachedUser || !user) return false
  if (cachedUser.id != null && user.id != null) {
    return String(cachedUser.id) === String(user.id)
  }
  return Boolean(
    cachedUser.email &&
    user.email &&
    String(cachedUser.email).trim().toLowerCase() === String(user.email).trim().toLowerCase()
  )
}

async function checkTutorialEligibility() {
  const token = localStorage.getItem('laborbit_token') || localStorage.getItem('labhub_token')
  if (!token || isPublic.value || route.path === '/setup' || route.path === '/login' || route.path === '/quick-share') return

  if (checkedTutorialToken === token) return
  if (tutorialCheckPromise && tutorialCheckToken === token) return tutorialCheckPromise

  const promise = (async () => {
    try {
      const { authApi } = await import('./api/client')
      const user = await authApi.getMe()
      const currentToken = localStorage.getItem('laborbit_token') || localStorage.getItem('labhub_token')
      if (!user || currentToken !== token) return

      checkedTutorialToken = token
      if (tutorialIsCompleted(user)) return

      // Older frontend builds could mark the tutorial complete locally while
      // the API endpoint was missing. Honor that state for the same account,
      // then backfill it to D1 so the tutorial does not reappear on this or
      // another device.
      let cachedUser = null
      try {
        cachedUser = JSON.parse(localStorage.getItem('labhub_user') || localStorage.getItem('laborbit_user') || 'null')
      } catch {}
      if (tutorialIsCompleted(cachedUser) && cachedTutorialBelongsToUser(cachedUser, user)) {
        try {
          await authApi.completeTutorial()
        } catch {
          // Keep the local dismissal effective if the network is temporarily unavailable.
        }
        return
      }

      openTutorial({ role: user.role, mandatory: true })
    } catch {}
  })()

  tutorialCheckToken = token
  tutorialCheckPromise = promise
  try {
    await promise
  } finally {
    if (tutorialCheckToken === token && tutorialCheckPromise === promise) {
      tutorialCheckToken = null
      tutorialCheckPromise = null
    }
  }
}

watch(() => route.path, (to, from) => {
  isPinned.value = localStorage.getItem('sidebar_pinned') === 'true'
  if (isPublic.value || to === '/setup' || to === '/login' || to === '/quick-share') {
    closeTutorial()
  } else {
    checkTutorialEligibility()
  }
}, { immediate: true })

function onUpdatePinned(val) {
  isPinned.value = val
  localStorage.setItem('sidebar_pinned', String(val))
}
</script>

<template>
  <div class="app-shell" :class="{ 'is-home': isHome, 'has-sidebar': showNavbar, 'sidebar-collapsed': !isPinned && showNavbar }">
    <WorkspaceSession v-if="showNavbar" />
    <WorldlineEffects />
    <PublicThemeSwitcher v-if="isPublic && route.path !== '/'" />
    <ForecastAtmosphere v-if="!isPublic && currentBgType !== 'paper'" />
    <MidAutumnMooncakes v-if="!isPublic" />
    <NationalDayCelebration v-if="!isPublic" />
    <a href="#main-content" class="skip-link">跳到主要内容</a>
    <MobileHeader v-if="showNavbar" />
    <Navbar v-if="showNavbar" :pinned="isPinned" @update:pinned="onUpdatePinned" />
    <main id="main-content" :class="!showNavbar ? 'public-workspace' : (isHome ? 'home-workspace' : (isAssistant ? 'assistant-workspace' : 'workspace'))">
      <router-view v-slot="{ Component }">
        <Transition v-if="isPublic" :css="false" mode="out-in" @enter="enterPage" @leave="leavePage">
          <component :is="Component" :key="route.path" />
        </Transition>
        <Transition v-else :css="false" mode="out-in" @enter="enterPage" @leave="leavePage">
          <KeepAlive include="AssistantView">
            <component :is="Component" :key="route.path" />
          </KeepAlive>
        </Transition>
      </router-view>
    </main>
    <MobileNavBar v-if="showNavbar" />
    <FeedbackHost v-if="!isPublic" />
    <NoticeScanBanner v-if="!isPublic" />
    <SystemTutorialModal v-if="!isPublic && showTutorial" />
    <DemoModeBanner v-if="isDemo && !isExcludedRoute" />
    <div v-if="isDemo && !isExcludedRoute" class="demo-watermark-overlay" aria-hidden="true"></div>
  </div>
</template>

<style>
.skip-link {
  position: fixed;
  top: -60px;
  left: 20px;
  background: var(--accent);
  color: var(--accent-ink);
  padding: 10px 20px;
  z-index: 200;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 13px;
}
.skip-link:focus { top: 12px; }
.home-workspace { width: 100%; min-width: 0; }
.assistant-workspace {
  width: 100%;
  height: 100vh;
  max-width: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.demo-watermark-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9980;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='340' viewBox='0 0 480 340'%3E%3Cg transform='rotate(-22 240 170)'%3E%3Ctext x='240' y='135' text-anchor='middle' dominant-baseline='central' fill='%23ffffff' fill-opacity='0.085' font-size='56' font-family='system-ui, -apple-system, sans-serif' font-weight='600' letter-spacing='4'%3E%E8%99%9A%E6%9E%84%E4%BF%A1%E6%81%AF%3C/text%3E%3Ctext x='240' y='205' text-anchor='middle' dominant-baseline='central' fill='%23ffffff' fill-opacity='0.085' font-size='56' font-family='system-ui, -apple-system, sans-serif' font-weight='600' letter-spacing='4'%3E%E4%BB%85%E4%BE%9B%E5%B1%95%E7%A4%BA%3C/text%3E%3C/g%3E%3C/svg%3E");
  background-size: 480px 340px;
}

@media (max-width: 640px) {
  .demo-watermark-overlay {
    background-size: 280px 198px;
  }
}
</style>
