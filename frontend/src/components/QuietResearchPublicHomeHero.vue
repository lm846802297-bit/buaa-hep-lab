<script setup>
import { ref } from 'vue'
import PublicThemeSwitcher from './PublicThemeSwitcher.vue'
import PublicSectionNav from './PublicSectionNav.vue'
import { usePublicHeroVisual } from '../composables/usePublicHeroVisual'
import { lab } from '../content/lab'
import PublicBrand from './PublicBrand.vue'
import { publicBrandIdentity } from '../content/brandIdentity'

const menuOpen = ref(false)
const { heroVisualModes, heroVisualMode, activeHeroVisual } = usePublicHeroVisual()
</script>

<template>
  <div class="public-home-theme--quiet-research" data-public-home-theme="quiet-research" :class="{ 'hero-visual-blueprint': heroVisualMode === 'blueprint', 'hero-visual-photo': heroVisualMode === 'photo', 'hero-visual-terminal': heroVisualMode === 'terminal' }">
    <PublicSectionNav />
    <header class="public-header">
      <PublicBrand @click="menuOpen = false" />
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
        <div class="hero-eyebrow"><span class="status-dot"></span> {{ publicBrandIdentity.englishDescriptor }} <span class="eyebrow-rule" aria-hidden="true"></span></div>
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
.public-home-theme--quiet-research.hero-visual-photo .collision-figure > svg,
.public-home-theme--quiet-research.hero-visual-terminal .collision-figure > svg {
  opacity: 0;
  pointer-events: none;
}


/* Quiet Research owns its homepage hero geometry and responsive rules.
   Keep these selectors local to this skin. */
