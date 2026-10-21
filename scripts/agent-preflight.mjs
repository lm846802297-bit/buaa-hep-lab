#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const usage = [
  'Usage:',
  '  node scripts/agent-preflight.mjs --paths <repo-relative-path> [<path> ...] [options]',
  '  node scripts/agent-preflight.mjs --paths-file <file> [options]',
  '  node scripts/agent-preflight.mjs --self-test',
  '',
  'Options:',
  '  --repo <owner/name>       Override repository inferred from origin or GITHUB_REPOSITORY',
  '  --base <branch>           Target branch to audit (default: main)',
  '  --pr <number>             Current PR number to exclude from overlap checks',
  '  --allow-overlap           Continue despite overlaps only with explicit user authorization',
  '  --allow-stale-base        Continue on an outdated base only with explicit authorization',
  '  --self-test               Run offline overlap-logic tests; no GitHub access required',
].join('\n');

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  } catch (error) {
    const stderr = error && error.stderr ? error.stderr.toString().trim() : '';
    const message = stderr || (error && error.message) || String(error);
    throw new Error(command + ' ' + args.join(' ') + ' failed: ' + message);
  }
}

function normalizeRepoPath(value) {
  const normalized = String(value).replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || path.posix.isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error("Expected a repository-relative path without '..': " + value);
  }
  return path.posix.normalize(normalized);
}

function inferRepository(override) {
  const configured = override || process.env.GITHUB_REPOSITORY;
  if (configured) {
    if (!/^[^/]+\/[^/]+$/.test(configured)) {
      throw new Error("Invalid repository '" + configured + "'; expected owner/name.");
    }
    return configured;
  }
  const remote = run('git', ['remote', 'get-url', 'origin']).replace(/\.git$/, '');
  const match = remote.match(/github\.com[:/]([^/]+\/[^/]+)$/i);
  if (!match) {
    throw new Error("Cannot infer owner/name from origin '" + remote + "'. Pass --repo owner/name.");
  }
  return match[1];
}

