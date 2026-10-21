<script setup>
import { computed, onMounted, ref } from 'vue'
import { publicEvents, publicSeminarSeries } from '../content/lab'
import { publicationReviewStatus } from '../utils/publicationReview'
import { buildPublicIcsCalendar, listPublicArchivedEvents, listPublicUpcomingEvents } from '../utils/publicEvents'

const now = ref(new Date())
const upcoming = computed(() => listPublicUpcomingEvents(publicEvents, now.value))
const archived = computed(() => listPublicArchivedEvents(publicEvents, now.value))
const series = computed(() => publicSeminarSeries.filter(item =>
  item.visibility === 'public' && publicationReviewStatus(item.last_verified_at, now.value).status === 'current'))
function eventReview(event) { return publicationReviewStatus(event.last_verified_at, now.value) }
function formatTime(value, timezone = 'Asia/Shanghai') {
  try {
    return new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '时间待核验'
  }
}
function statusLabel(event) {
  if (event.status === 'cancelled') return '已取消'
  if (event.status === 'completed' || new Date(event.end_at).getTime() < now.value.getTime()) return '已结束'
  return '已确认'
}
function downloadCalendar() {
  const content = buildPublicIcsCalendar(publicEvents, now.value)
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'buaa-hep-public-events.ics'
  link.click()
  URL.revokeObjectURL(url)
}
onMounted(() => { document.title = '公开学术活动 | BUAA HEP Hub' })
</script>

<template>
  <main class="events-page">
    <nav class="breadcrumb" aria-label="面包屑">
      <router-link to="/">BUAA HEP Hub</router-link><span aria-hidden="true">/</span><span aria-current="page">学术活动</span>
    </nav>
    <header class="page-hero">
      <p class="eyebrow">SEMINARS & ACADEMIC EVENTS</p>
      <h1>学术活动</h1>
      <p>仅发布经过确认的公开报告、研讨会与会议。内部组会排期、会议链接和成员提醒不会从组内系统自动同步到公开页面。</p>
      <button class="button primary" :disabled="upcoming.length === 0" @click="downloadCalendar">下载公开日历 (.ics) <span aria-hidden="true">↓</span></button>
    </header>

    <section class="events-section" aria-labelledby="series-heading">
      <p class="eyebrow">01 / SERIES</p><h2 id="series-heading">研讨会系列</h2>
      <div v-if="series.length" class="series-grid">
        <article v-for="item in series" :key="item.id" class="series-card">
          <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
          <a v-if="item.source_url" :href="item.source_url" target="_blank" rel="noopener noreferrer">系列主页 ↗</a>
        </article>
      </div>
      <p v-else class="empty-state">暂无已核验的公开研讨会系列。系列信息确认后，将在此处发布。</p>
    </section>

    <section class="events-section" aria-labelledby="upcoming-heading">
      <p class="eyebrow">02 / UPCOMING</p><h2 id="upcoming-heading">近期公开活动</h2>
      <div v-if="upcoming.length" class="event-list">
        <article v-for="event in upcoming" :key="event.id" class="event-card">
          <div class="event-time"><strong>{{ formatTime(event.start_at, event.timezone) }}</strong><span>{{ formatTime(event.end_at, event.timezone) }}</span></div>
          <div class="event-main"><p class="event-series">{{ event.series_title || '公开学术活动' }}</p><h3>{{ event.title }}</h3><p v-if="event.speaker" class="event-speaker">{{ event.speaker }}</p><p v-if="event.abstract" class="event-abstract">{{ event.abstract }}</p><p v-if="event.location" class="event-location">{{ event.location }}</p><a v-if="event.source_url" :href="event.source_url" target="_blank" rel="noopener noreferrer">活动详情 ↗</a><p class="event-review" :class="{ 'is-stale': eventReview(event).status !== 'current' }">{{ eventReview(event).label }}</p></div>
        </article>
      </div>
      <p v-else class="empty-state">目前没有已核验的近期公开活动。组内内部组会不会自动发布到此页面。</p>
    </section>

    <section v-if="archived.length" class="events-section" aria-labelledby="archive-heading">
      <p class="eyebrow">03 / ARCHIVE</p><h2 id="archive-heading">历史活动</h2>
      <div class="event-list">
        <article v-for="event in archived" :key="event.id" class="event-card archived">
          <div class="event-time"><strong>{{ formatTime(event.start_at, event.timezone) }}</strong><span>{{ statusLabel(event) }}</span></div>
          <div class="event-main"><h3>{{ event.title }}</h3><p v-if="event.speaker" class="event-speaker">{{ event.speaker }}</p><p v-if="event.abstract" class="event-abstract">{{ event.abstract }}</p><a v-if="event.source_url" :href="event.source_url" target="_blank" rel="noopener noreferrer">公开记录 ↗</a><p class="event-review" :class="{ 'is-stale': eventReview(event).status !== 'current' }">{{ eventReview(event).label }}</p></div>
        </article>
      </div>
    </section>
    <footer class="page-footer"><p>日历导出只包含未来、状态为已安排且核对日期有效的公开活动；取消、过期或未核验的条目不会导出。</p><router-link to="/" class="button secondary">返回首页</router-link></footer>
  </main>
