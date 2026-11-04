import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { Env, UserRow } from '../types';
import { authMiddleware, createToken } from '../middleware/auth';

import { passwordError, protectAuthAttempts } from '../middleware/loginProtection';

const app = new Hono<{ Bindings: Env; Variables: { user: UserRow } }>();

app.use('*', authMiddleware);

app.put('/profile', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const realName = body.real_name !== undefined ? (body.real_name || '').trim() : user.real_name;
  const nickname = body.nickname !== undefined ? (body.nickname || '').trim() : user.nickname;
  const bio = body.bio !== undefined ? (body.bio || '').trim() : user.bio;

  await c.env.DB.prepare(
    'UPDATE users SET name = ?, real_name = ?, nickname = ?, bio = ? WHERE id = ?'
  )
    .bind(nickname || realName || user.name, realName, nickname, bio, user.id)
    .run();

  const updated = await c.env.DB.prepare('SELECT id, name, real_name, nickname, email, role, identity, can_manage_seminars, avatar, bio, created_at FROM users WHERE id = ?')
    .bind(user.id)
    .first();

  return c.json(updated);
});

app.put('/credentials', protectAuthAttempts('credentials'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const current_password = body.current_password || '';
  const new_password = body.new_password;
  const email = body.email ? body.email.trim().toLowerCase() : null;

  if (!current_password) {
    return c.json({ detail: '请提供当前密码以验证身份' }, 400);
  }

  let match = false;
  if (user.hashed_password) {
    try {
      match = await bcrypt.compare(current_password, user.hashed_password);
    } catch (e) {
      console.warn('bcrypt compare failed:', e);
    }
  }

  if (!match) {
    return c.json({ detail: '当前密码错误，无法更改凭据' }, 400);
  }

  if (email && email !== user.email.toLowerCase()) {
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?')
      .bind(email, user.id)
      .first();
    if (existing) {
      return c.json({ detail: '该邮箱已被其他账号使用' }, 400);
    }
  }

  let finalPassword = user.hashed_password;
  let tokenVersion = user.token_version + 1;
  if (new_password) {
    if (passwordError(new_password)) {
      return c.json({ detail: passwordError(new_password) }, 400);
    }
    finalPassword = await bcrypt.hash(new_password, 6);
  }

  const finalEmail = email || user.email;

  await c.env.DB.prepare(
    'UPDATE users SET email = ?, hashed_password = ?, token_version = ? WHERE id = ?'
  )
    .bind(finalEmail, finalPassword, tokenVersion, user.id)
    .run();

  const updated = await c.env.DB.prepare('SELECT id, name, real_name, nickname, email, role, identity, can_manage_seminars, avatar, bio, created_at FROM users WHERE id = ?')
    .bind(user.id)
    .first();

  const secret = c.env.JWT_SECRET!;
  return c.json({ access_token: await createToken({ ...user, ...updated, token_version: tokenVersion } as UserRow, secret), token_type: 'bearer', user: updated });
});

app.post('/avatar', async (c) => {
  const user = c.get('user');
  const formData = await c.req.formData().catch(() => null);
  if (!formData) {
    return c.json({ detail: '无效的表单数据' }, 400);
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return c.json({ detail: '未找到上传的头像图片' }, 400);
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ detail: '头像仅支持 PNG、JPEG、WebP 或 GIF 格式图片' }, 400);
  }

  const MAX_AVATAR_BYTES = 200 * 1024; // 200 KB
  if (file.size > MAX_AVATAR_BYTES) {
    return c.json({ detail: '头像文件大小不得超过 200 KB，请压缩后重新上传' }, 400);
  }

  const fileId = crypto.randomUUID();
  const buffer = await file.arrayBuffer();

  // Try R2 if available, fallback to D1
  let savedToR2 = false;
  if (c.env.FILES_BUCKET) {
    try {
      await c.env.FILES_BUCKET.put(fileId, buffer, {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `inline; filename="${file.name}"`
        }
      });
      savedToR2 = true;
    } catch (e) {
      console.warn('R2 avatar upload failed, falling back to D1:', e);
    }
  }

  if (savedToR2) {
    await c.env.DB.prepare(
      `INSERT INTO uploaded_files (id, filename, content_type, size, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(fileId, file.name, file.type, file.size)
      .run();
  } else {
    const uint8 = new Uint8Array(buffer);
    await c.env.DB.prepare(
      `INSERT INTO uploaded_files (id, filename, content_type, size, content, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(fileId, file.name, file.type, file.size, uint8)
      .run();
  }

  const avatarUrl = `/api/files/${fileId}`;
  await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?')
    .bind(avatarUrl, user.id)
    .run();

  const updated = await c.env.DB.prepare('SELECT id, name, real_name, nickname, email, role, identity, can_manage_seminars, avatar, bio, created_at FROM users WHERE id = ?')
    .bind(user.id)
    .first();

  return c.json(updated);
});

// Synchronize the user's home dashboard layout across devices.
// The schema already stores this JSON in users.home_layout; keep the payload
// scoped to the authenticated user and bounded to prevent oversized writes.
app.get('/home-layout', async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare('SELECT home_layout FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ home_layout: string | null }>();
  const raw = row?.home_layout || '';
  if (!raw.trim()) return c.json({ has_custom_layout: false, layout: null });

  try {
    const layout = JSON.parse(raw);
    if (layout && typeof layout === 'object' && !Array.isArray(layout)) {
      return c.json({ has_custom_layout: true, layout });
    }
  } catch {
    // A malformed legacy value is treated as no custom layout; it is not
    // returned to the client or allowed to break the workspace shell.
  }
  return c.json({ has_custom_layout: false, layout: null });
});

app.put('/home-layout', async (c) => {
  const user = c.get('user');
  const layout = await c.req.json().catch(() => null);
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
    return c.json({ detail: '无效的首页布局数据' }, 400);
  }

  const serialized = JSON.stringify(layout);
  if (new TextEncoder().encode(serialized).byteLength > 64 * 1024) {
    return c.json({ detail: '首页布局数据不能超过 64 KiB' }, 413);
  }

  await c.env.DB.prepare('UPDATE users SET home_layout = ? WHERE id = ?')
    .bind(serialized, user.id)
    .run();
  return c.json({ has_custom_layout: true, saved: true, layout });
});

app.delete('/home-layout', async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare("UPDATE users SET home_layout = '' WHERE id = ?")
    .bind(user.id)
    .run();
  return c.json({ has_custom_layout: false, reset: true, layout: null });
});

export default app;
