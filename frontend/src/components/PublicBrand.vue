<script setup>
import { publicBrandIdentity } from '../content/brandIdentity'

const props = defineProps({
  to: { type: String, default: '/' },
})
</script>

<template>
  <router-link :to="props.to" class="public-brand" :aria-label="`返回${publicBrandIdentity.name}首页`">
    <span class="brand-mark-wrap" aria-hidden="true">
      <svg class="brand-mark" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="17.5" stroke="currentColor" stroke-opacity=".24" />
        <ellipse cx="24" cy="24" rx="9" ry="22" transform="rotate(45 24 24)" />
        <path d="M3 24h42" stroke="currentColor" stroke-opacity=".5" />
        <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
      </svg>
      <span class="brand-fraction">{{ publicBrandIdentity.fractionMark }}</span>
    </span>
    <span class="brand-copy">
      <strong>{{ publicBrandIdentity.name }}</strong>
      <small>{{ publicBrandIdentity.academicFocus }}</small>
    </span>
  </router-link>
</template>

<style scoped>
.public-brand {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: var(--text);
  text-decoration: none;
}

.public-brand:hover {
  color: var(--text);
}

.public-brand:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 5px;
  border-radius: 8px;
}

.brand-mark-wrap {
  position: relative;
  display: grid;
  flex: 0 0 44px;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--accent);
}

.brand-mark {
  display: block;
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 1.1;
}

.brand-fraction {
  position: absolute;
  right: -4px;
  bottom: -1px;
  padding: 1px 3px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--panel-solid);
  color: var(--accent);
  font: 600 8px/1.2 var(--font);
  letter-spacing: -.02em;
}

.brand-copy {
  display: block;
  min-width: 0;
}

.brand-copy strong {
  display: block;
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: .06em;
  white-space: nowrap;
}

.brand-copy small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-family: var(--font);
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: .02em;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .public-brand {
    gap: 10px;
  }

  .brand-mark-wrap {
    flex-basis: 38px;
    width: 38px;
    height: 38px;
  }

  .brand-copy strong {
    font-size: 18px;
  }

  .brand-copy small {
    max-width: 150px;
    font-size: 10px;
    letter-spacing: 0;
    white-space: normal;
  }
}
</style>
