# Security hardening follow-up — 2026-10

> Baseline: `main` at `f8074eee4173df3780c58df588a5e148f12f8880`.
> Status: implementation draft for PR review. No production secrets, database, or deployment were changed by this work.

## Changes in this branch

1. **Email HTML isolation** — untrusted email HTML is moved from Vue `v-html` rendering into a sandboxed iframe with no script, same-origin, form, popup, or top-navigation permissions. A restrictive CSP blocks network connections and remote images by default. Embedded `data:` images and inline styles remain available.
2. **URL scraper hardening** — the public event scraper rejects non-HTTP(S) URLs, user-info, IP-literal targets, local/reserved hostnames, and nonstandard ports. Redirects are handled manually and each target is revalidated. HTML/text response types are checked and each page is capped at 1 MB.
3. **FastAPI notice authorization** — teacher/admin checks use the existing canonical `User.role` field instead of nonexistent `User.identity`. The regression matrix covers owner, other student, teacher, and admin for both update and delete.
4. **Cloudflare notice authorization contract** — D1's `users` schema explicitly contains both `role` and `identity`; the Workers route's `user.identity === 'teacher'` check is supported by that schema and should not be mechanically rewritten to match FastAPI. A separate Workers route test now covers owner, another student, a teacher identity, and an admin for both update and delete.
5. **Self-hosted Docker configuration** — the repository no longer supplies a committed JWT signing key or a predictable default invite code through Compose. Operators must provide both `LABHUB_SECRET_KEY` (at least 32 characters) and a unique `LABHUB_INVITE_CODE` before starting the container.

## Important limitations and follow-ups

- Cloudflare Workers does not expose a reliable DNS-resolution/IP-address verification hook through this scraper's current `fetch` path. Blocking literal IPs, local/reserved hostnames, and revalidating redirects mitigates common SSRF cases but does **not** fully eliminate DNS-rebinding risks. If the scraper must accept arbitrary Internet hosts with a hard SSRF guarantee, route it through a controlled egress proxy that resolves and validates destination IPs, or use a maintained hostname allowlist.
- The current open PR #15 also changes `backend/seed.py`. To respect the repository's shared-file ownership rule, this branch does not edit that file. Its separate `init_clean_db()` helper still contains legacy default administrator-password/invite-code fallbacks and needs a follow-up after the overlapping PR is resolved.
- The README deployment instructions overlap open PR #3, so this branch adds a dedicated note rather than modifying that shared file. Update the README's self-hosted environment-variable instructions after PR #3 merges.
- **Verification gate** — GitHub Actions must pass on the exact current PR head before merge. The workflow covers frontend/API tests, the FastAPI suite, build, browser smoke checks, and isolated Pages runtime checks. These automated checks do not replace manual authenticated-mailbox testing with hostile HTML, nor do they constitute a production deployment; both remain outside this PR's verified scope.
