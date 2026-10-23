<script setup>
import { computed } from 'vue'
import { useThemeStyle } from '../composables/useThemeStyle'
import WorldlinePublicHomeHero from './WorldlinePublicHomeHero.vue'
import QuietResearchPublicHomeHero from './QuietResearchPublicHomeHero.vue'
import ClassicCyanPublicHomeHero from './ClassicCyanPublicHomeHero.vue'
import ObsidianGrayPublicHomeHero from './ObsidianGrayPublicHomeHero.vue'
import NebulaPurplePublicHomeHero from './NebulaPurplePublicHomeHero.vue'

const { publicColorScheme } = useThemeStyle()
const heroByTheme = {
  'quiet-research': QuietResearchPublicHomeHero,
  'classic-cyan': ClassicCyanPublicHomeHero,
  'obsidian-gray': ObsidianGrayPublicHomeHero,
  'nebula-purple': NebulaPurplePublicHomeHero,
  'worldline-console': WorldlinePublicHomeHero
}
const activeHero = computed(() => heroByTheme[publicColorScheme.value] || QuietResearchPublicHomeHero)
</script>

<template>
  <component :is="activeHero" />
</template>
