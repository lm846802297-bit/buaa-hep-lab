export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
function animatePage(el, frames, duration, done) {
  if (reducedMotion() || typeof el.animate !== 'function') { done(); return }
  const animation = el.animate(frames, { duration, easing: 'ease-out' })
  animation.finished.then(() => done(), () => done())
}
export function enterPage(el, done) {
  animatePage(el, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], 120, done)
}
export function leavePage(el, done) { animatePage(el, [{ opacity: 1 }, { opacity: 0 }], 60, done) }
