<script setup>
import { ref } from 'vue'
import PublicThemeSwitcher from './PublicThemeSwitcher.vue'
import PublicSectionNav from './PublicSectionNav.vue'
import { usePublicHeroVisual } from '../composables/usePublicHeroVisual'
import { lab } from '../content/lab'

const menuOpen = ref(false)
const { heroVisualModes, heroVisualMode, activeHeroVisual } = usePublicHeroVisual()
</script>

<template>
  <div class="public-home-default-hero" :class="{ 'hero-visual-blueprint': heroVisualMode === 'blueprint', 'hero-visual-photo': heroVisualMode === 'photo', 'hero-visual-terminal': heroVisualMode === 'terminal' }">
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
        <div class="hero-visual-controls" role="group" aria-label="首页右侧主视觉模式">
          <button
            v-for="mode in heroVisualModes"
            :key="mode.id"
            type="button"
            :class="{ active: heroVisualMode === mode.id }"
            :aria-pressed="heroVisualMode === mode.id"
            @click="heroVisualMode = mode.id"
          >{{ mode.label }}</button>
        </div>
        <Transition name="hero-image" mode="out-in">
          <img
            :key="activeHeroVisual.id"
            class="detector-photo"
            :src="activeHeroVisual.src"
            :alt="activeHeroVisual.alt"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          >
        </Transition>
        <svg viewBox="0 0 600 600" role="img" :aria-hidden="heroVisualMode !== 'blueprint'" aria-labelledby="collision-title collision-description">
          <title id="collision-title">叠加在 CMS 探测器照片上的粒子径迹示意</title>
          <desc id="collision-description">圆形几何环与向外延伸的粒子径迹是叠加在真实 CMS 探测器照片上的装饰性视觉元素，并非该照片对应的真实碰撞事件数据。</desc>
          <defs>
            <radialGradient id="collision-glow"><stop stop-color="#fff3cf" stop-opacity=".95"/><stop offset=".08" stop-color="#f4b45b" stop-opacity=".7"/><stop offset=".25" stop-color="#347dc1" stop-opacity=".24"/><stop offset="1" stop-color="#347dc1" stop-opacity="0"/></radialGradient>
            <linearGradient id="detector-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d4d8d7" stop-opacity=".9"/><stop offset=".5" stop-color="#657b8b" stop-opacity=".5"/><stop offset="1" stop-color="#c9a875" stop-opacity=".65"/></linearGradient>
          </defs>
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
        <figcaption>
          <a :href="activeHeroVisual.photoPage" target="_blank" rel="noopener noreferrer">{{ activeHeroVisual.photoCredit }}</a>
          <span><a :href="activeHeroVisual.licenseUrl" target="_blank" rel="noopener noreferrer">{{ activeHeroVisual.licenseLabel }}</a> · {{ activeHeroVisual.photoNote }}</span>
          <span>{{ activeHeroVisual.caption }}</span>
        </figcaption>
      </figure>
    </section>
  </div>
</template>

<style scoped>
.public-home-default-hero.hero-visual-photo .collision-figure > svg,
.public-home-default-hero.hero-visual-terminal .collision-figure > svg {
  opacity: 0;
  pointer-events: none;
}
</style>
