# BUAA HEP Hub 发布权威与核验记录

更新：2026-10-27（Asia/Shanghai）。

## 当前发布方式

**仓库的工作流文件 `.github/workflows/deploy.yml` 会依 PR 与 main push 执行验证，并在 `validate` 成功后调用仓库锁定的 Wrangler CLI 发布 Cloudflare Pages。** 部署后执行 `scripts/verify-live.mjs`，检查健康接口、匿名授权、公开 HTML、robots/sitemap 与内部路由 noindex。功能分支的 CI 不会部署生产。

**但实际生效的生产发布路径是 Cloudflare Pages 原生 Git 集成**（见下方维护者决定）；`deploy.yml` 因 PR-only 授权检查和账户付款状态，当前不是发布门禁。两者的事实必须分开陈述。

截至 2026-10-26，Cloudflare Pages Dashboard 显示该项目已连接 GitHub 仓库、生产分支为 `main`，且原生自动部署开启。2026-10-27 合并后，Pages 原生 Git 集成已将最新 `main` SHA 发布为 Active；对应 PR 的 GitHub Actions 验证因账户付款/支出限额问题未启动。

### 维护者决定：明确接受双发布路径（2026-10-27）

**维护者已决定：保留双发布路径，生产发布以 Cloudflare Pages 原生 Git 集成为准，不因 GitHub Actions 失败而阻塞发布。** 据此：

- `main` 推送后由 Pages 原生集成构建并发布，这是当前**预期且被接受**的生产路径；不再是待定风险项。
- GitHub Actions（`deploy.yml` 等）维持仓库现状，**不作为发布门禁**。Actions 因账户付款/支出限额无法启动时，记录为已知的账户状态，不据此判定发布失败，也不要求为此修改工作流。
- 不得为了“消除双路径”而单方面关闭 Pages 自动部署、改成仅预览，或移除 Actions 工作流；这类改动会直接改变现有发布方式，须维护者另行明确决定。

仍然成立的边界（与上述决定不冲突）：

- **不能把 Pages 原生部署描述为「Actions 验证通过」。** 两者是不同的事实，必须分开陈述。
- 发布后的可用性核查仍应执行 `node scripts/verify-live.mjs https://buaa-hep-hub.pages.dev`（健康接口、匿名授权、公开 HTML、robots/sitemap、`/hub` noindex）。这是发布后检查，不是 CI 门禁。
- 本地验证（单测、构建、浏览器回归、性能探针）仍是提交前的事实依据；Actions 不跑不等于不需要本地证据。
- 判断生产是否包含某次改动物，应比对实际产物（chunk 文件名与内容哈希），而不是假设「推了就等于发布了」。

2026-10-27 的性能修复提交 `66a14aa` 即按此路径发布：`assets/index-CQzHAqG8.js` 与 `assets/WorldlineEffects-B6GI6Kq6.js` 在生产站与本地构建的 md5 一致。同期三个 Actions 工作流因账户付款问题未启动，属已知账户状态，未作为发布失败处理。

本次更新保留已有的 main push 自动发布链路，不将它改成仅手动发布。另增加本地 Node/workerd bcrypt 基准步骤和 artifact，并把“已请求的 main 发布但缺少 Cloudflare 凭据”从警告改为失败，避免出现“验证绿灯但没有发布”的误判。Wrangler 部署命令会记录 GitHub Actions 的完整源 SHA。不会在本地执行生产部署，也不会读取或复制任何 secret。

### PR-only 发布授权与主分支保护限制

当前 `.github/workflows/deploy.yml` 在主分支发布候选进入验证阶段时，会通过 GitHub API 检查当前 SHA 是否确实是一个已合并、目标分支为 `main` 的 PR 的合并提交。直接推送产生的普通提交若没有对应的已合并 PR，将使验证失败，因此不会进入生产部署 job。该检查也覆盖在 `main` 上手动触发的发布流程。

这是一项**发布保护补偿措施**，不等于 GitHub 已经禁止直接推送。审计时 `main` 的分支元数据显示 `protected: false`；当前私有仓库的 Rulesets API 返回套餐限制（需要 GitHub Pro，或仓库公开后才可使用相应规则集）。由于课题组代码与研究工作流不应为了启用保护而默认公开，建议保持仓库私有；如果希望 GitHub 在服务端直接阻止未经 PR 的推送，需要在适用的付费方案下启用 `main` 的 PR 与必需状态检查规则。即使暂时无法启用，发布授权检查也必须保留。

