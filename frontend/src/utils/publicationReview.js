export const PUBLICATION_REVIEW_INTERVAL_DAYS = 180
const DAY_MS = 24 * 60 * 60 * 1000

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null
  return timestamp
}

export function publicationReviewStatus(lastVerifiedAt, now = new Date(), maxAgeDays = PUBLICATION_REVIEW_INTERVAL_DAYS) {
  const verifiedAt = parseDateOnly(lastVerifiedAt)
  if (verifiedAt === null) {
    return { status: lastVerifiedAt ? 'invalid' : 'unverified', lastVerifiedAt: null, ageDays: null, label: lastVerifiedAt ? '核对日期异常 · 请复核' : '尚未核对 · 请复核' }
  }

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const ageDays = Math.floor((today - verifiedAt) / DAY_MS)
  // Date-only review stamps can be one calendar day ahead of UTC when editors
  // work in Asia/Shanghai. Treat that boundary as current, but disclose the ambiguity.
  if (ageDays < -1) {
    return { status: 'invalid', lastVerifiedAt, ageDays, label: '核对日期晚于当前日期 · 请复核' }
  }
  if (ageDays === -1) {
    return { status: 'current', lastVerifiedAt, ageDays: 0, label: `日期处于时区边界 · ${lastVerifiedAt}` }
  }
  if (ageDays > maxAgeDays) {
    return { status: 'stale', lastVerifiedAt, ageDays, label: `待复核 · 上次核对 ${lastVerifiedAt}` }
  }
  return { status: 'current', lastVerifiedAt, ageDays, label: `已核对 ${lastVerifiedAt}` }
}
