<script setup>
import { computed } from 'vue'
import { useThemeStyle } from '../composables/useThemeStyle'
import DefaultPublicHomeHero from './DefaultPublicHomeHero.vue'
import WorldlinePublicHomeHero from './WorldlinePublicHomeHero.vue'

const { publicColorScheme } = useThemeStyle()
const activeHero = computed(() => publicColorScheme.value === 'worldline-console' ? WorldlinePublicHomeHero : DefaultPublicHomeHero)
</script>

<template>
  <component :is="activeHero" />
</template>
