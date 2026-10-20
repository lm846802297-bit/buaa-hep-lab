// Runs only against an ephemeral local D1 database, never remote resources.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Miniflare, convertV4MiniflareOptions } from '../frontend/node_modules/miniflare/dist/src/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(root, 'frontend');
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages', 'functions', 'build', 'functions', '--outdir', '.wrangler/verify-build', '--compatibility-date', '2026-09-17', '--compatibility-flags', 'nodejs_compat'], { cwd: frontend, env: { ...process.env, WRANGLER_LOG_PATH: resolve(root, '.wrangler/verify-logs') }, stdio: 'pipe' });
const setupToken = randomBytes(32).toString('hex');
const signingKey = randomBytes(48).toString('hex');
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true, scriptPath: resolve(frontend, '.wrangler/verify-build/index.js'),
  compatibilityDate: '2026-09-17', compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'isolated-verification' },
  bindings: { JWT_SECRET: signingKey, SETUP_TOKEN: setupToken },
  serviceBindings: { ASSETS: () => new Response('static fallback') },
}));
let count = 0;
const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); count++; };
const request = (path, options) => mf.dispatchFetch(`https://local.invalid/api${path}`, options);
const post = (path, data, token) => request(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) });
function multipart(content, headers) {
  const boundary = 'verification-' + randomBytes(12).toString('hex');
  return { method: 'POST', headers: { ...headers, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="local-test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from(content), Buffer.from(`\r\n--${boundary}--\r\n`),
  ]) };
}
try {
  const db = await mf.getD1Database('DB');
  const schema = readFileSync(resolve(root, 'scripts/schema_d1.sql'), 'utf8').replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  await db.batch(schema.map(sql => db.prepare(sql)));
  let status = await (await request('/system/status')).json();
  check(status.initialized, false, 'empty deployment is not initialized');
  check(status.setup_token_required, true, 'first administrator requires deployment code');
  check(status.max_upload_bytes, 1048576, 'D1-only upload size is advertised');
  const setup = { admin_name: 'Local verification admin', admin_email: 'local-admin@example.invalid', admin_password: randomBytes(18).toString('hex'), lab_name: 'Local verification lab', lab_short_name: 'TEST', institution: 'Test', invite_code: 'LOCAL-TEST-ONLY', default_location: '' };
  check((await post('/system/setup', setup)).status, 403, 'untrusted visitor cannot claim administrator');
  check((await (await request('/system/status')).json()).user_count, 0, 'failed setup has no side effects');
  const created = await post('/system/setup', { ...setup, setup_token: setupToken });
  assert.equal(created.status, 200, await created.clone().text()); count++;
  const admin = await created.json();
  check(admin.user.role, 'admin', 'owner receives admin role');
  check((await post('/system/setup', { ...setup, setup_token: setupToken })).status, 400, 'initialization cannot repeat');
  check((await request('/auth/me')).status, 401, 'anonymous requests are rejected');
  check((await request('/auth/me', { headers: { Authorization: `Bearer ${admin.access_token}` } })).status, 200, 'issued token works on protected endpoints');
  const memberResult = await post('/auth/register', { name: 'Local verification member', email: 'local-member@example.invalid', password: randomBytes(18).toString('hex'), invite_code: setup.invite_code, role: 'admin', identity: 'teacher' });
  assert.equal(memberResult.status, 200, await memberResult.clone().text()); count++;
  const member = await memberResult.json();
  check(member.user.role, 'student', 'registration cannot self-promote');
  for (const [index, optional] of [{}, { name: '  ', nickname: '  ' }, { nickname: 'Researcher' }, { name: 'Real name', nickname: 'Alias' }].entries()) {
    const email = `optional-${index}@example.invalid`;
    const password = randomBytes(18).toString('hex');
    const response = await post('/auth/register', { email, password, invite_code: setup.invite_code, ...optional });
    check(response.status, 200, 'registration works with optional names');
    const registered = await response.json();
    check(registered.user.real_name, (optional.name || '').trim(), 'real name remains optional');
    if (optional.nickname?.trim()) check(registered.user.name, optional.nickname.trim(), 'nickname is displayed');
    else { assert.match(registered.user.name, /^成员-[a-f0-9]{8}$/); count++; }
    check((await post('/auth/login', { email, password })).status, 200, 'nameless member can log in');
    const saved = await request('/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${registered.access_token}` }, body: JSON.stringify({ real_name: '', nickname: '' }) });
    check(saved.status, 200, 'profile can be saved without names');
    check((await saved.json()).real_name, '', 'saving does not invent a real name');
  }
  check((await post('/auth/register', { email: 'invalid@example.invalid', password: 'testing', invite_code: 'WRONG' })).status, 400, 'nameless registration still requires valid invitation');
  check((await post('/auth/register', { email: 'invalid@example.invalid', password: '123', invite_code: setup.invite_code })).status, 400, 'short passwords remain rejected');
  const memberHeaders = { Authorization: `Bearer ${member.access_token}` };
  check((await request('/system/settings', { headers: memberHeaders })).status, 403, 'members cannot change site settings');
  for (const endpoint of ['/seminars', '/library', '/resources/categories', '/resources/books', '/arxiv/feed', '/talks', '/notices', '/favorites']) {
    const response = await request(endpoint, { headers: memberHeaders });
    assert.equal(response.status, 200, `${endpoint}: ${await response.clone().text()}`); count++;
  }
  check((await request('/feedback', { headers: memberHeaders })).status, 403, 'members cannot access all feedback');
  check((await request('/feedback', { headers: { Authorization: `Bearer ${admin.access_token}` } })).status, 200, 'administrator can manage feedback');
  for (const endpoint of ['/files', '/resources/pdf']) {
    const uploaded = await request(endpoint, multipart('%PDF-1.4\nlocal verification\n%%EOF', memberHeaders));
    assert.equal(uploaded.status, 200, await uploaded.clone().text()); count++;
    const file = await uploaded.json();
    check((await mf.dispatchFetch(`https://local.invalid${file.url}`)).status, 401, 'file URLs require login');
    check((await mf.dispatchFetch(`https://local.invalid${file.url}`, { headers: memberHeaders })).status, 200, 'signed-in group members can retrieve files');
  }
  check((await request('/files', multipart(new Uint8Array(1048577), memberHeaders))).status, 400, 'D1-only upload limit is enforced');
  status = await (await request('/system/status')).json();
  check(status.initialized, true, 'successful setup persists');
  console.log(`Cloudflare runtime verification: ${count} checks passed (ephemeral local database, no R2).`);
} finally { await mf.dispose(); }

