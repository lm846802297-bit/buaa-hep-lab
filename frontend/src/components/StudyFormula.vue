<script setup>
import { computed, ref } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
const props = defineProps({ formula: { type: Object, required: true } })
const message = ref('')
const rendered = computed(() => {
  try { return katex.renderToString(props.formula.latex, { displayMode: true, throwOnError: true, trust: false, maxExpand: 1000, output: 'htmlAndMathml' }) }
  catch { return '' }
})
async function copy() {
  try { await navigator.clipboard.writeText(props.formula.latex); message.value = '已复制 LaTeX' }
  catch { message.value = '复制未完成，请展开并选择 LaTeX 源码' }
}
</script>
<template>
  <figure class="study-formula">
    <figcaption>{{ formula.label }}</figcaption>
    <div v-if="rendered" class="formula-scroll" tabindex="0" :aria-label="formula.label + '，超宽时可横向滚动'" v-html="rendered"></div>
    <p v-else>公式排版暂不可用，可展开下方 LaTeX 源码阅读。</p>
    <details><summary>LaTeX 源码</summary><pre><code>{{ formula.latex }}</code></pre></details>
    <button type="button" class="button secondary" @click="copy" :aria-label="'复制' + formula.label + '的 LaTeX'">复制公式</button>
    <span role="status">{{ message }}</span>
  </figure>
</template>
<style scoped>
.study-formula { margin:20px 0; min-width:0; padding:18px; background:var(--surface); border:1px solid var(--line); border-radius:12px; }
figcaption { font-size:14px; color:var(--soft); } .formula-scroll { overflow-x:auto; max-width:100%; padding:12px 0; font-size:16px; } .formula-scroll :deep(.katex-display) { margin:0; text-align:left; } .formula-scroll :deep(.katex-display>.katex) { text-align:left; }
summary { cursor:pointer; padding:10px 0; color:var(--accent); font-size:14px; } pre { white-space:pre-wrap; overflow-wrap:anywhere; font-size:13px; margin:8px 0 16px; color:var(--soft); } button { min-height:44px; margin-top:10px; } [role=status] { font-size:13px; color:var(--soft); margin-left:12px; }
</style>
