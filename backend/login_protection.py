import hashlib
import time
from fastapi import HTTPException
from sqlalchemy import text


def password_error(value):
    if not isinstance(value, str) or len(value) < 8:
        return '密码至少需要 8 个字符'
    if len(value.encode('utf-8')) > 72:
        return '密码最多为 72 个 UTF-8 字节，请缩短密码'
    return None


def protect_attempt(db, scope, identity, limit, now=None):
    seconds = int(time.time() if now is None else now)
    key = scope + ':' + hashlib.sha256(identity.encode()).hexdigest()
    db.execute(text('CREATE TABLE IF NOT EXISTS auth_rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL)'))
    db.execute(text('DELETE FROM auth_rate_limits WHERE reset_at <= :now'), {'now': seconds})
    row = db.execute(text('''INSERT INTO auth_rate_limits (key, attempts, reset_at)
        VALUES (:key, 1, :reset_at) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1
        RETURNING attempts, reset_at'''), {'key': key, 'reset_at': seconds + 900}).one()
    # Persist even when the caller returns an authentication error.
    db.commit()
    if row.attempts > limit:
        retry = max(1, row.reset_at - seconds)
        raise HTTPException(429, '尝试次数过多，请稍后再试', headers={'Retry-After': str(retry)})
