<script setup>
import { computed, onMounted } from 'vue'
import { directions, publications, publicContentIndexCheckedAt } from '../content/lab'
import { publicationReviewStatus } from '../utils/publicationReview'
import { researchTopicDetails, researchTopicResources } from '../content/researchTopicDetails'
import { researchTopicDeepGuides } from '../content/researchTopicDeepGuides'

const props = defineProps({ topic: { type: String, default: '' } })
const topic = computed(() => directions.find(item => item.id === props.topic) || null)
const relatedPapers = computed(() => topic.value
  ? topic.value.references.map(id => publications.find(paper => paper.id === id)).filter(Boolean)
  : [])
const topicDetail = computed(() => topic.value ? researchTopicDetails[topic.value.id] || null : null)
const topicDeepGuide = computed(() => topic.value ? researchTopicDeepGuides[topic.value.id] || null : null)
const topicResources = computed(() => topicDetail.value
  ? topicDetail.value.resourceIds.map(id => researchTopicResources.find(resource => resource.id === id)).filter(Boolean)
  : [])
const contentReview = computed(() => publicationReviewStatus(publicContentIndexCheckedAt))
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
        <p class="topic-review" :class="{ 'is-stale': contentReview.status !== 'current' }">资料核查：{{ publicContentIndexCheckedAt }} · {{ contentReview.status === 'current' ? '处于 180 天复核周期内' : contentReview.label }} · 本页为带适用条件的研究导读，不等同于独立学术审稿或论文计算复现</p>
        <div class="topic-hero-actions">
          <a href="#topic-relations" class="button primary">从关键关系式开始 <span aria-hidden="true">↓</span></a>
          <a href="#topic-papers" class="button secondary">查看代表论文 <span aria-hidden="true">↗</span></a>
          <router-link to="/#research-guides" class="topic-all-guides">浏览全部专题导读 ↗</router-link>
        </div>
      </header>

      <nav v-if="topicDetail" class="topic-local-nav" aria-label="专题内导航">
        <span class="topic-local-label">本页导航</span>
        <a href="#topic-question">科学问题</a>
        <a href="#topic-mechanisms">核心物理机制</a>
        <a href="#topic-relations">关键关系式</a>
        <a href="#topic-framework">研究方法</a>
        <a href="#topic-workflow">分析流程</a>
        <a href="#topic-observables">可观测量</a>
        <a href="#topic-interpretation">结果判读</a>
        <a href="#topic-assumptions">适用条件</a>
        <a href="#topic-questions">研究切入点</a>
        <a href="#topic-source-notes">参考依据</a>
        <a href="#topic-papers">代表论文</a>
        <a href="#topic-resources">专业资源</a>
      </nav>

      <section class="topic-section" aria-labelledby="topic-question">
        <p class="eyebrow">01 / MOTIVATION</p>
        <h2 id="topic-question">科学问题</h2>
        <p>{{ topic.question }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-mechanisms">
        <p class="eyebrow">02 / PHYSICS IN FOCUS</p>
        <h2 id="topic-mechanisms">核心物理机制与研究对象</h2>
        <p class="section-intro">{{ topicDetail.lead }}</p>
        <div class="physics-card-grid">
          <article v-for="item in topicDetail.mechanisms" :key="item.title" class="physics-card">
            <p class="physics-card-label">{{ item.label }}</p>
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <code v-if="item.formula" class="physics-formula">{{ item.formula }}</code>
            <ul>
              <li v-for="check in item.checks" :key="check">{{ check }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section" aria-labelledby="topic-relations">
        <p class="eyebrow">03 / KEY RELATIONS & VALIDITY</p>
        <h2 id="topic-relations">关键关系式：公式、含义与适用边界</h2>
        <p class="section-intro">{{ topicDeepGuide.framing }}</p>
        <div class="relation-grid">
          <article v-for="item in topicDeepGuide.keyRelations" :key="item.title" class="relation-card">
            <p class="relation-label">{{ item.label }}</p>
            <h3>{{ item.title }}</h3>
            <code class="relation-formula">{{ item.formula }}</code>
            <p>{{ item.meaning }}</p>
            <div class="relation-note"><strong>适用条件</strong><p>{{ item.conditions }}</p></div>
            <div class="relation-warning"><strong>不能直接推出</strong><p>{{ item.doesNotMean }}</p></div>
          </article>
        </div>
        <div class="prerequisite-panel">
          <strong>建议先掌握</strong>
          <ul><li v-for="item in topicDeepGuide.prerequisites" :key="item">{{ item }}</li></ul>
        </div>
      </section>

      <section class="topic-section" aria-labelledby="topic-framework">
        <p class="eyebrow">04 / FRAMEWORK & METHODS</p>
        <h2 id="topic-framework">理论框架与研究方法</h2>
        <p>{{ topic.methods }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-workflow">
        <p class="eyebrow">05 / FROM MODEL TO EVIDENCE</p>
        <h2 id="topic-workflow">从理论模型到可检验结论</h2>
        <p class="section-intro">每一步都应保留输入、假设、软件/数据版本与可追溯证据；不能用一张灵敏度曲线替代完整的理论和实验核查。</p>
        <ol class="topic-workflow">
          <li v-for="item in topicDetail.workflow" :key="item.step">
            <span class="workflow-step">{{ item.step }}</span>
            <div><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></div>
          </li>
        </ol>
      </section>

      <section class="topic-section" aria-labelledby="topic-observables">
        <p class="eyebrow">06 / OBSERVABLES</p>
        <h2 id="topic-observables">可观测量与实验联系</h2>
        <p>{{ topic.probes }}</p>
        <p class="topic-caveat">{{ topic.detail }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-interpretation">
        <p class="eyebrow">07 / HOW TO READ THE RESULTS</p>
        <h2 id="topic-interpretation">结果应该如何判读</h2>
        <div class="interpretation-grid">
          <article v-for="item in topicDetail.interpretation" :key="item.tag" class="interpretation-card">
            <span>{{ item.tag }}</span><h3>{{ item.title }}</h3><p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section" aria-labelledby="topic-assumptions">
        <p class="eyebrow">08 / ASSUMPTIONS & FAILURE MODES</p>
        <h2 id="topic-assumptions">研究中必须明确的假设与常见误判</h2>
        <p class="section-intro">这些检查不是形式上的免责声明，而是决定公式能否用于具体模型、数据和参数空间的条件。</p>
        <div class="assumption-grid">
          <article v-for="item in topicDeepGuide.assumptions" :key="item.title" class="assumption-card">
            <span aria-hidden="true">!</span><div><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></div>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section" aria-labelledby="topic-questions">
        <p class="eyebrow">09 / RESEARCH ENTRY POINTS</p>
        <h2 id="topic-questions">如何从导读进入实际研究</h2>
        <div class="research-question-grid">
          <article v-for="(item, index) in topicDeepGuide.researchQuestions" :key="item.title" class="research-question-card">
            <span class="question-index">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ item.title }}</h3><p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section topic-source-notes" aria-labelledby="topic-source-notes">
        <p class="eyebrow">10 / SOURCE NOTES</p>
        <h2 id="topic-source-notes">关系式与方法的参考依据</h2>
        <p class="section-intro">以下是进入原始资料的起点。正式研究时应继续核对具体章节、定义、版本和原始论文，而不是只引用本页概述。</p>
        <div class="topic-source-grid">
          <a v-for="item in topicDeepGuide.references" :key="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="topic-source-card">
            <strong>{{ item.title }} <span aria-hidden="true">↗</span></strong><p>{{ item.note }}</p>
          </a>
        </div>
      </section>

      <section class="topic-section topic-publications" aria-labelledby="topic-papers">
        <p class="eyebrow">11 / SELECTED PAPERS</p>
        <h2 id="topic-papers">相关代表论文</h2>
        <p class="section-intro">以下关联来自网站维护的公开专题与论文索引。具体模型假设、数值结果和实验限制应以原始论文为准；此页面不声称独立复现论文计算。</p>
        <ul>
          <li v-for="paper in relatedPapers" :key="paper.id">
            <div>
              <a :href="paper.source_url" target="_blank" rel="noopener noreferrer">{{ paper.title }} ↗</a>
              <p>{{ paper.authors.join(', ') }}</p>
              <small>arXiv:{{ paper.id }} · {{ paper.year }} · {{ paper.status === 'published' ? (paper.journal || '已发表') : '预印本' }}</small>
            </div>
            <a v-if="paper.doi" class="doi-link" :href="'https://doi.org/' + paper.doi" target="_blank" rel="noopener noreferrer">DOI ↗</a>
          </li>
        </ul>
      </section>

      <section v-if="topicDetail" class="topic-section topic-resource-section" aria-labelledby="topic-resources">
        <p class="eyebrow">12 / RESEARCH LINKS</p>
        <h2 id="topic-resources">本方向常用的专业资源</h2>
        <p class="section-intro">优先链接实验合作组、学术数据库和官方软件文档。外部资源用于追溯原始论文、公开数据和工具说明，不代表本课题组对其所有结论背书。</p>
        <div class="topic-resource-grid">
          <a v-for="resource in topicResources" :key="resource.id" class="topic-resource-card" :href="resource.url" target="_blank" rel="noopener noreferrer">
            <span class="resource-category">{{ resource.category }}</span>
            <strong>{{ resource.name }} <span aria-hidden="true">↗</span></strong>
            <p>{{ resource.description }}</p>
          </a>
        </div>
      </section>

      <footer class="topic-footer">
        <p>本专题是带有来源入口、适用条件与失效边界的研究导读；它不替代原始论文、独立计算或实验分析复现。正式引用时请以所链接的原始来源及其版本为准。</p>
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
.topic-review { position:relative; margin-top:22px; color:var(--muted); font-size:12px; line-height:1.7; }
.topic-review.is-stale { color:var(--warning); font-weight:600; }
.topic-hero-actions { position:relative; display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; margin-top:28px; }
.topic-hero-actions .button { min-height:46px; }
.topic-all-guides { color:var(--accent); font-size:13px; text-underline-offset:4px; }
.topic-all-guides:hover { text-decoration:underline; }
 .topic-local-nav { position:sticky; top:72px; z-index:4; display:flex; align-items:center; gap:8px; overflow-x:auto; padding:10px 12px; margin:18px 0 4px; border:1px solid var(--line); border-radius:12px; background:var(--panel); box-shadow:var(--shadow); scrollbar-width:thin; }
.topic-local-label { flex-shrink:0; padding:0 8px 0 2px; color:var(--muted); font-size:11px; letter-spacing:.08em; }
.topic-local-nav a { flex-shrink:0; padding:7px 10px; border-radius:999px; color:var(--soft); font-size:12px; text-decoration:none; }
.topic-local-nav a:hover,.topic-local-nav a:focus-visible { background:var(--surface); color:var(--accent); outline-offset:2px; }
.topic-section { padding:44px 0; border-bottom:1px solid var(--line); scroll-margin-top:138px; }
.topic-section h2 { margin:10px 0 18px; font-family:var(--serif); font-size:clamp(26px,3vw,34px); font-weight:400; }
.topic-section h2[id] { scroll-margin-top:138px; }
.topic-section>p:not(.eyebrow) { max-width:800px; color:var(--soft); font-size:16px; line-height:1.95; }
.topic-section .topic-caveat { margin-top:22px; padding:16px 18px; border-left:3px solid var(--accent); background:var(--surface); font-size:14px; }
 .section-intro { margin-bottom:22px; font-size:14px!important; }
.relation-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:24px; }
.relation-card { min-width:0; padding:24px; border:1px solid var(--line); border-radius:15px; background:var(--panel); }
.relation-label { color:var(--accent); font-size:10px; letter-spacing:.13em; line-height:1.7; }
.relation-card h3,.assumption-card h3,.research-question-card h3 { margin:10px 0 12px; font-size:17px; font-weight:600; line-height:1.55; }
.relation-formula { display:block; margin:14px 0; padding:13px 14px; border:1px solid var(--line); border-radius:9px; background:var(--surface); color:var(--text); font-family:var(--mono,ui-monospace,monospace); font-size:12px; line-height:1.85; white-space:normal; overflow-wrap:anywhere; }
.relation-card>p:not(.relation-label),.relation-note p,.relation-warning p,.assumption-card p,.research-question-card p,.topic-source-card p { color:var(--soft); font-size:13px; line-height:1.9; }
.relation-note,.relation-warning { margin-top:16px; padding:13px 14px; border-left:2px solid var(--line); background:var(--surface); }
.relation-note strong,.relation-warning strong { display:block; margin-bottom:5px; color:var(--accent); font-size:12px; }
.relation-warning { border-left-color:var(--warning); }
.relation-warning strong { color:var(--warning); }
.prerequisite-panel { margin-top:16px; padding:18px 22px; border:1px dashed var(--line); border-radius:12px; }
.prerequisite-panel>strong { color:var(--text); font-size:13px; }
.prerequisite-panel ul { display:flex; flex-wrap:wrap; gap:8px 28px; margin:12px 0 0; padding-left:18px; color:var(--muted); font-size:12px; line-height:1.8; }
.assumption-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:22px; }
.assumption-card { display:grid; grid-template-columns:30px minmax(0,1fr); gap:12px; padding:20px; border:1px solid var(--line); border-radius:13px; background:var(--panel); }
.assumption-card>span { display:grid; place-items:center; width:26px; height:26px; border:1px solid var(--warning); border-radius:50%; color:var(--warning); font-size:13px; }
.assumption-card h3 { margin:0 0 8px; }
.research-question-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
.research-question-card { padding:22px; border:1px solid var(--line); border-radius:13px; background:var(--panel); }
.question-index { color:var(--accent); font-family:var(--mono,ui-monospace,monospace); font-size:12px; letter-spacing:.1em; }
.research-question-card h3 { margin-top:18px; }
.topic-source-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:22px; }
.topic-source-card { display:block; padding:20px; border:1px solid var(--line); border-radius:13px; background:var(--panel); text-decoration:none; transition:border-color .18s ease,transform .18s ease; }
.topic-source-card:hover { border-color:var(--accent); transform:translateY(-2px); }
.topic-source-card strong { color:var(--accent); font-size:14px; line-height:1.7; overflow-wrap:anywhere; }
.topic-source-card p { margin-top:8px; }
.physics-card-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:24px; }
.physics-card,.interpretation-card { min-width:0; padding:22px; border:1px solid var(--line); border-radius:14px; background:var(--panel); }
.physics-card-label,.interpretation-card>span { color:var(--accent); font-size:10px; letter-spacing:.12em; line-height:1.6; }
 .physics-card h3,.interpretation-card h3,.topic-workflow h3 { margin:10px 0 12px; font-size:17px; font-weight:600; line-height:1.5; }
