# SEC-04：bcrypt cost 6 / 7 / 8 基准与生产评估边界

日期：2026-10-21，Asia/Shanghai。**当前受令牌保护的基准 Worker 已通过最新本地 CI，精确 run、artifact、源码 SHA 与结果见下文。Cloudflare production 的 bcrypt 调用级 CPU 仍未测；生产 cost 保持 6。历史 Windows 数据只作为旧基线，不与当前 CI 运行时直接比较。**

## 隔离 Cloudflare Worker：部署前置条件

本工作流**不会**由 push、pull request 或普通 CI 自动触发。可在 PR 分支 `final-audit` 上手动触发 `.github/workflows/sec04-bcrypt-isolated.yml`，输入精确确认字符串 `DEPLOY-ISOLATED-BCRYPT`；它只部署独立的 `buaa-hep-bcrypt-benchmark` Worker。工作流使用 GitHub Environment `sec04-benchmark`。建议先在仓库 Settings → Environments 中创建该环境并配置 required reviewer，再添加以下 secrets/variables。

Environment secrets（不要提交到仓库或放入命令行参数）：
- `CLOUDFLARE_API_TOKEN`：仅授予部署该 Worker 所需权限的 Cloudflare API token。
- `CLOUDFLARE_ACCOUNT_ID`：目标 Cloudflare 账户 ID。
- `BENCHMARK_TOKEN`：至少 32 字符的随机高熵 token；不得复用账户/API token。
Environment variable：
- `CLOUDFLARE_ACCOUNT_SUBDOMAIN`：该账户的 workers.dev 子域名标签。

工作流只使用 `frontend/benchmarks/bcrypt/wrangler.jsonc`，不执行 Pages 部署、不绑定生产 D1/R2、不接入生产认证路由。它先部署 Worker，再设置 `BENCHMARK_TOKEN`，然后以真实 POST 请求验证两项条件：缺少 token 时返回 404；携带正确 token 的 `control` 请求返回 200，且响应字段与 `Cache-Control: no-store` 均符合契约。正对照失败时不得开始 pilot。若环境变量/secrets 未配置，工作流会失败关闭。部署前须在 Cloudflare dashboard 核实账户套餐和 CPU 限额。

认证权限注意：此工作流使用 `wrangler secret put BENCHMARK_TOKEN` 设置 **Worker 脚本级 secret**，配置中没有 Cloudflare Secrets Store binding，因此不应仅为这条流程额外授予 account-level Secrets Store 写权限。对于首次创建的新 Worker，Cloudflare 当前授权文档要求 Workers 产品级 Admin；为避免给自动化 Token 过宽权限，可先在 Dashboard 中创建名为 `buaa-hep-bcrypt-benchmark` 的空 Worker，再创建仅对该 Worker 具有 Editor 权限的 API Token。该 Token 可部署现有 Worker 并设置其脚本 secret。Wrangler 的 OAuth 登录不支持细粒度授权；优先在部署环境使用受限的 account-owned API Token。

部署后在 Workers Free 的 10 ms CPU 限额下，必须按 cost 分组执行 pilot：每个 cost 单独 16 个请求（8 个输入/操作组合 × 1 次预热 + 1 次测量）。先测 cost 6，再分别测 cost 7 和 cost 8。保留所有失败，不自动启动完整扫描；cost 7/8 的 CPU 超限是待测结果，不应因预期超限而循环重试。PowerShell 下使用前文 SecureString 方式设置本地 `BENCHMARK_TOKEN`，再运行：

先运行 cost 6（16 个请求：8 个预热 + 8 个测量）：

```powershell
node frontend/benchmarks/bcrypt/run.mjs --runtime cloudflare --cost 6 --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 1 --warmup 1 --out cloudflare-cost-6.json
```

检查报告和调用级 CPU 日志后，才单独运行 cost 7：

