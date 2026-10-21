# SEC-04：bcrypt cost 6 / 7 / 8 基准与生产评估边界

日期：2026-10-21，Asia/Shanghai。**历史 Node/workerd 基准已完成，但其原始记录对应旧的基准 Worker 源码；本 PR 增加了 fail-closed 的访问令牌检查，CI 会在当前精确 SHA 上重新运行本地基准并上传证据。Cloudflare production 的 bcrypt 调用级 CPU 仍未测；生产 cost 保持 6。**

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

## 当前候选的最新 CI 基准证据（2026-10-21）

- 测量代码的 PR head：9d5cecf4a88d5828df9195496e31278503467ee9；base：fb287b4fac1a7c45e02ee3d1e276ebdabf476269。
- [GitHub Actions run 39539229688](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39539229688) 已完成：validate=success，deploy=skipped。本次没有发布生产。
- Artifact：bcrypt-local-evidence，ID 12319400215（从上述 Actions run 页面下载）。包含 node.json 与 workerd.json；每份均有 1,320 行：1,200 个测量样本、120 次预热、24 个分组、0 次失败。
- 两份报告的 environment.revision 均为 53520ed3b4d8a8131028d83fb430139c00c40625，是 base 与测量 head 的合并测试提交（父提交分别为 fb287b4fac1a7c45e02ee3d1e276ebdabf476269 与 9d5cecf4a88d5828df9195496e31278503467ee9），不是分支 head。
- 当前 CI runner：Linux x64、AMD EPYC 9V74、2 个逻辑 CPU、Node v24.22.0、bcryptjs 3.0.3、Wrangler 4.131.0、workerd 1.20260910.1；兼容日期 2026-09-17，nodejs_compat。
- 源码 SHA-256（UTF-8 文本，换行统一为 LF）：core.mjs=b0b19fba7291113af1d48177c4dca7341d67089d8e574e4278779c814bd116b1；fixtures.json=ac02d2fd5379fc83260564c0cbdffacc43dc914d32a73917b5e9519fcd1d3cf5；worker.mjs=5b219eb244c8f0cebd46d8167f568159dce6c9d82d266c71df4b9c1e793186db；run.mjs=0b09542bdccbdaf8ce36437d659ca81b4c659301cffdecb786833382767b33cb；wrangler.jsonc=469258fa7de68b56e464e4e1a0821bd3479673f36905f2f97e5601819ee48e5b；frontend/package-lock.json=6343f35eeaecf50c73e99bd56ec19e5dcfd16dc68c88a2fb0a501099ba6e44f8。

下表来自当前已通过的 CI artifact。每个分组 n=50；每个 cost 单元按“12 字节输入 p50/p95；72 字节输入 p50/p95”列出，单位 ms。p99 没有列出，因为 n=50 时 nearest-rank p99 就等于最大值，尾部估计不稳定。

| Runtime | 操作 | cost 6：12B；72B | cost 7：12B；72B | cost 8：12B；72B |
|---|---|---:|---:|---:|
| Node | control | 0.064/0.155；0.077/0.206 | 0.075/0.187；0.071/0.179 | 0.063/0.158；0.070/0.153 |
| Node | hash | 4.845/5.203；4.868/6.080 | 9.276/9.612；9.312/10.848 | 18.192/18.689；18.250/19.322 |
| Node | compare-match | 4.802/5.409；4.773/5.331 | 9.242/10.692；9.223/10.988 | 18.204/19.329；18.129/18.729 |
| Node | compare-mismatch | 4.775/5.064；4.779/5.142 | 9.219/9.707；9.225/9.524 | 18.233/19.892；18.144/19.423 |
| workerd | control | 1.458/2.476；1.555/2.418 | 1.425/2.781；1.483/2.057 | 1.419/3.532；1.372/2.205 |
| workerd | hash | 6.565/8.944；6.594/8.116 | 11.230/13.589；11.247/14.051 | 20.523/26.708；20.561/25.343 |
| workerd | compare-match | 6.709/8.028；6.691/8.175 | 11.232/16.770；11.305/13.609 | 20.647/25.474；20.422/24.720 |
| workerd | compare-mismatch | 6.856/8.479；6.798/8.192 | 11.328/14.830；11.359/14.221 | 20.508/26.996；20.565/24.889 |

