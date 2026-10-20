import type { Env } from '../types';

// D1 rows are limited to 2 MB; leave space for metadata and encoding overhead.
export function uploadLimit(env: Pick<Env, 'FILES_BUCKET'>): number {
  return env.FILES_BUCKET ? 15 * 1024 * 1024 : 1024 * 1024;
}