```powershell
node frontend/benchmarks/bcrypt/run.mjs --runtime cloudflare --cost 7 --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 1 --warmup 1 --out cloudflare-cost-7.json
```

再检查 cost 7 的报告，决定是否单独运行 cost 8：

```powershell
node frontend/benchmarks/bcrypt/run.mjs --runtime cloudflare --cost 8 --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 1 --warmup 1 --out cloudflare-cost-8.json
```

The runner writes every attempted row even on failure, stores a bounded HTTP response excerpt (for example, Error 1102), and classifies failures as `cpu-limit`, `timeout`, `network-error`, `http-server-error`, `http-client-error`, or `benchmark-error`. A non-zero exit code means inspect and preserve the report; it does not mean discard it.

将 `ACCOUNT` 替换为实际 workers.dev 子域名。每条命令单独运行并检查对应 JSON 与 Workers Logs；不要把三条命令一次性粘贴执行。cost 6 无失败且能关联调用级 CPU 后，再决定是否测试 cost 7；cost 7 报告核查后，再决定是否测试 cost 8。CPU 超限本身应保留为结果，不能循环重试。完整登录/注册/改密的非生产路径测试仍是独立未决项。

## 可复现方法

在仓库根目录执行，使用现有 lockfile，不升级依赖：

```sh
npm --prefix frontend ci
node frontend/benchmarks/bcrypt/run.mjs --runtime node --samples 50 --warmup 5 --out node-benchmark.json
node frontend/benchmarks/bcrypt/run.mjs --runtime workerd --samples 50 --warmup 5 --out workerd-benchmark.json
```

当前 runner 在每个环境测量 3 个 cost × 2 种输入字节数 × 4 种操作 × 50 个有效样本 = **1200 个测量样本**；每格另有 5 次预热，共 120 次。四种操作为受保护的 `control`（经过相同 Worker 参数校验、日志和 JSON 响应路径，但不执行 bcrypt）、`bcrypt.hash`（包含盐生成）、正确密码 `compare` 和错误密码 `compare`。单并发、每轮轮换 cost 起点，减少先后顺序偏差。固定公开 ASCII 合成输入为 12 / 72 UTF-8 字节；错误密码修改首字节，避免 72 字节截断造成伪匹配。比较使用公开固定盐生成的测试 fixture，不访问真实密码或账号。重建 fixture：`node frontend/benchmarks/bcrypt/generate-fixtures.mjs`；不应用到生产账号。下方历史表格是早期三操作数据（900 个测量、90 次预热、18 个分组），不能误认为包含新加入的 `control`；当前候选应以最终 CI artifact 为准。

原始记录包含所有预热和测量行、失败、UTC 时间、源码和 lockfile SHA-256、基础 revision、CPU/OS、依赖版本。源码当时尚未提交，基础 revision 为 `94c54853d733565605a27eec032f7e9faf55ae83`，应结合源码 SHA-256 重现。分位数仅计算成功测量，失败数量独立呈现；任一预热或测量失败时脚本非零退出，不丢弃失败。

环境：Windows `10.0.26300 x64`；AMD Ryzen 7 9800X3D（16 逻辑 CPU）；Node `v24.20.0`；bcryptjs `3.0.3`；Wrangler `4.131.0`；workerd `1.20260910.1`。workerd 与生产仓库配置同为兼容日期 `2026-09-17`、`nodejs_compat`。这是运行时行为对齐，不是 Cloudflare 硬件、套餐或 CPU 计费等效认证。

## 历史延迟分布（旧基线，仅供参考）

以下是 Windows/AMD 环境的旧三操作数据，单位毫秒；每格 n=50、失败=0。p50/p95/p99 使用 nearest-rank，即排序后第 ceil(p×n) 个值；n=50 时 p99 就是最大值，尾部估计不稳定。完整旧记录见 [Node 原始记录](bcrypt-node.json)、[workerd 原始记录](bcrypt-workerd.json)。**旧 runner 的 Node 路径与 workerd 路径并未完全对齐，且不含 control 组；不要用此表作跨运行时比较或生产预算结论。当前可比较的基准见下方最新 CI 证据。

