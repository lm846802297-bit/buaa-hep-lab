<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { fileApi } from '../api/client'

const props = defineProps({ user: Object })
const hasError = ref(false)
const privateUrl = ref('')
let revision = 0
function releasePrivateUrl() {
  if (privateUrl.value) URL.revokeObjectURL(privateUrl.value)
  privateUrl.value = ''
}

const avatarUrl = computed(() => {
  const av = props.user?.avatar
  if (!av) return ''
  if (av.startsWith('/api/files/')) return privateUrl.value
  return av
})

watch(() => props.user?.avatar, async av => {
  const current = ++revision
  releasePrivateUrl()
  hasError.value = false
  if (!av?.startsWith('/api/files/')) return
  try {
    const blob = await fileApi.read(av)
    if (current === revision) privateUrl.value = URL.createObjectURL(blob)
  } catch { if (current === revision) hasError.value = true }
}, { immediate: true })
onBeforeUnmount(() => { revision++; releasePrivateUrl() })

function handleError() {
  hasError.value = true
}
</script>

<template>
  <img 
    v-if="avatarUrl && !hasError" 
    class="user-avatar-image" 
    :src="avatarUrl" 
    alt="用户头像" 
    loading="lazy" 
    @error="handleError" 
  />
  <span v-else>{{ (user?.nickname || user?.real_name || user?.name || '?').slice(0, 1) }}</span>
</template>

<style scoped>
.user-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
</style>
