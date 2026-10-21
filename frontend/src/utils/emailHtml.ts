/**
 * Build an isolated document for untrusted email HTML.
 *
 * The iframe must also use an empty sandbox attribute. The restrictive CSP
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

export function buildEmailHtmlDocument(untrustedHtml: string): string {
  const body = typeof untrustedHtml === 'string' ? untrustedHtml : '';
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
