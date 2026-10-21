import bcrypt from 'bcryptjs'
import fixtures from './fixtures.json' with { type: 'json' }

// Public synthetic inputs only. Never accept passwords or hashes from requests.
export const cases = [12, 72]
export const costs = [6, 7, 8]
export const operations = ['hash', 'compare-match', 'compare-mismatch']
export const passwordFor = bytes => 'Benchmark-only-public-input!'.repeat(3).slice(0, bytes)

export async function runOperation({ cost, bytes, operation }) {
  if (!costs.includes(cost) || !cases.includes(bytes) || !operations.includes(operation)) {
    throw new Error('Unsupported benchmark case')
  }
  const password = passwordFor(bytes)
  const fixture = fixtures[`${cost}:${bytes}`]
  if (operation === 'hash') {
    const hash = await bcrypt.hash(password, cost)
    if (bcrypt.getRounds(hash) !== cost || hash.length !== 60) throw new Error('Invalid generated hash')
  } else {
    // Alter the first byte so the 72-byte bcrypt boundary cannot hide the mismatch.
    const matched = await bcrypt.compare(operation === 'compare-match' ? password : `!${password.slice(1)}`, fixture)
    if (matched !== (operation === 'compare-match')) throw new Error('Comparison verification failed')
  }
  return { cost, bytes, operation, ok: true }
}
