# Toolchain Audit Remediation Plan

## Goal

Resolve the remaining Vite/esbuild and Vitest/Tinypool audit findings without upgrading Tailwind CSS to v4 or changing GitHub Actions and production deployment workflows.

## Approved dependency path

- Upgrade Vite from 5 to 6.4.5 and Vitest from 3 to 4.1.12.
- Keep the current Vue Vite plugin and Tailwind CSS v3.
- Preserve the tested `undici@7.30.1` and `postcss-selector-parser@7.1.6` overrides.

## Implementation steps

1. Update the Vitest test URL mock to retain the native URL constructor.
2. Configure Vue asset URL handling so absolute public asset URLs remain browser URLs.
3. Disable dependency discovery in the middleware-only public prerender server to avoid a Vite shutdown scan error.
4. Update the Vite and Vitest version ranges and regenerate the lockfile.
5. Run the complete test suite, production build, full dependency audit, production-only audit, local Cloudflare verification, and whitespace check.

## Acceptance criteria

- `npm audit` reports zero vulnerabilities.
- `npm audit --omit=dev` reports zero vulnerabilities.
- All existing tests pass.
- The production build and public prerender complete successfully.
- Local Cloudflare verification passes using its isolated D1 database; no production deployment is triggered.
- GitHub Actions and deployment configuration remain unchanged.
