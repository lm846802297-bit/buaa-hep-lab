# Module boundary and Cloudflare type checks

This document describes the lightweight architectural checks introduced for incremental modularization. It does not claim that the current application has already been fully migrated to feature-based modules.

## Commands

Run from the repository root:

```bash
node scripts/check-module-boundaries.mjs --self-test
npm --prefix frontend run check:module-boundaries
npm --prefix frontend run check:types:cloudflare
```

The GitHub Actions workflow `.github/workflows/module-architecture.yml` runs these checks independently of the full build/deployment workflow.

## Enforced dependency directions

- Reusable logic/API layers (`src/api`, `src/composables`, `src/libs`, `src/services`, and `src/utils`) may not import route-level views or UI components.
- Reusable components may not import route-level views.
- Static content/data modules may not import UI components, views, composables, services, API modules, or UI libraries.
- Cloudflare Pages Functions under `frontend/functions/api` may not import browser-application modules under `frontend/src`.
- If `src/shared` and `src/features` are introduced later, shared infrastructure may not depend on feature-specific implementation modules.

These are intentionally narrow, high-confidence rules. They protect dependency direction without requiring a large directory migration or treating every existing cross-layer dependency as a blocker.

## Scope and limitations

The checker scans JavaScript, TypeScript, JSX/TSX, and Vue source files. It recognizes relative imports and the existing `@/` alias. It does not currently resolve package exports, computed dynamic imports, CommonJS `require()`, or detect arbitrary circular dependency graphs. Add a rule only with a corresponding positive/negative self-test and after checking the current `main` baseline.

The TypeScript configuration checks `frontend/functions/api/**/*.ts` against the checked-in Wrangler-generated `worker-configuration.d.ts`. The initial run exposed 19 diagnostics; all 19 were subsequently fixed and the type-check job reported zero diagnostics on commit `19060a241f4275369bd35b1fdcb267752754d7e7`. The active `diagnostics` list in `frontend/typescript-baseline.cloudflare.json` is now empty. The original entries are retained under `resolvedDiagnostics` for audit history and are not accepted by the checker. Any future TypeScript diagnostic therefore fails CI.

The configuration uses `strict: false` as an incremental adoption setting; it is not a claim that all existing JavaScript/Vue code is type-safe, nor a substitute for runtime authorization/security tests. The compiler version is pinned to TypeScript 5.9.3. A later tightening pass should reduce the baseline, evaluate stricter options, and decide whether TypeScript should become a locked development dependency.

## Acceptance

- The self-test proves that forbidden dependency directions fail and permitted directions pass.
- The source scan reports no current violations.
- The Cloudflare TypeScript job reports zero diagnostics on the exact PR head SHA.
- This workflow is an additional check; merging still requires the repository's full existing regression and deployment-validation workflow.
