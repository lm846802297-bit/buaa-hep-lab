import { describe, expect, it } from 'vitest'
import { publicationReviewStatus, PUBLICATION_REVIEW_INTERVAL_DAYS } from './publicationReview'

const today = new Date('2026-10-21T12:00:00.000Z')

describe('publication review freshness', () => {
  it('keeps recently checked records current', () => {
    expect(publicationReviewStatus('2026-10-20', today).status).toBe('current')
  })

  it('marks metadata stale only after the review interval', () => {
    expect(PUBLICATION_REVIEW_INTERVAL_DAYS).toBe(180)
    expect(publicationReviewStatus('2026-04-24', today).status).toBe('current')
    expect(publicationReviewStatus('2026-04-23', today).status).toBe('stale')
  })

  it('never treats missing, malformed, impossible or future dates as verified', () => {
    expect(publicationReviewStatus('', today).status).toBe('unverified')
    expect(publicationReviewStatus('2026-13-40', today).status).toBe('invalid')
    expect(publicationReviewStatus('2026-10-22', today).status).toBe('invalid')
  })
})
