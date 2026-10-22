<script setup>
import DefaultPublicHomeHero from './DefaultPublicHomeHero.vue'
</script>

<template>
  <div class="public-home-theme public-home-theme--nebula-purple" data-public-home-theme="nebula-purple">
    <DefaultPublicHomeHero />
  </div>
</template>

<style scoped>
/* Theme-specific homepage overrides belong in this component's scoped styles. */
.public-home-theme--nebula-purple {
  --public-home-theme-id: "nebula-purple";
}
</style>
