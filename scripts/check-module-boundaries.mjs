#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = path.join(repositoryRoot, 'frontend');
const sourceRoot = path.join(frontendRoot, 'src');
const codeExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue']);

const repoPath = (absolutePath) => path.relative(repositoryRoot, absolutePath).split(path.sep).join('/');
const isWithin = (file, directory) => file === directory || file.startsWith(directory + '/');

function isRuntimeSourceFile(file) {
  const normalized = file.replaceAll('\\', '/');
  const isTestDirectory = normalized.split('/').includes('__tests__');
  const isTestFile = /\.(?:test|spec)\.[^.]+$/i.test(path.posix.basename(normalized));
  return !isTestDirectory && !isTestFile;
}

function walkCodeFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.wrangler', 'coverage'].includes(entry.name)) continue;
      files.push(...walkCodeFiles(path.join(directory, entry.name)));
    } else if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function extractImportSpecifiers(source) {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function resolveProjectImport(importer, specifier) {
  let absoluteTarget;
  if (specifier.startsWith('@/')) {
    absoluteTarget = path.resolve(sourceRoot, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    absoluteTarget = path.resolve(path.dirname(path.resolve(repositoryRoot, importer)), specifier);
  } else {
    return null;
  }

  const normalized = repoPath(absoluteTarget);
  if (normalized === '..' || normalized.startsWith('../')) return null;
  return normalized;
}

function getBoundaryViolations(importer, target) {
  const violations = [];
  const source = 'frontend/src/';
  const views = source + 'views';
  const components = source + 'components';
  const logicLayers = [
    source + 'api',
    source + 'composables',
    source + 'libs',
    source + 'services',
    source + 'utils',
  ];

  if (logicLayers.some((directory) => isWithin(importer, directory)) &&
      (isWithin(target, views) || isWithin(target, components))) {
    violations.push({
      code: 'LAYER-001',
      message: 'Reusable logic/API modules must not depend on page views or UI components.',
    });
  }

  if (isWithin(importer, components) && isWithin(target, views)) {
    violations.push({
      code: 'COMPONENT-001',
      message: 'Reusable components must not depend on route-level views.',
    });
  }

  if (isWithin(importer, source + 'content') &&
      [components, source + 'composables', views, source + 'services', source + 'api', source + 'libs']
        .some((directory) => isWithin(target, directory))) {
    violations.push({
      code: 'CONTENT-001',
      message: 'Content/data modules must not depend on UI or runtime feature modules.',
    });
  }

  if (isWithin(importer, 'frontend/src') && isWithin(target, 'frontend/functions/api')) {
    violations.push({
      code: 'BROWSER-API-001',
      message: 'Browser application source must not import server-side Cloudflare API modules; use HTTP API calls instead.',
    });
  }

  if (isWithin(importer, 'frontend/functions/api') && isWithin(target, 'frontend/src')) {
    violations.push({
      code: 'RUNTIME-001',
      message: 'Cloudflare API code must not import browser-application source modules.',
    });
  }

  // Forward-looking guard: once these folders are introduced, shared infrastructure
  // must remain independent of feature-specific implementation details.
  if (isWithin(importer, source + 'shared') && isWithin(target, source + 'features')) {
    violations.push({
      code: 'SHARED-001',
      message: 'Shared infrastructure must not depend on feature-specific implementation modules.',
    });
  }

  return violations;
}

function runSelfTest() {
  assert.equal(
    isRuntimeSourceFile('frontend/src/utils/papers.test.js'),
    false,
    'test modules may import server helpers for isolated behavioral tests',
  );
  assert.equal(
    isRuntimeSourceFile('frontend/src/utils/papers.js'),
    true,
    'runtime modules remain subject to dependency-boundary checks',
  );

  const cases = [
    ['frontend/src/utils/date.js', 'frontend/src/views/HomeView.vue', 'LAYER-001'],
    ['frontend/src/services/papers.js', 'frontend/src/components/PaperCard.vue', 'LAYER-001'],
    ['frontend/src/components/PaperCard.vue', 'frontend/src/views/LibraryView.vue', 'COMPONENT-001'],
    ['frontend/src/content/lab.js', 'frontend/src/api/client.js', 'CONTENT-001'],
    ['frontend/functions/api/routes/auth.ts', 'frontend/src/api/client.js', 'RUNTIME-001'],
    ['frontend/src/api/client.js', 'frontend/functions/api/routes/auth.ts', 'BROWSER-API-001'],
    ['frontend/src/shared/format.js', 'frontend/src/features/papers/api.js', 'SHARED-001'],
  ];

  for (const [importer, target, expectedCode] of cases) {
    const actual = getBoundaryViolations(importer, target).map((item) => item.code);
    assert.ok(actual.includes(expectedCode), `Expected ${expectedCode} for ${importer} -> ${target}; got ${actual}`);
  }

  const escapedAliasTarget = resolveProjectImport(
    'frontend/src/api/client.js',
    '@/../functions/api/routes/auth.ts',
  );
  assert.equal(escapedAliasTarget, 'frontend/functions/api/routes/auth.ts');
  assert.ok(
    getBoundaryViolations('frontend/src/api/client.js', escapedAliasTarget)
      .some((item) => item.code === 'BROWSER-API-001'),
    'the @/ alias must not bypass the browser/server runtime boundary',
  );

  assert.deepEqual(
    getBoundaryViolations('frontend/src/views/HomeView.vue', 'frontend/src/components/AppIcon.vue'),
    [],
    'page views may use reusable components',
  );
  assert.deepEqual(
    getBoundaryViolations('frontend/src/services/papers.js', 'frontend/src/utils/format.js'),
    [],
    'business services may use lower-level utilities',
  );
  assert.deepEqual(
    getBoundaryViolations('frontend/functions/api/routes/auth.ts', 'frontend/functions/api/middleware/auth.ts'),
    [],
    'Cloudflare API modules may import other server-side API modules',
  );
  console.log('Module boundary checker self-test passed (forbidden and allowed dependency directions).');
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }

  const roots = [
    path.join(frontendRoot, 'src'),
    path.join(frontendRoot, 'functions', 'api'),
  ];
  const files = roots.flatMap(walkCodeFiles).filter((file) => isRuntimeSourceFile(repoPath(file)));
  const violations = [];
  let checkedImports = 0;

  for (const absoluteFile of files) {
    const importer = repoPath(absoluteFile);
    const source = readFileSync(absoluteFile, 'utf8');
    for (const specifier of extractImportSpecifiers(source)) {
      const target = resolveProjectImport(importer, specifier);
      if (!target) continue;
      checkedImports += 1;
      for (const violation of getBoundaryViolations(importer, target)) {
        violations.push({ importer, target, ...violation });
      }
    }
  }

  if (violations.length) {
    console.error(`Module boundary check failed: ${violations.length} forbidden dependency edge(s).`);
    for (const item of violations) {
      console.error(`- [${item.code}] ${item.importer} -> ${item.target}: ${item.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Module boundary check passed: scanned ${files.length} source files and ${checkedImports} local imports.`);
}

main();
