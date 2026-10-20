import { afterEach, describe, expect, it, vi } from 'vitest'
import { enterPage, leavePage } from './motion'
afterEach(() => vi.unstubAllGlobals())
describe('page transitions', () => {
  it('completes without animation when reduced motion is requested', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    const animate = vi.fn(), done = vi.fn()
    enterPage({ animate }, done)
    expect(animate).not.toHaveBeenCalled(); expect(done).toHaveBeenCalledWith()
  })
  it('finishes cancelled animations without passing an error as a cancellation flag', async () => {
    const done = vi.fn()
    leavePage({ animate: () => ({ finished: Promise.reject(new Error('cancelled')) }) }, done)
    await Promise.resolve()
    expect(done).toHaveBeenCalledWith()
  })
})
