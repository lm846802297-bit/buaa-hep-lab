/**
 * Build an isolated document for untrusted email HTML.
 *
 * The iframe must disable scripts and same-origin access. The restrictive CSP
 * prevents remote images/styles/scripts from loading by default, avoiding
 * both script execution and common remote tracking pixels.
 */
const EMAIL_CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  'img-src data:',
  "style-src 'unsafe-inline'",
  'font-src data:',
  "connect-src 'none'",
  'media-src data:',
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ');

function prepareEmailBody(untrustedHtml: string): string {
  // Template contents are inert: do not insert this untrusted tree into the app.
  if (typeof document === 'undefined') return '';
  const template = document.createElement('template');
  template.innerHTML = typeof untrustedHtml === 'string' ? untrustedHtml : '';

  template.content.querySelectorAll('script, meta, base, link, iframe, frame, object, embed, form').forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(element => {
    const isHtmlLink = element.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
      (element.localName === 'a' || element.localName === 'area');
    const rawHref = isHtmlLink ? element.getAttribute('href') : null;
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || ['href', 'xlink:href', 'target', 'rel', 'ping', 'attributionsrc', 'download', 'srcdoc'].includes(name)) {
        element.removeAttribute(attribute.name);
      }
    }
    if (!rawHref) return;
    try {
      // Relative and non-web links cannot acquire the application's origin.
      const url = new URL(rawHref);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
      element.setAttribute('href', url.href);
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    } catch {
      // An invalid or relative URL remains inactive.
    }
  });
  return template.innerHTML;
}

export function buildEmailHtmlDocument(untrustedHtml: string): string {
  const body = prepareEmailBody(untrustedHtml);
  return `<!doctype html>
<html lang="und">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${EMAIL_CONTENT_SECURITY_POLICY}">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html { color-scheme: light; }
    body { margin: 12px; color: #1f2937; background: #fff; font: 14px/1.65 system-ui, sans-serif; overflow-wrap: anywhere; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; border-collapse: collapse; }
    pre, code { white-space: pre-wrap; overflow-wrap: anywhere; }
    a { color: #1d4ed8; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
