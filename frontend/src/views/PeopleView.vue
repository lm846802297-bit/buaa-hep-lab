<script setup>
import { computed, onMounted } from 'vue'
import { publicContentIndexCheckedAt, publicPeople } from '../content/lab'
import { publicBrandIdentity } from '../content/brandIdentity'
import { publicationReviewStatus } from '../utils/publicationReview'

const people = computed(() => publicPeople.filter(person => person.visibility === 'public'))
const reviewStatus = person => publicationReviewStatus(person.last_verified_at)
onMounted(() => { document.title = `团队与学术指导 | ${publicBrandIdentity.name}` })
</script>

<template>
  <main class="people-page">
    <nav class="breadcrumb" aria-label="面包屑">
      <router-link to="/">{{ publicBrandIdentity.name }}</router-link><span aria-hidden="true">/</span><span aria-current="page">团队与学术指导</span>
    </nav>
    <header class="page-hero">
      <p class="eyebrow">PEOPLE & ACADEMIC GUIDANCE</p>
      <h1>团队与学术指导</h1>
      <p>展示已经确认可公开的学术人员信息与官方来源。此页面不是完整人员名册；未获确认的学生和成员资料不会被自动公开。</p>
      <p class="review-note">人员与专题资料核查日期：{{ publicContentIndexCheckedAt }}</p>
    </header>

    <section class="people-grid" aria-label="已确认公开的人员资料">
      <article v-for="person in people" :key="person.id" class="person-card">
        <p class="person-role">{{ person.groupRole }}</p>
        <h2>{{ person.name }} <span>{{ person.english }}</span></h2>
        <p class="person-title">{{ person.title }} · {{ person.institution }}</p>
        <p class="person-field">{{ person.field }}</p>
        <p class="person-intro">{{ person.intro }}</p>
        <ul class="topic-list"><li v-for="topic in person.topics" :key="topic">{{ topic }}</li></ul>
        <p class="person-review" :class="{ 'is-stale': reviewStatus(person).status !== 'current' }">{{ reviewStatus(person).label }}</p>
        <a class="source-link" :href="person.source_url" target="_blank" rel="noopener noreferrer">官方个人主页 ↗</a>
      </article>
    </section>

    <aside class="directory-policy">
      <h2>公开资料原则</h2>
      <p>职务、单位与研究方向以链接的官方个人主页为准。新增人员、照片、联系方式、履历或学生身份前，须确认准确性和公开许可；内部账号与组内日程不作为公开目录的数据源。</p>
    </aside>
    <footer class="page-footer"><router-link to="/" class="button secondary">返回首页</router-link></footer>
  </main>
</template>

<style scoped>
.people-page { width:min(1080px,calc(100% - 48px)); margin:0 auto; padding:28px 0 80px; color:var(--text); }
.breadcrumb { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:44px; color:var(--muted); font-size:13px; }.breadcrumb a { color:var(--accent); }
.page-hero { max-width:800px; padding:0 0 34px; border-bottom:1px solid var(--line); }.eyebrow { color:var(--accent); font-size:11px; letter-spacing:.14em; }.page-hero h1 { margin:14px 0 18px; font-family:var(--serif); font-size:clamp(34px,5vw,54px); font-weight:400; letter-spacing:-.035em; }.page-hero>p:not(.eyebrow) { max-width:740px; color:var(--soft); font-size:15px; line-height:1.9; }.page-hero .review-note { margin-top:14px; color:var(--muted); font-size:12px; }
.people-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; padding-top:30px; }.person-card { min-width:0; padding:28px; border:1px solid var(--line); border-radius:16px; background:var(--surface); }.person-role { color:var(--accent); font-size:12px; letter-spacing:.04em; }.person-card h2 { margin:12px 0 8px; font-family:var(--serif); font-size:27px; font-weight:400; }.person-card h2 span { display:block; margin-top:4px; color:var(--muted); font-family:var(--font); font-size:14px; font-weight:400; }.person-title,.person-field { color:var(--muted); font-size:13px; line-height:1.7; }.person-field { margin-top:8px; color:var(--soft); }.person-intro { margin-top:18px; color:var(--soft); font-size:14px; line-height:1.9; }.topic-list { display:flex; flex-wrap:wrap; gap:7px; padding:0; margin:18px 0 0; list-style:none; }.topic-list li { padding:5px 9px; border:1px solid var(--line); border-radius:999px; color:var(--muted); font-size:11px; }.person-review { margin-top:20px; color:var(--muted); font-size:12px; }.person-review.is-stale { color:var(--warning); font-weight:600; }.source-link { display:inline-block; margin-top:12px; color:var(--accent); font-size:13px; }.directory-policy { margin-top:34px; padding:22px 24px; border-left:3px solid var(--accent); background:var(--panel); }.directory-policy h2 { margin-bottom:8px; font-size:18px; font-weight:500; }.directory-policy p { color:var(--muted); font-size:13px; line-height:1.9; }.page-footer { padding-top:26px; }
@media(max-width:680px) { .people-page { width:calc(100% - 36px); padding-top:18px; }.breadcrumb { margin-bottom:28px; }.people-grid { grid-template-columns:1fr; gap:14px; }.person-card { padding:22px; } }
</style>
