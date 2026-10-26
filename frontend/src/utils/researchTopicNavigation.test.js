import { afterEach, describe, expect, it, vi } from 'vitest'
import { scrollToResearchTopicSection } from './researchTopicNavigation'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubNavigation({ reducedMotion = false, sectionExists = true } = {}) {
  const section = { scrollIntoView: vi.fn() }
  const history = {
    state: { position: 3 },
    replaceState: vi.fn(),
    pushState: vi.fn(),
  }
  const documentRef = {
    getElementById: vi.fn(() => sectionExists ? section : null),
  }
  const windowRef = {
    history,
    matchMedia: vi.fn(() => ({ matches: reducedMotion })),
  }

  vi.stubGlobal('document', documentRef)
  vi.stubGlobal('window', windowRef)
  return { section, history, documentRef, windowRef }
}

describe('research topic section navigation', () => {
  it('updates the shareable fragment by replacing rather than pushing history', () => {
    const { section, history, documentRef } = stubNavigation()

    expect(scrollToResearchTopicSection('topic-workflow')).toBe(true)

    expect(documentRef.getElementById).toHaveBeenCalledWith('topic-workflow')
    expect(history.replaceState).toHaveBeenCalledWith(history.state, '', '#topic-workflow')
    expect(history.pushState).not.toHaveBeenCalled()
    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('disables smooth scrolling when reduced motion is requested', () => {
    const { section, windowRef } = stubNavigation({ reducedMotion: true })

    expect(scrollToResearchTopicSection('topic-papers')).toBe(true)
    expect(windowRef.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
  })

  it('does not mutate history if the requested section is missing', () => {
    const { history, section } = stubNavigation({ sectionExists: false })

    expect(scrollToResearchTopicSection('missing-section')).toBe(false)
    expect(history.replaceState).not.toHaveBeenCalled()
    expect(history.pushState).not.toHaveBeenCalled()
    expect(section.scrollIntoView).not.toHaveBeenCalled()
  })
})