**结果解释：**
- Node 的 process.cpuUsage 原始记录中，hash 的 CPU p50 约为 cost 6：4.85–4.87 ms、cost 7：9.29–9.32 ms、cost 8：18.20–18.23 ms；control 约为 0.07–0.08 ms。它是当前 CI Node 进程的 CPU，不是 Cloudflare CPU。
- workerd 的 control wall p50 约为 1.37–1.56 ms；hash/compare 的 wall p50 约为 cost 6：6.56–6.86 ms、cost 7：11.23–11.36 ms、cost 8：20.42–20.65 ms。它包含 dispatchFetch、本地调度、IPC、序列化与响应解析，不能当作 CPU。
- 这些数据支持一个有限结论：在此 CI runner 上，cost 从 6 升至 7 或 8 会显著增加计算开销；它们不能证明 Cloudflare 生产 CPU 预算充足，也不能据此决定调高 cost。生产 cost 继续保持 6，直到线上调用级 CPU 与完整认证路径证据齐备。

### 当前 Pages 认证路径盘点

检查当前部署所用的 Pages Functions 路由，确认以下 bcrypt 路径：

- POST /auth/login：对存量用户的 hashed_password 执行 bcrypt.compare；cost 取决于该用户现有哈希。
- POST /auth/register：校验密码与邀请码、查询邮箱后执行 bcrypt.hash(password, 6)，随后写入 D1 并处理关联记录。
- PUT /account/credentials：先对 current_password 执行 bcrypt.compare；如果提交 new_password，则校验后执行 bcrypt.hash(new_password, 6)，更新邮箱/哈希/token_version 并签发新 token。该路径使用 protectAuthAttempts('credentials')。
- 管理员 POST /auth/members：执行 bcrypt.hash(password, 6) 后创建账号。

frontend/tests/security.test.ts 已有基于 SQLite 的 D1 适配器测试，覆盖凭据更新、token_version 失效和认证限速等功能；这些是功能/安全回归，不是 Cloudflare CPU 基准，也不等于生产完整路径的 CPU 验收。旧 FastAPI backend 使用独立的 Python bcrypt 实现，未包含在当前 Pages 发布工作流中；除非有独立生产部署证据，不应将它与 Pages 运行数据混合。

当前 Worker 基准的 control 组在 Node、workerd 与 Cloudflare 中均走同一 Worker fetch 路径，只绕过 bcrypt 运算；它不包含 D1、JWT、邀请码或真实认证中间件。因此 control 差值只能估计隔离基准 Worker 内 bcrypt 的增量成本，不能代替完整认证路由测量。

## 局限与决策

