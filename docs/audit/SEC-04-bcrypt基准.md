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

## 基准源码版本的参考 CI 证据（run 39541458020）

- [GitHub Actions run 39541458020](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39541458020) 已完成并通过：`validate=success`、`deploy=skipped`。该 run 中 Wrangler bundle `--dry-run`、测试、构建和本地基准均通过；没有部署 Worker 或生产。
- 测量时的 PR head：`145a6d1419f12f835261c3e1ca2f1e35350d41dc`。Artifact `bcrypt-local-evidence` ID `12320036002`，保留至 2027-01-19 03:58:12 UTC（90 天）。包含 `node.json` 与 `workerd.json`；每份 1,320 行：1,200 个测量样本、120 次预热、24 个分组、0 次失败。
- 两份报告的 `environment.revision` 均为 `35c15de25dfd72ad679b36e0bd065a1ba9bf9a43`。这是 GitHub Actions 合并测试提交，其父提交为 main 的 `2527598ad82f0c02186dbbbcb179b87809bc2b44` 与 PR head `145a6d1419f12f835261c3e1ca2f1e35350d41dc`，不是 PR head 本身。
- **Base SHA 必须按时间记录：** PR API 的 base SHA 字段仍返回 `fb287b4fac1a7c45e02ee3d1e276ebdabf476269`；但该 run 的实际合并测试使用 main ref `2527598ad82f0c02186dbbbcb179b87809bc2b44`。在本次文档更新时，`refs/heads/main` 已前进到 `596ad2de8fbd2f133d93a44a2332245393df85cf`，所以 run 39541458020 不是对这个更新后的 main ref 的合并验收。文档更新后的最新 PR CI 必须再通过；PR 元数据、实时 main ref、artifact revision 应分别记录。
- Runner：Linux x64、AMD EPYC 7763 64-Core、Node v24.22.0、bcryptjs 3.0.3、Wrangler 4.131.0、workerd 1.20260910.1；兼容日期 2026-09-17，`nodejs_compat`。
- 源码 SHA-256（UTF-8，换行统一为 LF）：`core.mjs` = `ed47f24cc7b024cc2864b76920644329993a0a0582fd2579a3fb639477e1f774`；`fixtures.json` = `ac02d2fd5379fc83260564c0cbdffacc43dc914d32a73917b5e9519fcd1d3cf5`；`worker.mjs` = `622be8816fdb6600121db1f7eef5067212c8240543027692adaaf0d1842d5461`；`run.mjs` = `2b42e0cc4a9a44619cf7952d6c40b93500876bd1e578e0a5e5c0e9d7543dabe1`；`wrangler.jsonc` = `469258fa7de68b56e464e4e1a0821bd3479673f36905f2f97e5601819ee48e5b`；`frontend/package-lock.json` = `6343f35eeaecf50c73e99bd56ec19e5dcfd16dc68c88a2fb0a501099ba6e44f8`.

下表来自上述 artifact。每组 n=50；每个 cost 单元按“12 字节输入 p50/p95；72 字节输入 p50/p95”列出，单位 ms。n=50 时尾部估计不稳定，因此不列 p99。

| Runtime | 操作 | cost 6：12B；72B | cost 7：12B；72B | cost 8：12B；72B |
|---|---|---:|---:|---:|
| Node | control | 0.121/0.211；0.115/0.210 | 0.121/0.208；0.116/0.201 | 0.116/0.234；0.117/0.209 |
| Node | hash | 5.731/6.199；5.721/6.141 | 10.880/11.595；10.936/11.936 | 21.297/21.843；21.347/21.843 |
| Node | compare-match | 5.602/5.723；5.608/5.951 | 10.814/11.318；10.814/11.094 | 21.236/21.928；21.222/21.534 |
| Node | compare-mismatch | 5.633/6.091；5.633/6.195 | 10.814/11.132；10.806/11.836 | 21.237/22.222；21.238/22.295 |
| workerd | control | 1.668/3.156；1.711/4.156 | 1.662/2.627；1.653/2.346 | 1.649/3.121；1.680/1.989 |
| workerd | hash | 7.375/9.172；7.265/9.858 | 13.207/16.887；12.609/16.444 | 23.244/30.653；23.179/31.344 |
| workerd | compare-match | 7.497/9.251；7.640/9.099 | 12.677/17.048；12.625/16.605 | 23.452/30.663；23.090/30.124 |
| workerd | compare-mismatch | 7.365/10.889；7.470/13.194 | 12.751/16.461；12.716/16.230 | 23.065/29.801；23.231/30.600 |

