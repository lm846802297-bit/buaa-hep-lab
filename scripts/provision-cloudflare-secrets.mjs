// Run only once for a new deployment. The signing key never touches disk.
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, '.deploy-local/setup-code.txt');
if (existsSync(target)) throw new Error('An initialization code already exists. Do not rotate production credentials accidentally.');
const secret = randomBytes(48).toString('base64url');
const setupToken = randomBytes(24).toString('base64url');
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages', 'secret', 'bulk', '--project-name', 'buaa-hep-hub'], {
  cwd: resolve(root, 'frontend'), input: JSON.stringify({ JWT_SECRET: secret, SETUP_TOKEN: setupToken }), encoding: 'utf8',
  env: process.env,
});
const redact = value => (value || '').replaceAll(secret, '[redacted]').replaceAll(setupToken, '[redacted]');
if (result.status !== 0) throw new Error(redact(result.stdout) + redact(result.stderr));
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `课题组网站首次初始化码（请勿转发）\n\n${setupToken}\n\n打开 https://buaa-hep-hub.pages.dev/setup ，在“部署初始化码”中填写此码，随后自行设定管理员账号、密码与组内邀请码。\n此文件不在源码压缩包中。完成初始化后，该码不能再创建管理员。\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
console.log(redact(result.stdout));
console.log('Cloud secrets configured. Initialization code saved to the ignored local-only setup-code file.');