.physics-formula { display:block; margin:14px 0 10px; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--text); font-family:var(--mono,ui-monospace,monospace); font-size:12px; line-height:1.7; white-space:normal; overflow-wrap:anywhere; }
.physics-card>p:not(.physics-card-label),.interpretation-card p,.topic-workflow li p { color:var(--soft); font-size:14px; line-height:1.9; }
.physics-card ul { margin:14px 0 0; padding-left:18px; color:var(--muted); font-size:12px; line-height:1.9; }
.topic-workflow { display:grid; gap:0; list-style:none; padding:0; margin:22px 0 0; }
.topic-workflow li { display:grid; grid-template-columns:48px minmax(0,1fr); gap:16px; padding:20px 0; border-bottom:1px solid var(--line); }
.workflow-step { display:grid; place-items:center; width:38px; height:38px; border:1px solid var(--line); border-radius:50%; color:var(--accent); font-size:12px; }
.topic-workflow h3 { margin:0 0 6px; }
.interpretation-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:22px; }
.interpretation-card>span { display:inline-block; padding:3px 7px; border:1px solid var(--line); border-radius:999px; }
.topic-resource-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:24px; }
.topic-resource-card { display:flex; flex-direction:column; align-items:flex-start; min-width:0; padding:18px; border:1px solid var(--line); border-radius:13px; background:var(--panel); text-decoration:none; transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease; }
.topic-resource-card:hover { transform:translateY(-2px); border-color:var(--accent); box-shadow:var(--shadow); }
.resource-category { margin-bottom:12px; color:var(--muted); font-size:10px; letter-spacing:.08em; }
.topic-resource-card strong { color:var(--accent); font-size:14px; line-height:1.6; overflow-wrap:anywhere; }
.topic-resource-card strong span { display:inline-block; margin-left:2px; }
.topic-resource-card p { margin-top:8px; color:var(--soft); font-size:12px; line-height:1.8; }
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
@media(max-width:760px) { .physics-card-grid,.interpretation-grid,.relation-grid,.assumption-grid { grid-template-columns:1fr; } .research-question-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .topic-source-grid { grid-template-columns:1fr; } .topic-resource-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .topic-local-nav { top:64px; } }
@media(max-width:600px) { .research-topic-page { width:calc(100% - 36px); padding-top:18px; } .topic-hero-actions { align-items:stretch; flex-direction:column; } .topic-hero-actions .button { justify-content:space-between; } .topic-all-guides { padding:8px 2px; } .research-question-grid { grid-template-columns:1fr; } .relation-card { padding:18px; } .relation-formula { font-size:11px; } .topic-breadcrumb { margin-bottom:28px; } .topic-hero { padding:26px 22px; } .topic-intro,.topic-section>p:not(.eyebrow) { font-size:14px; } .topic-publications li { gap:12px; } .topic-local-nav { top:56px; gap:2px; margin:12px 0 0; } .topic-local-label { display:none; } .topic-local-nav a { padding:7px 9px; } .physics-card,.interpretation-card { padding:18px; } .topic-resource-grid { grid-template-columns:1fr; } .topic-workflow li { grid-template-columns:36px minmax(0,1fr); gap:10px; } .workflow-step { width:32px; height:32px; } }
</style>
