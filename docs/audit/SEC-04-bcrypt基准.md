# SEC-04：bcrypt cost 6 / 7 / 8 基准与生产评估边界

日期：2026-10-21，Asia/Shanghai。**当前受令牌保护的基准 Worker 已通过最新本地 CI，精确 run、artifact、源码 SHA 与结果见下文。Cloudflare production 的 bcrypt 调用级 CPU 仍未测；生产 cost 保持 6。历史 Windows 数据只作为旧基线，不与当前 CI 运行时直接比较。**

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

- 当前 PR head：`d176b77bb0301bfbad435354d83e9c4c750c4b86`。
- PR 的 GitHub 元数据 base SHA 仍返回旧值 `fb287b4fac1a7c45e02ee3d1e276ebdabf476269`；本次 run 的实际合并测试提交为 `045a2a8a41dc8a3bb6afb4ba9efb69e9e6fc1b5e`，其父提交分别是当时的 `main=596ad2de8fbd2f133d93a44a2332245393df85cf` 与上述 PR head。三者必须分开记录，不能把 artifact revision 当作 PR head。
- [GitHub Actions run 39542043131](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39542043131) 已完成：`validate=success`、`deploy=skipped`。隔离 Worker 的 Wrangler `--dry-run`、安全回归、构建、浏览器检查和本地基准均通过；没有部署 Cloudflare Worker 或生产站点。
- `bcrypt-local-evidence` artifact ID `12320285738`，包含 `node.json` 与 `workerd.json`。两份记录的 `environment.revision=045a2a8a41dc8a3bb6afb4ba9efb69e9e6fc1b5e`，与该 run 的合并测试提交一致；每份 1,320 行：1,200 个测量样本、120 次预热、24 个分组、0 次失败。
- 运行环境：Linux x64（GitHub-hosted runner）；AMD EPYC 9V74 80-Core Processor，报告显示 2 个逻辑 CPU；Node v24.21.0、bcryptjs 3.0.3、Wrangler 4.131.0、workerd 1.20260910.1；compatibility date `2026-09-17`，`nodejs_compat`。
- 源码 SHA-256（UTF-8，换行统一为 LF）：`core.mjs` = `ed47f24cc7b024cc2864b76920644329993a0a0582fd2579a3fb639477e1f774`；`fixtures.json` = `ac02d2fd5379fc83260564c0cbdffacc43dc914d32a73917b5e9519fcd1d3cf5`；`worker.mjs` = `622be8816fdb6600121db1f7eef5067212c8240543027692adaaf0d1842d5461`；`run.mjs` = `2b42e0cc4a9a44619cf7952d6c40b93500876bd1e578e0a5e5c0e9d7543dabe1`；`wrangler.jsonc` = `469258fa7de68b56e464e4e1a0821bd3479673f36905f2f97e5601819ee48e5b`；`frontend/package-lock.json` = `6343f35eeaecf50c73e99bd56ec19e5dcfd16dc68c88a2fb0a501099ba6e44f8`。

下表均来自上述 artifact。每组 n=50；每格按“12 字节输入 p50/p95；72 字节输入 p50/p95”列出，单位 ms。n=50 时 p95 估计仍有限，不能把它当作稳定的生产尾延迟。

| Runtime | 操作 | cost 6：12B；72B | cost 7：12B；72B | cost 8：12B；72B |
|---|---|---:|---:|---:|
| Node | control wall | 0.092/0.162；0.096/0.176 | 0.101/0.177；0.088/0.155 | 0.090/0.166；0.087/0.155 |
| Node | hash wall | 4.876/5.359；4.867/5.561 | 9.279/9.708；9.293/10.295 | 18.219/20.160；18.125/18.415 |
| Node | compare-match wall | 4.794/5.041；4.804/5.124 | 9.207/10.324；9.211/9.616 | 18.095/18.701；18.120/18.611 |
| Node | compare-mismatch wall | 4.785/4.998；4.790/5.092 | 9.213/9.754；9.213/9.493 | 18.120/18.429；18.098/18.309 |
| workerd | control wall | 1.258/2.196；1.270/3.025 | 1.241/3.061；1.275/2.481 | 1.244/2.890；1.257/3.767 |
| workerd | hash wall | 6.142/8.140；6.086/7.471 | 10.677/13.176；10.714/14.372 | 20.009/24.359；19.822/24.785 |
| workerd | compare-match wall | 6.095/7.982；6.116/7.704 | 10.728/13.088；10.582/13.564 | 20.227/24.144；19.831/24.109 |
| workerd | compare-mismatch wall | 6.315/7.850；6.113/8.253 | 10.714/13.872；10.719/13.888 | 19.680/24.144；19.965/24.499 |