| 环境 | 字节 | 操作 | cost | p50 | p95 | p99 |
|---|---:|---|---:|---:|---:|---:|
| Node | 12 | hash | 6 | 2.822 | 3.160 | 3.251 |
| Node | 12 | hash | 7 | 5.578 | 6.268 | 6.459 |
| Node | 12 | hash | 8 | 11.160 | 12.136 | 13.079 |
| Node | 12 | compare-match | 6 | 2.798 | 3.243 | 3.596 |
| Node | 12 | compare-match | 7 | 5.555 | 6.400 | 6.809 |
| Node | 12 | compare-match | 8 | 11.150 | 12.236 | 14.093 |
| Node | 12 | compare-mismatch | 6 | 2.800 | 3.303 | 3.379 |
| Node | 12 | compare-mismatch | 7 | 5.557 | 6.212 | 6.637 |
| Node | 12 | compare-mismatch | 8 | 11.138 | 12.414 | 13.501 |
| Node | 72 | hash | 6 | 2.826 | 3.403 | 3.481 |
| Node | 72 | hash | 7 | 5.585 | 6.189 | 6.881 |
| Node | 72 | hash | 8 | 11.161 | 12.008 | 13.337 |
| Node | 72 | compare-match | 6 | 2.802 | 3.347 | 3.412 |
| Node | 72 | compare-match | 7 | 5.573 | 6.574 | 6.662 |
| Node | 72 | compare-match | 8 | 11.139 | 12.411 | 13.383 |
| Node | 72 | compare-mismatch | 6 | 2.804 | 3.243 | 3.761 |
| Node | 72 | compare-mismatch | 7 | 5.578 | 6.167 | 6.594 |
| Node | 72 | compare-mismatch | 8 | 11.109 | 12.576 | 12.724 |
| workerd | 12 | hash | 6 | 4.168 | 4.655 | 4.853 |
| workerd | 12 | hash | 7 | 7.077 | 7.784 | 8.171 |
| workerd | 12 | hash | 8 | 12.948 | 13.755 | 14.412 |
| workerd | 12 | compare-match | 6 | 4.146 | 4.730 | 5.086 |
| workerd | 12 | compare-match | 7 | 7.103 | 7.946 | 8.660 |
| workerd | 12 | compare-match | 8 | 12.890 | 13.673 | 14.434 |
| workerd | 12 | compare-mismatch | 6 | 4.190 | 4.714 | 5.538 |
| workerd | 12 | compare-mismatch | 7 | 7.087 | 8.015 | 8.456 |
| workerd | 12 | compare-mismatch | 8 | 12.929 | 14.120 | 15.807 |
| workerd | 72 | hash | 6 | 4.181 | 4.693 | 5.078 |
| workerd | 72 | hash | 7 | 7.098 | 7.581 | 8.406 |
| workerd | 72 | hash | 8 | 13.057 | 13.698 | 14.338 |
| workerd | 72 | compare-match | 6 | 4.122 | 4.676 | 4.777 |
| workerd | 72 | compare-match | 7 | 7.144 | 7.943 | 8.780 |
| workerd | 72 | compare-match | 8 | 12.998 | 13.546 | 13.767 |
| workerd | 72 | compare-mismatch | 6 | 4.181 | 4.893 | 5.077 |
| workerd | 72 | compare-mismatch | 7 | 7.047 | 7.452 | 7.900 |
| workerd | 72 | compare-mismatch | 8 | 13.014 | 13.718 | 14.639 |

## 当前 PR head 的 CI 与可复核基准证据