Cloudflare 原生 Pages Git Provider 在 2026-10-20 的控制台快照中显示未连接；这只是历史状态。2026-10-26 的 Dashboard 检查已显示 GitHub 连接、生产分支 `main`、原生自动部署开启，构建根目录 `frontend`、输出目录 `dist`。该新状态覆盖旧快照。为避免 Actions 与 Pages 原生集成同时发布，合并生产变更前需先决定是否关闭 Cloudflare 自动部署或改为仅创建预览；本次没有修改该设置。

## 最近一次观察到的应用代码生产部署（2026-10-27）

| 项目 | 证据 |
|---|---|
| 应用代码 main 源提交 | `e4b4014468856787c6f0efd0f4ded9420ac5359b` |
| Cloudflare 部署记录 | Production / `main` / `Active`，来源 SHA 与当前 `main` 一致 |
| Cloudflare 版本 URL | `https://590d84b5.buaa-hep-hub.pages.dev` |
| 稳定生产 URL | `https://buaa-hep-hub.pages.dev` |
| 发布路径 | Cloudflare Pages 原生 Git 集成（根据活跃生产记录与仓库连接状态判断）；没有执行本地 `pages:deploy` |
| 发布后检查 | `node scripts/verify-live.mjs https://buaa-hep-hub.pages.dev` 成功；健康接口、匿名授权、公开 HTML/元数据、robots、sitemap 与 `/hub` noindex 检查通过 |
| GitHub Actions 验证 | **未通过。** PR #68 的 run [40392300351](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/40392300351) 与 PR #71 的 run [40394374245](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/40394374245) 在验证步骤前因账户付款失败/支出限额而未启动；不能称为 Actions 验证通过 |
| 凭据处理 | 只读取 Wrangler 身份和部署元数据；没有读取或记录 Cloudflare secret 值 |

该部署由 Cloudflare Pages 原生 Git 集成完成，不等于仓库规定的 GitHub Actions 发布验证成功。恢复 Actions 账户计费后，仍需在最终 head 上跑通 PR 验证，并确认 main 发布工作流完成。历史成功的 Actions 发布基线见 [pages-release-evidence.json](audit/pages-release-evidence.json) 中的 `latestVerifiedMainBeforeSec04Update`；不能把它与本次部署混为一谈。

该记录对应应用代码变更的部署；后续只改审计文档的 main 提交即使触发 Pages 构建，也不会改变这里记录的应用代码 SHA。

## 生产资源与兼容性边界

- 生产项目：`buaa-hep-hub`，稳定域名 `buaa-hep-hub.pages.dev`。
- 当前仓库的 `frontend/wrangler.json` 声明 D1 `DB`，不声明 R2。README 的当前约定为 D1-only 附件路径；单文件上限为 1 MiB。不能宣称 R2 已启用或使用 15 MiB 限额，除非后续先完成桶创建、binding、上传/下载兼容测试并由维护者批准。
- 历史 Cloudflare 控制台快照与聚合 CPU 指标见 [pages-release-evidence.json](audit/pages-release-evidence.json)。该快照的部署源 SHA 和 CPU 时间窗早于 run 39529826480，不可冒充当前部署的元数据。
- 不读取生产数据库、账号、密码、JWT 或 secret 值；生产完整权限矩阵仍需使用专门的验收账号，并单独记录证据。

## SEC-04 的边界

Node/workerd 基准是固定公开合成输入的本地测量；它们不是 Cloudflare 生产 CPU 数据。CI 会上传当前精确 SHA 的 `bcrypt-local-evidence` artifact，但不部署基准 Worker。Cloudflare 专用 Worker 位于 `frontend/benchmarks/bcrypt/`，不绑定 D1/R2 或生产路由；由于 `workers.dev` 默认公开，Worker 必须要求 `BENCHMARK_TOKEN`，缺少令牌时 fail closed。只有维护者明确批准隔离 Worker 的目标和成本后，才可手动部署并测量调用级 CPU。

**生产 bcrypt cost 继续保持 6。** 在获得按 cost/操作分组的 Cloudflare CPU 证据、完整登录/注册/改密路径开销、限速与资源余量分析之前，不提高 cost，也不关闭 SEC-04。
