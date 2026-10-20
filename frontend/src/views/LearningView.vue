<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { learningRevision, learningSources, learningTopics, reproductionChecklist } from '../content/learning'
import { downloadText, reproductionTemplate, searchLearning, sourceById, topicMarkdown } from '../utils/learning'
const StudyFormula = defineAsyncComponent(() => import('../components/StudyFormula.vue'))
const route = useRoute()
const query = ref('')
const resourceCategory = ref('all')
const heading = ref(null)
const selected = computed(() => learningTopics.find(topic => topic.id === (route.params.topic || learningTopics[0].id)))
const topicMatches = computed(() => searchLearning(learningTopics, query.value))
const sourceMatches = computed(() => searchLearning(learningSources, query.value, resourceCategory.value))
const resourceCategories = [...new Set(learningSources.map(source => source.category))]
const base = import.meta.env.BASE_URL
onMounted(() => { if (route.params.topic) heading.value?.focus({ preventScroll: true }) })
watch(() => route.params.topic, async (_, previous) => {
  if (typeof document !== 'undefined') document.title = `${selected.value?.title || '学习与计算'} | 组内学习指南`
  if (previous !== undefined) { await nextTick(); heading.value?.focus({ preventScroll: true }) }
}, { immediate: true })
</script>

<template>
  <div id="learning-top" class="learning-shell">
    <header class="learning-heading">
      <div><p class="eyebrow">THEORY & COMPUTATION</p><h1>学习与计算</h1><p>从理论约定出发，让每次计算都留下可追溯的依据。</p></div>
      <router-link class="button secondary" to="/resources">返回资料库</router-link>
    </header>
    <div class="learning-status"><strong>{{ learningRevision.status }}</strong><p>面向具有场论基础的组内成员。当前为基于公开资料整理的学习指南，学术维护者{{ learningRevision.maintainer }}；来源核对与独立复现分别记录。</p><span>v{{ learningRevision.version }} · 来源核查 {{ learningRevision.checkedAt }}</span></div>
    <nav class="learning-shortcuts" aria-label="学习页面目录"><a href="#study-topics">学习路线</a><a href="#study-notes">专题正文</a><a href="#study-sources">权威资源</a><a href="#study-reproduction">复现记录</a></nav>
    <label class="learning-search">搜索专题与资源<input v-model="query" type="search" placeholder="例如：EFT、维数、实验数据、FeynCalc" /></label>
    <div class="learning-layout">
      <aside id="study-topics" class="learning-topic-panel">
        <h2>建议学习顺序</h2><p>按前置知识推进，也可直接选择专题。</p>
        <nav aria-label="学习专题"><router-link v-for="topic in topicMatches" :key="topic.id" :to="'/learning/' + topic.id" :aria-current="selected?.id === topic.id ? 'page' : undefined" class="learning-topic" :class="{ selected: selected?.id === topic.id }"><span>{{ topic.number }} / {{ topic.level }}</span><strong>{{ topic.title }}</strong></router-link></nav>
        <p v-if="!topicMatches.length" role="status">没有匹配的专题。当前正文仍保留，可清除搜索重新选择。</p>
      </aside>
      <article v-if="selected" id="study-notes" class="learning-article">
        <header><span class="eyebrow">{{ selected.level }}</span><h2 ref="heading" tabindex="-1">{{ selected.title }}</h2><p>{{ selected.summary }}</p><p class="learning-prerequisites">前置知识：{{ selected.prerequisites }}</p><button class="button secondary" type="button" @click="downloadText(topicMarkdown(selected), selected.id + '-study-note.md')">下载本篇笔记</button></header>
        <section class="learning-goals"><h3>学习目标</h3><ul><li v-for="goal in selected.goals" :key="goal">{{ goal }}</li></ul></section>
        <nav class="article-toc" aria-label="当前专题目录"><a v-for="section in selected.sections" :key="section.id" :href="'#note-' + section.id">{{ section.title }}</a><a href="#note-assumptions">假设与适用范围</a></nav>
        <section v-for="section in selected.sections" :id="'note-' + section.id" :key="section.id" class="learning-section">
          <h3>{{ section.title }}</h3><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <StudyFormula v-for="formula in section.formulas || []" :key="formula.label" :formula="formula"><template #loading><pre class="formula-loading">{{ formula.latex }}</pre></template></StudyFormula>
          <pre v-if="section.code" class="learning-code" tabindex="0" aria-label="FeynCalc 本机运行示例"><code>{{ section.code }}</code></pre>
          <div class="section-sources"><span>本节参考</span><a v-for="id in section.sources" :key="id" :href="sourceById(id).url" target="_blank" rel="noopener noreferrer">{{ sourceById(id).name }} ↗</a></div>
        </section>
        <section id="note-assumptions" class="learning-assumptions"><h3>假设、近似与适用范围</h3><ul><li v-for="assumption in selected.assumptions" :key="assumption">{{ assumption }}</li></ul></section>
        <section class="learning-section"><h3>自查练习</h3><p>{{ selected.exercise }}</p><div v-if="selected.download" class="learning-download"><a class="button primary" :href="base + selected.download.path" :download="selected.download.filename">{{ selected.download.label }} ↓</a><p>{{ selected.download.status }}</p><code>python two_body_decay.py</code></div></section>
        <footer class="learning-note-footer"><p>文档版本 {{ learningRevision.version }} · {{ learningRevision.checkedAt }} · 学术维护者{{ learningRevision.maintainer }}</p><p>未发布参数扫描、实验排除图或课题组新研究结论。新增研究材料须补齐学术审核与复现记录。</p><a href="#learning-top">返回页面顶部 ↑</a></footer>
      </article>
      <section v-else id="study-notes" class="learning-article" role="status"><h2 ref="heading" tabindex="-1">没有这个学习专题</h2><p>链接可能不完整，请从左侧学习路线重新选择。</p><router-link class="button secondary" to="/learning">查看学习路线</router-link></section>
    </div>
    <section id="study-sources" class="learning-resource-panel">
      <div class="learning-section-heading"><div><p class="eyebrow">CURATED RESOURCES</p><h2>权威资源索引</h2><p>跳转前了解资料用途；数值与软件版本以原始来源为准。</p></div><label>资源类别<select v-model="resourceCategory"><option value="all">全部资源</option><option v-for="category in resourceCategories" :key="category" :value="category">{{ category }}</option></select></label></div>
      <p role="status" class="learning-result-count">找到 {{ sourceMatches.length }} 项资源</p>
      <div class="learning-resource-grid"><article v-for="source in sourceMatches" :key="source.id" class="learning-resource"><span>{{ source.category }}</span><h3><a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }} ↗</a></h3><p>{{ source.use }}</p><small>{{ source.checked }}</small></article></div>
      <div v-if="!sourceMatches.length" class="learning-empty"><p>没有匹配的资源。</p><button class="button secondary" @click="query = ''; resourceCategory = 'all'">清除资源筛选</button></div>
    </section>
    <section id="study-reproduction" class="learning-reproduction"><div><p class="eyebrow">REPRODUCIBILITY</p><h2>把验证过程和结果一起保存</h2><p>以下清单用于新计算的记录，不表示当前专题已全部通过。</p><button class="button secondary" type="button" @click="downloadText(reproductionTemplate(), 'research-reproduction-record.md')">下载复现记录模板</button></div><ol><li v-for="item in reproductionChecklist" :key="item">{{ item }}</li></ol></section>
  </div>
