<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { directions, publications } from '../content/lab'

const route = useRoute()
const topic = computed(() => directions.find(item => item.id === route.params.topic) || null)
const relatedPapers = computed(() => topic.value
  ? topic.value.references.map(id => publications.find(paper => paper.id === id)).filter(Boolean)
  : [])
onMounted(() => {
  document.title = topic.value
    ? `${topic.value.title} | BUAA HEP Hub`
    : '研究专题不存在 | BUAA HEP Hub'
})
</script>

<template>
  <main class="research-topic-page">
    <nav class="topic-breadcrumb" aria-label="面包屑">
      <router-link to="/">BUAA HEP Hub</router-link>
      <span aria-hidden="true">/</span>
      <a href="/#research">研究方向</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ topic?.title || '专题不存在' }}</span>
    </nav>

    <template v-if="topic">
      <header class="topic-hero">
        <p class="eyebrow">{{ topic.number }} / RESEARCH TOPIC</p>
        <div class="topic-symbol" aria-hidden="true">{{ topic.symbol }}</div>
        <p class="topic-kicker">{{ topic.en }}</p>
        <h1>{{ topic.title }}</h1>
        <p class="topic-intro">{{ topic.text }}</p>
        <div class="topic-tags">
          <span v-for="tag in topic.tags" :key="tag">{{ tag }}</span>
        </div>
      </header>

      <section class="topic-section" aria-labelledby="topic-question">
        <p class="eyebrow">01 / MOTIVATION</p>
        <h2 id="topic-question">科学问题</h2>
        <p>{{ topic.question }}</p>
      </section>

      <section class="topic-section" aria-labelledby="topic-framework">
        <p class="eyebrow">02 / FRAMEWORK & METHODS</p>
        <h2 id="topic-framework">理论框架与研究方法</h2>
        <p>{{ topic.methods }}</p>
      </section>

      <section class="topic-section" aria-labelledby="topic-observables">
        <p class="eyebrow">03 / OBSERVABLES</p>
        <h2 id="topic-observables">可观测量与实验联系</h2>
        <p>{{ topic.probes }}</p>
        <p class="topic-caveat">{{ topic.detail }}</p>
      </section>

      <section class="topic-section topic-publications" aria-labelledby="topic-papers">
        <p class="eyebrow">04 / SELECTED PAPERS</p>
        <h2 id="topic-papers">相关代表论文</h2>
        <p class="section-intro">以下关联来自网站维护的公开专题与论文索引。具体模型假设、数值结果和实验限制应以原始论文为准；此页面不声称独立复现论文计算。</p>
        <ul>
          <li v-for="paper in relatedPapers" :key="paper.id">
            <div>
              <a :href="paper.source_url" target="_blank" rel="noopener noreferrer">{{ paper.title }} ↗</a>
              <p>{{ paper.authors.join(', ') }}</p>
              <small>arXiv:{{ paper.id }} · {{ paper.year }} · {{ paper.status === 'published' ? (paper.journal || '已发表') : '预印本' }}</small>
            </div>
            <a v-if="paper.doi" class="doi-link" :href="`https://doi.org/${paper.doi}`" target="_blank" rel="noopener noreferrer">DOI ↗</a>
          </li>
        </ul>
      </section>

      <footer class="topic-footer">
        <p>本专题基于已确认的公开研究方向与论文元数据编写。公式推导、参数范围、实验约束与可复现计算将在经过来源核验后逐步补充。</p>
        <router-link to="/" class="button secondary">返回课题组首页</router-link>
      </footer>
    </template>
    <section v-else class="topic-not-found">
      <p class="eyebrow">404 / NOT FOUND</p>
      <h1>没有找到这个研究专题。</h1>
      <p>专题链接可能已更名，或该主题尚未公开。</p>
      <router-link to="/" class="button primary">返回首页</router-link>
    </section>
  </main>
</template>

<style scoped>
.research-topic-page { width:min(980px,calc(100% - 48px)); margin:0 auto; padding:28px 0 80px; color:var(--text); }
.topic-breadcrumb { display:flex; flex-wrap:wrap; gap:10px; align-items:center; color:var(--muted); font-size:13px; margin-bottom:52px; }
.topic-breadcrumb a { color:var(--accent); }
.topic-hero { position:relative; overflow:hidden; padding:clamp(28px,6vw,64px); border:1px solid var(--line); border-radius:18px; background:var(--panel); box-shadow:var(--shadow); }
.eyebrow,.topic-kicker { color:var(--accent); font-size:11px; letter-spacing:.14em; text-transform:uppercase; }
.topic-symbol { position:absolute; right:28px; top:6px; font-family:var(--serif); font-size:clamp(120px,24vw,230px); line-height:1; color:var(--accent); opacity:.09; pointer-events:none; }
.topic-kicker { position:relative; margin-top:36px; }
.topic-hero h1 { position:relative; margin:14px 0 20px; max-width:700px; font-family:var(--serif); font-size:clamp(36px,5vw,58px); line-height:1.22; font-weight:400; letter-spacing:-.035em; }
.topic-intro { position:relative; max-width:680px; font-size:16px; line-height:1.95; color:var(--soft); }
.topic-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:28px; }
.topic-tags span { padding:6px 12px; border:1px solid var(--line); border-radius:999px; font-size:12px; color:var(--muted); }
.topic-section { padding:44px 0; border-bottom:1px solid var(--line); }
.topic-section h2 { margin:10px 0 18px; font-family:var(--serif); font-size:clamp(26px,3vw,34px); font-weight:400; }
.topic-section>p:not(.eyebrow) { max-width:800px; color:var(--soft); font-size:16px; line-height:1.95; }
.topic-section .topic-caveat { margin-top:22px; padding:16px 18px; border-left:3px solid var(--accent); background:var(--surface); font-size:14px; }
.section-intro { margin-bottom:22px; font-size:14px!important; }
.topic-publications ul { list-style:none; padding:0; margin:0; }
.topic-publications li { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; padding:20px 0; border-bottom:1px solid var(--line); }
.topic-publications li>div { min-width:0; }
.topic-publications li a { color:var(--accent); line-height:1.75; overflow-wrap:anywhere; }
.topic-publications li p { margin-top:8px; color:var(--soft); font-size:13px; line-height:1.8; }
.topic-publications li small { display:block; margin-top:6px; color:var(--muted); font-size:12px; }
.topic-publications li .doi-link { flex-shrink:0; font-size:13px; }
.topic-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; padding-top:28px; }
.topic-footer p { max-width:640px; color:var(--muted); font-size:13px; line-height:1.8; }
.topic-not-found { padding:64px 0; }
.topic-not-found h1 { margin:16px 0; font-family:var(--serif); font-weight:400; font-size:clamp(32px,5vw,48px); }
.topic-not-found>p:not(.eyebrow) { margin-bottom:24px; color:var(--muted); }
@media(max-width:600px) { .research-topic-page { width:calc(100% - 36px); padding-top:18px; } .topic-breadcrumb { margin-bottom:28px; } .topic-hero { padding:26px 22px; } .topic-intro,.topic-section>p:not(.eyebrow) { font-size:14px; } .topic-publications li { gap:12px; } }
</style>
