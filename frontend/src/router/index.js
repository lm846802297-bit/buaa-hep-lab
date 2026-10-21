import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'PublicHome', component: () => import('../views/PublicHomeView.vue'), meta: { public: true } },
  { path: '/research/:topic', name: 'ResearchTopic', component: () => import('../views/ResearchTopicView.vue'), props: true, meta: { public: true } },
  { path: '/people', name: 'PublicPeople', component: () => import('../views/PeopleView.vue'), meta: { public: true } },
  { path: '/events', name: 'PublicEvents', component: () => import('../views/EventsView.vue'), meta: { public: true } },
  { path: '/learning/:topic?', name: 'Learning', component: () => import('../views/LearningView.vue'), meta: { requiresAuth: true } },
  { path: '/feedback', component: () => import('../views/FeedbackView.vue'), meta: { requiresAuth: true } },
  { path: '/account', component: () => import('../views/AccountView.vue'), meta: { requiresAuth: true } },
  {
    path: '/hub',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/library', name: 'Library', component: () => import('../views/LibraryView.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('../views/FavoritesView.vue'), meta: { requiresAuth: true } },
  { path: '/admin/feedback', name: 'AdminFeedback', component: () => import('../views/AdminFeedbackView.vue'), meta: { requiresAuth: true } },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/arxiv',
    name: 'ArxivFeed',
    component: () => import('../views/ArxivFeedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/seminars',
    name: 'Seminars',
    component: () => import('../views/SeminarView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/ResourceHubView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mailbox',
    name: 'Mailbox',
    component: () => import('../views/MailboxView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notices',
    name: 'Notices',
    component: () => import('../views/NoticesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/quick-share',
    name: 'QuickShare',
    component: () => import('../views/QuickShareView.vue'),
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('../views/SetupView.vue'),
  },
  {
    path: '/assistant',
    name: 'Assistant',
    component: () => import('../views/AssistantView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/style',
    name: 'Style',
    component: () => import('../views/StyleView.vue'),
    meta: { requiresAuth: true },
  },
]

import { isDemoMode, initDemoAuth } from '../mock/isDemo'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})


router.beforeEach(async (to, from, next) => {
  // Reset before the route transition starts. The app uses an out-in transition,
  // so scrolling after navigation can race the outgoing page animation.
  if (to.path !== from.path && typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  // The public website must remain available before setup and without a backend.
  if (to.meta.public) return next()
  if (to.query?.demo === '1' || to.query?.demo === 'true') {
    localStorage.setItem('labhub_force_demo', '1')
  } else if (to.query?.demo === '0' || to.query?.demo === 'false') {
    localStorage.removeItem('labhub_force_demo')
    if (localStorage.getItem('labhub_token')?.startsWith('demo_')) {
      localStorage.removeItem('labhub_token')
      localStorage.removeItem('labhub_user')
    }
  }

  if (isDemoMode()) {
    initDemoAuth()
  }

  const { useSiteConfig } = await import('../composables/useSiteConfig')
  const { siteConfig, fetchSiteStatus } = useSiteConfig()

  if (siteConfig.initialized === null) {
    await fetchSiteStatus()
  }

  // 1. 系统未初始化：强制重定向至 /setup
  if (siteConfig.initialized === false) {
    if (to.path !== '/setup') {
      return next({ path: '/setup' })
    }
    return next()
  }

  // 2. 系统已初始化：禁止重入 /setup
  if (to.path === '/setup') {
    return next({ path: '/' })
  }

  // 3. 身份认证权限校验
  const token = localStorage.getItem('labhub_token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach(to => {
  const isPublic = !!to.meta.public
  let robots = document.querySelector('meta[name="robots"]')
  if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
  robots.content = isPublic ? 'index,follow' : 'noindex,nofollow'
  if (!isPublic) document.title = '组内科研协作 | BUAA HEP Hub'
})

export default router