- 当前 PR head：`c679a24a4d8d176fe355fe7538cd52d9526ef6eb`。
- [GitHub Actions run 39601665582](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39601665582) 对该 head 的 `validate=success`、`deploy=skipped`；隔离基准未部署，生产站点也未由该 PR run 发布。
- 同一 head 的独立 FastAPI backend regression run [39601665692](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39601665692) 为 `success`。该套件是独立后端测试，不等同于 Pages 生产 bcrypt CPU 验收。
- `bcrypt-local-evidence` artifact ID `12346154108`，包含 `node.json` 与 `workerd.json`。两份记录的 `environment.revision=fcf18a738ffc943d472f3c8f97b0d809271d5b98`，与该 PR run 的合并测试提交一致；每份 1,320 行：1,200 个测量样本、120 次预热、24 个分组、0 次失败。PR head、PR base SHA 与合并测试 revision 是不同概念，必须分别记录。
- 运行环境：Linux x64 GitHub-hosted runner；AMD EPYC 9V74，报告显示 2 个逻辑 CPU；Node v24.21.0、bcryptjs 3.0.3、Wrangler 4.131.0、workerd 1.20260910.1；兼容日期 `2026-09-17`、`nodejs_compat`。
- 该 artifact 的 cost 6、12-byte 样本（n=50，单位 ms）：
  
  | Runtime | Operation | wall p50 | wall p95 | Node process CPU p50 |
  |---|---|---:|---:|---:|
  | Node | control | 0.096 | 0.200 | 0.098 |
  | Node | hash | 5.442 | 5.804 | 5.445 |
  | Node | compare-match | 5.346 | 5.603 | 5.341 |
  | Node | compare-mismatch | 5.342 | 5.655 | 5.345 |
  | workerd | control | 2.094 | 3.271 | 不适用 |
  | workerd | hash | 7.788 | 9.478 | 不适用 |
  | workerd | compare-match | 7.627 | 10.511 | 不适用 |
  | workerd | compare-mismatch | 7.658 | 9.319 | 不适用 |

  Node CPU 是本地 Node 进程级计数；workerd 数值是调用端包围 `dispatchFetch` 的 wall time。两者都不是 Cloudflare 线上 invocation CPU。control 与 bcrypt 组的差值只用于说明本地同路径的增量工作量，不能直接换算为生产 CPU 预算。
- 本地 CI 证据只证明该 SHA 上基准与安全回归能够运行，**不证明 Cloudflare 生产套餐/CPU 限额、隔离 Worker 调用级 CPU 或完整认证路径已经验收**。生产 bcrypt cost 继续保持 6，SEC-04 继续开放。

### 当前 Pages 认证路径盘点

检查当前部署所用的 Pages Functions 路由，确认以下 bcrypt 路径：

- POST /auth/login：对存量用户的 hashed_password 执行 bcrypt.compare；cost 取决于该用户现有哈希。
- POST /auth/register：校验密码与邀请码、查询邮箱后执行 bcrypt.hash(password, 6)，随后写入 D1 并处理关联记录。
- PUT /account/credentials：先对 current_password 执行 bcrypt.compare；如果提交 new_password，则校验后执行 bcrypt.hash(new_password, 6)，更新邮箱/哈希/token_version 并签发新 token。该路径使用 protectAuthAttempts('credentials')。
- 管理员 POST /auth/members：执行 bcrypt.hash(password, 6) 后创建账号。
- `frontend/functions/api/routes/system.ts` 的首次 `POST /setup`：只有在系统尚无用户且 `SETUP_TOKEN` 有效时，才对首个管理员密码执行 `bcrypt.hash(..., 6)`；这是一次性初始化路径，不属于日常登录，但属于完整的源码调用点清单。

frontend/tests/security.test.ts 已有基于 SQLite 的 D1 适配器测试，覆盖凭据更新、token_version 失效和认证限速等功能；这些是功能/安全回归，不是 Cloudflare CPU 基准，也不等于生产完整路径的 CPU 验收。旧 FastAPI backend 使用独立的 Python bcrypt 实现，未包含在当前 Pages 发布工作流中；除非有独立生产部署证据，不应将它与 Pages 运行数据混合。

