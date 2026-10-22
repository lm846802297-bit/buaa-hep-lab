<script setup>
import DefaultPublicHomeHero from './DefaultPublicHomeHero.vue'
</script>

<template>
  <div class="public-home-theme public-home-theme--quiet-research" data-public-home-theme="quiet-research">
    <DefaultPublicHomeHero />
  </div>
</template>

<style scoped>
/* Theme-specific homepage overrides belong in this component's scoped styles. */
.public-home-theme--quiet-research {
  --public-home-theme-id: "quiet-research";
}
</style>
