import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface WranglerConfig {
  vars?: Record<string, unknown>;
}

function readWranglerConfig(): WranglerConfig {
  return JSON.parse(readFileSync(resolve(frontendRoot, 'wrangler.json'), 'utf8')) as WranglerConfig;
}

/**
 * The scraper allowlist has to live in `wrangler.json` rather than only in the
 * Cloudflare dashboard. Whenever a deployment is triggered, the wrangler config
 * becomes the source of truth for the Pages project variable set, so a value that
 * exists only in the dashboard is silently dropped by the next deploy and the
 * scraper starts fail-closing with HTTP 503.
 */
describe('Pages runtime configuration', () => {
  it('declares SCRAPER_ALLOWED_HOSTS in the wrangler vars block', () => {
    const vars = readWranglerConfig().vars ?? {};
    expect(Object.prototype.hasOwnProperty.call(vars, 'SCRAPER_ALLOWED_HOSTS')).toBe(true);
  });

  it('keeps the scraper allowlist a non-empty comma-separated hostname list', () => {
    const raw = readWranglerConfig().vars?.SCRAPER_ALLOWED_HOSTS;
    expect(typeof raw).toBe('string');
    const hosts = String(raw).split(',').map(host => host.trim()).filter(Boolean);
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) {
      // Exact hostnames only: no scheme, no path, no wildcard, no port.
      expect(host).toMatch(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/);
    }
  });

  it('does not rely on a wildcard or a bare public suffix for the allowlist', () => {
    const raw = String(readWranglerConfig().vars?.SCRAPER_ALLOWED_HOSTS ?? '');
    expect(raw).not.toContain('*');
    const hosts = raw.split(',').map(host => host.trim()).filter(Boolean);
    for (const host of hosts) {
      expect(host.split('.').length).toBeGreaterThanOrEqual(2);
    }
  });
});