</template>

<style scoped>
.learning-shell { max-width:1280px; margin:auto; min-width:0; color:var(--text); }
.learning-heading,.learning-section-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; } h1 { font-size:clamp(28px,3.2vw,40px); font-weight:400; margin:8px 0 12px; } h2 { font-size:25px; font-weight:400; line-height:1.5; } h3 { font-size:20px; font-weight:500; line-height:1.5; }
p { color:var(--soft); line-height:1.85; } .eyebrow { color:var(--muted); font-size:12px; letter-spacing:.1em; } .button { min-height:44px; white-space:normal; text-align:center; } a:hover { text-decoration:underline; text-underline-offset:4px; }
.learning-status { margin:28px 0 20px; padding:20px 24px; border:1px solid var(--line); border-radius:20px; background:var(--panel-solid); } .learning-status strong { font-weight:500; color:var(--warning); } .learning-status p { font-size:14px; margin:8px 0; } .learning-status span { font-size:13px; color:var(--muted); }
.learning-shortcuts { display:flex; flex-wrap:wrap; gap:8px 20px; margin-bottom:20px; } .learning-shortcuts a { color:var(--accent); padding:10px 0; font-size:14px; }
.learning-search { max-width:640px; margin-bottom:28px; font-size:14px; }
.learning-layout { display:grid; grid-template-columns:250px minmax(0,1fr); gap:28px; align-items:start; }
.learning-topic-panel { border:1px solid var(--line); border-radius:20px; background:var(--panel-solid); padding:20px; } .learning-topic-panel h2 { font-size:19px; } .learning-topic-panel>p { font-size:13px; margin:10px 0; }
.learning-topic { display:flex; flex-direction:column; gap:6px; border:1px solid var(--line); border-radius:12px; padding:14px; margin-top:12px; } .learning-topic span { color:var(--muted); font-size:12px; } .learning-topic strong { font-size:15px; font-weight:400; } .learning-topic.selected { background:var(--raised); border-color:var(--accent); } .learning-topic.selected strong::before { content:'当前 · '; color:var(--accent); }
.learning-article { min-width:0; background:var(--panel-solid); border:1px solid var(--line); border-radius:20px; padding:28px; } .learning-article header h2 { margin:10px 0 16px; } .learning-article header .button { margin-top:18px; } .learning-prerequisites { margin-top:16px; font-size:14px; color:var(--muted); }
.learning-goals { margin:28px 0; } ul,ol { padding-left:22px; color:var(--soft); line-height:1.9; } li+li { margin-top:8px; } .article-toc { display:flex; flex-wrap:wrap; gap:8px 18px; padding:16px 0; border-block:1px solid var(--line); } .article-toc a { padding:8px 0; font-size:14px; color:var(--accent); }
.learning-section { padding-top:32px; } .learning-section h3 { margin-bottom:14px; } .learning-section p+p { margin-top:14px; } .learning-code { margin:20px 0; background:var(--surface); border:1px solid var(--line); padding:16px; border-radius:12px; overflow-x:auto; font-size:13px; color:var(--soft); } .formula-loading { white-space:pre-wrap; overflow-wrap:anywhere; font-size:13px; }
.section-sources { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:18px; font-size:13px; } .section-sources span { color:var(--muted); } .section-sources a { color:var(--accent); overflow-wrap:anywhere; }
.learning-assumptions { margin-top:28px; padding:20px; background:var(--surface); border-left:3px solid var(--warning); border-radius:12px; } .learning-download { margin-top:20px; } .learning-download p { font-size:13px; margin:12px 0; } .learning-download code { color:var(--soft); font-size:13px; }
.learning-note-footer { margin-top:28px; border-top:1px solid var(--line); padding-top:20px; } .learning-note-footer p { font-size:13px; color:var(--muted); margin-bottom:12px; } .learning-note-footer a { display:inline-block; padding:10px 0; color:var(--accent); font-size:14px; }
.learning-resource-panel { padding:48px 0; margin-top:32px; border-top:1px solid var(--line); } .learning-section-heading p:not(.eyebrow) { margin-top:12px; font-size:14px; } .learning-section-heading label { min-width:180px; } .learning-result-count { margin:20px 0 14px; font-size:14px; color:var(--muted); }
.learning-resource-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; } .learning-resource { min-width:0; padding:24px; border:1px solid var(--line); background:var(--panel-solid); border-radius:20px; } .learning-resource>span,.learning-resource small { color:var(--muted); font-size:13px; } .learning-resource h3 { margin:10px 0 14px; font-size:19px; overflow-wrap:anywhere; } .learning-resource a { color:var(--accent); } .learning-resource p { font-size:14px; margin-bottom:18px; }
.learning-reproduction { display:grid; grid-template-columns:1fr 1fr; gap:40px; padding:28px; border:1px solid var(--line); border-radius:20px; background:var(--panel-solid); } .learning-reproduction h2 { margin:10px 0 18px; } .learning-reproduction p { font-size:14px; margin-bottom:20px; } .learning-reproduction ol { font-size:14px; margin:0; } .learning-empty { padding:24px 0; } .learning-empty .button { margin-top:16px; }
section[id],aside[id],article[id] { scroll-margin-top:90px; }
@media(max-width:1000px) { .learning-layout { grid-template-columns:1fr; } .learning-topic-panel nav { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; } .learning-topic { margin:0; } .learning-topic-panel>p { margin-bottom:18px; } }
@media(max-width:650px) { .learning-heading,.learning-section-heading { flex-direction:column; gap:20px; } .learning-article,.learning-status,.learning-resource,.learning-reproduction,.learning-topic-panel { padding:18px; } .learning-reproduction,.learning-resource-grid { grid-template-columns:1fr; gap:20px; } .learning-topic-panel nav { grid-template-columns:1fr; } h2 { font-size:23px; } .learning-layout { gap:20px; } .learning-heading>.button { align-self:flex-start; } }
</style>
