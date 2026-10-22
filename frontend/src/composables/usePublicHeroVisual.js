import { computed, onMounted, ref, watch } from 'vue'

export const HERO_VISUAL_MODE_KEY = 'labhub_public_hero_visual_mode'

export const publicHeroVisualModes = [
  {
    id: 'blueprint',
    label: '蓝图叠加',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/CMS_detector_%282%29.jpg',
    alt: 'CERN 地下实验区内的 CMS 紧凑型缪子线圈粒子探测器实景照片。',
    photoPage: 'https://commons.wikimedia.org/wiki/File:CMS_detector_(2).jpg',
    photoCredit: 'CMS detector · photo by zipckr (Flickr)',
    licenseLabel: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    photoNote: 'cropped; scientific overlays added',
    caption: '理论 · 模型 · 信号'
  },
  {
    id: 'photo',
    label: 'ATLAS 实景',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/CERN_ATLAS_Detector.jpg?width=1600',
    alt: 'CERN 大型强子对撞机 ATLAS 粒子探测器的全景实景照片。',
    photoPage: 'https://commons.wikimedia.org/wiki/File:CERN_ATLAS_Detector.jpg',
    photoCredit: 'ATLAS detector · photo by SimonWaldherr',
    licenseLabel: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    photoNote: 'image cropped to fit the hero',
    caption: 'ATLAS · CERN · LHC'
  },
  {
    id: 'terminal',
    label: '碰撞事件',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Event_display_of_a_4-muon_candidate_in_the_ATLAS_detector.png?width=1440',
    alt: 'ATLAS Collaboration 发布的四缪子候选事例真实重建事件显示图。',
    photoPage: 'https://commons.wikimedia.org/wiki/File:Event_display_of_a_4-muon_candidate_in_the_ATLAS_detector.png',
    photoCredit: 'ATLAS Collaboration · 4-muon event display',
    licenseLabel: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    photoNote: 'real event display; no additional tracks added',
    caption: 'EVENT DISPLAY · 4 MUONS'
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
    } catch {}
  })

  return { heroVisualModes: publicHeroVisualModes, heroVisualMode, activeHeroVisual }
}
