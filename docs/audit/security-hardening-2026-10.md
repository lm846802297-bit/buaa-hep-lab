# Security hardening follow-up — 2026-10-23

> Integration base: `main` at `0a58a7496683165b55b2fd69e148c2702046c85a`.
> Status: local integration candidate awaiting review, an operator-approved scraper host list, and remaining verification. No production secrets or services have been changed by preparing this candidate.

## Changes staged on this integration branch

1. **Bootstrap credentials** — clean-database initialization requires an explicit `ADMIN_PASSWORD` of 12–72 UTF-8 bytes and an explicit `LABHUB_INVITE_CODE`. The legacy `LAB-2026` invite is rejected, credential validation occurs before destructive database operations, and secret values are not logged. Tests cover byte boundaries and fail-before-mutation behavior.
2. **Test configuration** — backend tests use an explicit test-only invite code. The shared rate-limit isolation fixture from current `main` is retained.
3. **FastAPI notice permissions** — teacher/admin authorization uses the actual SQLAlchemy `User.role` field. A role matrix covers owner, another student, teacher, and admin for both update and delete.
4. **Cloudflare notice permissions** — the Workers data model has a separate `identity` field. Its teacher-identity logic is retained and tested against the D1 schema; it is not rewritten to match the FastAPI model.
5. **Self-hosted Compose** — the predictable JWT signing key and default invite code are removed. Compose requires explicitly configured `LABHUB_SECRET_KEY` and `LABHUB_INVITE_CODE`; `ADMIN_PASSWORD` is available for the explicit clean-database bootstrap only.
6. **Untrusted email HTML** — HTML mail bodies are rendered in a sandboxed iframe without script or same-origin permission and with a restrictive CSP that blocks remote resources by default. Before rendering, the inert email fragment removes active content and rewrites permitted absolute HTTP(S) links to open with `noopener noreferrer`; unsupported and relative links remain inactive. The popup permissions support user-activated links so destination pages do not inherit the email sandbox.
7. **Public URL scraper** — only HTTP(S) URLs with ordinary hostnames are accepted; URL credentials, IP literals, local/reserved hostnames, non-default ports, unapproved hosts, unsafe redirects, non-text content types, and responses larger than 1 MB are rejected. Every redirect and discovered subpage is checked against the same exact-host allowlist. If `SCRAPER_ALLOWED_HOSTS` is absent, scraping fails closed with HTTP 503.

## Important security boundaries

- A hostname allowlist does not prove that an allowlisted hostname cannot resolve to a private address or change its resolution. A hard SSRF guarantee requires a controlled egress boundary that validates resolved A/AAAA addresses at connection time. The Worker implementation must not be described as eliminating DNS rebinding.
- If a live self-hosted deployment has ever used the previously committed `LABHUB_SECRET_KEY`, rotating the value in source control is insufficient. Rotate it out-of-band and account for invalidating existing JWTs. Do not put the replacement value in Git or logs.
- The allowlist is intentionally not populated with guessed domains. An operator must configure approved exact hostnames in the Cloudflare Pages environment before URL scraping can work.
- Automated sandbox tests do not replace manual authenticated-mailbox interaction testing with hostile HTML on supported browsers. Relative, non-HTTP(S), credential-bearing and SVG links are intentionally inactive in this candidate.
- The self-hosted FastAPI `/api/talks/scrape-url` route is separate from the Pages scraper and is not hardened by this change. It currently accepts a user-provided HTTP(S) URL and disables TLS certificate verification; it requires a separate security fix before relying on it in a self-hosted deployment. The project owner reports that the current deployment uses Cloudflare only.

## Verification status

- The candidate is based on the main commit listed above and retains its existing Chromium smoke suite and workflow structure.
- CI has not yet been verified on this candidate; previous Actions jobs were blocked before validation by the account billing or spending-limit error.
- Docker Compose is not installed in the local verification environment, so actual Compose configuration validation remains outstanding. The owner reports no current Docker deployment.
- Local candidate checks: frontend tests 838 passed and 2 skipped; FastAPI tests 132 passed; production build and bundle check completed; Cloudflare type and module-boundary checks passed; isolated Cloudflare runtime verification passed 86 checks; Chromium smoke passed 711 checks including the actual demo mailbox link regression.
- A focused Chromium check uses the actual mailbox component in authenticated demo mode with a synthetic hostile message. It verifies link opening, opener isolation, and blocked tracking, and is called by the browser smoke entry point. Real-account and cross-browser checks remain outstanding.
- This review branch omits the proposed workflow path-classification change because the GitHub OAuth credential lacks `workflow` scope. The smoke script includes the mailbox check, but later changes limited to the mailbox view, sanitizer or focused test will not automatically select the browser job until that separate workflow change is authorized and added. The complete local candidate retains that change.
- No production deployment has been performed by this branch.
