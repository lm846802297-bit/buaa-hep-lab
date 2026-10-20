import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { createToken, verifyToken, authMiddleware, canManageSeminars } from '../functions/api/middleware/auth';
import { consumeAttempt, passwordError } from '../functions/api/middleware/loginProtection';
import resources from '../functions/api/routes/resources';
import seminars from '../functions/api/routes/seminars';
import auth from '../functions/api/routes/auth';
import account from '../functions/api/routes/account';
import mailbox from '../functions/api/routes/mailbox';
import arxiv from '../functions/api/routes/arxiv';
import system from '../functions/api/routes/system';

vi.mock('../functions/api/utils/imap', () => ({ CloudflareImapClient: vi.fn(), decryptUserPassword: vi.fn(), parseRawEmail: vi.fn(), extractMessageId: vi.fn(), extractDateHeader: vi.fn(), extractSubjectHeader: vi.fn(), isTalkEmail: vi.fn(), isConferenceEmail: vi.fn(), isNoticeEmail: vi.fn() }));
vi.mock('../functions/api/utils/smtp', () => ({ CloudflareSmtpClient: vi.fn(), parseExternalEmails: vi.fn() }));

// Execute real SQL, including atomic UPSERT and row updates, against SQLite.
// The same routes are additionally smoke-tested in the local Workers runtime.
function d1(sqlite: DatabaseSync): any {
  const prepare = (sql: string, params: any[] = []) => ({
    bind: (...args: any[]) => prepare(sql, args),
    first: async () => sqlite.prepare(sql).get(...params) || null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params), success: true }),
    run: async () => { const info = sqlite.prepare(sql).run(...params); return { success: true, meta: { last_row_id: Number(info.lastInsertRowid), changes: Number(info.changes) } }; },
  });
  return { prepare, batch: async (statements: any[]) => Promise.all(statements.map(s => s.run())) };
}
const secret = 'isolated-test-secret-at-least-32-characters';
let sqlite: DatabaseSync, env: any, app: Hono<any>;
let users: any[], tokens: string[];
async function request(path: string, index = 0, method = 'GET', body?: unknown) {
  return app.request(path, { method, headers: { Authorization: `Bearer ${tokens[index]}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, env);
}
beforeEach(async () => {
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../scripts/schema_d1.sql', import.meta.url), 'utf8'));
  const roles = ['student', 'student', 'admin', 'teacher', 'student'];
  for (let i = 0; i < roles.length; i++) sqlite.prepare('INSERT INTO users (id,name,email,hashed_password,role,can_manage_seminars) VALUES (?,?,?,?,?,?)').run(i + 1, `Member ${i + 1}`, `member${i + 1}@example.invalid`, bcrypt.hashSync('test-password', 4), roles[i], i === 4 ? 1 : 0);
  users = sqlite.prepare('SELECT * FROM users ORDER BY id').all();
  tokens = await Promise.all(users.map(user => createToken(user, secret)));
  env = { DB: d1(sqlite), JWT_SECRET: secret };
  app = new Hono();
  app.route('/resources', resources); app.route('/seminars', seminars); app.route('/auth', auth); app.route('/account', account); app.route('/mailbox', mailbox); app.route('/arxiv', arxiv); app.route('/system', system);
  app.get('/protected', authMiddleware, c => c.json({ ok: true }));
  sqlite.prepare("INSERT INTO resource_books (id,title,authors,category,created_by_id) VALUES (1,'Original','Author','教材',1)").run();
  sqlite.prepare("INSERT INTO resource_books (id,title,authors,category,created_by_id) VALUES (2,'Unowned','Author','教材',NULL)").run();
  sqlite.prepare("INSERT INTO seminar_schedules (id,date,time,topic,presenter_id,presenter_name,status) VALUES (1,'2099-10-20','14:30','Original',1,'Member 1','scheduled')").run();
});
afterEach(() => sqlite.close());

describe('public system status disclosure boundary', () => {
  it('withholds member count and default meeting location from anonymous status requests', async () => {
    sqlite.exec('CREATE TABLE IF NOT EXISTS system_settings (key VARCHAR(50) PRIMARY KEY, value TEXT NOT NULL)');
    sqlite.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('default_location', 'Internal meeting room / https://meet.example.invalid/secret');
    const anonymous = await app.request('/system/status', { method: 'GET' }, env);
    expect(anonymous.status).toBe(200);
    const publicPayload = await anonymous.json() as Record<string, unknown>;
    expect(publicPayload).not.toHaveProperty('default_location');
    expect(publicPayload).not.toHaveProperty('user_count');
    expect(publicPayload).toHaveProperty('initialized', true);

    const authenticated = await request('/system/status', 0);
    expect(authenticated.status).toBe(200);
    const privatePayload = await authenticated.json() as Record<string, unknown>;
    expect(privatePayload.default_location).toBe('Internal meeting room / https://meet.example.invalid/secret');
    expect(privatePayload).not.toHaveProperty('user_count');
  });
});

describe('public arXiv proxy input validation', () => {
  it.each(['/proxy-pdf', '/proxy-markdown'])('rejects invalid identifiers before upstream fetch: %s', async endpoint => {
    const response = await app.request(`/arxiv${endpoint}/not-an-arxiv-id`, { method: 'GET' }, env);
    expect(response.status).toBe(400);
  });
});

describe('resource ownership at HTTP boundary', () => {
  it.each([0, 2])('creator or administrator %i may edit and delete', async index => {
    expect((await request('/resources/books/1', index, 'PUT', { title: 'Changed' })).status).toBe(200);
    expect((await request('/resources/books/1', index, 'DELETE')).status).toBe(200);
  });
  it.each([1, 3, 4])('other member %i cannot edit or delete', async index => {
    expect((await request('/resources/books/1', index, 'PUT', { title: 'Stolen' })).status).toBe(403);
    expect((await request('/resources/books/1', index, 'DELETE')).status).toBe(403);
    expect(sqlite.prepare('SELECT title FROM resource_books WHERE id=1').get()?.title).toBe('Original');
  });
  it('unowned seed resources require an administrator', async () => {
    expect((await request('/resources/books/2', 0, 'PUT', { title: 'Stolen' })).status).toBe(403);
    expect((await request('/resources/books/2', 2, 'PUT', { title: 'Reviewed' })).status).toBe(200);
  });
  it('requires a session and returns 404 for missing resources', async () => {
    expect((await app.request('/resources/books/1', { method: 'PUT' }, env)).status).toBe(401);
    expect((await request('/resources/books/999', 0, 'PUT', {})).status).toBe(404);
  });
});

describe('seminar authorization matrix', () => {
  it.each([0, 2, 3, 4])('presenter, administrator, teacher or delegated member %i can edit topic/abstract', async index => {
    for (const action of ['topic', 'abstract']) expect((await request(`/seminars/1/${action}`, index, 'PUT', { topic: 'Reviewed', abstract: 'Abstract' })).status).toBe(200);
  });
  it('ordinary members cannot modify another presenter', async () => {
    for (const action of ['topic', 'abstract']) expect((await request(`/seminars/1/${action}`, 1, 'PUT', { topic: 'Stolen', abstract: 'Stolen' })).status).toBe(403);
  });
  it('a duplicate display name cannot override an assigned account', async () => {
    sqlite.prepare("UPDATE users SET name='Member 1', nickname='Member 1' WHERE id=2").run();
    expect((await request('/seminars/1/topic', 1, 'PUT', { topic: 'Impersonated' })).status).toBe(403);
    sqlite.prepare('UPDATE seminar_schedules SET presenter_id=NULL WHERE id=1').run();
    expect((await request('/seminars/1/topic', 1, 'PUT', { topic: 'Ambiguous' })).status).toBe(403);
  });
  it('a presenter cannot reassign or reschedule their meeting without management rights', async () => {
    expect((await request('/seminars/1', 0, 'PUT', { date: '2099-10-21', presenter_id: 2 })).status).toBe(403);
  });
  it.each([0, 1, 2, 3, 4])('checks the canonical management field for %i', index => {
    expect(canManageSeminars(users[index])).toBe([false, false, true, true, true][index]);
  });
});

describe('versioned Bearer authentication', () => {
  it('revokes the old token on normal APIs and mailbox sync, and issues a usable new token', async () => {
    const changed = await request('/account/credentials', 0, 'PUT', { current_password: 'test-password', new_password: 'changed-password' });
    expect(changed.status).toBe(200);
    const data = await changed.json();
    expect((await verifyToken(data.access_token, secret))?.token_version).toBe(1);
    for (const path of ['/protected', '/resources/books', '/mailbox/sync-stream']) expect((await request(path)).status).toBe(401);
    tokens[0] = data.access_token;
    expect((await request('/protected')).status).toBe(200);
    // Reaches mailbox configuration validation instead of failing authentication.
    expect((await request('/mailbox/sync-stream')).status).toBe(400);
  });
  it('does not accept a JWT from URL parameters, including the stream endpoint', async () => {
    for (const path of ['/protected', '/mailbox/sync-stream']) expect((await app.request(`${path}?token=${tokens[0]}`, {}, env)).status).toBe(401);
  });
  it.each([undefined, '', 'weak'])('fails closed with secret %s', async invalid => {
    const badEnv = { ...env, JWT_SECRET: invalid };
    expect((await app.request('/protected', {}, badEnv)).status).toBe(503);
    expect((await app.request('/auth/login', { method: 'POST' }, badEnv)).status).toBe(503);
    await expect(createToken(users[0], invalid as any)).rejects.toThrow();
    expect(await verifyToken(tokens[0], invalid as any)).toBeNull();
  });
  it('rejects a tampered token and a token for a deleted account', async () => {
    const original = tokens[0]; tokens[0] = original.slice(0, -4) + 'abcd';
    expect((await request('/protected')).status).toBe(401);
    tokens[0] = original; sqlite.prepare('DELETE FROM resource_books').run(); sqlite.prepare('DELETE FROM seminar_schedules').run(); sqlite.prepare('DELETE FROM users WHERE id=1').run();
    expect((await request('/protected')).status).toBe(401);
  });
  it('rejects expired sessions', async () => {
    const time = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 86400000);
    try { expect((await request('/protected')).status).toBe(401); } finally { time.mockRestore(); }
  });
});

describe('persistent authentication throttling', () => {
  it('limits one normalized account across IP addresses and returns Retry-After', async () => {
    const attempt = (ip: string) => app.request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify({ email: ' MEMBER1@example.invalid ', password: 'wrong-password' }) }, env);
    for (let i = 0; i < 10; i++) expect((await attempt(`192.0.2.${i}`)).status).toBe(401);
    const blocked = await attempt('192.0.2.99'); expect(blocked.status).toBe(429); expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
  it('limits password spraying across accounts from one IP', async () => {
    for (let i = 0; i < 60; i++) await consumeAttempt(env.DB, 'login:ip', '192.0.2.1', 60, 0);
    expect(await consumeAttempt(env.DB, 'login:ip', '192.0.2.1', 60, 1000)).toBe(899);
    expect(await consumeAttempt(env.DB, 'login:ip', '192.0.2.1', 60, 900000)).toBe(0);
  });
  it('enforces atomic counters for concurrent attempts', async () => {
    const attempts = await Promise.all(Array.from({ length: 15 }, () => consumeAttempt(env.DB, 'test', 'same-account', 10, 0)));
    expect(attempts.filter(Boolean)).toHaveLength(5);
    const row = sqlite.prepare('SELECT key FROM auth_rate_limits').get(); expect(row?.key).not.toContain('same-account');
  });
  it('requires 8 characters and prevents silent bcrypt truncation', () => {
    expect(passwordError('1234567')).toBeTruthy(); expect(passwordError('long-test-password')).toBeNull(); expect(passwordError('密'.repeat(25))).toBeTruthy();
  });
});
