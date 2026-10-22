<script setup>
import DefaultPublicHomeHero from './DefaultPublicHomeHero.vue'
</script>

<template>
  <div class="public-home-theme public-home-theme--classic-cyan" data-public-home-theme="classic-cyan">
    <DefaultPublicHomeHero />
  </div>
</template>

<style scoped>
/* Theme-specific homepage overrides belong in this component's scoped styles. */
.public-home-theme--classic-cyan {
  --public-home-theme-id: "classic-cyan";
}
</style>