Node 的 `process.cpuUsage` p50 与 wall 近似：hash cost 6/7/8 分别约为 4.87/9.30/18.18 ms；control 约为 0.09–0.10 ms。这是 CI Node 进程的 CPU 计数，不是 Cloudflare Worker CPU。workerd 数据测的是调用端包围 `dispatchFetch` 的 wall time，包含调度、IPC、序列化与响应解析；不能把它当成纯计算 CPU。此组数据可说明在该 runner 上 cost 增大显著增加本地计算工作量，但不能证明 Cloudflare CPU 预算充足，也不能据此提高生产 cost。

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
  node benchmarks/bcrypt/run.mjs --runtime cloudflare --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 1 --warmup 1 --out cloudflare-pilot.json
  if ($LASTEXITCODE -ne 0) { throw "Pilot recorded failures; inspect cloudflare-pilot.json and stop before a full run." }
} finally {
  Remove-Item Env:BENCHMARK_TOKEN -ErrorAction SilentlyContinue
  if ($secure) { $secure.Dispose() }
}
```

将 `ACCOUNT` 替换为 Cloudflare 返回的实际账户子域。

只有在 pilot 的 48 个请求均无失败、Cloudflare invocation log 能按 sample ID 关联 CPU、且已确认套餐/限额后，才执行完整扫描。重新安全输入 token（使用上面的 SecureString 模式），再运行：

```powershell
try {
  node benchmarks/bcrypt/run.mjs --runtime cloudflare --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 50 --warmup 5 --out cloudflare-benchmark.json
  if ($LASTEXITCODE -ne 0) { throw "Full run recorded failures; preserve the JSON and investigate rather than retrying blindly." }
} finally {
  Remove-Item Env:BENCHMARK_TOKEN -ErrorAction SilentlyContinue
  if ($secure) { $secure.Dispose() }
}
```

Cloudflare 默认参数现为 pilot（1 次测量 + 1 次预热）；完整模式必须显式指定 `--samples 50 --warmup 5`。完整模式总计 1,320 次请求，若 Free CPU 限额导致 cost 7/8 超限，应保留失败证据并停止，不要循环重试。
只使用自己创建并确认所有权的 Worker URL；URL 限制只是防止误用，不是对域名所有权的认证。runner 通过 HTTPS POST 的受限 JSON 请求体传递 token，不把它放入 URL、请求头或输出报告；URL 中只保留非秘密 sample ID，以关联 invocation CPU 与结构化日志。Worker 日志仅写出白名单元数据。命令返回的 wall/RTT 包含网络开销，**不能直接当作 Worker CPU**。

Cloudflare invocation CPU 是整个 Worker 请求的 CPU 总量，包含 URL/令牌校验、bcrypt、日志与 JSON 响应开销，不是纯 bcrypt 指令时间。若要估计哈希的增量成本，应同时测量相同 Worker 的受保护 no-op/control 基线；否则把结果明确标记为“每次基准 invocation CPU”，不要称作纯 bcrypt CPU。

### CPU 证据验收

在 [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) 中搜索自定义日志消息里的 `bcrypt-v1` 或具体 sample ID，再按同一请求 URL 的 sample 查询参数关联 invocation log。代码在 bcrypt 之前通过 `console.log({...})` 输出结构化 JSON 对象，包含 `benchmark`、`sampleId`、`cost`、`bytes`、`operation` 与 `event`；Workers Logs 会索引这些字段。即使请求因 CPU 限额被中断，也有机会保留关联标记。Cloudflare 会在 invocation log 中提供 CPU 与 wall time；可用 [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) 的 `$workers.cpuTimeMs` 和 `$workers.wallTimeMs` 字段核验。总览见 [CPU Time per execution](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。按 cost、输入字节数、操作分组；排除 warmup，但保留失败、资源超限和缺失样本数。不能将混合 cost 的总分位数当成单一 cost 的结果。若日志无法与调用级 CPU 关联，继续标记“Cloudflare CPU 未测”，不得用 RTT 代替。

验收记录至少包含：cost、操作、输入字节数、n、失败/缺失数、CPU min/p50/p95/p99/max、wall/RTT 分布、套餐/限额、Worker 版本、地区、日志采样率与时间窗口。还需在隔离的非生产认证应用中测完整登录/注册/改密路径和限速开销，评估资源余量并记录维护者的参数选择理由。**Node/workerd 微基准成功不代表生产成本评估完成。**

历史原始 JSON 保留当时的源码 SHA、基础 revision 和运行环境；它们是基线，不应冒充当前受令牌保护的 Worker 版本的复测。合并前须检查本 PR 精确 SHA 的 CI 和新生成的 `bcrypt-local-evidence` artifact。没有 Cloudflare 调用级 CPU 证据前，不提高生产 bcrypt cost。