- Node 使用调用端高精度单调时钟；附带的 `process.cpuUsage` 是 Node 进程 user+system CPU。旧 Windows 记录的单次 CPU 分辨率不足；当前 Linux CI 记录虽包含每次操作的 CPU 计数，但仍受进程级计量、调度与输出开销影响，不能代替 Worker CPU。
- workerd 使用调用端 `hrtime` 包围 `dispatchFetch` 和响应解析，包含本地调度、IPC、序列化及运行开销；并非哈希纯 CPU。真实 Cloudflare 模式测的是网络 RTT，不能把它写成生产 CPU。
- 不在 Worker 内用 `Date.now()` / `performance.now()` 测纯计算：线上计时器只随 I/O 推进，可能得到 0。参见 [Cloudflare timers](https://developers.cloudflare.com/workers/runtime-apis/performance/)。
- 2026-10-20 的 Cloudflare Pages production dashboard 快照记录了过去 24h 聚合 CPU 数据（早于 main 部署 run 39529826480）：2,058 次成功 invocation、0 错误、25 子请求、0 CPU 超限；CPU P50 2.209 ms、P75 2.854 ms、P99 11.222 ms、P99.9 23.375 ms。此数据包含该 Pages 项目的所有 Functions 调用，未按路由、操作、cost 分类；样本数是总 invocation 数，不是每个分位数对应的 bcrypt 样本量。不能把聚合 P99 当成 cost 6，也不能把它用于预测 cost 7/8。
- 未测生产套餐、CPU 限额、Cloudflare 硬件/地区、冷启动、并发、D1 延迟及完整登录/注册/改密路径。每环境仅单次批次，不能推断真实用户分布或 CPU 额度余量；CI 测量同样只提供当地 runner 的结果。
- Node 单次 CPU 和本地 workerd 耗时均不能证明 cost 6/7/8 满足生产预算。**不据此调高生产 cost，也不宣称当前 cost 已经通过生产成本评估。** 成本强度与 CPU 预算之间的最终取舍需维护者依据生产等效数据记录批准理由。

## 可追溯的基准与 CI 证据

- 历史 `bcrypt-node.json` 与 `bcrypt-workerd.json` 已独立检查：每份 990 行（900 个测量、90 次预热）、18 个分组、0 次失败；两份记录均标注基础 revision `94c54853d733565605a27eec032f7e9faf55ae83` 与当时的源码 SHA-256。这些是旧实现的历史基线，不是受令牌保护版本的复测。
- 历史候选 SHA `2e2a04efb15ade4cb57ccc9148bac2594fea61ff` 的 [GitHub Actions run 39532692792](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39532692792) 已通过 `validate`，并生成 `bcrypt-local-evidence` artifact（artifact ID `12316376269`）；该候选证据已被后续提交取代，不作为当前验收依据。PR 运行中的 `deploy` job 按预期跳过，没有生产发布。
- **SHA 口径：** PR 的 `head_sha` 是分支提交；GitHub Actions 的 `pull_request` 工作流通常检出 PR 合并测试引用，因此 artifact 内的 `environment.revision` 可能是合并测试提交，而不是分支 `head_sha`。验收时必须同时记录 PR head SHA、base SHA、Actions run URL 和 artifact 内 revision；不能把这几个 SHA 混为一谈。
- 更早的中间候选 `5c8a0ccebaaffdc4fdb27c5e49a5f19b54992689` 曾因运行器分支语法错误而失败；错误已修复，旧失败记录保留。后续任何代码/文档更新都会改变 PR head，合并门槛必须以最终 head 的 CI 与 artifact 为准，不能沿用上述中间候选的绿灯。

## 在 Cloudflare 环境补完（需维护者明确批准；本次未上传或部署）

独立工具位于 `frontend/benchmarks/bcrypt/`，不进入 `frontend/functions`，不绑定 D1/R2，不访问生产 API、账号或密码。CI 仅在 GitHub Actions runner 的 Node 与本地 workerd/Miniflare 中运行基准，并上传 `bcrypt-local-evidence` artifact；**CI 不会部署该 Worker**。

### 访问控制与安全边界

`workers.dev` 默认是公开入口，因此 Worker 在运行 bcrypt 前必须检查绑定的 `BENCHMARK_TOKEN`（至少 32 个字符）和 `Authorization: Bearer ...`。缺少 secret 时 fail closed 并返回 404。Token 不得写入仓库、命令行参数、URL、日志或基准报告。测试 Worker 不得绑定生产 D1/R2，也不得与 Pages Functions 合并。部署前先确认目标 Worker 名称、账号、套餐/CPU 限额及可能费用；测试结束后删除临时 Worker 与本地 token。

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
try { $env:BENCHMARK_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
node benchmarks/bcrypt/run.mjs --runtime cloudflare --url https://buaa-hep-bcrypt-benchmark.ACCOUNT.workers.dev --samples 50 --warmup 5 --out cloudflare-benchmark.json
Remove-Item Env:BENCHMARK_TOKEN
```

将 `ACCOUNT` 替换为 Cloudflare 返回的实际账户子域。只使用自己创建并确认所有权的 Worker URL；URL 限制只是防止误用，不是对域名所有权的认证。runner 通过 HTTPS 的 Authorization header 发送 token，不会将 token 写入输出 JSON。命令返回的 wall/RTT 包含网络开销，**不能直接当作 Worker CPU**。

Cloudflare invocation CPU 是整个 Worker 请求的 CPU 总量，包含 URL/令牌校验、bcrypt、日志与 JSON 响应开销，不是纯 bcrypt 指令时间。若要估计哈希的增量成本，应同时测量相同 Worker 的受保护 no-op/control 基线；否则把结果明确标记为“每次基准 invocation CPU”，不要称作纯 bcrypt CPU。

### CPU 证据验收

在 [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) 中按结构化字段 `benchmark=bcrypt-v1` 或 URL 中的 sample ID 定位自定义日志，再关联同一请求 URL 的 invocation log；Cloudflare 会在 invocation log 中提供 CPU 与 wall time。可用 [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) 的 `$workers.cpuTimeMs` 和 `$workers.wallTimeMs` 字段核验。总览见 [CPU Time per execution](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。按 cost、输入字节数、操作分组；排除 warmup，但保留失败、资源超限和缺失样本数。不能将混合 cost 的总分位数当成单一 cost 的结果。若日志无法与调用级 CPU 关联，继续标记“Cloudflare CPU 未测”，不得用 RTT 代替。

验收记录至少包含：cost、操作、输入字节数、n、失败/缺失数、CPU min/p50/p95/p99/max、wall/RTT 分布、套餐/限额、Worker 版本、地区、日志采样率与时间窗口。还需在隔离的非生产认证应用中测完整登录/注册/改密路径和限速开销，评估资源余量并记录维护者的参数选择理由。**Node/workerd 微基准成功不代表生产成本评估完成。**

历史原始 JSON 保留当时的源码 SHA、基础 revision 和运行环境；它们是基线，不应冒充当前受令牌保护的 Worker 版本的复测。合并前须检查本 PR 精确 SHA 的 CI 和新生成的 `bcrypt-local-evidence` artifact。没有 Cloudflare 调用级 CPU 证据前，不提高生产 bcrypt cost。
