# Security hardening follow-up — 2026-10

> Baseline: `main` at `f8074eee4173df3780c58df588a5e148f12f8880`.
> Status: implementation draft for PR review. No production secrets, database, or deployment were changed by this work.

## Changes in this branch

1. **Email HTML isolation** — untrusted email HTML is moved from Vue `v-html` rendering into a sandboxed iframe with no script, same-origin, form, popup, or top-navigation permissions. A restrictive CSP blocks network connections and remote images by default. Unit tests verify the wiring; Chromium smoke tests now exercise script blocking, opaque-origin isolation, and tracking-image blocking.
2. **URL scraper hardening** — the public event scraper rejects non-HTTP(S) URLs, user-info, IP-literal targets, local/reserved hostnames, and non-default ports. Redirects are handled manually and each target is revalidated. HTML/text response types are checked and each page is capped at 1 MB. Scraping fails closed unless the operator configures an exact-host `SCRAPER_ALLOWED_HOSTS` list; redirects and discovered subpages must stay on that list.
3. **FastAPI notice authorization** — teacher/admin checks use the existing canonical `User.role` field instead of nonexistent `User.identity`. The regression matrix covers owner, other student, teacher, and admin for both update and delete.
4. **Cloudflare notice authorization contract** — D1's `users` schema explicitly contains both `role` and `identity`; the Workers route's `user.identity === 'teacher'` check is supported by that schema and should not be mechanically rewritten to match FastAPI. A separate Workers route test covers owner, another student, a teacher identity, and an admin for both update and delete.
5. **Self-hosted Docker configuration** — Compose requires explicit `LABHUB_SECRET_KEY` and `LABHUB_INVITE_CODE` values and no longer supplies a committed JWT signing key or predictable default invite code. `ADMIN_PASSWORD` is optional for normal setup but required by the explicit clean-database bootstrap; it must be at least 12 UTF-8 bytes. Bootstrap secrets are not printed.
6. **Configuration tests and operator guide** — CI now has a Docker Compose fail-closed configuration test (when Docker Compose is available) and a separate `docs/SELF_HOSTED_DOCKER.md` guide. Cloudflare Pages and self-hosted FastAPI instructions remain separate.

## Remaining security boundaries and merge gates

- **SSRF boundary** — the exact-host allowlist materially narrows the scraper's reach, but it cannot prove that an allowlisted hostname will never resolve to a private address. A hard SSRF guarantee still requires a controlled egress proxy that validates resolved A/AAAA addresses at connection time. Until an operator configures `SCRAPER_ALLOWED_HOSTS`, the scraper returns a configuration error instead of fetching arbitrary hosts.
- PR #15 also changes `backend/seed.py`; that branch now removes default administrator credentials and the predictable `LAB-2026` invite code, requires explicit bootstrap credentials, and avoids printing secret values. Merge PR #15 before PR #26, then rerun PR #26 CI against the merged base.
- PR #3 edits the release workflow and Cloudflare deployment documentation. This branch keeps the self-hosted Docker guide in a separate file and does not modify those overlapping paths; Cloudflare Pages and self-hosted Docker configuration are documented separately.
- **Verification gate** — GitHub Actions must pass on the exact current PR head before merge. Automated checks do not replace manual authenticated-mailbox interaction testing with hostile HTML, and they do not constitute a production deployment.

## Current state

- PR #26 remains a draft and has not been merged or deployed.
- The scraper allowlist is intentionally not populated with guessed domains. The production Pages environment must receive an operator-approved exact-host list before scraping is enabled.
- After PR #15 is merged, rerun the complete PR #26 validation against the updated `main`; then complete the remaining manual checks before marking ready for review.
