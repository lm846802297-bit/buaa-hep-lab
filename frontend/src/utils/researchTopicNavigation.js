export function scrollToResearchTopicSection(target) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false

  const section = document.getElementById(target)
  if (!section || typeof section.scrollIntoView !== 'function') return false

  // Keep the section address shareable without creating one browser-history
  // entry per directory click. Back should leave the topic, not revisit anchors.
  window.history.replaceState(window.history.state, '', `#${target}`)

  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  })
  return true
}