.public-header,.public-hero,.public-section,.public-footer,.research-strip { width:min(1280px,calc(100% - 96px)); margin-inline:auto; }
.public-header { min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:18px; border-bottom:1px solid var(--line); position:relative; z-index:5; background:color-mix(in srgb,var(--bg) 88%,transparent); }
.public-brand { display:flex; align-items:center; gap:14px; text-decoration:none; }
.brand-mark { width:42px; height:42px; color:var(--accent); stroke:currentColor; stroke-width:1; }
.public-brand strong { display:block; font-size:20px; font-weight:500; letter-spacing:.08em; }.public-brand small { display:block; font-size:11px; color:var(--muted); letter-spacing:.08em; margin-top:4px; }
nav { display:flex; align-items:center; gap:28px; font-size:13px; } nav>a { padding:12px 0; color:var(--soft); } nav>a:hover { color:var(--accent); }
.public-header .nav-hub { display:inline-flex; align-items:center; gap:12px; min-height:40px; padding:0 15px; border:1px solid var(--text); border-radius:6px; background:var(--text); color:var(--bg); text-decoration:none; white-space:nowrap; transition:transform .2s ease,background .2s ease,border-color .2s ease; }
.public-header .nav-hub:hover { transform:translateY(-1px); background:var(--accent); border-color:var(--accent); color:var(--accent-ink,var(--bg)); }
.public-header .nav-hub span { margin:0; font-size:16px; }
.menu-toggle { display:none; }
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
.coordinate-left { left:0; bottom:7%; max-width:100px; }
.coordinate-right { right:0; bottom:7%; max-width:110px; text-align:left; }
.hero-eyebrow { color:var(--accent); font-size:10px; letter-spacing:.17em; text-transform:uppercase; display:flex; align-items:center; gap:10px; margin-bottom:24px; }.status-dot { width:6px; height:6px; flex-shrink:0; background:var(--accent); border-radius:50%; box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 12%,transparent); }.eyebrow-rule { width:34px; height:1px; background:currentColor; margin-left:10px; }
h1.hero-title { font-family:var(--serif,Georgia,serif); font-size:clamp(42px,5.2vw,82px); font-weight:400; line-height:.99; letter-spacing:-.055em; margin:0 0 24px; color:var(--text); }
h1.hero-title span { color:var(--accent); }
.hero-intro { max-width:490px; color:var(--soft); font-size:15px; line-height:1.85; }
.hero-actions { display:flex; flex-wrap:wrap; gap:10px; margin:28px 0 36px; }.hero-actions a { gap:18px; min-height:48px; }
.hero-affiliation { display:flex; flex-direction:column; gap:8px; font-size:12px; color:var(--soft); }.hero-affiliation>span:first-child { font-size:9px; color:var(--muted); letter-spacing:.19em; }.hero-affiliation small { color:var(--muted); font-size:11px; }
.collision-figure { margin:0 -20px 0 -8px; color:var(--accent); position:relative; isolation:isolate; filter:drop-shadow(0 12px 26px color-mix(in srgb,var(--accent) 10%,transparent)); }
.collision-figure::before { content:""; position:absolute; z-index:0; inset:5%; border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--accent) 14%,transparent),transparent 68%); }
.detector-photo { position:absolute; z-index:1; inset:4%; width:92%; height:92%; object-fit:cover; border-radius:50%; opacity:.92; mix-blend-mode:multiply; filter:saturate(.82) contrast(1.08); mask-image:radial-gradient(circle,#000 0 66%,transparent 79%); }
.collision-figure>svg { display:block; width:100%; overflow:visible; position:relative; z-index:2; }
.collision-figure figcaption a { color:var(--muted); text-decoration:underline; text-decoration-color:color-mix(in srgb,var(--muted) 45%,transparent); text-underline-offset:3px; }
.collision-figure figcaption a:hover { color:var(--accent); }
.detector-rings { stroke:currentColor; stroke-opacity:.28; stroke-width:.8; }
.detector-segments { opacity:.9; }
.collision-tracks { stroke:color-mix(in srgb,var(--accent) 78%,#4c91c7); stroke-width:1.45; filter:drop-shadow(0 0 2px color-mix(in srgb,var(--accent) 26%,transparent)); }
.collision-tracks path:nth-child(3n) { stroke:#d49a4e; stroke-width:1.3; opacity:.9; }.collision-tracks path:nth-child(2n) { opacity:.66; }
.track-hits { filter:drop-shadow(0 0 4px currentColor); }
.collision-core { fill:#fff3d6; stroke:#dba45b; stroke-width:5; paint-order:stroke; filter:drop-shadow(0 0 9px #efb65e); animation:collision-core-pulse 3.2s ease-in-out infinite; transform-origin:300px 300px; }
@keyframes collision-core-pulse { 0%,100% { opacity:.84; transform:scale(.82); } 50% { opacity:1; transform:scale(1.12); } }
.collision-annotations { font-family:var(--font); font-size:18px; }.collision-annotations text:last-child { font-size:7px; letter-spacing:.8px; opacity:.6; }
.collision-figure figcaption { font-size:10px; line-height:1.6; letter-spacing:.02em; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:6px 14px; color:var(--muted); padding:0 28px; }
@media(min-width:1600px) { .public-hero { min-height:760px; } }
@media(max-width:1000px) { .research-guide-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .public-header,.public-hero,.public-section,.public-footer,.research-strip { width:calc(100% - 56px); }.public-hero { min-height:620px; }nav { gap:20px; }.research-layout { gap:28px; }.about-section,.collaboration-section { gap:40px; }.public-hero h1 { font-size:44px; } }
@media(max-width:700px) { .research-guide-grid { grid-template-columns:1fr; } .research-guide-card { padding:22px; } .topic-guide-entry { padding:16px; } .public-header,.public-hero,.public-section,.public-footer,.research-strip { width:calc(100% - 36px); }.public-header { min-height:84px; flex-wrap:wrap; gap:10px; }.public-brand strong { font-size:16px; }.public-brand small { font-size:10px; }.brand-mark { width:34px; height:34px; }.menu-toggle { display:flex; font-size:12px; min-height:40px; padding:8px 12px; }nav { display:none; width:100%; padding-bottom:20px; flex-wrap:wrap; gap:12px 22px; }nav.open { display:flex; }.public-header .nav-hub { border-left:1px solid var(--line); padding-left:15px; }.public-hero { grid-template-columns:1fr; padding-top:48px; gap:16px; min-height:0; }.public-hero h1 { font-size:clamp(33px,8vw,48px); }.hero-eyebrow { font-size:9px; letter-spacing:.08em; }.hero-actions { gap:4px; margin:28px 0 32px; }.hero-actions a { gap:12px; padding-inline:14px; font-size:12px; }.hero-intro { font-size:14px; }.collision-figure { width:min(100%,430px); margin-inline:auto; }.research-strip { flex-wrap:wrap; justify-content:flex-start; gap:14px 20px; font-size:10px; padding:20px 0; }.public-section { padding:56px 0; }.section-top { align-items:flex-start; flex-direction:column; gap:16px; }.section-top h2 { font-size:27px; }.section-top>p br { display:none; }.research-layout,.about-section,.collaboration-section { grid-template-columns:1fr; gap:28px; }.research-tabs strong { font-size:18px; }.research-tabs button { padding:22px 0; }.research-detail { padding:28px 24px; }.research-detail h3 { font-size:22px; }.research-detail p { font-size:14px; }.publication-controls { flex-direction:column; align-items:stretch; }.paper-search input { width:100%; box-sizing:border-box; }.segmented { align-self:flex-start; }.segmented button { padding:8px 12px; }.public-paper { grid-template-columns:50px 1fr; gap:16px; }.paper-year { font-size:22px; }.paper-content h3 { font-size:17px; }.paper-link { grid-column:2; padding:4px 0; }.public-footer { flex-wrap:wrap; gap:20px; }.public-footer>span:nth-child(2) { order:3; flex-basis:100%; }.collaboration-section h2 { font-size:26px; } }


/* Hero image modes are local to Quiet Research; they cannot restyle another skin. */
.public-home-theme--quiet-research.hero-visual-photo .collision-figure::before { display: none; }
.public-home-theme--quiet-research.hero-visual-photo .collision-figure > svg { opacity: 0; pointer-events: none; }
.public-home-theme--quiet-research.hero-visual-photo .detector-photo {
  inset: 0; width: 100%; height: 100%; border-radius: inherit; opacity: 1;
  mix-blend-mode: normal; filter: none; mask-image: none;
}
.public-home-theme--quiet-research.hero-visual-terminal .collision-figure::before {
  z-index: 2; border-radius: inherit;
  background: linear-gradient(135deg, rgb(4 15 29 / 74%), rgb(7 33 54 / 24%) 55%, rgb(4 15 29 / 64%));
}
.public-home-theme--quiet-research.hero-visual-terminal .collision-figure > svg { z-index: 3; opacity: 0; pointer-events: none; }
.public-home-theme--quiet-research.hero-visual-terminal .detector-photo { mix-blend-mode: normal; filter: contrast(1.04) saturate(1.08); mask-image: none; }
.public-home-theme--quiet-research.hero-visual-terminal .collision-figure figcaption {
  left: 12px; right: 12px; bottom: 12px; padding: 10px 12px;
  border: 1px solid rgb(134 216 232 / 40%); background: rgb(4 15 29 / 88%);
  color: #e2f6ff; text-shadow: none;
}
.public-home-theme--quiet-research.hero-visual-terminal .collision-figure figcaption a { color: #a6e7f7; }
.hero-image-enter-active, .hero-image-leave-active { transition: opacity .22s ease; }
.hero-image-enter-from, .hero-image-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .hero-image-enter-active, .hero-image-leave-active { transition: none; }
}
@media (max-width: 760px) {
  .hero-visual-controls { top: 10px; right: 10px; gap: 2px; padding: 4px; }
  .hero-visual-controls button { min-height: 28px; padding: 5px 7px; font-size: 9px; }
  .public-home-theme--quiet-research.hero-visual-terminal .collision-figure figcaption { bottom: 10px; }
}
</style>
