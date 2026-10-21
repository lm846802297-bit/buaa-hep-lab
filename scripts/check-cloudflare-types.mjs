#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = path.join(repositoryRoot, 'frontend');
const baselinePath = path.join(frontendRoot, 'typescript-baseline.cloudflare.json');

function parseDiagnostic(line) {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
  if (!match) return null;
  return {
    file: match[1].replaceAll('\\\\', '/'),
    line: Number(match[2]),
    column: Number(match[3]),
    code: match[4],
    message: match[5],
  };
}

function diagnosticKey(item) {
  return JSON.stringify([item.file, item.line, item.column, item.code, item.message]);
}

function main() {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    command,
    ['--yes', '--package=typescript@5.9.3', 'tsc', '--noEmit', '-p', 'tsconfig.cloudflare.json'],
    {
      cwd: frontendRoot,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  );

  const output = [result.stdout || '', result.stderr || ''].join('\n');
  if (result.error) {
    console.error('Could not start the pinned TypeScript compiler:', result.error.message);
    process.exitCode = 1;
    return;
  }

  const diagnosticLines = output.split(/\r?\n/).filter((line) => /error TS\d+:/.test(line));
  const diagnostics = diagnosticLines.map(parseDiagnostic).filter(Boolean);
  if (diagnostics.length !== diagnosticLines.length) {
    console.error('TypeScript emitted diagnostics that the baseline checker could not parse.');
    console.error(diagnosticLines.filter((line) => !parseDiagnostic(line)).join('\n'));
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0 && diagnostics.length === 0) {
    console.error('TypeScript did not complete and produced no parseable diagnostics.');
    console.error(output);
    process.exitCode = 1;
    return;
  }

  const baselineKeys = new Set(baseline.diagnostics.map(diagnosticKey));
  const actualKeys = new Set(diagnostics.map(diagnosticKey));
  const newDiagnostics = diagnostics.filter((item) => !baselineKeys.has(diagnosticKey(item)));
  const resolvedDiagnostics = baseline.diagnostics.filter((item) => !actualKeys.has(diagnosticKey(item)));

  if (newDiagnostics.length > 0) {
    console.error(`Cloudflare TypeScript check failed: ${newDiagnostics.length} new diagnostic(s) beyond the reviewed baseline.`);
    for (const item of newDiagnostics) {
      console.error(`- ${item.file}(${item.line},${item.column}): ${item.code}: ${item.message}`);
    }
    console.error('Review each new diagnostic. If it is a genuine existing issue, fix it or explicitly review and update the baseline.');
    process.exitCode = 1;
    return;
  }

  console.log(`Cloudflare TypeScript baseline check passed: ${diagnostics.length} known diagnostic(s), no new diagnostics.`);
  if (resolvedDiagnostics.length > 0) {
    console.log(`${resolvedDiagnostics.length} baseline diagnostic(s) are no longer present; remove them from the baseline after review.`);
  }
  console.log('Tracked baseline:', path.relative(repositoryRoot, baselinePath));
}

main();
