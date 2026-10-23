# Self-hosted FastAPI deployment with Docker Compose

This guide is for the **self-hosted FastAPI backend**. It is separate from the production BUAA HEP Hub deployment on Cloudflare Pages + D1.

## Required configuration

Create a local `.env` file in the repository root. Do not commit it.

```dotenv
LABHUB_SECRET_KEY=<random secret of at least 32 characters>
LABHUB_INVITE_CODE=<unique invite code of at least 12 characters>
# Only needed when explicitly running the clean-database bootstrap:
ADMIN_PASSWORD=<unique password of at least 12 characters>
```

Requirements:

- Do not use the legacy invite code `LAB-2026`.
- Generate the JWT secret and invite code independently; do not reuse passwords or credentials from other services.
- Keep `.env` out of version control. The repository's `.gitignore` already ignores it.
- The normal first-run setup wizard creates the initial administrator. `ADMIN_PASSWORD` is only consumed by the explicit clean-database bootstrap; if it is not configured, that bootstrap stops before changing the database.
- The bootstrap command never prints the password or invite code in plaintext.

## Start the service

From the repository root:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml config --quiet
docker compose --env-file .env -f deploy/docker-compose.yml up --build -d
docker compose --env-file .env -f deploy/docker-compose.yml logs --tail=100 lab-hub
```

If the required JWT secret or invite code is absent, `docker compose config` must fail rather than substitute a predictable default.

## Clean database initialization

Only use this path when intentionally preparing a clean self-hosted database. Back up existing data first; do not use a reset option on a database containing real users or research files.

Set `ADMIN_PASSWORD` in `.env`, then run `docker compose --env-file .env -f deploy/docker-compose.yml exec lab-hub python -m backend.seed --clean`. The password must be 12–72 UTF-8 bytes and the invite code must be explicitly configured; the bootstrap validates both before database mutation. Do not add `--reset` unless you intentionally intend to drop the existing database schema. The routine setup wizard is preferred for a new deployment.

## Cloudflare Pages distinction

The public Cloudflare Pages scraper has a separate `SCRAPER_ALLOWED_HOSTS` setting. Configure it in the Pages environment as a comma-separated list of exact trusted hostnames (no schemes, paths, wildcards, or arbitrary user-provided domains). When the list is missing, URL scraping is intentionally disabled. This setting is not the same as the self-hosted Docker secrets above.
