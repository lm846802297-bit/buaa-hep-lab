import { computed, onMounted, ref, watch } from 'vue'

export const HERO_VISUAL_MODE_KEY = 'labhub_public_hero_visual_mode'

// Only the blueprint composition is published. The former "ATLAS 实景" and "碰撞事件"
// modes pointed at Wikimedia Commons files that do not resolve for visitors, so the hero
// rendered an empty 950x836 grey box while still showing the borrowed attribution. The
// owner rejected both images, so they are removed rather than re-hosted. Keeping the list
// as the single source of truth makes the mode switcher disappear on its own, because the
// templates render one button per entry.
export const publicHeroVisualModes = [
  {
    id: 'blueprint',
    label: '蓝图叠加',
    src: '/images/particle-accelerator-blueprint.avif',
    alt: '暖白工程蓝图、机械齿轮、粒子加速器与碰撞轨迹组成的概念插画；并非真实实验事件显示图。',
    photoPage: null,
    photoCredit: 'Scientific Atelier · 粒子加速器蓝图概念插画',
    licenseLabel: null,
    licenseUrl: null,
    photoNote: '课题组提供的视觉参考图 · 非实验数据',
    caption: 'SCIENTIFIC ATELIER · BLUEPRINT'
  }
]

export function usePublicHeroVisual() {
  const heroVisualMode = ref('blueprint')
  const activeHeroVisual = computed(() => publicHeroVisualModes.find(mode => mode.id === heroVisualMode.value) || publicHeroVisualModes[0])

  watch(heroVisualMode, mode => {
    try { localStorage.setItem(HERO_VISUAL_MODE_KEY, mode) } catch {}
  })

  onMounted(() => {
    try {
      const savedMode = localStorage.getItem(HERO_VISUAL_MODE_KEY)
      if (publicHeroVisualModes.some(mode => mode.id === savedMode)) heroVisualMode.value = savedMode
      // A visitor who previously selected a removed mode keeps a stale value in storage;
      // reset it so the class list and the stored state cannot drift apart.
      else localStorage.setItem(HERO_VISUAL_MODE_KEY, 'blueprint')
    } catch {}
  })

  return { heroVisualModes: publicHeroVisualModes, heroVisualMode, activeHeroVisual }
}
