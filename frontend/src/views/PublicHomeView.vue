<script setup>
import { computed, onMounted, ref, nextTick } from 'vue'
import PublicThemeSwitcher from '../components/PublicThemeSwitcher.vue'
import PublicSectionNav from '../components/PublicSectionNav.vue'
import { lab, advisorProfile, collaborators, directions, publications, publicationCategories, publicResources, publicResourceCheckedAt } from '../content/lab'
const menuOpen = ref(false)
const filter = ref('all')
const query = ref('')
const selectedYear = ref('all')
const sortOrder = ref('newest')
const copyMessage = ref('')
const years = [...new Set(publications.map(p => p.year))].sort((a, b) => Number(b) - Number(a))
const reviewNow = ref(new Date())
const publicationReviews = computed(() => Object.fromEntries(publications.map(paper => [paper.id, publicationReviewStatus(paper.last_verified_at, reviewNow.value)])))
const resourceReview = computed(() => publicationReviewStatus(publicResourceCheckedAt, reviewNow.value))
const visiblePapers = computed(() => filterPublications(publications, { category: filter.value, query: query.value, year: selectedYear.value, sort: sortOrder.value }))
import { filterPublications, publicationBibtex, citationText } from '../utils/publications'
import { publicationReviewStatus } from '../utils/publicationReview'
async function copyCitation(paper) {
  try { await navigator.clipboard.writeText(citationText(paper)); copyMessage.value = `已复制 arXiv:${paper.id} 的引用` }
  catch { copyMessage.value = '复制未完成，请使用 BibTeX 下载引用' }
}
function showRelatedPapers(id) {
  filter.value = id; query.value = ''; selectedYear.value = 'all'
  document.getElementById('publications')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
function moveResearchTab(event, index) {
  const target = { ArrowDown: (index + 1) % directions.length, ArrowUp: (index + directions.length - 1) % directions.length, Home: 0, End: directions.length - 1 }[event.key]
  if (target === undefined) return
  event.preventDefault()
  currentDirection.value = target
  nextTick(() => document.getElementById(`research-tab-${target}`)?.focus())
}
const currentDirection = ref(0)
const activeDirection = computed(() => directions[currentDirection.value])
const relatedResearchPapers = computed(() => activeDirection.value.references.map(id => publications.find(paper => paper.id === id)).filter(Boolean))
const resourceCategory = ref('all')
const resourceCategories = [...new Set(publicResources.map(resource => resource.category))]
const visibleResources = computed(() => publicResources.filter(resource => resourceCategory.value === 'all' || resource.category === resourceCategory.value))
onMounted(() => {
  document.title = `${lab.name}${lab.provisional ? '（暂定）' : ''} | ${lab.field}`

  // A cross-page hash link can arrive before Vue has rendered the target section.
  // Re-apply the fragment after mount so links such as /#research-guides land correctly.
  const hash = window.location.hash
  if (hash) {
    nextTick(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView())
  }
})
function downloadBibtex() {
  const entries = publicationBibtex(visiblePapers.value)
  const url = URL.createObjectURL(new Blob([entries], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = 'buaa-hep-selected.bib'; link.click(); URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="lab-public">
    <PublicSectionNav />
    <header class="public-header">
      <a href="#top" class="public-brand" aria-label="课题组首页" @click="menuOpen = false">
        <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="17"/><ellipse cx="24" cy="24" rx="9" ry="22" transform="rotate(45 24 24)"/><path d="M3 24h42"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>
        <span><strong>{{ lab.shortName }}</strong><small>北京航空航天大学 · 物理学院</small></span>
      </a>
      <button class="menu-toggle button secondary" :aria-expanded="menuOpen" aria-controls="public-navigation" @click="menuOpen = !menuOpen">{{ menuOpen ? '关闭菜单' : '菜单' }}</button>
      <nav id="public-navigation" :class="{ open: menuOpen }" aria-label="官网导航">
        <a href="#research" @click="menuOpen = false">研究方向</a><a href="#research-guides" @click="menuOpen = false">专题导读</a><a href="#publications" @click="menuOpen = false">代表成果</a><a href="#physics-resources" @click="menuOpen = false">物理资源</a><a href="#about" @click="menuOpen = false">关于我们</a>
        <router-link to="/people" @click="menuOpen = false">团队</router-link><router-link to="/events" @click="menuOpen = false">学术活动</router-link>
        <router-link class="nav-hub" to="/hub">组内协作 <span aria-hidden="true">↗</span></router-link>
      </nav>
      <PublicThemeSwitcher inline />
      <router-link class="header-hub-cta" to="/hub" aria-label="进入组内协作空间">
        <span>进入协作空间</span><span class="header-hub-arrow" aria-hidden="true">↗</span>
      </router-link>
    </header>

    <section id="top" class="public-hero">
      <div class="hero-blueprint-decor" aria-hidden="true">
        <svg class="blueprint-gear blueprint-gear-large" viewBox="0 0 240 240" fill="none">
          <g stroke="currentColor" stroke-width="1"><circle cx="120" cy="120" r="82"/><circle cx="120" cy="120" r="63"/><circle cx="120" cy="120" r="25"/><circle cx="120" cy="120" r="8"/><path d="M120 18v204M18 120h204M48 48l144 144M192 48L48 192"/><path d="M120 2v22M120 216v22M2 120h22M216 120h22M36 36l16 16M188 188l16 16M204 36l-16 16M52 188l-16 16"/></g>
        </svg>
        <svg class="blueprint-gear blueprint-gear-small" viewBox="0 0 180 180" fill="none">
          <g stroke="currentColor" stroke-width="1"><circle cx="90" cy="90" r="62"/><circle cx="90" cy="90" r="43"/><circle cx="90" cy="90" r="15"/><path d="M90 8v164M8 90h164M32 32l116 116M148 32L32 148"/></g>
        </svg>
        <span class="blueprint-equation equation-top">ℒ = −¼ FμνFμν + ψ̄ iγμDμψ + ⋯</span>
        <span class="blueprint-equation equation-side">MATTER<br>ENERGY<br>SPACE<br>TIME<br>BEYOND</span>
        <span class="blueprint-equation equation-bottom">E² = p²c² + m²c⁴</span>
        <span class="blueprint-coordinate coordinate-left">QUARKS · LEPTONS · GAUGE BOSONS · HIGGS</span>
        <span class="blueprint-coordinate coordinate-right">COLLISIONS / DETECTORS / DATA / DISCOVERY</span>
      </div>
      <div class="hero-copy">
        <div class="hero-eyebrow"><span class="status-dot"></span> {{ lab.english }} <span class="eyebrow-rule" aria-hidden="true"></span></div>
        <h1 class="hero-title">Particle Physics<br><span>Research Group</span></h1>
        <p class="hero-intro">{{ lab.intro }}</p>
        <div class="hero-actions">
          <a href="#research" class="button primary">探索研究方向 <span aria-hidden="true">→</span></a>
          <a href="#about" class="button secondary">关于课题组 <span aria-hidden="true">→</span></a>
          <a href="#research-guides" class="button ghost">专题导读 <span aria-hidden="true">↓</span></a>
        </div>
        <div class="hero-affiliation"><span>BEIHANG UNIVERSITY · HIGH-ENERGY PHYSICS</span><span>{{ lab.name }} <small v-if="lab.provisional">/ 暂定名称</small></span></div>
      </div>
      <figure class="collision-figure">
        <svg viewBox="0 0 600 600" role="img" aria-labelledby="collision-title collision-description">
          <title id="collision-title">粒子碰撞探测器概念图</title>
          <desc id="collision-description">精密探测器的多层圆形结构、碰撞中心和向外延伸的粒子径迹。此为装饰性概念示意，并非真实实验数据。</desc>
          <defs>
            <radialGradient id="collision-glow"><stop stop-color="#fff3cf" stop-opacity=".95"/><stop offset=".08" stop-color="#f4b45b" stop-opacity=".7"/><stop offset=".25" stop-color="#347dc1" stop-opacity=".24"/><stop offset="1" stop-color="#347dc1" stop-opacity="0"/></radialGradient>
            <linearGradient id="detector-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d4d8d7" stop-opacity=".9"/><stop offset=".5" stop-color="#657b8b" stop-opacity=".5"/><stop offset="1" stop-color="#c9a875" stop-opacity=".65"/></linearGradient>
          </defs>
          <circle cx="300" cy="300" r="290" fill="url(#collision-glow)"/>
          <g class="detector-rings" fill="none">
            <circle v-for="r in [48,88,135,180,225,264]" :key="r" cx="300" cy="300" :r="r"/>
            <ellipse cx="300" cy="300" rx="264" ry="98" transform="rotate(-27 300 300)"/>
            <ellipse cx="300" cy="300" rx="250" ry="145" transform="rotate(28 300 300)"/>
            <circle cx="300" cy="300" r="278" stroke-dasharray="2 8"/>
            <path d="M18 300h564M300 18v564M88 88l424 424M512 88L88 512" stroke-dasharray="3 8"/>
          </g>
          <g class="detector-segments" fill="none" stroke="url(#detector-metal)" stroke-width="5">
            <circle cx="300" cy="300" r="208" stroke-dasharray="5 4 20 4"/>
            <circle cx="300" cy="300" r="164" stroke-dasharray="14 5 4 5"/>
            <circle cx="300" cy="300" r="120" stroke-dasharray="8 3 2 3"/>
          </g>
          <g class="collision-tracks" fill="none" stroke-linecap="round">
            <path d="M300 300Q365 222 528 112"/><path d="M300 300C356 325 458 320 570 377"/>
            <path d="M300 300Q250 339 127 495"/><path d="M300 300Q238 261 42 213"/>
            <path d="M300 300C328 250 339 163 356 37"/><path d="M300 300C317 351 338 459 426 530"/>
            <path d="M300 300Q197 315 43 378"/><path d="M300 300Q246 190 172 60"/>
            <path d="M300 300C353 278 429 226 552 214"/><path d="M300 300Q271 399 259 562"/>
          </g>
          <g class="track-hits" fill="currentColor"><circle cx="300" cy="300" r="5"/><circle cx="450" cy="170" r="3"/><circle cx="197" cy="409" r="3"/><circle cx="336" cy="172" r="3"/><circle cx="466" cy="337" r="3"/></g>
          <circle class="collision-core" cx="300" cy="300" r="12"/>
          <g class="collision-annotations" fill="currentColor"><text x="438" y="94">μ⁺</text><text x="478" y="418">χ</text><text x="105" y="464">μ⁻</text><text x="340" y="284">p → ← p</text><text x="318" y="582">EVENT DISPLAY / CONCEPTUAL</text></g>
        </svg>
        <figcaption><span>COLLISIONS · DETECTORS · DATA</span><span>理论 · 模型 · 信号</span></figcaption>
      </figure>
    </section>
    <div class="research-strip"><span>高能粒子物理唯象学</span><span>暗物质</span><span>中微子</span><span>希格斯物理</span><span>超出标准模型</span></div>

    <section id="research" class="public-section research-section">
      <div class="section-top"><div><span class="eyebrow">01 / RESEARCH</span><h2>让理论走向可检验的信号。</h2></div><p>从基本相互作用出发，<br>连接微观模型与实验观测。</p></div>
      <div class="research-layout">
        <div class="research-tabs" role="tablist" aria-label="研究方向" aria-orientation="vertical">
          <button v-for="(d, i) in directions" :id="`research-tab-${i}`" :key="d.id" role="tab" :aria-selected="i === currentDirection" aria-controls="research-detail" :tabindex="i === currentDirection ? 0 : -1" :class="{ active: i === currentDirection }" @click="currentDirection = i" @keydown="moveResearchTab($event, i)"><span>{{ d.number }}</span><strong>{{ d.title }}</strong><span aria-hidden="true">↗</span></button>
        </div>
        <article id="research-detail" class="research-detail" role="tabpanel" :aria-labelledby="`research-tab-${currentDirection}`" tabindex="0">
          <span class="research-symbol" aria-hidden="true">{{ activeDirection.symbol }}</span><span class="eyebrow">{{ activeDirection.en }}</span><h3>{{ activeDirection.title }}</h3><p>{{ activeDirection.text }}</p>
          <dl class="research-explainer"><div><dt>研究问题</dt><dd>{{ activeDirection.question }}</dd></div><div><dt>主要方法</dt><dd>{{ activeDirection.methods }}</dd></div><div><dt>实验联系</dt><dd>{{ activeDirection.probes }}</dd></div></dl>
          <p class="research-scope">{{ activeDirection.detail }}</p>
          <div class="topic-tags"><span v-for="tag in activeDirection.tags" :key="tag">{{ tag }}</span></div>
          <router-link class="topic-guide-entry" :to="`/research/${activeDirection.id}`" :aria-label="`阅读${activeDirection.title}专题导读`">
            <div><span>RESEARCH GUIDE / 深入阅读</span><strong>进入{{ activeDirection.title }}专题导读</strong><small>关键关系式 · 适用条件 · 分析流程 · 专业资源</small></div>
            <span class="topic-guide-arrow" aria-hidden="true">↗</span>
          </router-link>
          <div class="research-evidence"><h4>相关研究选读</h4><ul><li v-for="paper in relatedResearchPapers" :key="paper.id"><a :href="paper.source_url" target="_blank" rel="noopener noreferrer">{{ paper.title }} <span aria-hidden="true">↗</span></a><small>arXiv:{{ paper.id }}</small></li></ul></div>
          <button class="button secondary related-papers" @click="showRelatedPapers(activeDirection.id)">查看相关论文 <span aria-hidden="true">↓</span></button>
        </article>
      </div>
      <noscript><div class="research-static"><h3>全部研究方向</h3><article v-for="direction in directions" :key="direction.id"><h4>{{ direction.title }}</h4><p>{{ direction.text }}</p><dl><dt>研究问题</dt><dd>{{ direction.question }}</dd><dt>主要方法</dt><dd>{{ direction.methods }}</dd><dt>实验联系</dt><dd>{{ direction.probes }}</dd></dl><p>{{ direction.detail }}</p></article></div></noscript>
    </section>

    <section id="research-guides" class="public-section research-guides-section" aria-labelledby="research-guides-title">
      <div class="section-top">
        <div><span class="eyebrow">02 / RESEARCH GUIDES</span><h2 id="research-guides-title">从概念出发，沿着证据深入。</h2></div>
        <p>五个方向，各有一份可继续阅读的专题导读。<br>公式附带适用条件，结论标明模型与数据边界。</p>
      </div>
      <div class="research-guide-grid">
        <article v-for="direction in directions" :key="direction.id" class="research-guide-card">
          <div class="research-guide-top"><span>{{ direction.number }} / TOPIC GUIDE</span><span class="research-guide-symbol" aria-hidden="true">{{ direction.symbol }}</span></div>
          <p class="research-guide-kicker">{{ direction.en }}</p>
          <h3>{{ direction.title }}</h3>
          <p class="research-guide-summary">{{ direction.text }}</p>
          <div class="research-guide-question"><span>核心问题</span><p>{{ direction.question }}</p></div>
          <div class="research-guide-tags"><span v-for="tag in direction.tags.slice(0, 3)" :key="tag">{{ tag }}</span></div>
          <a :href="'/research/' + direction.id" class="button primary research-guide-open">打开专题导读 <span aria-hidden="true">↗</span></a>
        </article>
      </div>
      <p class="research-guides-note">导读用于建立概念地图与追溯原始来源；不替代论文原文、独立计算或实验分析复现。</p>
    </section>

    <section id="publications" class="public-section publications-section">
      <div class="section-top"><div><span class="eyebrow">03 / SELECTED PUBLICATIONS</span><h2>以研究回应问题。</h2></div><button class="button secondary" :disabled="!visiblePapers.length" @click="downloadBibtex">导出 BibTeX <span aria-hidden="true">↓</span></button></div>
      <p class="section-description">以下为公开代表成果选录，非完整或最新论文列表。16 篇选录已由课题组确认，书目信息交叉核对至 arXiv 与 INSPIRE-HEP；最近核对：2026-10-20。</p>
      <div class="publication-controls"><div class="segmented" aria-label="论文主题筛选"><button v-for="item in [{ id: 'all', label: '全部成果' }, ...publicationCategories]" :key="item.id" :aria-pressed="filter === item.id" :class="{ selected: filter === item.id }" @click="filter = item.id">{{ item.label }}</button></div><label class="paper-search"><span class="sr-only">搜索论文标题、作者、编号、DOI、期刊或主题</span><input v-model="query" type="search" placeholder="搜索标题、作者、编号或 DOI"/></label></div>
      <div class="publication-options"><label>年份 <select v-model="selectedYear" aria-label="论文年份"><option value="all">全部年份</option><option v-for="year in years" :key="year" :value="year">{{ year }}</option></select></label><label>排序 <select v-model="sortOrder" aria-label="论文排序"><option value="newest">年份由新到旧</option><option value="oldest">年份由旧到新</option></select></label><p role="status">显示 {{ visiblePapers.length }} / {{ publications.length }} 篇</p></div>
      <p v-if="copyMessage" class="citation-status" role="status">{{ copyMessage }}</p>
      <div class="paper-list">
        <article v-for="paper in visiblePapers" :key="paper.id" class="public-paper">
          <div class="paper-year">{{ paper.year }}<small>hep-ph</small></div>
          <div class="paper-content"><div class="paper-heading"><span class="paper-tag">{{ paper.tag }}</span><span class="paper-status">{{ paper.status === 'published' ? '已发表' : '预印本' }}</span></div>
            <h3><a :href="paper.source_url" target="_blank" rel="noopener noreferrer">{{ paper.title }}</a></h3>
            <p class="paper-authors">{{ paper.authors.join(' · ') }}</p>
            <p class="paper-summary">{{ paper.summary }}</p>
            <p class="paper-journal">{{ paper.journal || '预印本 · 暂未检索到期刊出版记录' }}</p>
            <a v-if="paper.doi" :href="`https://doi.org/${paper.doi}`" target="_blank" rel="noopener noreferrer" class="paper-doi">DOI: {{ paper.doi }}</a>
            <p class="paper-verification" :class="{ 'is-stale': publicationReviews[paper.id].status !== 'current' }">arXiv:{{ paper.id }} · {{ publicationReviews[paper.id].label }}</p>
            <div class="paper-actions"><a :href="paper.source_url" target="_blank" rel="noopener noreferrer" :aria-label="`阅读论文 ${paper.id}`">arXiv ↗</a><a :href="paper.inspire_url" target="_blank" rel="noopener noreferrer" :aria-label="`核对论文 ${paper.id} 的 INSPIRE 记录`">INSPIRE ↗</a><button @click="copyCitation(paper)" :aria-label="`复制论文 ${paper.id} 的引用`">复制引用</button></div>
          </div>
        </article>
        <div v-if="!visiblePapers.length" class="paper-empty">没有匹配的论文。<button class="button ghost" @click="query = ''; filter = 'all'; selectedYear = 'all'">清除筛选</button></div>
      </div>
    </section>

    <section id="physics-resources" class="public-section physics-resources-section" aria-labelledby="physics-resources-title">
      <div class="section-top"><div><span class="eyebrow">04 / PHYSICS RESOURCES</span><h2 id="physics-resources-title">让每一步探索，都有可靠的起点。</h2></div><p>文献、数据与计算工具，<br>从官方来源继续深入。</p></div>
      <p class="section-description">精选常用物理网站，点击在新标签页打开。各站点的资料、软件和使用条件以原始来源为准。</p>
      <div class="physics-resource-controls" role="group" aria-label="物理资源分类"><button type="button" :aria-pressed="resourceCategory === 'all'" :class="{ selected: resourceCategory === 'all' }" @click="resourceCategory = 'all'">全部资源</button><button v-for="category in resourceCategories" :key="category" type="button" :aria-pressed="resourceCategory === category" :class="{ selected: resourceCategory === category }" @click="resourceCategory = category">{{ category }}</button></div>
      <p class="physics-resource-count" role="status">显示 {{ visibleResources.length }} / {{ publicResources.length }} 项资源</p>
      <div class="physics-resource-grid"><article v-for="resource in visibleResources" :key="resource.id" class="physics-resource-card"><span>{{ resource.category }}</span><h3><a :href="resource.url" target="_blank" rel="noopener noreferrer" :aria-label="resource.name + '（新标签页）'">{{ resource.name }} <span aria-hidden="true">↗</span></a></h3><p>{{ resource.description }}</p></article></div>
      <p class="physics-resource-note" :class="{ 'is-stale': resourceReview.status !== 'current' }">资源说明核对：{{ publicResourceCheckedAt }} · {{ resourceReview.status === 'current' ? '处于 180 天复核周期内' : resourceReview.label }}。站内仅提供导航，不代管第三方数据或计算服务。</p>
    </section>

    <section id="about" class="public-section about-section">
      <div><span class="eyebrow">05 / ABOUT THE GROUP</span><h2>保持好奇，<br>一起探索基本规律。</h2><p>依托{{ lab.institution }}，聚焦{{ lab.field }}。我们在理论研究、文献研读与学术讨论中，探索新的物理可能性。</p></div>
      <div class="about-details">
        <div class="academic-partner" role="group" :aria-label="advisorProfile.groupRole + '：' + advisorProfile.name">
          <span>{{ advisorProfile.groupRole }}</span>
          <strong>{{ advisorProfile.name }} <small> / {{ advisorProfile.english }}</small></strong>
          <p class="partner-affiliation">{{ advisorProfile.institution }} · {{ advisorProfile.title }}</p>
          <p>{{ advisorProfile.intro }}</p>
          <p class="partner-topics">研究方向：{{ advisorProfile.topics.join('、') }}</p>
          <a :href="advisorProfile.source" target="_blank" rel="noopener noreferrer">北京航空航天大学学院主页 ↗</a>
          <a href="#publications">查看代表成果 ↓</a>
        </div>
        <div v-for="person in collaborators" :key="person.source" class="academic-partner" role="group" :aria-label="person.groupRole + '：' + person.name">
          <span>{{ person.groupRole }}</span>
          <strong>{{ person.name }} <small> / {{ person.english }}</small></strong>
          <p class="partner-affiliation">{{ person.institution }} · {{ person.title }}</p>
          <p>{{ person.intro }}</p>
          <p class="partner-topics">研究方向：{{ person.topics.join('、') }}</p>
          <p v-for="highlight in person.highlights" :key="highlight">{{ highlight }}</p>
          <a :href="person.source" target="_blank" rel="noopener noreferrer">北京大学教师主页 ↗</a>
        </div>
        <div><span>研究领域</span><strong>{{ lab.field }}</strong></div>
        <p>更多成员介绍与学术活动将在确认后补充。</p>
      </div>
    </section>

    <section id="collaboration" class="public-section collaboration-section"><div><span class="eyebrow">RESEARCH, TOGETHER</span><h2>把日常协作，留给更好的研究。</h2><p>组会安排、文献讨论与研习资料，在同一个工作台持续积累。</p><router-link to="/hub" class="button primary">进入组内协作 <span aria-hidden="true">↗</span></router-link></div><div class="hub-module-list"><span><i>01</i> 组会与学术日程 <small>SEMINARS</small></span><span><i>02</i> 文献推荐与讨论 <small>LITERATURE</small></span><span><i>03</i> 资料库与个人收藏 <small>RESOURCES</small></span><p>工作台需登录访问 · 首次使用由管理员初始化</p></div></section>
    <footer class="public-footer"><span>{{ lab.shortName }}<small>{{ lab.name }}<template v-if="lab.provisional">（暂定名称）</template></small></span><span>基于 <a href="https://github.com/Chocologism/lab-orbit" target="_blank" rel="noopener noreferrer">LabOrbit</a> 定制 · 非学校官方门户</span><a href="#top">回到顶部 ↑</a></footer>
  </div>
</template>

<style scoped>
.research-explainer { position:relative; margin:24px 0; display:grid; gap:18px; }
.research-explainer dt { color:var(--accent); font-size:13px; margin-bottom:6px; }
.research-explainer dd { margin:0; color:var(--soft); font-size:15px; line-height:1.85; }
.research-detail .research-scope { padding-top:18px; border-top:1px solid var(--line); font-size:13px; color:var(--muted); }
.topic-guide-entry { display:flex; justify-content:space-between; align-items:center; gap:18px; margin:24px 0 4px; padding:18px 20px; border:1px solid var(--accent); border-radius:14px; background:var(--raised); color:var(--text); text-decoration:none; transition:transform .18s ease,box-shadow .18s ease,background .18s ease; }
.topic-guide-entry:hover { transform:translateY(-2px); box-shadow:var(--shadow); background:var(--surface); }
.topic-guide-entry>div { display:flex; flex-direction:column; gap:6px; min-width:0; }
.topic-guide-entry>div>span { color:var(--accent); font-size:9px; letter-spacing:.13em; }
.topic-guide-entry strong { font-size:16px; font-weight:500; line-height:1.6; }
.topic-guide-entry small { color:var(--muted); font-size:11px; line-height:1.7; }
.topic-guide-arrow { flex-shrink:0; display:grid; place-items:center; width:38px; height:38px; border-radius:50%; background:var(--accent); color:var(--accent-ink); font-size:18px; }
.research-guides-section { border-top:1px solid var(--line); }
.research-guide-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
.research-guide-card { position:relative; display:flex; flex-direction:column; min-width:0; overflow:hidden; padding:24px; border:1px solid var(--line); border-radius:17px; background:var(--surface); }
.research-guide-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; color:var(--accent); font-size:9px; letter-spacing:.13em; }
.research-guide-symbol { margin-top:-15px; color:var(--accent); opacity:.14; font-family:var(--serif); font-size:70px; line-height:1; }
.research-guide-kicker { margin-top:10px; color:var(--muted); font-size:9px; letter-spacing:.1em; line-height:1.7; }
.research-guide-card h3 { margin:12px 0; font-size:21px; font-weight:400; line-height:1.45; }
.research-guide-summary { color:var(--soft); font-size:13px; line-height:1.85; }
.research-guide-question { margin-top:18px; padding:14px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.research-guide-question>span { color:var(--accent); font-size:11px; }
.research-guide-question p { margin-top:7px; color:var(--soft); font-size:12px; line-height:1.8; }
.research-guide-tags { display:flex; flex-wrap:wrap; gap:6px; margin:16px 0 22px; }
.research-guide-tags span { padding:4px 8px; border:1px solid var(--line); border-radius:999px; color:var(--muted); font-size:10px; }
.research-guide-open { display:flex; justify-content:space-between; width:100%; min-height:46px; margin-top:auto; }
.research-guides-note { margin-top:18px; color:var(--muted); font-size:12px; line-height:1.8; }
.research-evidence { position:relative; margin-top:26px; padding-top:20px; border-top:1px solid var(--line); }
.research-evidence h4 { font-size:14px; font-weight:500; color:var(--soft); }
.research-evidence ul { padding-left:18px; margin:14px 0 0; display:grid; gap:14px; }
.research-evidence li { color:var(--muted); font-size:13px; }
.research-evidence a { color:var(--accent); font-size:14px; line-height:1.7; overflow-wrap:anywhere; }
.research-evidence a:hover { text-decoration:underline; text-underline-offset:4px; }
.research-evidence small { display:block; margin-top:4px; font-size:12px; color:var(--muted); }
.research-static article { padding:24px 0; border-bottom:1px solid var(--line); }
.research-static h3,.research-static h4 { margin:18px 0; }
.research-static p,.research-static dd { font-size:15px; line-height:1.8; color:var(--soft); margin:10px 0; }
.research-static dt { margin-top:14px; font-size:14px; color:var(--accent); }
.physics-resources-section { border-top:1px solid var(--line); }
.physics-resource-controls { display:flex; flex-wrap:wrap; gap:8px; margin:28px 0 14px; }
.physics-resource-controls button { min-height:44px; border:1px solid var(--line); padding:10px 16px; background:transparent; color:var(--soft); border-radius:12px; font-size:14px; }
.physics-resource-controls button.selected { background:var(--raised); color:var(--text); border-color:var(--accent); }
.physics-resource-count { font-size:13px; color:var(--muted); margin-bottom:18px; }
.physics-resource-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; }
.physics-resource-card { min-width:0; border:1px solid var(--line); background:var(--surface); border-radius:20px; padding:24px; }
.physics-resource-card>span { color:var(--muted); font-size:12px; }
.physics-resource-card h3 { margin:12px 0 14px; font-size:20px; font-weight:400; overflow-wrap:anywhere; }
.physics-resource-card h3 a { color:var(--accent); display:inline-block; padding:4px 0; min-height:44px; }
.physics-resource-card h3 a:hover { text-decoration:underline; text-underline-offset:4px; }
.physics-resource-card p { color:var(--soft); font-size:14px; line-height:1.85; }
.physics-resource-note { font-size:13px; color:var(--muted); line-height:1.8; margin-top:24px; }
.physics-resource-note.is-stale { color:var(--warning); font-weight:600; }
@media(max-width:1100px) { .physics-resource-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:1100px) {
  .public-header { gap:12px; }
  .public-header nav { gap:15px; font-size:12px; }
  .public-brand { gap:9px; }
  .public-brand strong { font-size:16px; letter-spacing:.03em; }
  .public-header .header-hub-cta { padding:0 12px; gap:8px; font-size:12px; }
}
@media(max-width:900px) {
  .public-header { flex-wrap:wrap; padding:14px 0; }
  .public-header .menu-toggle { display:flex; font-size:13px; min-height:44px; }
  #public-navigation { display:none; order:5; width:100%; flex-wrap:wrap; gap:12px 22px; padding:8px 0 14px; }
  #public-navigation.open { display:flex; }
  .public-header .nav-hub { border-left:0; padding-left:0; }
  .public-header .header-hub-cta { margin-left:auto; }
  .public-hero { grid-template-columns:minmax(0,1fr) minmax(0,.92fr); min-height:570px; padding:44px 0; }
  .blueprint-gear-large { width:240px; }
}
@media(max-width:650px) {
  .public-header,.public-hero,.public-section,.public-footer,.research-strip { width:calc(100% - 36px); }
  .public-header { gap:10px; }
  .public-header .public-brand { max-width:calc(100% - 130px); }
  .public-brand .brand-mark { width:34px; height:34px; }
  .public-brand strong { font-size:14px; }
  .public-brand small { font-size:9px; }
  .public-header .header-hub-cta { order:4; width:100%; justify-content:space-between; margin:0; }
  .public-header .menu-toggle { margin-left:auto; }
  .public-header .public-theme-switcher { order:3; }
  .public-hero { display:flex; flex-direction:column; align-items:stretch; gap:18px; min-height:0; padding:48px 0 34px; }
  .hero-copy { position:relative; z-index:1; }
  h1.hero-title { font-size:clamp(39px,11vw,58px); line-height:1.02; }
  .hero-eyebrow { font-size:9px; letter-spacing:.1em; }
  .hero-intro { font-size:14px; line-height:1.8; }
  .hero-actions { gap:8px; margin:22px 0 26px; }
  .hero-actions a { min-height:44px; padding:10px 12px; gap:10px; font-size:12px; }
  .hero-affiliation>span:first-child { font-size:8px; }
  .collision-figure { margin:0 -6px; }
  .collision-figure figcaption { padding:0 10px; font-size:8px; }
  .equation-top { top:4px; right:2%; font-size:12px; }
  .equation-side,.coordinate-right { display:none; }
  .equation-bottom { bottom:10%; left:4%; font-size:16px; }
  .coordinate-left { bottom:13%; font-size:7px; max-width:84px; }
  .blueprint-gear-large { width:190px; left:-100px; top:-10px; }
  .blueprint-gear-small { width:150px; left:auto; right:4%; bottom:-35px; }
}
@media(max-width:650px) { .physics-resource-grid { grid-template-columns:1fr; } .physics-resource-card { padding:20px; } .research-explainer dd { font-size:14px; } }
.related-papers { margin-top:24px; }
.topic-detail-link { margin:24px 0 0 8px; min-height:44px; display:inline-flex; align-items:center; gap:10px; }
@media(max-width:650px) { .topic-detail-link { margin-left:0; } }
.publication-controls { gap:20px; flex-wrap:wrap; }
.publication-controls .segmented { flex-wrap:wrap; gap:4px; }
.publication-controls .segmented button { white-space:normal; }
.publication-options { display:flex; gap:20px; flex-wrap:wrap; align-items:center; margin:20px 0; color:var(--muted); font-size:14px; }
.publication-options label { display:flex; gap:10px; align-items:center; }
.publication-options select { color:var(--text); background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
.publication-options p { margin-left:auto; }
.paper-heading { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
.paper-status { font-size:12px; color:var(--soft); border:1px solid var(--line); padding:2px 8px; border-radius:999px; }
.paper-summary { color:var(--soft); font-size:14px; line-height:1.8; margin:12px 0; }
.paper-doi { color:var(--accent); font-size:14px; overflow-wrap:anywhere; }
.paper-verification { font-size:12px; color:var(--muted); margin-top:12px; }
.paper-verification.is-stale { color:var(--warning); font-weight:600; }
.paper-actions { display:flex; flex-wrap:wrap; gap:16px; margin-top:14px; font-size:14px; color:var(--accent); }
.paper-actions button { color:inherit; background:transparent; border:0; padding:0; cursor:pointer; font:inherit; }
.citation-status { color:var(--success); font-size:14px; }

.lab-public { background:var(--bg); color:var(--text); position:relative; overflow:hidden; font-family:var(--font); }
.public-header,.public-hero,.public-section,.public-footer,.research-strip { width:min(1280px,calc(100% - 96px)); margin-inline:auto; }
.public-header { min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:18px; border-bottom:1px solid var(--line); position:relative; z-index:5; background:color-mix(in srgb,var(--bg) 88%,transparent); }
.public-header .header-hub-cta { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; gap:16px; min-height:44px; padding:0 18px; border:1px solid var(--text); border-radius:7px; background:var(--text); color:var(--bg); text-decoration:none; font-family:var(--serif,var(--font)); font-size:13px; transition:transform .2s ease,background .2s ease,box-shadow .2s ease; }
.public-header .header-hub-cta:hover { transform:translateY(-2px); background:var(--accent); border-color:var(--accent); color:var(--accent-ink,var(--bg)); box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 18%,transparent); }
.header-hub-arrow { font-family:var(--font); font-size:18px; }
.public-brand { display:flex; align-items:center; gap:14px; text-decoration:none; }
.brand-mark { width:42px; height:42px; color:var(--accent); stroke:currentColor; stroke-width:1; }
.public-brand strong { display:block; font-size:20px; font-weight:500; letter-spacing:.08em; }.public-brand small { display:block; font-size:11px; color:var(--muted); letter-spacing:.08em; margin-top:4px; }
nav { display:flex; align-items:center; gap:32px; font-size:14px; } nav>a { padding:12px 0; color:var(--soft); } nav>a:hover { color:var(--accent); }.nav-hub { border-left:1px solid var(--line); padding-left:28px; }.nav-hub span { margin-left:12px; }.menu-toggle { display:none; }
.public-hero { isolation:isolate; position:relative; display:grid; grid-template-columns:minmax(0,1.02fr) minmax(0,1fr); align-items:center; min-height:690px; gap:10px; padding:58px 0 48px; }
.public-hero::before { content:""; position:absolute; z-index:-2; top:0; bottom:0; left:50%; width:100vw; transform:translateX(-50%); pointer-events:none; background-image:linear-gradient(color-mix(in srgb,var(--muted) 10%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--muted) 10%,transparent) 1px,transparent 1px),radial-gradient(ellipse at 72% 46%,color-mix(in srgb,var(--accent) 11%,transparent),transparent 55%); background-size:8px 8px,8px 8px,auto; opacity:.82; mask-image:linear-gradient(to bottom,transparent 0%,#000 10%,#000 88%,transparent 100%); }
.public-hero::after { content:""; position:absolute; z-index:-1; pointer-events:none; left:-9vw; top:0; width:50vw; height:100%; opacity:.28; background:radial-gradient(circle at 32% 20%,transparent 0 75px,color-mix(in srgb,var(--muted) 70%,transparent) 76px 77px,transparent 78px),radial-gradient(circle at 32% 20%,transparent 0 105px,color-mix(in srgb,var(--muted) 55%,transparent) 106px 107px,transparent 108px),radial-gradient(circle at 75% 83%,transparent 0 54px,color-mix(in srgb,var(--muted) 65%,transparent) 55px 56px,transparent 57px),radial-gradient(circle at 75% 83%,transparent 0 75px,color-mix(in srgb,var(--muted) 45%,transparent) 76px 77px,transparent 78px); }
.hero-blueprint-decor { position:absolute; z-index:-1; inset:0; overflow:hidden; pointer-events:none; color:var(--muted); }
.blueprint-gear { position:absolute; opacity:.23; stroke:currentColor; }
.blueprint-gear-large { width:310px; left:-115px; top:-24px; transform:rotate(-8deg); }
.blueprint-gear-small { width:220px; left:37%; bottom:-95px; transform:rotate(13deg); }
.blueprint-equation { position:absolute; font-family:var(--serif,var(--font)); color:var(--muted); opacity:.72; pointer-events:none; }
.equation-top { top:28px; right:4%; font-size:clamp(13px,1.6vw,24px); font-style:italic; }
.equation-side { top:24%; right:0; font-family:var(--font); font-size:9px; line-height:1.9; letter-spacing:.22em; writing-mode:vertical-rl; }
.equation-bottom { bottom:15%; left:13%; font-size:clamp(16px,2vw,28px); font-style:italic; }
.blueprint-coordinate { position:absolute; font-size:8px; line-height:2; letter-spacing:.15em; opacity:.72; }
.coordinate-left { left:0; bottom:18%; max-width:100px; }
.coordinate-right { right:0; bottom:7%; max-width:110px; text-align:left; }
.hero-eyebrow { color:var(--accent); font-size:10px; letter-spacing:.17em; text-transform:uppercase; display:flex; align-items:center; gap:10px; margin-bottom:24px; }.status-dot { width:6px; height:6px; flex-shrink:0; background:var(--accent); border-radius:50%; box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 12%,transparent); }.eyebrow-rule { width:34px; height:1px; background:currentColor; margin-left:10px; }
h1.hero-title { font-family:var(--serif,Georgia,serif); font-size:clamp(42px,5.2vw,82px); font-weight:400; line-height:.99; letter-spacing:-.055em; margin:0 0 24px; color:var(--text); }
h1.hero-title span { color:var(--accent); }
.hero-intro { max-width:490px; color:var(--soft); font-size:15px; line-height:1.85; }
.hero-actions { display:flex; flex-wrap:wrap; gap:10px; margin:28px 0 36px; }.hero-actions a { gap:18px; min-height:48px; }
.hero-affiliation { display:flex; flex-direction:column; gap:8px; font-size:12px; color:var(--soft); }.hero-affiliation>span:first-child { font-size:9px; color:var(--muted); letter-spacing:.19em; }.hero-affiliation small { color:var(--muted); font-size:11px; }
.collision-figure { margin:0 -20px 0 -8px; color:var(--accent); position:relative; filter:drop-shadow(0 12px 26px color-mix(in srgb,var(--accent) 10%,transparent)); }
.collision-figure::before { content:""; position:absolute; inset:5%; border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--accent) 14%,transparent),transparent 68%); }
.collision-figure>svg { display:block; width:100%; overflow:visible; position:relative; }
.detector-rings { stroke:currentColor; stroke-opacity:.28; stroke-width:.8; }
.detector-segments { opacity:.9; }
.collision-tracks { stroke:color-mix(in srgb,var(--accent) 78%,#4c91c7); stroke-width:1.45; filter:drop-shadow(0 0 2px color-mix(in srgb,var(--accent) 26%,transparent)); }
.collision-tracks path:nth-child(3n) { stroke:#d49a4e; stroke-width:1.3; opacity:.9; }.collision-tracks path:nth-child(2n) { opacity:.66; }
.track-hits { filter:drop-shadow(0 0 4px currentColor); }
.collision-core { fill:#fff3d6; stroke:#dba45b; stroke-width:5; paint-order:stroke; filter:drop-shadow(0 0 9px #efb65e); animation:collision-core-pulse 3.2s ease-in-out infinite; transform-origin:300px 300px; }
@keyframes collision-core-pulse { 0%,100% { opacity:.84; transform:scale(.82); } 50% { opacity:1; transform:scale(1.12); } }
.collision-annotations { font-family:var(--font); font-size:18px; }.collision-annotations text:last-child { font-size:7px; letter-spacing:.8px; opacity:.6; }
.collision-figure figcaption { font-size:9px; letter-spacing:.12em; display:flex; justify-content:space-between; color:var(--muted); padding:0 28px; }
.research-strip { border-top:1px solid var(--line); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; gap:20px; padding:24px 0; color:var(--muted); font-size:12px; }.research-strip span:first-child { color:var(--accent); }
.public-section { padding:96px 0; scroll-margin-top:24px; }.section-top { display:flex; justify-content:space-between; align-items:flex-end; gap:28px; margin-bottom:36px; }.eyebrow { font-size:10px; letter-spacing:.17em; margin-bottom:16px; }h2 { font-size:clamp(28px,3.1vw,40px); font-weight:400; line-height:1.45; letter-spacing:-.03em; }.section-top>p,.section-description { font-size:14px; line-height:1.9; color:var(--muted); }
.research-layout { display:grid; grid-template-columns:1fr 1.1fr; gap:64px; }.research-tabs { display:flex; flex-direction:column; }.research-tabs button { display:flex; align-items:center; gap:24px; padding:28px 4px; border:0; border-bottom:1px solid var(--line); background:transparent; text-align:left; color:var(--muted); font-size:14px; cursor:pointer; }.research-tabs strong { font-size:20px; font-weight:400; flex:1; }.research-tabs button.active { color:var(--accent); }.research-tabs button.active strong { color:var(--text); }.research-tabs button.active>span:last-child { transform:rotate(45deg); }.research-detail { background:var(--surface); border:1px solid var(--line); border-radius:20px; padding:44px 36px; position:relative; overflow:hidden; }.research-detail .eyebrow { max-width:75%; color:var(--accent); position:relative; }.research-detail h3 { font-size:24px; font-weight:400; margin:28px 0 16px; position:relative; }.research-detail p { color:var(--soft); font-size:15px; line-height:1.9; position:relative; max-width:440px; }.research-symbol { position:absolute; right:26px; top:-10px; font-size:140px; font-weight:300; line-height:1; color:var(--accent); opacity:.12; }.topic-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:28px; }.topic-tags span { border:1px solid var(--line); border-radius:999px; padding:5px 12px; color:var(--muted); font-size:11px; }
.publications-section { border-top:1px solid var(--line); }.publications-section .section-top { margin-bottom:14px; }.publication-controls { display:flex; gap:16px; justify-content:space-between; align-items:center; margin:32px 0 12px; }.segmented button { border:0; background:transparent; color:var(--muted); padding:9px 15px; border-radius:8px; font-size:13px; min-height:40px; cursor:pointer; }.segmented button.selected { background:var(--raised); color:var(--text); }.paper-search input { width:260px; border:1px solid var(--line); border-radius:12px; background:var(--surface); padding:12px 16px; color:var(--text); font-size:13px; }.public-paper { display:grid; grid-template-columns:82px 1fr 80px; gap:28px; padding:32px 0; border-bottom:1px solid var(--line); }.paper-year { font-size:28px; font-weight:300; color:var(--muted); line-height:1.25; }.paper-year small { display:block; font-size:10px; margin-top:12px; letter-spacing:.05em; }.paper-tag { color:var(--accent); font-size:11px; }.paper-content h3 { font-size:20px; line-height:1.5; font-weight:400; margin:10px 0; max-width:840px; }.paper-content h3 a:hover { color:var(--accent); }.paper-authors,.paper-journal { font-size:12px; color:var(--muted); line-height:1.8; }.paper-journal { color:var(--soft); margin-top:5px; }.paper-link { font-size:12px; color:var(--accent); display:flex; align-items:center; gap:14px; }.paper-empty { padding:44px 0; color:var(--muted); }
.about-section { display:grid; grid-template-columns:1fr 1fr; gap:96px; }.about-section>div>p { font-size:15px; line-height:1.95; color:var(--muted); max-width:450px; margin-top:24px; }.about-details>div { display:flex; flex-direction:column; gap:12px; border-bottom:1px solid var(--line); padding:20px 0; }.about-details>div:first-child { padding-top:0; }.about-details>div>span { font-size:11px; color:var(--muted); }.about-details strong,.about-details a { font-size:17px; font-weight:400; }.about-details small { font-size:12px; color:var(--muted); }.about-details a { color:var(--accent); }.about-details>p { font-size:12px!important; }
.academic-partner p { margin:0; font-size:14px; line-height:1.8; color:var(--soft); }.academic-partner .partner-topics { color:var(--muted); }.academic-partner a { font-size:14px; }
.collaboration-section { display:grid; grid-template-columns:1.15fr 1fr; gap:72px; border-top:1px solid var(--line); }.collaboration-section h2 { font-size:30px; }.collaboration-section p { font-size:14px; color:var(--muted); margin:18px 0 28px; line-height:1.8; }.collaboration-section .button { gap:28px; }.hub-module-list>span { display:flex; gap:20px; align-items:center; padding:20px 0; border-bottom:1px solid var(--line); font-size:15px; }.hub-module-list i { font-size:11px; color:var(--muted); font-style:normal; }.hub-module-list small { margin-left:auto; font-size:9px; letter-spacing:.1em; color:var(--muted); }.hub-module-list>p { font-size:11px; }
.public-footer { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:32px 0; border-top:1px solid var(--line); color:var(--muted); font-size:11px; }.public-footer>span:first-child { font-size:15px; color:var(--text); letter-spacing:.05em; }.public-footer small { display:block; font-size:10px; color:var(--muted); margin-top:8px; }.public-footer a:hover { color:var(--accent); }.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }a,button,input { outline-offset:5px; }a:focus-visible,button:focus-visible,input:focus-visible { outline:2px solid var(--focus); }.button:disabled { opacity:.5; cursor:not-allowed; }
@media(min-width:1600px) { .public-hero { min-height:760px; } }
@media(max-width:1000px) { .research-guide-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .public-header,.public-hero,.public-section,.public-footer,.research-strip { width:calc(100% - 56px); }.public-hero { min-height:620px; }nav { gap:20px; }.research-layout { gap:28px; }.about-section,.collaboration-section { gap:40px; }.public-hero h1 { font-size:44px; } }
@media(max-width:700px) { .research-guide-grid { grid-template-columns:1fr; } .research-guide-card { padding:22px; } .topic-guide-entry { padding:16px; } .public-header,.public-hero,.public-section,.public-footer,.research-strip { width:calc(100% - 36px); }.public-header { min-height:84px; flex-wrap:wrap; gap:10px; }.public-brand strong { font-size:16px; }.public-brand small { font-size:10px; }.brand-mark { width:34px; height:34px; }.menu-toggle { display:flex; font-size:12px; min-height:40px; padding:8px 12px; }nav { display:none; width:100%; padding-bottom:20px; flex-wrap:wrap; gap:12px 22px; }nav.open { display:flex; }.nav-hub { border-left:0; padding-left:0; }.public-hero { grid-template-columns:1fr; padding-top:48px; gap:16px; min-height:0; }.public-hero h1 { font-size:clamp(33px,8vw,48px); }.hero-eyebrow { font-size:9px; letter-spacing:.08em; }.hero-actions { gap:4px; margin:28px 0 32px; }.hero-actions a { gap:12px; padding-inline:14px; font-size:12px; }.hero-intro { font-size:14px; }.collision-figure { width:min(100%,430px); margin-inline:auto; }.research-strip { flex-wrap:wrap; justify-content:flex-start; gap:14px 20px; font-size:10px; padding:20px 0; }.public-section { padding:56px 0; }.section-top { align-items:flex-start; flex-direction:column; gap:16px; }.section-top h2 { font-size:27px; }.section-top>p br { display:none; }.research-layout,.about-section,.collaboration-section { grid-template-columns:1fr; gap:28px; }.research-tabs strong { font-size:18px; }.research-tabs button { padding:22px 0; }.research-detail { padding:28px 24px; }.research-detail h3 { font-size:22px; }.research-detail p { font-size:14px; }.publication-controls { flex-direction:column; align-items:stretch; }.paper-search input { width:100%; box-sizing:border-box; }.segmented { align-self:flex-start; }.segmented button { padding:8px 12px; }.public-paper { grid-template-columns:50px 1fr; gap:16px; }.paper-year { font-size:22px; }.paper-content h3 { font-size:17px; }.paper-link { grid-column:2; padding:4px 0; }.public-footer { flex-wrap:wrap; gap:20px; }.public-footer>span:nth-child(2) { order:3; flex-basis:100%; }.collaboration-section h2 { font-size:26px; } }
</style>
