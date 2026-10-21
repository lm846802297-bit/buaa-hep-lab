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
    'https://events.example.edu:8080/'
  ])('rejects a non-public or malformed target before fetching: %s', async url => {
    expect(() => validatePublicHttpUrl(url)).toThrow();
    const upstream = vi.spyOn(globalThis, 'fetch');
    const result = await scrapeUrlDeep(url);
    expect(result.success).toBe(false);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('accepts an ordinary public academic event URL', () => {
    expect(validatePublicHttpUrl('https://indico.example.edu/event/123#overview').href)
      .toBe('https://indico.example.edu/event/123');
  });

  it('does not follow a redirect to a private IP literal', async () => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } })
    );

    const result = await scrapeUrlDeep('https://events.example.edu/');
    expect(result.success).toBe(false);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(upstream.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
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
