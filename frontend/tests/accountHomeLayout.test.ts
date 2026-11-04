import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { Hono } from 'hono'
import { createToken } from '../functions/api/middleware/auth'
import account from '../functions/api/routes/account'

function d1(sqlite: DatabaseSync): any {
  const prepare = (sql: string, params: any[] = []) => ({
    bind: (...args: any[]) => prepare(sql, args),
    first: async () => sqlite.prepare(sql).get(...params) || null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params), success: true }),
    run: async () => {
      const info = sqlite.prepare(sql).run(...params)
      return {
        success: true,
        meta: { last_row_id: Number(info.lastInsertRowid), changes: Number(info.changes) }
      }
    },
  })
  return {
    prepare,
    batch: async (statements: any[]) => Promise.all(statements.map((statement: any) => statement.run())),
  }
}

const secret = 'isolated-home-layout-test-secret-at-least-32-characters'
let sqlite: DatabaseSync
let env: any
let app: Hono<any>
let tokens: string[]

async function request(path: string, userIndex: number | null = 0, method = 'GET', body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (userIndex !== null) headers.Authorization = `Bearer ${tokens[userIndex]}`
  return app.request(path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env)
}

beforeAll(async () => {
  sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync(new URL('../../scripts/schema_d1.sql', import.meta.url), 'utf8'))

  sqlite.prepare(
    'INSERT INTO users (id, name, email, hashed_password, role, identity) VALUES (1, ?, ?, ?, ?, ?)'
  ).run('Layout Owner', 'layout-owner@example.invalid', 'unused', 'student', 'student')
  sqlite.prepare(
    'INSERT INTO users (id, name, email, hashed_password, role, identity) VALUES (2, ?, ?, ?, ?, ?)'
  ).run('Other Member', 'layout-other@example.invalid', 'unused', 'student', 'student')

  const users = sqlite.prepare('SELECT * FROM users ORDER BY id').all() as any[]
  tokens = await Promise.all(users.map(user => createToken(user, secret)))
  env = { DB: d1(sqlite), JWT_SECRET: secret }
  app = new Hono<any>()
  app.route('/account', account)
})

beforeEach(() => {
  sqlite.prepare('UPDATE users SET home_layout = NULL').run()
})

afterAll(() => {
  sqlite.close()
})

const sampleLayout = {
  slot1: {
    type: 'medium-wide',
    items: [
      { id: 'slot1-conferences', widgetId: 'conferences', size: 'medium-wide', slot1Index: 0 },
      { id: 'slot1-weather', widgetId: 'weather', size: 'medium-wide', slot1Index: 1 },
    ],
  },
  rightGrid: [
    { id: 'grid-next-seminar', widgetId: 'next-seminar', size: 'large', col: 1, row: 1, colSpan: 2, rowSpan: 4 },
    { id: 'grid-mailbox', widgetId: 'mailbox', size: 'small', col: 1, row: 5, colSpan: 2, rowSpan: 1 },
  ],
  updatedAt: 1727800000000,
}

describe('Cloudflare per-user home layout API', () => {
  it('requires authentication for read, write and reset', async () => {
    expect((await request('/account/home-layout', null)).status).toBe(401)
    expect((await request('/account/home-layout', null, 'PUT', sampleLayout)).status).toBe(401)
    expect((await request('/account/home-layout', null, 'DELETE')).status).toBe(401)
  })

  it('returns the default state when no custom layout is stored', async () => {
    const response = await request('/account/home-layout')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ has_custom_layout: false, layout: null })
  })

  it('saves and restores a custom layout across sessions without leaking it to other users', async () => {
    const save = await request('/account/home-layout', 0, 'PUT', sampleLayout)
    expect(save.status).toBe(200)
    expect(await save.json()).toEqual({
      has_custom_layout: true,
      saved: true,
      layout: sampleLayout,
    })

    const secondSession = await request('/account/home-layout', 0)
    expect(secondSession.status).toBe(200)
    expect((await secondSession.json()).layout).toEqual(sampleLayout)

    const otherUser = await request('/account/home-layout', 1)
    expect(otherUser.status).toBe(200)
    expect(await otherUser.json()).toEqual({ has_custom_layout: false, layout: null })
  })

  it('resets only the authenticated user layout', async () => {
    await request('/account/home-layout', 0, 'PUT', sampleLayout)
    const reset = await request('/account/home-layout', 0, 'DELETE')
    expect(reset.status).toBe(200)
    expect(await reset.json()).toEqual({ has_custom_layout: false, reset: true, layout: null })
    expect(await (await request('/account/home-layout', 0)).json()).toEqual({
      has_custom_layout: false,
      layout: null,
    })
  })

  it('rejects invalid and oversized payloads without overwriting the saved layout', async () => {
    await request('/account/home-layout', 0, 'PUT', sampleLayout)

    expect((await request('/account/home-layout', 0, 'PUT', [])).status).toBe(400)
    expect((await request('/account/home-layout', 0, 'PUT', { note: 'x'.repeat(66 * 1024) })).status).toBe(413)

    const current = await request('/account/home-layout', 0)
    expect((await current.json()).layout).toEqual(sampleLayout)
  })
})
