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
  <div class="worldline-home" :class="'visual-' + heroVisualMode">
    <PublicSectionNav />
    <header class="worldline-header">
      <a href="#top" class="worldline-brand" aria-label="课题组首页" @click="menuOpen = false">
        <svg class="worldline-brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="17"/><ellipse cx="24" cy="24" rx="9" ry="22" transform="rotate(45 24 24)"/><path d="M3 24h42"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>
        <span><strong>{{ lab.shortName }}</strong><small>北京航空航天大学 · 物理学院</small></span>
      </a>
      <button class="worldline-menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="worldline-navigation" @click="menuOpen = !menuOpen">{{ menuOpen ? '关闭菜单' : '菜单' }}</button>
      <nav id="worldline-navigation" class="worldline-navigation" :class="{ open: menuOpen }" aria-label="官网导航">
        <a href="#research" @click="menuOpen = false">研究方向</a>
        <a href="#research-guides" @click="menuOpen = false">专题导读</a>
        <a href="#publications" @click="menuOpen = false">代表成果</a>
        <a href="#physics-resources" @click="menuOpen = false">物理资源</a>
        <a href="#about" @click="menuOpen = false">关于我们</a>
        <router-link to="/people" @click="menuOpen = false">团队</router-link>
        <router-link to="/events" @click="menuOpen = false">学术活动</router-link>
        <router-link class="worldline-hub-link" to="/hub" @click="menuOpen = false">组内协作 <span aria-hidden="true">↗</span></router-link>
      </nav>
      <PublicThemeSwitcher inline />
    </header>

    <section id="top" class="worldline-hero" aria-labelledby="worldline-hero-title">
      <div class="worldline-blueprint-layer" aria-hidden="true">
        <svg class="worldline-gear worldline-gear-left" viewBox="0 0 240 240" fill="none"><g stroke="currentColor" stroke-width="1"><circle cx="120" cy="120" r="82"/><circle cx="120" cy="120" r="63"/><circle cx="120" cy="120" r="25"/><circle cx="120" cy="120" r="8"/><path d="M120 2v236M2 120h236M36 36l168 168M204 36L36 204M76 2v28M164 210v28M2 76h28M210 164h28"/></g></svg>
        <svg class="worldline-detector-plan" viewBox="0 0 700 600" fill="none"><g stroke="currentColor" stroke-width="1"><circle cx="350" cy="280" r="230"/><circle cx="350" cy="280" r="205"/><circle cx="350" cy="280" r="160"/><circle cx="350" cy="280" r="118"/><circle cx="350" cy="280" r="65"/><ellipse cx="350" cy="280" rx="280" ry="110" transform="rotate(-26 350 280)"/><ellipse cx="350" cy="280" rx="275" ry="130" transform="rotate(28 350 280)"/><path d="M25 280h650M350 5v550M110 40l480 480M590 40L110 520" stroke-dasharray="3 7"/></g></svg>
        <svg class="worldline-map" viewBox="0 0 800 180" fill="none"><g stroke="currentColor" stroke-width="1"><path d="M18 90C120 30 170 150 280 92S450 32 548 92 680 142 782 76"/><path d="M20 112C130 52 190 170 290 112S450 54 550 112 690 160 780 96" stroke-dasharray="2 6"/><circle cx="75" cy="77" r="4"/><circle cx="280" cy="92" r="4"/><circle cx="548" cy="92" r="4"/><circle cx="730" cy="94" r="4"/></g></svg>
        <span class="worldline-equation equation-top">ℒ = −¼ FμνFμν + ψ̄ iγμDμψ + ⋯</span>
        <span class="worldline-equation equation-side">MATTER<br>ENERGY<br>SPACE<br>TIME<br>BEYOND</span>
        <span class="worldline-equation equation-bottom">E² = p²c² + m²c⁴</span>
        <span class="worldline-coordinate coordinate-left">QUARKS · LEPTONS · GAUGE BOSONS · HIGGS</span>
        <span class="worldline-coordinate coordinate-right">COLLISIONS / DETECTORS / DATA / DISCOVERY</span>
      </div>

      <div class="worldline-copy">
        <div class="worldline-eyebrow"><span aria-hidden="true"></span> PARTICLE PHYSICS PHENOMENOLOGY</div>
        <h1 id="worldline-hero-title">Particle Physics<br><span>Research Group</span></h1>
        <p class="worldline-intro">{{ lab.intro }}</p>
        <div class="worldline-actions">
          <a href="#research" class="worldline-primary-action">探索研究方向 <span aria-hidden="true">→</span></a>
          <a href="#about" class="worldline-secondary-action">关于课题组 <span aria-hidden="true">→</span></a>
          <a href="#research-guides" class="worldline-text-action">专题导读 <span aria-hidden="true">↓</span></a>
        </div>
        <div class="worldline-bottom-route"><span>PEOPLE</span><i aria-hidden="true"></i><span>IDEAS</span><i aria-hidden="true"></i><span>A MORE COMPLETE UNIVERSE.</span></div>
      </div>

      <figure class="worldline-detector-figure">
        <div class="worldline-visual-controls" role="group" aria-label="首页右侧主视觉模式">
          <button v-for="mode in heroVisualModes" :key="mode.id" type="button" :class="{ active: heroVisualMode === mode.id }" :aria-pressed="heroVisualMode === mode.id" @click="heroVisualMode = mode.id">{{ mode.label }}</button>
        </div>
        <Transition name="worldline-image" mode="out-in">
          <img :key="activeHeroVisual.id" class="worldline-detector-photo" :src="activeHeroVisual.src" :alt="activeHeroVisual.alt" loading="eager" fetchpriority="high" decoding="async">
        </Transition>
        <svg v-if="heroVisualMode === 'blueprint'" class="worldline-track-overlay" viewBox="0 0 600 600" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1" opacity=".64"><circle cx="300" cy="300" r="48"/><circle cx="300" cy="300" r="88"/><circle cx="300" cy="300" r="135"/><circle cx="300" cy="300" r="180"/><circle cx="300" cy="300" r="225"/><circle cx="300" cy="300" r="264"/><ellipse cx="300" cy="300" rx="264" ry="98" transform="rotate(-27 300 300)"/><ellipse cx="300" cy="300" rx="250" ry="145" transform="rotate(28 300 300)"/><path d="M18 300h564M300 18v564M88 88l424 424M512 88L88 512" stroke-dasharray="3 8"/></g><g stroke="#dca65d" stroke-width="2" stroke-linecap="round"><path d="M300 300Q365 222 528 112"/><path d="M300 300C356 325 458 320 570 377"/><path d="M300 300Q250 339 127 495"/><path d="M300 300Q238 261 42 213"/><path d="M300 300C328 250 339 163 356 37"/><path d="M300 300C317 351 338 459 426 530"/></g><circle cx="300" cy="300" r="12" fill="#fff1ce" stroke="#dca65d" stroke-width="3"/></svg>
        <figcaption class="worldline-image-credit">
          <a :href="activeHeroVisual.photoPage" target="_blank" rel="noopener noreferrer">{{ activeHeroVisual.photoCredit }}</a>
          <span><a :href="activeHeroVisual.licenseUrl" target="_blank" rel="noopener noreferrer">{{ activeHeroVisual.licenseLabel }}</a> · {{ activeHeroVisual.photoNote }}</span>
          <span>{{ activeHeroVisual.caption }}</span>
          <span class="worldline-sr-only">Conceptual particle tracks are illustrative only and do not represent the actual collision event shown in this detector photograph. 蓝图中的粒子轨迹为概念示意，并非该照片对应的真实碰撞事件数据。</span>
        </figcaption>
      </figure>
    </section>
  </div>
