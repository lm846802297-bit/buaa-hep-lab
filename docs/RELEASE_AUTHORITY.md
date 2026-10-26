# BUAA HEP Hub 发布权威与核验记录

更新：2026-10-27（Asia/Shanghai）。

## 当前发布方式

**仓库声明的正式发布流程是 GitHub Actions 工作流 `.github/workflows/deploy.yml`。** 工作流对 PR 与 main push 执行验证；仅当事件来自 `main` 且不是 PR 时，在完整 `validate` 成功后调用仓库锁定的 Wrangler CLI 发布 Cloudflare Pages。部署后执行 `scripts/verify-live.mjs`，检查健康接口、匿名授权、公开 HTML、robots/sitemap 与内部路由 noindex。功能分支的 CI 不会部署生产。

但截至 2026-10-26，Cloudflare Pages Dashboard 也显示该项目已连接 GitHub 仓库、生产分支为 `main`，且原生自动部署开启。因此当前存在 Actions 与 Cloudflare Git integration 两条可能触发生产部署的路径；在关闭或改为仅预览之前，不能称 Actions 是唯一技术发布路径。任何合并到 `main` 的提交都可能同时触发两套部署。

本次更新保留已有的 main push 自动发布链路，不将它改成仅手动发布。另增加本地 Node/workerd bcrypt 基准步骤和 artifact，并把“已请求的 main 发布但缺少 Cloudflare 凭据”从警告改为失败，避免出现“验证绿灯但没有发布”的误判。Wrangler 部署命令会记录 GitHub Actions 的完整源 SHA。不会在本地执行生产部署，也不会读取或复制任何 secret。

### PR-only 发布授权与主分支保护限制

当前 `.github/workflows/deploy.yml` 在主分支发布候选进入验证阶段时，会通过 GitHub API 检查当前 SHA 是否确实是一个已合并、目标分支为 `main` 的 PR 的合并提交。直接推送产生的普通提交若没有对应的已合并 PR，将使验证失败，因此不会进入生产部署 job。该检查也覆盖在 `main` 上手动触发的发布流程。

这是一项**发布保护补偿措施**，不等于 GitHub 已经禁止直接推送。审计时 `main` 的分支元数据显示 `protected: false`；当前私有仓库的 Rulesets API 返回套餐限制（需要 GitHub Pro，或仓库公开后才可使用相应规则集）。由于课题组代码与研究工作流不应为了启用保护而默认公开，建议保持仓库私有；如果希望 GitHub 在服务端直接阻止未经 PR 的推送，需要在适用的付费方案下启用 `main` 的 PR 与必需状态检查规则。即使暂时无法启用，发布授权检查也必须保留。

Cloudflare 原生 Pages Git Provider 在 2026-10-20 的控制台快照中显示未连接；这只是历史状态。2026-10-26 的 Dashboard 检查已显示 GitHub 连接、生产分支 `main`、原生自动部署开启，构建根目录 `frontend`、输出目录 `dist`。该新状态覆盖旧快照。为避免 Actions 与 Pages 原生集成同时发布，合并生产变更前需先决定是否关闭 Cloudflare 自动部署或改为仅创建预览；本次没有修改该设置。

## 最近一次已验证的 main 发布（PR #3 更新前基线）

| 项目 | 证据 |
|---|---|
| main 源提交 | `fb287b4fac1a7c45e02ee3d1e276ebdabf476269` |
| GitHub Actions | [run 39529826480](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39529826480) |
| 验证 job | `validate: success` |
| 部署 job | `deploy: success` |
| Cloudflare 版本 URL | `https://2d105688.buaa-hep-hub.pages.dev`（部署日志返回） |
| 稳定生产 URL | `https://buaa-hep-hub.pages.dev` |
| 发布后检查 | `node scripts/verify-live.mjs` 成功；健康、公开 HTML/元数据、匿名 API 授权与内部路由 noindex 检查通过 |
| 凭据处理 | Actions 日志只显示已掩码的凭据变量；未读取、导出或写入凭据值 |

此表是更新前的基线。PR #3 的新提交尚未发布；合并后必须检查由合并 SHA 触发的 main workflow，并将新 run、SHA、版本 URL 和健康检查结果追加为最新证据。不能把 PR validate 成功等同于生产部署成功。

## 生产资源与兼容性边界

- 生产项目：`buaa-hep-hub`，稳定域名 `buaa-hep-hub.pages.dev`。
- 当前仓库的 `frontend/wrangler.json` 声明 D1 `DB`，不声明 R2。README 的当前约定为 D1-only 附件路径；单文件上限为 1 MiB。不能宣称 R2 已启用或使用 15 MiB 限额，除非后续先完成桶创建、binding、上传/下载兼容测试并由维护者批准。
- 历史 Cloudflare 控制台快照与聚合 CPU 指标见 [pages-release-evidence.json](audit/pages-release-evidence.json)。该快照的部署源 SHA 和 CPU 时间窗早于 run 39529826480，不可冒充当前部署的元数据。
- 不读取生产数据库、账号、密码、JWT 或 secret 值；生产完整权限矩阵仍需使用专门的验收账号，并单独记录证据。

## SEC-04 的边界

Node/workerd 基准是固定公开合成输入的本地测量；它们不是 Cloudflare 生产 CPU 数据。CI 会上传当前精确 SHA 的 `bcrypt-local-evidence` artifact，但不部署基准 Worker。Cloudflare 专用 Worker 位于 `frontend/benchmarks/bcrypt/`，不绑定 D1/R2 或生产路由；由于 `workers.dev` 默认公开，Worker 必须要求 `BENCHMARK_TOKEN`，缺少令牌时 fail closed。只有维护者明确批准隔离 Worker 的目标和成本后，才可手动部署并测量调用级 CPU。

**生产 bcrypt cost 继续保持 6。** 在获得按 cost/操作分组的 Cloudflare CPU 证据、完整登录/注册/改密路径开销、限速与资源余量分析之前，不提高 cost，也不关闭 SEC-04。
