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

## 实测延迟分布

单位毫秒；每格 n=50、失败=0。p50/p95/p99 使用 nearest-rank，即排序后第 ceil(p×n) 个值；n=50 时 p99 就是最大值，尾部估计不稳定。完整 min/p50/p95/p99/max 和逐样本数据见 [Node 原始记录](bcrypt-node.json)、[workerd 原始记录](bcrypt-workerd.json)。

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

- 当前 PR head：196cae07b1b4f3d6d89ab65461a5212cb89cf511；base：fb287b4fac1a7c45e02ee3d1e276ebdabf476269。
- 精确 head 的 [GitHub Actions run 39535976599](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39535976599) 已完成：validate=success，deploy=skipped。本次没有发布生产。
- 当前 bcrypt-local-evidence artifact ID：12317109921（可从上述 run 页面下载）。包含 node.json 与 workerd.json；每份均有 1,320 行：1,200 个测量样本、120 次预热、24 个分组、0 次失败。
- Artifact 内 environment.revision 为 a4e3a2a2b1e26f3a8ead117a10620624d5323a56，是本次 PR 测试用的合并提交（父提交分别为 base SHA 和当前 PR head SHA），不是 PR head 本身。报告同时记录了源码 SHA-256，防止把不同代码版本的基准混为一谈。
- 当前 CI runner 环境：Linux x64、Intel Xeon Platinum 8573C、2 个逻辑 CPU、Node v24.22.0、bcryptjs 3.0.3、Wrangler 4.131.0、workerd 1.20260910.1。这与此前 Windows/AMD 的历史表格是不同机器，数值不应直接当成硬件性能对比。

下表是当前 Linux CI artifact 的调用端 wall time 摘要，单位 ms；每个分组 n=50。每个 cost 单元按“12 字节输入 p50/p95；72 字节输入 p50/p95”列出。这里的 p95 仅描述该次 CI runner，不代表 Cloudflare 生产分布。

| Runtime | 操作 | cost 6：12B；72B | cost 7：12B；72B | cost 8：12B；72B |
|---|---|---:|---:|---:|
| Node | control | 0.0006/0.0014；0.0006/0.0031 | 0.0007/0.0021；0.0006/0.0018 | 0.0006/0.0014；0.0007/0.0013 |
| Node | hash | 4.635/5.268；4.582/5.391 | 9.188/10.173；9.293/10.125 | 18.227/20.022；18.276/19.198 |
| Node | compare-match | 4.658/5.297；4.599/5.125 | 9.256/10.032；9.163/10.300 | 18.543/19.324；18.178/19.317 |
| Node | compare-mismatch | 4.633/5.194；4.659/5.110 | 9.069/9.670；9.210/10.072 | 18.363/19.351；18.594/20.150 |
| workerd | control | 1.540/3.543；1.583/4.649 | 1.533/2.361；1.508/2.316 | 1.498/2.480；1.468/2.630 |
| workerd | hash | 6.732/8.570；6.673/8.542 | 11.719/13.743；11.629/14.586 | 21.705/25.782；21.475/27.086 |
| workerd | compare-match | 6.780/9.677；6.680/7.841 | 11.597/13.612；11.813/14.038 | 21.695/25.965；21.666/27.519 |
| workerd | compare-mismatch | 6.894/9.486；6.802/8.740 | 11.860/14.677；11.756/14.428 | 21.683/27.245；21.521/25.910 |

**解释限制：** Node 的 control 仅是异步函数/计时器开销，单次 CPU 数值受 process.cpuUsage 分辨率限制；workerd 的 wall time 包含 dispatchFetch、本地调度、IPC、序列化与响应解析。二者都不是 Cloudflare invocation CPU。当前数据只能证明基准在该 CI 环境可复现、三种 bcrypt 操作均正常，不能据此确定生产 cost 6 的 CPU 预算是否安全。

### 当前 Pages 认证路径盘点

检查当前部署所用的 frontend/functions/api/routes/auth.ts，确认其中有以下 bcrypt 路径：

- POST /login：对已有用户的 hashed_password 执行 bcrypt.compare；哈希的 cost 由存量哈希决定。
- POST /register：先做注册校验与邀请码/邮箱 D1 查询，再执行 bcrypt.hash(password, 6)，随后插入用户并处理关联记录。
- 管理员 POST /members：执行 bcrypt.hash(password, 6) 后创建账号。
- **未在当前 Pages auth router 中找到修改密码/重置密码端点。** 因此不能声称“密码修改路径已测”；若应用其他部署入口存在此功能，需要先确认真实路由与部署位置，再纳入审计。仓库中的旧 FastAPI backend 是另一条运行路径，不属于当前 Pages workflow 的发布产物，除非另有部署证据，不应与 Pages 运行数据混合。

当前控制组只覆盖基准 Worker 自身的鉴权、参数校验、日志和响应路径；它不执行 D1、JWT、邀请码、真实登录保护中间件或整条认证路由。完整认证路径仍需单独测试，且必须区分 Worker CPU 与端到端 wall latency。

## 局限与决策

- Node 使用调用端高精度单调时钟；附带的 `process.cpuUsage` 仅是 Node 进程 user+system CPU，在 Windows 上分辨率不足以可靠解释单次短操作，不能代替 Worker CPU。
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

在 Cloudflare Workers Observability / Logs 中按 `benchmark=bcrypt-v1` 与随机 sample ID 定位每次调用，并关联该调用的 CPU time、outcome；参见 [Metrics 的 CPU Time per execution](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。按 cost、输入字节数、操作分组；排除 warmup，但保留失败、资源超限和缺失样本数。不能将混合 cost 的总分位数当成单一 cost 的结果。若日志无法与调用级 CPU 关联，继续标记“Cloudflare CPU 未测”，不得用 RTT 代替。

验收记录至少包含：cost、操作、输入字节数、n、失败/缺失数、CPU min/p50/p95/p99/max、wall/RTT 分布、套餐/限额、Worker 版本、地区、日志采样率与时间窗口。还需在隔离的非生产认证应用中测完整登录/注册/改密路径和限速开销，评估资源余量并记录维护者的参数选择理由。**Node/workerd 微基准成功不代表生产成本评估完成。**

历史原始 JSON 保留当时的源码 SHA、基础 revision 和运行环境；它们是基线，不应冒充当前受令牌保护的 Worker 版本的复测。合并前须检查本 PR 精确 SHA 的 CI 和新生成的 `bcrypt-local-evidence` artifact。没有 Cloudflare 调用级 CPU 证据前，不提高生产 bcrypt cost。
