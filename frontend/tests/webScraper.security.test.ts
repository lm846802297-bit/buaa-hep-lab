import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrapeUrlDeep, validatePublicHttpUrl } from '../functions/api/utils/webScraper';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('public web scraper URL boundary', () => {
  it.each([
    'http://localhost/admin',
    'http://127.0.0.1/admin',
    'http://2130706433/admin',
    'http://[::1]/admin',
    'http://router.local/',
    'http://metadata.google.internal/',
    'http://user:password@events.example.edu/',
    'https://events.example.edu:8080/',
    'https://events.example.edu:80/',
    'http://events.example.edu:443/'
  ])('rejects a non-public or malformed target before fetching: %s', async url => {
    expect(() => validatePublicHttpUrl(url)).toThrow();
    const upstream = vi.spyOn(globalThis, 'fetch');
    const result = await scrapeUrlDeep(url, ['events.example.edu']);
    expect(result.success).toBe(false);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('accepts an ordinary public academic event URL when it is allowlisted', () => {
    expect(validatePublicHttpUrl('https://indico.example.edu/event/123#overview', ['indico.example.edu']).href)
      .toBe('https://indico.example.edu/event/123');
  });

  it('rejects a public but unapproved hostname before fetching', async () => {
    expect(() => validatePublicHttpUrl('https://other.example.edu/', ['events.example.edu'])).toThrow(/白名单/);
    const upstream = vi.spyOn(globalThis, 'fetch');
    const result = await scrapeUrlDeep('https://other.example.edu/', ['events.example.edu']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('白名单');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('fails closed when no trusted-host allowlist is configured', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch');
    const result = await scrapeUrlDeep('https://events.example.edu/');
    expect(result.success).toBe(false);
    expect(result.error).toContain('白名单');
    expect(upstream).not.toHaveBeenCalled();
  });

  it('does not follow a redirect to a private IP literal', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } })
    );

    const result = await scrapeUrlDeep('https://events.example.edu/', ['events.example.edu']);
    expect(result.success).toBe(false);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(upstream.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
  });

  it('does not follow a redirect to a different public hostname outside the allowlist', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://other.example.edu/admin' } })
    );

    const result = await scrapeUrlDeep('https://events.example.edu/', ['events.example.edu']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('白名单');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('allows a validated public redirect and reads a bounded HTML response', async () => {
    const html = '<html><head><title>Workshop</title></head><body><main>Workshop information</main></body></html>';
    const upstream = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/conference' } }))
      .mockResolvedValueOnce(new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', 'content-length': String(new TextEncoder().encode(html).length) }
      }));

    const result = await scrapeUrlDeep('https://events.example.edu/');
    expect(result.success).toBe(true);
    expect(result.title).toBe('Workshop');
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('rejects oversized HTML before parsing it', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('too large', {
        status: 200,
        headers: { 'content-type': 'text/html', 'content-length': '1000001' }
      })
    );

    const result = await scrapeUrlDeep('https://events.example.edu/');
    expect(result.success).toBe(false);
    expect(result.error).toContain('1 MB');
    expect(upstream).toHaveBeenCalledTimes(1);
  });
});
