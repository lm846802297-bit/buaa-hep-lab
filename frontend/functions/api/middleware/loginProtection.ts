import { Context, Next } from 'hono';
import { Env, UserRow } from '../types';

export function passwordError(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 8) return '密码至少需要 8 个字符';
  if (new TextEncoder().encode(value).length > 72) return '密码最多为 72 个 UTF-8 字节，请缩短密码';
  return null;
}

// Shared D1 counters work across isolates. No email, IP, password or JWT is logged.
export async function consumeAttempt(db: D1Database, scope: string, identifier: string, limit: number, now = Date.now()): Promise<number> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identifier));
  const key = scope + ':' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  const seconds = Math.floor(now / 1000);
  await db.prepare('CREATE TABLE IF NOT EXISTS auth_rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL)').run();
  await db.prepare('DELETE FROM auth_rate_limits WHERE reset_at <= ?').bind(seconds).run();
  const row = await db.prepare(`INSERT INTO auth_rate_limits (key, attempts, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts, reset_at`)
    .bind(key, seconds + 900).first<{ attempts: number; reset_at: number }>();
  if (!row) throw new Error('Login protection unavailable');
  return row.attempts > limit ? Math.max(1, row.reset_at - seconds) : 0;
}

export function protectAuthAttempts(scope: 'login' | 'register' | 'credentials') {
  return async (c: Context<{ Bindings: Env; Variables: { user: UserRow } }>, next: Next) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = c.req.header('CF-Connecting-IP') || 'local-development';
    let retry = await consumeAttempt(c.env.DB, scope + ':ip', ip, scope === 'login' ? 60 : 20);
    if (!retry && scope !== 'register') {
      const identity = scope === 'credentials' ? String(c.get('user').id) : String(body.email || '').trim().toLowerCase();
      retry = await consumeAttempt(c.env.DB, scope + ':account', identity, 10);
    }
    if (retry) {
      console.warn(JSON.stringify({ event: 'auth_rate_limited', scope }));
      c.header('Retry-After', String(retry));
      return c.json({ detail: '尝试次数过多，请稍后再试', retry_after: retry }, 429);
    }
    await next();
  };
}