</template>

<style scoped>
.events-page { width:min(1000px,calc(100% - 48px)); margin:0 auto; padding:28px 0 80px; color:var(--text); }.breadcrumb { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:44px; color:var(--muted); font-size:13px; }.breadcrumb a { color:var(--accent); }
.page-hero { padding-bottom:36px; border-bottom:1px solid var(--line); }.eyebrow { color:var(--accent); font-size:11px; letter-spacing:.14em; }.page-hero h1 { margin:14px 0 18px; font-family:var(--serif); font-size:clamp(36px,5vw,56px); font-weight:400; }.page-hero>p:not(.eyebrow) { max-width:780px; margin-bottom:24px; color:var(--soft); font-size:15px; line-height:1.9; }
.events-section { padding:36px 0; border-bottom:1px solid var(--line); }.events-section h2 { margin:10px 0 22px; font-family:var(--serif); font-size:clamp(25px,3vw,34px); font-weight:400; }.empty-state { padding:24px; border:1px dashed var(--line); border-radius:12px; color:var(--muted); font-size:14px; line-height:1.9; }
.series-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }.series-card { padding:22px; border:1px solid var(--line); border-radius:14px; background:var(--surface); }.series-card h3 { font-size:18px; font-weight:500; }.series-card p { margin:12px 0; color:var(--soft); font-size:14px; line-height:1.8; }.series-card a,.event-main>a { color:var(--accent); font-size:13px; }
.event-list { display:grid; gap:14px; }.event-card { display:grid; grid-template-columns:minmax(180px, .34fr) 1fr; gap:24px; padding:24px; border:1px solid var(--line); border-radius:14px; background:var(--surface); }.event-card.archived { opacity:.9; }.event-time { display:flex; flex-direction:column; gap:8px; color:var(--muted); font-size:13px; line-height:1.7; }.event-time strong { color:var(--text); font-weight:500; }.event-main h3 { margin:7px 0 10px; font-size:20px; font-weight:500; line-height:1.5; }.event-series { color:var(--accent); font-size:11px; letter-spacing:.05em; }.event-speaker,.event-location { margin-top:8px; color:var(--muted); font-size:13px; }.event-abstract { margin:12px 0; color:var(--soft); font-size:14px; line-height:1.85; }.event-review { margin-top:12px; color:var(--muted); font-size:12px; }.event-review.is-stale { color:var(--warning); font-weight:600; }.page-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; padding-top:26px; }.page-footer p { max-width:700px; color:var(--muted); font-size:12px; line-height:1.8; }
@media(max-width:640px) { .events-page { width:calc(100% - 36px); padding-top:18px; }.breadcrumb { margin-bottom:28px; }.series-grid { grid-template-columns:1fr; }.event-card { grid-template-columns:1fr; gap:14px; padding:20px; }.event-main h3 { font-size:18px; } }
</style>