当前 Worker 基准不包含 D1、JWT、邀请码或真实认证中间件。因此 control 差值只能估计隔离基准 Worker 内 bcrypt 的增量成本，不能代替完整认证路由测量。

## 局限与决策

- Node 使用调用端高精度单调时钟；附带的 `process.cpuUsage` 是 Node 进程 user+system CPU。旧 Windows 记录的单次 CPU 分辨率不足；当前 Linux CI 记录虽包含每次操作的 CPU 计数，但仍受进程级计量、调度与输出开销影响，不能代替 Worker CPU。
- workerd 使用调用端 `hrtime` 包围 `dispatchFetch` 和响应解析，包含本地调度、IPC、序列化及运行开销；并非哈希纯 CPU。真实 Cloudflare 模式测的是网络 RTT，不能把它写成生产 CPU。
- 不在 Worker 内用 `Date.now()` / `performance.now()` 测纯计算：线上计时器只随 I/O 推进，可能得到 0。参见 [Cloudflare timers](https://developers.cloudflare.com/workers/runtime-apis/performance/)。
- 2026-10-20 的 Cloudflare Pages production dashboard 快照记录了过去 24h 聚合 CPU 数据（早于 main 部署 run 39529826480）：2,058 次成功 invocation、0 错误、25 子请求、0 CPU 超限；CPU P50 2.209 ms、P75 2.854 ms、P99 11.222 ms、P99.9 23.375 ms。此数据包含该 Pages 项目的所有 Functions 调用，未按路由、操作、cost 分类；样本数是总 invocation 数，不是每个分位数对应的 bcrypt 样本量。不能把聚合 P99 当成 cost 6，也不能把它用于预测 cost 7/8。
- 未测生产套餐、CPU 限额、Cloudflare 硬件/地区、冷启动、并发、D1 延迟及完整登录/注册/改密路径。每环境仅单次批次，不能推断真实用户分布或 CPU 额度余量；CI 测量同样只提供当地 runner 的结果。
- Cloudflare 官方 [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) 文档列出 Workers Free 每次 HTTP 请求 10 ms CPU 限额；Workers Paid 默认 30 秒，可按配置提高，最高 5 分钟。Pages Functions 计费按 Workers 规则处理（见 [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)）。本项目实际账户套餐与该 Worker 的有效限额尚未核实。若实际使用 Free 计划，cost 7/8 的线上基准可能出现 CPU 超限；应将超限记录为测量结果，不反复重试，也不能据本地 wall time 推断。
- Node 单次 CPU 和本地 workerd 耗时均不能证明 cost 6/7/8 满足生产预算。**不据此调高生产 cost，也不宣称当前 cost 已经通过生产成本评估。** 成本强度与 CPU 预算之间的最终取舍需维护者依据生产等效数据记录批准理由。

## 可追溯的基准与 CI 证据

- 历史 `bcrypt-node.json` 与 `bcrypt-workerd.json` 已独立检查：每份 990 行（900 个测量、90 次预热）、18 个分组、0 次失败；两份记录均标注基础 revision `94c54853d733565605a27eec032f7e9faf55ae83` 与当时的源码 SHA-256。这些是旧实现的历史基线，不是受令牌保护版本的复测。
- 历史候选 SHA `2e2a04efb15ade4cb57ccc9148bac2594fea61ff` 的 [GitHub Actions run 39532692792](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39532692792) 已通过 `validate`，并生成 `bcrypt-local-evidence` artifact（artifact ID `12316376269`）；该候选证据已被后续提交取代，不作为当前验收依据。PR 运行中的 `deploy` job 按预期跳过，没有生产发布。
- **SHA 口径：** PR 的 `head_sha` 是分支提交；GitHub Actions 的 `pull_request` 工作流通常检出 PR 合并测试引用，因此 artifact 内的 `environment.revision` 可能是合并测试提交，而不是分支 `head_sha`。验收时必须同时记录 PR head SHA、base SHA、Actions run URL 和 artifact 内 revision；不能把这几个 SHA 混为一谈。
- 更早的中间候选 `5c8a0ccebaaffdc4fdb27c5e49a5f19b54992689` 曾因运行器分支语法错误而失败；错误已修复，旧失败记录保留。后续任何代码/文档更新都会改变 PR head，合并门槛必须以最终 head 的 CI 与 artifact 为准，不能沿用上述中间候选的绿灯。

## 在 Cloudflare 环境补完（需维护者明确批准；本次未上传或部署）

独立工具位于 `frontend/benchmarks/bcrypt/`，不进入 `frontend/functions`，不绑定 D1/R2，不访问生产 API、账号或密码。CI 仅在 GitHub Actions runner 的 Node 与本地 workerd/Miniflare 中运行基准，并上传 `bcrypt-local-evidence` artifact；**CI 不会部署该 Worker**。

### 访问控制与安全边界

`workers.dev` 默认是公开入口，因此 Worker 在运行 bcrypt 前必须检查绑定的 `BENCHMARK_TOKEN`（至少 32 个字符）。缺少 secret 时 fail closed 并返回 404。由于 Cloudflare 实时请求日志包含请求头字段，runner 不通过 `Authorization` 头发送静态令牌，而改为 HTTPS POST 的受限 JSON 请求体（最大 1 KiB）。URL 只包含非秘密的 `sampleId`，用于把 invocation CPU 日志与结构化自定义日志关联；Worker 拒绝其他查询参数，并只记录白名单中的 sampleId、cost、bytes、operation 和事件类型，不记录令牌或原始请求体。Token 不得写入仓库、命令行参数、URL、日志或基准报告。隔离 pilot 还必须实际抽查平台日志，确认没有请求体/令牌泄露；若观察到泄露，停止扫描并重新设计。测试 Worker 不得绑定生产 D1/R2，也不得与 Pages Functions 合并。部署前先确认目标 Worker 名称、账号、套餐/CPU 限额及可能费用；测试结束后删除临时 Worker 与本地 token。

### 由维护者批准后执行的独立 Worker 流程

以下步骤会创建/修改 Cloudflare 资源，**本次未执行**。只在隔离 Worker 目标与成本得到确认后执行：

```powershell
cd frontend
node node_modules/wrangler/bin/wrangler.js deploy --config benchmarks/bcrypt/wrangler.jsonc
node node_modules/wrangler/bin/wrangler.js secret put BENCHMARK_TOKEN --config benchmarks/bcrypt/wrangler.jsonc
```

为 `BENCHMARK_TOKEN` 生成至少 32 字符的随机值，在 Wrangler 的交互提示中设置为 Worker secret；不要将其提交到 Git。然后在 PowerShell 中安全输入同一个 token（输入不会回显）并运行：

```powershell
$secure = Read-Host "Enter BENCHMARK_TOKEN" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:BENCHMARK_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
try {
  node benchmarks/bcrypt/run.mjs --runtime cloudflare --cost 6 --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 1 --warmup 1 --out cloudflare-cost-6.json
  if ($LASTEXITCODE -ne 0) { throw "Cost-6 pilot recorded failures; preserve cloudflare-cost-6.json and stop for review." }
} finally {
  Remove-Item Env:BENCHMARK_TOKEN -ErrorAction SilentlyContinue
  $secure.Dispose()
}
```

Only after reviewing cost 6's report and invocation CPU logs, repeat the same SecureString setup for cost 7 with output `cloudflare-cost-7.json`; review that evidence before separately deciding whether to run cost 8 with output `cloudflare-cost-8.json`. For cost 7/8, a non-zero exit caused by confirmed CPU-limit outcomes is retained evidence, not a reason to retry. Other failure classes remain blockers.

将 `ACCOUNT` 替换为 Cloudflare 返回的实际账户子域。

Workers Free 下不以 cost 7/8 零失败作为继续条件：cost 6 必须无失败；cost 7/8 的 CPU 超限可作为预期的边界证据，但必须确认失败类别确实为 CPU 超限而非鉴权、网络或代码错误。只有在每组报告均已审阅、Cloudflare invocation log 能按 sample ID 关联 CPU、且已确认套餐/限额后，才由维护者单独批准是否进行更大样本扫描。重新安全输入 token（使用上面的 SecureString 模式），再运行：

```powershell
# Only after explicit review/approval; run one cost per invocation.
node benchmarks/bcrypt/run.mjs --runtime cloudflare --cost 6 --samples 50 --warmup 5 --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --out cloudflare-cost-6-full.json
# Separate runs for cost 7 and cost 8 must each have a separate report and review.
```

Cloudflare 模式必须显式指定单个 `--cost 6|7|8`，以防不同 cost 混在一个结果中。每个 pilot 为 16 次请求；若某次请求触发 CPU 超限，脚本仍继续收集剩余样本、保存失败行与分组摘要，并以非零退出码结束。完整扫描每个 cost 400 次测量 + 40 次预热，三个 cost 合计 1,320 次请求；Free 套餐下不应默认执行完整扫描。
只使用自己创建并确认所有权的 Worker URL；URL 限制只是防止误用，不是对域名所有权的认证。runner 通过 HTTPS POST 的受限 JSON 请求体传递 token，不把它放入 URL、请求头或输出报告；URL 中只保留非秘密 sample ID，以关联 invocation CPU 与结构化日志。Worker 日志仅写出白名单元数据。命令返回的 wall/RTT 包含网络开销，**不能直接当作 Worker CPU**。

Cloudflare invocation CPU 是整个 Worker 请求的 CPU 总量，包含 URL/令牌校验、bcrypt、日志与 JSON 响应开销，不是纯 bcrypt 指令时间。若要估计哈希的增量成本，应同时测量相同 Worker 的受保护 no-op/control 基线；否则把结果明确标记为“每次基准 invocation CPU”，不要称作纯 bcrypt CPU。

### CPU 证据验收

在 [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) 中搜索自定义日志消息里的 `bcrypt-v1` 或具体 sample ID，再按同一请求 URL 的 sample 查询参数关联 invocation log。代码在 bcrypt 之前通过 `console.log({...})` 输出结构化 JSON 对象，包含 `benchmark`、`sampleId`、`cost`、`bytes`、`operation` 与 `event`；Workers Logs 会索引这些字段。即使请求因 CPU 限额被中断，也有机会保留关联标记。Cloudflare 会在 invocation log 中提供 CPU 与 wall time；可用 [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) 的 `$workers.cpuTimeMs` 和 `$workers.wallTimeMs` 字段核验。总览见 [CPU Time per execution](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。按 cost、输入字节数、操作分组；排除 warmup，但保留失败、资源超限和缺失样本数。不能将混合 cost 的总分位数当成单一 cost 的结果。若日志无法与调用级 CPU 关联，继续标记“Cloudflare CPU 未测”，不得用 RTT 代替。

验收记录至少包含：cost、操作、输入字节数、n、失败/缺失数、CPU min/p50/p95/p99/max、wall/RTT 分布、套餐/限额、Worker 版本、地区、日志采样率与时间窗口。还需在隔离的非生产认证应用中测完整登录/注册/改密路径和限速开销，评估资源余量并记录维护者的参数选择理由。**Node/workerd 微基准成功不代表生产成本评估完成。**

历史原始 JSON 保留当时的源码 SHA、基础 revision 和运行环境；它们是基线，不应冒充当前受令牌保护的 Worker 版本的复测。合并前须检查本 PR 精确 SHA 的 CI 和新生成的 `bcrypt-local-evidence` artifact。没有 Cloudflare 调用级 CPU 证据前，不提高生产 bcrypt cost。
