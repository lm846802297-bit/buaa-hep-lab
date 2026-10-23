import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { createToken } from '../functions/api/middleware/auth';
import notices from '../functions/api/routes/notices';

// Keep one database for this suite because the route caches table-setup state per module.
function d1(sqlite: DatabaseSync): any {
  const prepare = (sql: string, params: any[] = []) => ({
    bind: (...args: any[]) => prepare(sql, args),
    first: async () => sqlite.prepare(sql).get(...params) || null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params), success: true }),
    run: async () => {
      const info = sqlite.prepare(sql).run(...params);
      return {
        success: true,
        meta: { last_row_id: Number(info.lastInsertRowid), changes: Number(info.changes) }
      };
    },
  });
  return {
    prepare,
    batch: async (statements: any[]) => Promise.all(statements.map((statement: any) => statement.run())),
  };
}

const secret = 'isolated-notice-test-secret-at-least-32-characters';
let sqlite: DatabaseSync;
let env: any;
let app: Hono<any>;
let tokens: string[];

async function request(path: string, index = 0, method = 'GET', body?: unknown) {
  return app.request(path, {
    method,
    headers: {
      Authorization: `Bearer ${tokens[index]}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, env);
}

beforeAll(async () => {
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../scripts/schema_d1.sql', import.meta.url), 'utf8'));

  const users = [
    { id: 1, name: 'Owner Student', email: 'owner@example.invalid', role: 'student', identity: 'student' },
    { id: 2, name: 'Other Student', email: 'other@example.invalid', role: 'student', identity: 'student' },
    // In the Workers data model, teaching identity is separate from the account role.
    { id: 3, name: 'Teacher Identity', email: 'teacher@example.invalid', role: 'student', identity: 'teacher' },
    { id: 4, name: 'Administrator', email: 'admin@example.invalid', role: 'admin', identity: 'student' },
  ];
  for (const user of users) {
    sqlite.prepare(
      'INSERT INTO users (id, name, email, hashed_password, role, identity) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.id, user.name, user.email, 'unused', user.role, user.identity);
  }

  const userRows = sqlite.prepare('SELECT * FROM users ORDER BY id').all() as any[];
  tokens = await Promise.all(userRows.map(user => createToken(user, secret)));

  env = { DB: d1(sqlite), JWT_SECRET: secret };
  app = new Hono<any>();
  app.route('/notices', notices);
});

beforeEach(() => {
  sqlite.prepare('DELETE FROM notices').run();
  sqlite.prepare(
    'INSERT INTO notices (id, title, content, created_by_id, created_by_name) VALUES (1, ?, ?, 1, ?)'
  ).run('Original notice', 'Original content', 'Owner Student');
});

afterAll(() => {
  sqlite.close();
});

describe('Cloudflare notice edit/delete authorization', () => {
  it('allows the notice owner to edit and delete their own notice', async () => {
    expect((await request('/notices/1', 0, 'PUT', { title: 'Updated by owner' })).status).toBe(200);
    expect((await request('/notices/1', 0, 'DELETE')).status).toBe(200);
  });

  it('denies another ordinary student both edit and delete', async () => {
    expect((await request('/notices/1', 1, 'PUT', { title: 'Unauthorized' })).status).toBe(403);
    expect((await request('/notices/1', 1, 'DELETE')).status).toBe(403);
    expect(sqlite.prepare('SELECT title FROM notices WHERE id = 1').get()?.title).toBe('Original notice');
  });

  it('allows a teacher identity even when the account role is student', async () => {
    expect((await request('/notices/1', 2, 'PUT', { title: 'Updated by teacher' })).status).toBe(200);
    expect((await request('/notices/1', 2, 'DELETE')).status).toBe(200);
  });

  it('allows an administrator to edit and delete notices', async () => {
    expect((await request('/notices/1', 3, 'PUT', { title: 'Updated by admin' })).status).toBe(200);
    expect((await request('/notices/1', 3, 'DELETE')).status).toBe(200);
  });
});
