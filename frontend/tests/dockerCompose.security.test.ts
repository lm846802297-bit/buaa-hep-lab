import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const composeFile = resolve(repoRoot, 'deploy/docker-compose.yml');
const tempDir = mkdtempSync(join(tmpdir(), 'labhub-compose-security-'));
const emptyEnvFile = join(tempDir, 'empty.env');
writeFileSync(emptyEnvFile, '');

const dockerAvailable = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' }).status === 0;
// Cloudflare Pages sets CI=true but does not provide Docker. Keep this integration check
// skippable there; require Docker in GitHub Actions, where the repository CI validates it.
if ((process.env.GITHUB_ACTIONS === 'true' || process.env.REQUIRE_DOCKER_COMPOSE === 'true') && !dockerAvailable) {
  throw new Error('Docker Compose must be available in Docker-enabled CI to verify the self-hosted deployment contract.');
}

afterAll(() => rmSync(tempDir, { recursive: true, force: true }));

function validateCompose(env: NodeJS.ProcessEnv) {
  return spawnSync(
    'docker',
    ['compose', '--env-file', emptyEnvFile, '-f', composeFile, 'config', '--quiet'],
    { cwd: repoRoot, env, encoding: 'utf8' },
  );
}

describe.skipIf(!dockerAvailable)('self-hosted Docker Compose secret contract', () => {
  it('fails closed when required secret values are absent', () => {
    const env = { ...process.env };
    delete env.LABHUB_SECRET_KEY;
    delete env.LABHUB_INVITE_CODE;
    const result = validateCompose(env);
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}\n${result.stdout}`).toMatch(/LABHUB_(SECRET_KEY|INVITE_CODE)/);
  });

  it('accepts explicit CI-only secret values without printing the resolved configuration', () => {
    const env = {
      ...process.env,
      LABHUB_SECRET_KEY: 'ci-only-secret-value-32-characters-minimum',
      LABHUB_INVITE_CODE: 'CI-ONLY-INVITE-2026',
    };
    const result = validateCompose(env);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });
});