function ghJsonLines(endpoint) {
  const output = run('gh', ['api', '--paginate', endpoint, '--jq', '.[] | @json']);
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function ghLines(endpoint, jq) {
  const output = run('gh', ['api', '--paginate', endpoint, '--jq', jq]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function findOverlaps(plannedPaths, pullRequests, options) {
  const settings = options || {};
  const baseBranch = settings.baseBranch || 'main';
  const currentBranch = settings.currentBranch || '';
  const currentPr = settings.currentPr === undefined ? null : settings.currentPr;
  const planned = new Set(plannedPaths.map(normalizeRepoPath));
  return pullRequests
    .filter((pr) => pr.base && pr.base.ref === baseBranch)
    .filter((pr) => Number(pr.number) !== Number(currentPr))
    .filter((pr) => !pr.head || pr.head.ref !== currentBranch)
    .map((pr) => ({
      pullRequest: pr,
      paths: Array.from(new Set((pr.files || []).map(normalizeRepoPath)))
        .filter((file) => planned.has(file))
        .sort(),
    }))
    .filter((entry) => entry.paths.length > 0)
    .sort((a, b) => Number(a.pullRequest.number) - Number(b.pullRequest.number));
}

function selfTest() {
  const prs = [
    { number: 20, title: 'topic navigation', base: { ref: 'main' }, head: { ref: 'feat/topic' }, files: ['frontend/src/index.css', 'frontend/src/views/ResearchTopicView.vue'] },
    { number: 21, title: 'own PR', base: { ref: 'main' }, head: { ref: 'agent-preflight' }, files: ['frontend/src/index.css'] },
    { number: 22, title: 'other base', base: { ref: 'release' }, head: { ref: 'fix/release' }, files: ['frontend/src/index.css'] },
    { number: 23, title: 'unrelated', base: { ref: 'main' }, head: { ref: 'docs/readme' }, files: ['README.md'] },
  ];
  const overlaps = findOverlaps(
    ['frontend\\src\\index.css', './frontend/src/views/ResearchTopicView.vue'],
    prs,
    { baseBranch: 'main', currentBranch: 'agent-preflight', currentPr: null },
  );
  assert.equal(overlaps.length, 1, 'detect only the other main-targeting PR with matching paths');
  assert.equal(overlaps[0].pullRequest.number, 20);
  assert.deepEqual(overlaps[0].paths, ['frontend/src/index.css', 'frontend/src/views/ResearchTopicView.vue']);
  assert.equal(findOverlaps(['README.md'], prs, { currentBranch: 'agent-preflight' }).length, 1, 'README overlap should be reported');
  assert.equal(findOverlaps(['frontend/src/index.css'], prs, { currentBranch: 'agent-preflight', currentPr: 20 }).length, 0, 'explicit current PR is excluded');
  assert.equal(findOverlaps(['frontend/src/index.css'], prs, { currentBranch: 'agent-preflight' }).length, 1, 'own branch PR is excluded by branch name');
  console.log('Agent preflight self-test passed (path normalization, exact overlap, base filtering, and own-PR exclusion).');
}

function parseArgs(argv) {
  const options = { paths: [], base: 'main', pr: null, repo: null, allowOverlap: false, allowStaleBase: false, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--self-test') options.selfTest = true;
    else if (arg === '--allow-overlap') options.allowOverlap = true;
    else if (arg === '--allow-stale-base') options.allowStaleBase = true;
    else if (arg === '--paths') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) options.paths.push(argv[++i]);
    } else if (arg === '--paths-file') {
      const file = argv[++i];
      if (!file) throw new Error('--paths-file requires a file path.');
      options.paths.push(...readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));
    } else if (arg === '--repo') options.repo = argv[++i];
    else if (arg === '--base') options.base = argv[++i];
    else if (arg === '--pr') options.pr = Number(argv[++i]);
    else throw new Error('Unknown argument: ' + arg);
  }
  if (options.pr !== null && (!Number.isInteger(options.pr) || options.pr < 1)) throw new Error('--pr must be a positive integer.');
  if (!options.base) throw new Error('--base requires a branch name.');
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) {
    selfTest();
    return;
  }
  if (options.paths.length === 0) throw new Error('Provide at least one planned path using --paths or --paths-file.');
  const plannedPaths = Array.from(new Set(options.paths.map(normalizeRepoPath))).sort();
  const repo = inferRepository(options.repo);
  const currentBranch = run('git', ['branch', '--show-current']);
  const headSha = run('git', ['rev-parse', 'HEAD']);
  if (!currentBranch || currentBranch === options.base) {
    throw new Error("Current branch is '" + (currentBranch || '(detached HEAD)') + "'. Create/use a task branch before editing; do not work directly on '" + options.base + "'.");
  }

  // Refresh only the local remote-tracking ref; no source files or remote refs are changed.
  run('git', ['fetch', '--quiet', 'origin', '+refs/heads/' + options.base + ':refs/remotes/origin/' + options.base]);
  const localBaseSha = run('git', ['rev-parse', 'refs/remotes/origin/' + options.base]);
  const remoteBaseSha = run('gh', ['api', 'repos/' + repo + '/branches/' + encodeURIComponent(options.base), '--jq', '.commit.sha']);
  const mergeBase = run('git', ['merge-base', 'origin/' + options.base, 'HEAD']);
  const baseAhead = Number(run('git', ['rev-list', '--count', mergeBase + '..origin/' + options.base]));
  const branchAhead = Number(run('git', ['rev-list', '--count', mergeBase + '..HEAD']));
  const openPullRequests = ghJsonLines('repos/' + repo + '/pulls?state=open&base=' + encodeURIComponent(options.base) + '&per_page=100');

  const prRecords = [];
  for (const pr of openPullRequests) {
    if (Number(pr.number) === Number(options.pr) || (pr.head && pr.head.ref === currentBranch)) continue;
    const files = ghLines('repos/' + repo + '/pulls/' + pr.number + '/files?per_page=100', '.[].filename');
    prRecords.push({ ...pr, files });
  }
  const overlaps = findOverlaps(plannedPaths, prRecords, { baseBranch: options.base, currentBranch, currentPr: options.pr });

  console.log('Agent preflight (source-code read-only; refreshes local origin tracking ref)');
  console.log('Repository: ' + repo);
  console.log('Target base: ' + options.base);
  console.log('GitHub base SHA: ' + remoteBaseSha);
  console.log('Local origin/' + options.base + ' SHA: ' + localBaseSha);
  console.log('Branch: ' + currentBranch);
  console.log('HEAD SHA: ' + headSha);
  console.log('Merge base: ' + mergeBase);
  console.log('Branch commits ahead of base: ' + branchAhead + '; base commits not in branch: ' + baseAhead);
  console.log('Open PRs checked: ' + openPullRequests.length);
  console.log('Planned paths:');
  for (const file of plannedPaths) console.log('  - ' + file);

  const blockers = [];
  if (remoteBaseSha !== localBaseSha) blockers.push('Local base ref does not match GitHub base SHA; refresh/retry before editing.');
  if (baseAhead > 0 && !options.allowStaleBase) {
    blockers.push('Task branch is behind ' + options.base + ' by ' + baseAhead + ' commit(s). Update/rebase before editing, or obtain explicit authorization to proceed stale.');
  }
  if (overlaps.length > 0) {
    console.log('Exact path overlap found with ' + overlaps.length + ' open PR(s):');
    for (const entry of overlaps) {
      const pr = entry.pullRequest;
      console.log('  - PR #' + pr.number + ' [' + (pr.draft ? 'draft' : 'open') + '] ' + pr.title);
      console.log('    head: ' + (pr.head ? pr.head.sha : '(unknown)'));
      for (const file of entry.paths) console.log('    shared: ' + file);
    }
    if (!options.allowOverlap) {
      blockers.push('Planned paths overlap open PRs. Stop before editing and coordinate ownership/merge order; --allow-overlap is only for explicit user-authorized exceptions.');
    } else {
      console.log('WARNING: overlap override supplied; verify explicit user authorization is recorded.');
    }
  } else {
    console.log('No exact changed-path overlaps found. This does not rule out semantic/API/deployment dependencies.');
  }

  if (blockers.length > 0) {
    console.error('\nPREFLIGHT BLOCKED:');
    for (const blocker of blockers) console.error('- ' + blocker);
    process.exitCode = 2;
    return;
  }
  console.log('\nPREFLIGHT PASSED: continue only within the declared paths and project rules.');
}

main().catch((error) => {
  console.error('PREFLIGHT ERROR: ' + error.message);
  console.error(usage);
  process.exitCode = 2;
});
