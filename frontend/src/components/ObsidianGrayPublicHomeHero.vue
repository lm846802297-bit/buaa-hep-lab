<script setup>
import DefaultPublicHomeHero from './DefaultPublicHomeHero.vue'
</script>

<template>
  <div class="public-home-theme public-home-theme--obsidian-gray" data-public-home-theme="obsidian-gray">
    <DefaultPublicHomeHero />
  </div>
</template>

<style scoped>
/* Theme-specific homepage overrides belong in this component's scoped styles. */
.public-home-theme--obsidian-gray {
  --public-home-theme-id: "obsidian-gray";
}
</style>
