<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const topicNavigation = computed(() => topicDetail.value?.navigation || [])

const topicVisuals = {
  dark: { src: '/images/research-topics/dark-matter.svg', alt: '星系晕、暗物质粒子与液氙探测器中的核反冲信号示意图' },
  neutrino: { src: '/images/research-topics/neutrino.svg', alt: '三种中微子味态的振荡传播、混合关系与示意性振荡谱' },
  collider: { src: '/images/research-topics/collider.svg', alt: '多层对撞机探测器、中心碰撞顶点与多色粒子径迹' },
  phase: { src: '/images/research-topics/phase-gw.svg', alt: '早期宇宙真空泡成核、扩张、碰撞以及引力波传播的概念图' },
  precision: { src: '/images/research-topics/quantum-metrology.svg', alt: 'Bloch 球量子态、自旋关联与量子测量分布的示意图' },
}
const currentTopicVisual = computed(() => topicVisuals[topic.value?.id] || null)
const activeTopicSection = ref('topic-question')
const isTopicNavOpen = ref(false)
let topicSectionObserver

function observeTopicSections() {
  topicSectionObserver?.disconnect()
  if (typeof IntersectionObserver === 'undefined') return
  topicSectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) activeTopicSection.value = visible[0].target.id
  }, { rootMargin: '-5% 0px -70% 0px', threshold: [0, 0.15, 0.35] })

  for (const item of topicNavigation.value) {
    const section = document.getElementById(item.target)
    if (section) topicSectionObserver.observe(section)
  }
}
const topicSectionTitles = computed(() => Object.fromEntries(
  topicNavigation.value.map(item => [item.target, item.heading]),
))
const contentReview = computed(() => publicationReviewStatus(publicContentIndexCheckedAt))
onMounted(async () => {
  document.title = topic.value
    ? `${topic.value.title} | BUAA HEP Hub`
    : '研究专题不存在 | BUAA HEP Hub'
  await nextTick()
  observeTopicSections()
})
watch(() => props.topic, async () => {
  activeTopicSection.value = 'topic-question'
  isTopicNavOpen.value = false
  await nextTick()
  observeTopicSections()
})
onBeforeUnmount(() => topicSectionObserver?.disconnect())
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
          <a href="/#research-guides" class="topic-all-guides">浏览全部专题导读 ↗</a>
        </div>
      </header>

      <figure v-if="currentTopicVisual" class="topic-visual-panel">
        <img :src="currentTopicVisual.src" :alt="currentTopicVisual.alt" width="1000" height="400" loading="lazy" decoding="async">
        <figcaption>概念插图 · 非真实实验事件或科研数据</figcaption>
      </figure>

      <div class="topic-reading-layout">
        <aside v-if="topicDetail" class="topic-sidebar" aria-label="专题目录">
          <div class="topic-sidebar-heading">
            <span class="topic-sidebar-kicker">FIELD INDEX</span>
            <button
              type="button"
              class="topic-sidebar-toggle"
              :aria-expanded="isTopicNavOpen"
              @click="isTopicNavOpen = !isTopicNavOpen"
            >
              <span>专题目录</span>
              <span aria-hidden="true">{{ isTopicNavOpen ? '−' : '+' }}</span>
            </button>
          </div>
          <nav class="topic-local-nav" :class="{ 'is-open': isTopicNavOpen }" aria-label="专题内导航">
            <a
              v-for="(item, index) in topicNavigation"
              :key="item.target"
              :href="'#' + item.target"
              :class="{ 'is-active': activeTopicSection === item.target }"
              :aria-current="activeTopicSection === item.target ? 'location' : undefined"
              @click="isTopicNavOpen = false"
            >
              <span class="topic-nav-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span>{{ item.label }}</span>
            </a>
          </nav>
        </aside>
        <div class="topic-content-column">

      <section class="topic-section" aria-labelledby="topic-question">
        <p class="eyebrow">01 / MOTIVATION</p>
        <h2 id="topic-question">{{ topicSectionTitles['topic-question'] || '科学问题' }}</h2>
        <p>{{ topic.question }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-mechanisms">
        <p class="eyebrow">02 / PHYSICS IN FOCUS</p>
        <h2 id="topic-mechanisms">{{ topicSectionTitles['topic-mechanisms'] || '核心物理机制与研究对象' }}</h2>
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
        <h2 id="topic-relations">{{ topicSectionTitles['topic-relations'] || '关键关系式：公式、含义与适用边界' }}</h2>
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
        <h2 id="topic-framework">{{ topicSectionTitles['topic-framework'] || '理论框架与研究方法' }}</h2>
        <p>{{ topic.methods }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-workflow">
        <p class="eyebrow">05 / FROM MODEL TO EVIDENCE</p>
        <h2 id="topic-workflow">{{ topicSectionTitles['topic-workflow'] || '从理论模型到可检验结论' }}</h2>
        <p class="section-intro">每一步都应保留输入、假设、软件/数据版本与可追溯证据；不能用一张灵敏度曲线替代完整的理论和实验核查。</p>
        <ol class="topic-workflow">
          <li v-for="item in topicDetail.workflow" :key="item.step">
            <span class="workflow-step">{{ item.step }}</span>
            <div><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></div>
          </li>
        </ol>
      </section>

      <section v-if="topicDeepGuide && topicDeepGuide.analysisBlueprint" class="topic-section topic-analysis-blueprint" aria-labelledby="topic-blueprint">
        <p class="eyebrow">05A / TOPIC-SPECIFIC RESEARCH BLUEPRINT</p>
        <h2 id="topic-blueprint">{{ topicSectionTitles['topic-blueprint'] || topicDeepGuide.analysisBlueprint.title }}</h2>
        <p class="section-intro">{{ topicDeepGuide.analysisBlueprint.question }}</p>
        <p>{{ topicDeepGuide.analysisBlueprint.scope }}</p>
        <ol class="topic-workflow">
          <li v-for="item in topicDeepGuide.analysisBlueprint.steps" :key="item.step">
            <span class="workflow-step">{{ item.step }}</span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.detail }}</p>
              <p class="blueprint-output"><strong>阶段产物：</strong>{{ item.output }}</p>
            </div>
          </li>
        </ol>
        <h3 class="blueprint-subheading">必须通过的物理与数值检查</h3>
        <div class="interpretation-grid">
          <article v-for="item in topicDeepGuide.analysisBlueprint.validationChecks" :key="item.title" class="interpretation-card">
            <span>VALIDATION</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
          </article>
        </div>
        <div class="prerequisite-panel">
          <strong>最终报告必须保留</strong>
          <ul>
            <li v-for="item in topicDeepGuide.analysisBlueprint.reportingChecklist" :key="item">{{ item }}</li>
          </ul>
        </div>
      </section>

      <section class="topic-section" aria-labelledby="topic-observables">
        <p class="eyebrow">06 / OBSERVABLES</p>
        <h2 id="topic-observables">{{ topicSectionTitles['topic-observables'] || '可观测量与实验联系' }}</h2>
        <p>{{ topic.probes }}</p>
        <p class="topic-caveat">{{ topic.detail }}</p>
      </section>

      <section v-if="topicDetail" class="topic-section" aria-labelledby="topic-interpretation">
        <p class="eyebrow">07 / HOW TO READ THE RESULTS</p>
        <h2 id="topic-interpretation">{{ topicSectionTitles['topic-interpretation'] || '结果应该如何判读' }}</h2>
        <div class="interpretation-grid">
          <article v-for="item in topicDetail.interpretation" :key="item.tag" class="interpretation-card">
            <span>{{ item.tag }}</span><h3>{{ item.title }}</h3><p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section" aria-labelledby="topic-assumptions">
        <p class="eyebrow">08 / ASSUMPTIONS & FAILURE MODES</p>
        <h2 id="topic-assumptions">{{ topicSectionTitles['topic-assumptions'] || '研究中必须明确的假设与常见误判' }}</h2>
        <p class="section-intro">这些检查不是形式上的免责声明，而是决定公式能否用于具体模型、数据和参数空间的条件。</p>
        <div class="assumption-grid">
          <article v-for="item in topicDeepGuide.assumptions" :key="item.title" class="assumption-card">
            <span aria-hidden="true">!</span><div><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></div>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section" aria-labelledby="topic-questions">
        <p class="eyebrow">09 / RESEARCH ENTRY POINTS</p>
        <h2 id="topic-questions">{{ topicSectionTitles['topic-questions'] || '如何从导读进入实际研究' }}</h2>
        <div class="research-question-grid">
          <article v-for="(item, index) in topicDeepGuide.researchQuestions" :key="item.title" class="research-question-card">
            <span class="question-index">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ item.title }}</h3><p>{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section v-if="topicDeepGuide" class="topic-section topic-source-notes" aria-labelledby="topic-source-notes">
        <p class="eyebrow">10 / SOURCE NOTES</p>
        <h2 id="topic-source-notes">{{ topicSectionTitles['topic-source-notes'] || '关系式与方法的参考依据' }}</h2>
        <p class="section-intro">以下是进入原始资料的起点。正式研究时应继续核对具体章节、定义、版本和原始论文，而不是只引用本页概述。</p>
        <div class="topic-source-grid">
          <a v-for="item in topicDeepGuide.references" :key="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="topic-source-card">
            <strong>{{ item.title }} <span aria-hidden="true">↗</span></strong><p>{{ item.note }}</p>
          </a>
        </div>
      </section>

      <section class="topic-section topic-publications" aria-labelledby="topic-papers">
        <p class="eyebrow">11 / SELECTED PAPERS</p>
        <h2 id="topic-papers">{{ topicSectionTitles['topic-papers'] || '相关代表论文' }}</h2>
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
        <h2 id="topic-resources">{{ topicSectionTitles['topic-resources'] || '本方向常用的专业资源' }}</h2>
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
        </div>
      </div>
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
.research-topic-page { width:min(1280px,calc(100% - 48px)); margin:0 auto; padding:28px 0 80px; color:var(--text); }
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
.topic-visual-panel { position:relative; height:clamp(170px,24vw,280px); margin:18px 0 26px; overflow:hidden; border:1px solid var(--line); border-radius:15px; background:#07131d; box-shadow:var(--shadow); }
.topic-visual-panel::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(90deg,rgba(4,14,22,.08),transparent 45%,rgba(4,14,22,.18)); }
.topic-visual-panel img { display:block; width:100%; height:100%; object-fit:cover; object-position:center; }
.topic-visual-panel figcaption { position:absolute; right:12px; bottom:10px; z-index:1; padding:5px 8px; border:1px solid rgba(160,220,232,.24); border-radius:6px; background:rgba(3,13,21,.72); color:#d2e8ec; font-size:10px; letter-spacing:.04em; }
.topic-reading-layout { display:grid; grid-template-columns:220px minmax(0,1fr); align-items:start; gap:clamp(24px,3vw,40px); margin-top:4px; }
.topic-sidebar { position:sticky; top:18px; align-self:start; max-height:calc(100vh - 36px); overflow-y:auto; overscroll-behavior:contain; padding:12px; border:1px solid var(--line); border-radius:14px; background:var(--panel); box-shadow:var(--shadow); scrollbar-width:thin; scrollbar-color:var(--line) transparent; }
.topic-sidebar-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 8px 12px; border-bottom:1px solid var(--line); }
.topic-sidebar-kicker { color:var(--muted); font-size:10px; letter-spacing:.13em; }
.topic-sidebar-toggle { display:none; }
.topic-sidebar-toggle:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
.topic-local-nav { display:flex; flex-direction:column; gap:3px; padding-top:10px; }
.topic-local-nav a { display:grid; grid-template-columns:22px minmax(0,1fr); align-items:start; gap:7px; padding:9px 8px; border-left:2px solid transparent; border-radius:7px; color:var(--soft); font-size:12px; line-height:1.55; text-decoration:none; transition:background .16s ease,color .16s ease,border-color .16s ease; }
.topic-nav-index { padding-top:1px; color:var(--muted); font-family:var(--mono,ui-monospace,monospace); font-size:10px; }
.topic-local-nav a:hover,.topic-local-nav a:focus-visible,.topic-local-nav a.is-active { background:var(--surface); color:var(--accent); outline-offset:2px; }
.topic-local-nav a.is-active { border-left-color:var(--accent); }
.topic-local-nav a.is-active .topic-nav-index { color:var(--accent); }
.topic-content-column { min-width:0; }
:global(html) { scroll-behavior:smooth; }
.topic-section { padding:44px 0; border-bottom:1px solid var(--line); scroll-margin-top:28px; }
.topic-section h2 { margin:10px 0 18px; font-family:var(--serif); font-size:clamp(26px,3vw,34px); font-weight:400; }
.topic-section h2[id] { scroll-margin-top:28px; }
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
.blueprint-output { margin:8px 0 0!important; padding-left:12px; border-left:2px solid var(--line); color:var(--muted)!important; font-size:13px!important; }
.blueprint-subheading { margin:28px 0 0; font-size:17px; font-weight:600; line-height:1.6; }
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
@media(prefers-reduced-motion:reduce) {
  :global(html) { scroll-behavior:auto; }
  .topic-local-nav a { transition:none; }
}
@media(max-width:980px) {
  .topic-reading-layout { grid-template-columns:1fr; gap:12px; }
  .topic-sidebar { top:8px; z-index:20; max-height:calc(100vh - 16px); padding:8px 10px; background:color-mix(in srgb,var(--panel) 90%,transparent); backdrop-filter:blur(14px); }
  .topic-sidebar-heading { padding:0; border:0; }
  .topic-sidebar-kicker { padding-left:4px; }
  .topic-sidebar-toggle { display:flex; align-items:center; gap:18px; min-height:38px; padding:6px 10px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--text); font:inherit; font-size:12px; cursor:pointer; }
  .topic-section h2[id] { scroll-margin-top:82px; }
  .topic-local-nav { display:none; max-height:58vh; overflow-y:auto; padding-top:10px; }
  .topic-local-nav.is-open { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px; }
  .topic-local-nav a { padding:8px; }
}
@media(max-width:760px) { .physics-card-grid,.interpretation-grid,.relation-grid,.assumption-grid { grid-template-columns:1fr; } .research-question-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .topic-source-grid { grid-template-columns:1fr; } .topic-resource-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) {
  .research-topic-page { width:calc(100% - 36px); padding-top:18px; }
  .topic-hero-actions { align-items:stretch; flex-direction:column; }
  .topic-hero-actions .button { justify-content:space-between; }
  .topic-all-guides { padding:8px 2px; }
  .research-question-grid { grid-template-columns:1fr; }
  .relation-card { padding:18px; }
  .relation-formula { font-size:11px; }
  .topic-breadcrumb { margin-bottom:28px; }
  .topic-hero { padding:26px 22px; }
  .topic-intro,.topic-section>p:not(.eyebrow) { font-size:14px; }
  .topic-publications li { gap:12px; }
  .topic-local-nav.is-open { grid-template-columns:1fr; }
  .topic-local-nav a { padding:8px; }
  .physics-card,.interpretation-card { padding:18px; }
  .topic-resource-grid { grid-template-columns:1fr; }
  .topic-workflow li { grid-template-columns:36px minmax(0,1fr); gap:10px; }
  .workflow-step { width:32px; height:32px; }
  .topic-visual-panel { height:150px; margin-top:12px; }
}
</style>
