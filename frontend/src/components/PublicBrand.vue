<script setup>
import { publicBrandIdentity } from '../content/brandIdentity'

const props = defineProps({
  href: { type: String, default: '#top' },
  variant: {
    type: String,
    default: 'standard',
    validator: value => ['standard', 'worldline'].includes(value),
  },
})
</script>

<template>
  <a
    :href="props.href"
    :class="props.variant === 'worldline' ? 'worldline-brand' : 'public-brand'"
    :aria-label="`${publicBrandIdentity.name}首页`"
  >
    <span class="brand-mark-wrap" aria-hidden="true">
      <svg
        :class="props.variant === 'worldline' ? 'worldline-brand-mark' : 'brand-mark'"
        viewBox="0 0 48 48"
        fill="none"
      >
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
  </a>
</template>

<style scoped>
.public-brand,
.worldline-brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-width: 0;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
}

.worldline-brand {
  gap: 10px;
  color: var(--wl-ink, var(--text));
}

.public-brand:hover,
.worldline-brand:hover {
  color: inherit;
}

.public-brand:focus-visible,
.worldline-brand:focus-visible {
  outline: 2px solid var(--focus, var(--accent));
  outline-offset: 4px;
  border-radius: 3px;
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

.worldline-brand .brand-mark-wrap {
  flex-basis: 36px;
  width: 36px;
  height: 36px;
  color: var(--wl-ink, var(--accent));
}

.brand-mark,
.worldline-brand-mark {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  stroke: currentColor;
  stroke-width: 1.1;
}

.brand-fraction {
  position: absolute;
  right: -4px;
  bottom: -1px;
  padding: 1px 3px;
  border: 1px solid var(--line, rgba(32, 43, 56, .2));
  border-radius: 3px;
  background: var(--wl-paper, var(--bg, #fffefa));
  color: var(--accent);
  font: 600 8px/1.2 var(--font, Arial, sans-serif);
  letter-spacing: -.02em;
}

.brand-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.brand-copy strong {
  display: block;
  color: inherit;
  font-family: var(--serif, Georgia, serif);
  font-size: 21px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: .04em;
  white-space: nowrap;
}

.brand-copy small {
  display: block;
  margin: 0;
  color: var(--muted);
  font-family: var(--font, Arial, sans-serif);
  font-size: 10px;
  line-height: 1.35;
  letter-spacing: 0;
  white-space: nowrap;
}

.worldline-brand .brand-copy strong {
  font-size: 15px;
  letter-spacing: .01em;
}

.worldline-brand .brand-copy small {
  color: var(--wl-muted, var(--muted));
}

@media (max-width: 1120px) {
  .worldline-brand .brand-copy small {
    display: none;
  }
}

@media (max-width: 820px) {
  .worldline-brand .brand-mark-wrap {
    flex-basis: 30px;
    width: 30px;
    height: 30px;
  }

  .worldline-brand .brand-copy strong {
    font-size: 14px;
  }
}

@media (max-width: 700px) {
  .public-brand {
    gap: 9px;
  }

  .public-brand .brand-mark-wrap {
    flex-basis: 34px;
    width: 34px;
    height: 34px;
  }

  .public-brand .brand-copy strong {
    font-size: 16px;
    letter-spacing: .02em;
  }

  .public-brand .brand-copy small {
    max-width: 112px;
    font-size: 9px;
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .public-brand,
  .worldline-brand {
    transition: none;
  }
}
</style>
