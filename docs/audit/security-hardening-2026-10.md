# Security hardening follow-up — 2026-10-23

> Integration base: `main` at `71be5f904baf6e2cc25c70d74cb23ce28c9aeea3`.
> Status: implementation staged for current-head CI and manual review. This work does not change production secrets or deploy any service.

## Changes staged on this integration branch

1. **Bootstrap credentials** — clean-database initialization requires an explicit `ADMIN_PASSWORD` of 12–72 UTF-8 bytes and an explicit `LABHUB_INVITE_CODE`. The legacy `LAB-2026` invite is rejected, credential validation occurs before destructive database operations, and secret values are not logged. Tests cover byte boundaries and fail-before-mutation behavior.
2. **Test configuration** — backend tests use an explicit test-only invite code. The shared rate-limit isolation fixture from current `main` is retained.
3. **FastAPI notice permissions** — teacher/admin authorization uses the actual SQLAlchemy `User.role` field. A role matrix covers owner, another student, teacher, and admin for both update and delete.
4. **Cloudflare notice permissions** — the Workers data model has a separate `identity` field. Its teacher-identity logic is retained and tested against the D1 schema; it is not rewritten to match the FastAPI model.
5. **Self-hosted Compose** — the predictable JWT signing key and default invite code are removed. Compose requires explicitly configured `LABHUB_SECRET_KEY` and `LABHUB_INVITE_CODE`; `ADMIN_PASSWORD` is available for the explicit clean-database bootstrap only.
6. **Untrusted email HTML** — HTML mail bodies are rendered in an empty-sandbox iframe with a restrictive CSP that blocks scripts and remote resources by default. Unit and Chromium smoke tests check script isolation, opaque origin, and tracking-image blocking.
7. **Public URL scraper** — only HTTP(S) URLs with ordinary hostnames are accepted; URL credentials, IP literals, local/reserved hostnames, non-default ports, unapproved hosts, unsafe redirects, non-text content types, and responses larger than 1 MB are rejected. Every redirect and discovered subpage is checked against the same exact-host allowlist. If `SCRAPER_ALLOWED_HOSTS` is absent, scraping fails closed with HTTP 503.

## Important security boundaries

- A hostname allowlist does not prove that an allowlisted hostname cannot resolve to a private address or change its resolution. A hard SSRF guarantee requires a controlled egress boundary that validates resolved A/AAAA addresses at connection time. The Worker implementation must not be described as eliminating DNS rebinding.
- If a live self-hosted deployment has ever used the previously committed `LABHUB_SECRET_KEY`, rotating the value in source control is insufficient. Rotate it out-of-band and account for invalidating existing JWTs. Do not put the replacement value in Git or logs.
- The allowlist is intentionally not populated with guessed domains. An operator must configure approved exact hostnames in the Cloudflare Pages environment before URL scraping can work.
- Automated sandbox tests do not replace manual authenticated-mailbox interaction testing with hostile HTML.

## Verification status

- The changes are based on current `main`, preserving its existing Chromium smoke suite and workflow structure.
- CI has not yet been verified on the final integration commit.
- No production deployment has been performed by this branch.