**结果解释：**
- Node 的 `process.cpuUsage` 记录中，hash CPU p50 约为 cost 6：5.73 ms、cost 7：10.91 ms、cost 8：21.33 ms；control 约为 0.12 ms。这是 CI Node 进程 CPU，不是 Cloudflare CPU。
- workerd 的 control wall p50 约为 1.65–1.71 ms；hash/compare wall p50 约为 cost 6：7.27–7.64 ms、cost 7：12.61–13.21 ms、cost 8：23.07–23.45 ms。它包含 dispatchFetch、本地调度、IPC、序列化和响应解析，不能当作 CPU。
- Node 与 workerd 通过同一 Worker fetch/auth/参数校验/结构化日志/响应路径；control 与 bcrypt 组使用相同的合成输入准备和 fixture 查找，control 只跳过 bcrypt。样本关联日志在 bcrypt 开始前写出。
- CI runner 硬件在相邻运行间发生变化，绝对毫秒数可能随机器而变。当前数据只说明此 runner 上 cost 增大显著增加计算开销；不能证明 Cloudflare CPU 预算充足，也不能据此提高生产 cost。

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
只使用自己创建并确认所有权的 Worker URL；URL 限制只是防止误用，不是对域名所有权的认证。runner 通过 HTTPS 的 Authorization header 发送 token，不会将 token 写入输出 JSON。命令返回的 wall/RTT 包含网络开销，**不能直接当作 Worker CPU**。

Cloudflare invocation CPU 是整个 Worker 请求的 CPU 总量，包含 URL/令牌校验、bcrypt、日志与 JSON 响应开销，不是纯 bcrypt 指令时间。若要估计哈希的增量成本，应同时测量相同 Worker 的受保护 no-op/control 基线；否则把结果明确标记为“每次基准 invocation CPU”，不要称作纯 bcrypt CPU。

### CPU 证据验收

在 [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) 中搜索自定义日志消息里的 `bcrypt-v1` 或具体 sample ID，再按同一请求 URL 的 sample 查询参数关联 invocation log。代码在 bcrypt 之前通过 `console.log({...})` 输出结构化 JSON 对象，包含 `benchmark`、`sampleId`、`cost`、`bytes`、`operation` 与 `event`；Workers Logs 会索引这些字段。即使请求因 CPU 限额被中断，也有机会保留关联标记。Cloudflare 会在 invocation log 中提供 CPU 与 wall time；可用 [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) 的 `$workers.cpuTimeMs` 和 `$workers.wallTimeMs` 字段核验。总览见 [CPU Time per execution](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。按 cost、输入字节数、操作分组；排除 warmup，但保留失败、资源超限和缺失样本数。不能将混合 cost 的总分位数当成单一 cost 的结果。若日志无法与调用级 CPU 关联，继续标记“Cloudflare CPU 未测”，不得用 RTT 代替。

验收记录至少包含：cost、操作、输入字节数、n、失败/缺失数、CPU min/p50/p95/p99/max、wall/RTT 分布、套餐/限额、Worker 版本、地区、日志采样率与时间窗口。还需在隔离的非生产认证应用中测完整登录/注册/改密路径和限速开销，评估资源余量并记录维护者的参数选择理由。**Node/workerd 微基准成功不代表生产成本评估完成。**

历史原始 JSON 保留当时的源码 SHA、基础 revision 和运行环境；它们是基线，不应冒充当前受令牌保护的 Worker 版本的复测。合并前须检查本 PR 精确 SHA 的 CI 和新生成的 `bcrypt-local-evidence` artifact。没有 Cloudflare 调用级 CPU 证据前，不提高生产 bcrypt cost。
