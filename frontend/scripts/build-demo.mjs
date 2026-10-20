import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('..', import.meta.url))
const env = { ...process.env, GITHUB_PAGES: 'true', VITE_DEMO_MODE: 'true' }
for (const args of [['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-demo'], ['scripts/prerender-public.mjs', 'dist-demo']]) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