</template>

<style scoped>
.worldline-home {
  --wl-ink: #202b38;
  --wl-muted: #5d6874;
  --wl-line: rgba(41, 65, 93, .2);
  --wl-paper: #f4f1e9;
  position: relative;
  isolation: isolate;
  overflow: clip;
  color: var(--wl-ink);
  background-color: var(--wl-paper);
  background-image:
    linear-gradient(to right, rgba(41, 65, 93, .045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(41, 65, 93, .045) 1px, transparent 1px),
    linear-gradient(to right, rgba(41, 65, 93, .018) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(41, 65, 93, .018) 1px, transparent 1px),
    radial-gradient(ellipse at 70% 38%, rgba(255,255,255,.9), transparent 58%);
  background-size: 8px 8px, 8px 8px, 40px 40px, 40px 40px, auto;
  font-family: var(--font, Inter, Arial, sans-serif);
}
.worldline-header { position: relative; z-index: 10; display: flex; align-items: center; gap: clamp(12px, 2vw, 34px); min-height: 76px; padding: 12px clamp(22px, 4.2vw, 72px); border-bottom: 1px solid var(--wl-line); background: rgba(250,248,242,.88); }
.worldline-brand { display: inline-flex; align-items: center; gap: 10px; flex: 0 0 auto; color: var(--wl-ink); text-decoration: none; }
.worldline-brand-mark { width: 36px; height: 36px; stroke: currentColor; stroke-width: 1.2; }
.worldline-brand span { display: grid; gap: 2px; }
.worldline-brand strong { font: 500 15px/1.2 var(--serif, Georgia, serif); letter-spacing: .01em; }
.worldline-brand small { font-size: 10px; color: var(--wl-muted); white-space: nowrap; }
.worldline-navigation { display: flex; align-items: center; justify-content: center; gap: clamp(10px, 1.45vw, 25px); margin-inline: auto; }
.worldline-navigation a { position: relative; padding: 8px 0; color: var(--wl-ink); font-size: 13px; text-decoration: none; white-space: nowrap; }
.worldline-navigation a:not(.worldline-hub-link)::after { position: absolute; right: 0; bottom: 2px; left: 0; height: 1px; background: currentColor; content: ''; transform: scaleX(0); transform-origin: left; transition: transform .18s ease; }
.worldline-navigation a:hover::after, .worldline-navigation a:focus-visible::after { transform: scaleX(1); }
.worldline-navigation .worldline-hub-link { padding: 10px 14px; border: 1px solid var(--wl-line); background: rgba(255,255,255,.64); }
.worldline-menu-toggle { display: none; }
.worldline-home :deep(.public-theme-switcher) { flex: 0 0 auto; }
.worldline-hero { position: relative; display: grid; grid-template-columns: minmax(0, .96fr) minmax(0, 1.04fr); align-items: center; min-height: clamp(660px, calc(100svh - 76px), 880px); padding: clamp(44px, 5.3vw, 92px) clamp(24px, 5vw, 86px) 64px; }
.worldline-blueprint-layer { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; color: rgba(41,65,93,.32); }
.worldline-gear { position: absolute; width: clamp(180px, 24vw, 380px); height: auto; }
.worldline-gear-left { top: -5%; left: -7%; }
.worldline-detector-plan { position: absolute; top: -4%; left: 30%; width: min(48vw, 720px); opacity: .42; }
.worldline-map { position: absolute; bottom: 1%; left: 1%; width: min(55vw, 800px); opacity: .68; }
.worldline-equation { position: absolute; color: rgba(41,65,93,.62); font-family: var(--serif, Georgia, serif); font-style: italic; }
.equation-top { top: 3%; right: 3%; font-size: clamp(15px, 1.35vw, 24px); }
.equation-side { top: 16%; right: 1.5%; font: 500 10px/1.8 var(--font, Arial, sans-serif); letter-spacing: .2em; }
.equation-bottom { bottom: 17%; left: 8%; font-size: clamp(20px, 1.9vw, 32px); }
.worldline-coordinate { position: absolute; color: rgba(41,65,93,.66); font: 500 9px/1.8 var(--font, Arial, sans-serif); letter-spacing: .17em; }
.coordinate-left { bottom: 10%; left: 26%; }
.coordinate-right { right: 2%; bottom: 10%; writing-mode: vertical-rl; }
.worldline-copy { position: relative; z-index: 3; width: min(760px, 100%); padding-block: 12px 26px; }
.worldline-eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; color: var(--wl-muted); font-size: 10px; letter-spacing: .2em; }
.worldline-eyebrow span { width: 24px; height: 1px; background: #527a82; }
.worldline-copy h1 { max-width: 790px; margin: 0; color: #141a21; font: 400 clamp(52px, 5.2vw, 94px)/.98 var(--serif, Georgia, 'Times New Roman', serif); letter-spacing: -.055em; }
.worldline-copy h1 span { color: #1d3046; }
.worldline-intro { max-width: 530px; margin: 24px 0 0; color: #485463; font: 400 clamp(14px, 1vw, 17px)/1.75 var(--serif, Georgia, serif); }
.worldline-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 26px; }
.worldline-actions a { display: inline-flex; align-items: center; justify-content: space-between; gap: 22px; min-height: 46px; padding: 12px 16px; border: 1px solid var(--wl-line); color: var(--wl-ink); font-size: 13px; text-decoration: none; transition: transform .18s ease, background-color .18s ease; }
.worldline-actions a:hover { transform: translateY(-2px); }
.worldline-actions .worldline-primary-action { background: #202d3d; color: #fffdf7; border-color: #202d3d; }
.worldline-actions .worldline-secondary-action { background: rgba(255,255,255,.58); }
.worldline-actions .worldline-text-action { border-color: transparent; border-bottom-color: var(--wl-line); background: transparent; }
.worldline-bottom-route { display: flex; align-items: center; gap: 12px; max-width: 660px; margin-top: clamp(48px, 8vh, 90px); color: #4f5d6a; font-size: 9px; font-weight: 600; letter-spacing: .2em; }
.worldline-bottom-route i { display: block; width: clamp(28px, 7vw, 100px); height: 1px; background: var(--wl-line); }
.worldline-detector-figure { position: absolute; z-index: 1; top: 0; right: 0; bottom: 0; width: 61%; margin: 0; overflow: hidden; background: #d9dfe0; }
.worldline-detector-figure::before { position: absolute; z-index: 2; inset: 0; background: linear-gradient(90deg, var(--wl-paper) 0%, rgba(244,241,233,.84) 8%, rgba(244,241,233,.25) 29%, transparent 50%), linear-gradient(0deg, rgba(244,241,233,.14), transparent 35%); content: ''; pointer-events: none; }
.worldline-detector-photo { width: 100%; height: 100%; object-fit: cover; object-position: center; filter: saturate(.78) contrast(.96); transition: filter .25s ease; }
.visual-terminal .worldline-detector-photo { filter: saturate(.96) contrast(1.04); }
.visual-photo .worldline-detector-photo { filter: saturate(.84) contrast(.98); }
.worldline-track-overlay { position: absolute; z-index: 2; inset: 4% 0 5% 8%; width: 90%; height: 90%; color: rgba(226,235,239,.82); mix-blend-mode: screen; pointer-events: none; }
.worldline-visual-controls { position: absolute; z-index: 5; top: clamp(18px, 3vw, 42px); right: clamp(16px, 3vw, 42px); display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; padding: 4px; border: 1px solid rgba(41,65,93,.22); background: rgba(255,254,250,.92); box-shadow: 0 4px 18px rgba(25,39,54,.08); }
.worldline-visual-controls button { min-height: 32px; padding: 7px 10px; border: 1px solid transparent; background: transparent; color: #354353; font-size: 11px; white-space: nowrap; cursor: pointer; }
.worldline-visual-controls button.active { background: #25384b; color: #fffdf7; }
.worldline-visual-controls button:focus-visible, .worldline-navigation a:focus-visible, .worldline-actions a:focus-visible { outline: 2px solid #527a82; outline-offset: 3px; }
.worldline-image-credit { position: absolute; z-index: 4; right: 22px; bottom: 12px; left: 20%; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px 16px; padding: 7px 10px; background: rgba(255,254,250,.88); color: #344252; font: 500 9px/1.5 var(--font, Arial, sans-serif); }
.worldline-image-credit a { color: inherit; text-underline-offset: 2px; }
.worldline-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.visual-photo .worldline-detector-figure::before, .visual-terminal .worldline-detector-figure::before { background: linear-gradient(90deg, var(--wl-paper) 0%, rgba(244,241,233,.62) 8%, rgba(244,241,233,.08) 28%, transparent 45%), linear-gradient(0deg, rgba(244,241,233,.1), transparent 32%); }
@media (min-width: 1600px) {
  .worldline-hero { padding-left: max(5vw, calc((100vw - 1720px) / 2)); }
  .worldline-copy h1 { font-size: clamp(76px, 5vw, 106px); }
}
@media (max-width: 1120px) {
  .worldline-header { gap: 16px; padding-inline: 24px; }
  .worldline-navigation { gap: 12px; }
  .worldline-navigation a { font-size: 12px; }
  .worldline-brand small { display: none; }
  .worldline-hero { grid-template-columns: minmax(0, 1fr); min-height: 700px; }
  .worldline-copy { width: min(58%, 620px); }
  .worldline-copy h1 { font-size: clamp(50px, 6vw, 76px); }
  .worldline-detector-figure { width: 63%; }
  .worldline-detector-figure::before { background: linear-gradient(90deg, var(--wl-paper) 0%, rgba(244,241,233,.92) 9%, rgba(244,241,233,.48) 36%, transparent 70%); }
}
@media (max-width: 820px) {
  .worldline-header { min-height: 66px; padding: 10px 16px; }
  .worldline-brand-mark { width: 30px; height: 30px; }
  .worldline-brand strong { font-size: 14px; }
  .worldline-menu-toggle { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; margin-left: auto; padding: 8px 11px; border: 1px solid var(--wl-line); background: rgba(255,255,255,.75); color: var(--wl-ink); font-size: 12px; }
  .worldline-navigation { position: absolute; top: calc(100% - 1px); right: 12px; left: 12px; display: none; align-items: stretch; gap: 0; padding: 8px 14px; border: 1px solid var(--wl-line); background: #fffefa; box-shadow: 0 14px 28px rgba(32,43,56,.12); }
  .worldline-navigation.open { display: flex; flex-direction: column; }
  .worldline-navigation a { padding: 11px 0; font-size: 13px; }
  .worldline-home :deep(.public-theme-switcher) { margin-left: 0; }
  .worldline-hero { display: block; min-height: 760px; padding: 34px 22px 40px; }
  .worldline-copy { width: 100%; padding-top: 24px; }
  .worldline-copy h1 { max-width: 95%; font-size: clamp(43px, 10vw, 64px); line-height: 1.02; }
  .worldline-eyebrow { max-width: 80%; margin-bottom: 22px; font-size: 9px; letter-spacing: .14em; }
  .worldline-intro { max-width: 92%; margin-top: 20px; font-size: 14px; }
  .worldline-actions { max-width: 440px; margin-top: 22px; gap: 8px; }
  .worldline-actions a { min-height: 42px; padding: 10px 11px; gap: 12px; font-size: 12px; }
  .worldline-bottom-route { position: absolute; z-index: 4; right: 22px; bottom: 18px; left: 22px; justify-content: space-between; margin: 0; font-size: 8px; letter-spacing: .12em; }
  .worldline-bottom-route i { flex: 1; max-width: 34px; }
  .worldline-detector-figure { position: relative; top: auto; right: auto; bottom: auto; width: calc(100% + 44px); height: 360px; margin: 20px -22px 0; }
  .worldline-detector-figure::before { background: linear-gradient(180deg, var(--wl-paper) 0%, rgba(244,241,233,.9) 7%, rgba(244,241,233,.18) 28%, transparent 48%), linear-gradient(0deg, rgba(244,241,233,.12), transparent 24%); }
  .worldline-visual-controls { top: 14px; right: 12px; left: 12px; justify-content: center; gap: 2px; padding: 3px; }
  .worldline-visual-controls button { min-height: 30px; padding: 6px 8px; font-size: 10px; }
  .worldline-image-credit { right: 8px; bottom: 8px; left: 8px; justify-content: flex-start; font-size: 8px; }
  .worldline-equation.equation-top { top: 8%; right: 5%; font-size: 12px; }
  .worldline-equation.equation-side, .worldline-coordinate.coordinate-right { display: none; }
  .worldline-gear-left { top: 6%; left: -18%; width: 58vw; }
  .worldline-detector-plan { top: 14%; left: 32%; width: 78vw; }
  .worldline-map { bottom: 2%; left: -10%; width: 90vw; }
  .worldline-coordinate.coordinate-left { bottom: 8%; left: 8%; font-size: 7px; }
}
@media (prefers-reduced-motion: reduce) {
  .worldline-navigation a::after, .worldline-actions a, .worldline-detector-photo { transition: none; }
}
</style>
