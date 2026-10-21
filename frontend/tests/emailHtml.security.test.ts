import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildEmailHtmlDocument } from '../src/utils/emailHtml';

describe('isolated email HTML rendering', () => {
  it('puts a restrictive CSP before untrusted email markup', () => {
    const malicious = '<img src="https://tracker.example/pixel"><script>parent.document.cookie</script>';
    const document = buildEmailHtmlDocument(malicious);
    expect(document.indexOf('Content-Security-Policy')).toBeLessThan(document.indexOf(malicious));
    expect(document).toContain("default-src 'none'");
    expect(document).toContain('img-src data:');
    expect(document).toContain("connect-src 'none'");
    expect(document).toContain('object-src \'none\'');
    expect(document).toContain('base-uri \'none\'');
  });

  it('uses a sandboxed iframe instead of injecting email HTML into the application DOM', () => {
    const mailboxView = readFileSync(new URL('../src/views/MailboxView.vue', import.meta.url), 'utf8');
    expect(mailboxView).toContain('<iframe');
    expect(mailboxView).toContain('sandbox=""');
    expect(mailboxView).toContain('referrerpolicy="no-referrer"');
    expect(mailboxView).toContain(':srcdoc="buildEmailHtmlDocument(emailDetail.body_html)"');
    expect(mailboxView).not.toContain('v-html="emailDetail.body_html"');
  });
});
