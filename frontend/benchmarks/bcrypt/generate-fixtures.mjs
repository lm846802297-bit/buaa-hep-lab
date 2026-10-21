import bcrypt from 'bcryptjs'
import { writeFileSync } from 'node:fs'

// Public deterministic test fixtures. Never use this salt or input for real accounts.
const fixtures = {}
for (const cost of [6, 7, 8]) for (const bytes of [12, 72]) {
  const password = 'Benchmark-only-public-input!'.repeat(3).slice(0, bytes)
  fixtures[`${cost}:${bytes}`] = bcrypt.hashSync(password, `$2b$${String(cost).padStart(2, '0')}$abcdefghijklmnopqrstuu`)
}
writeFileSync(new URL('./fixtures.json', import.meta.url), JSON.stringify(fixtures, null, 2) + '\n')
