# Cloudflare Pages 部署与附件存储：当前状态和验收边界

> **文档状态：当前仓库操作说明。** 本文依据仓库中的 `frontend/wrangler.json`、`.github/workflows/deploy.yml`、`frontend/functions/api/utils/uploadPolicy.ts` 和 `frontend/functions/api/routes/files.ts` 编写。源码配置不证明某次生产部署成功；线上状态应核对实际部署记录与健康检查，Actions 验证结果另行核对。

## 1. 当前仓库配置

- 目标站点：`https://buaa-hep-hub.pages.dev/`。
- 当前 Pages 配置声明 D1 绑定 `DB`，未声明 `FILES_BUCKET` / R2 绑定。
- 在没有 `FILES_BUCKET` 绑定时，上传策略将单文件上限设为 **1 MiB**。更大的讲义、教材或数据文件应使用经核对的外部链接，不要绕过后端限制。
- 代码保留可选 R2 适配，但代码存在不等于账户中已经创建存储桶、绑定已经生效或生产站点已部署该代码。
- 仓库另有附件存储架构提案，其中讨论了 Workers KV 等备选路径。本文不批准选择或启用新的存储后端；任何存储后端变更都需要独立设计、隔离验收和明确批准。

## 2. 正式发布路径

仓库的正式发布流程由 `.github/workflows/deploy.yml` 管理。2026-10-27 的部署记录显示 Cloudflare Pages 还启用了连接 `main` 的原生 Git 自动部署，因此主线提交可能独立触发生产构建；该路径不会等待 GitHub Actions 验证。具体证据和双路径待处理事项见 [发布权威与核验记录](RELEASE_AUTHORITY.md)。不要为了方便而直接在本地运行 `wrangler pages deploy` 绕过门禁。

在合并生产变更之前，先重新核实 Pages 控制台的 Git 集成设置，并决定是否关闭原生生产自动部署或将其改为仅创建预览，避免它绕过仓库工作流的验证。记录实际决定和部署路径后，再进行合并与发布。

1. 在 PR 的**当前 HEAD** 上运行与改动范围相符的测试、构建、包体积、浏览器和隔离运行时检查。新提交产生新 SHA 后，旧 SHA 的成功记录不能替代新提交的验证。
2. 合并后，Actions 工作流根据变更范围判断是否需要 Pages 发布；发布候选必须满足工作流中的 PR/验证条件，且提交消息不得含有 `[skip-prod-deploy]`。这一标记只约束仓库工作流，不会阻止当前 Pages 原生 Git 集成独立构建和发布。
3. 手动触发工作流时，必须显式勾选 `deploy_production`；默认的手动运行不应被当作生产部署。
4. 发布工作流使用仓库 Actions Secrets `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。不要把这些值写入源码、README、测试 fixture 或日志。
5. Actions 工作流部署后会执行线上健康与匿名授权检查。对任何发布路径，均应记录实际部署来源 SHA、部署状态及线上检查结果；原生 Git 部署成功不能记作 Actions 验证通过。

### 常用本地检查

从仓库根目录执行，按改动范围选择，不要求每个文档改动都运行完整应用栈：

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run check:bundle
node scripts/verify-cloudflare.mjs
```

若改动了 FastAPI 路由、模型、服务或数据库行为，请先在隔离的 Python 环境中安装 `backend/requirements-test.txt`，然后使用仅供本地测试的密钥运行测试。例如，在 Windows PowerShell 中：

```powershell
python -m pip install -r backend/requirements-test.txt
powershell -NoProfile -Command '$env:LABHUB_SECRET_KEY = "isolated-local-test-secret-never-for-production-32-plus"; python -m pytest backend -q'
```

示例密钥是公开的测试值，只能用于隔离测试数据库，不能用于生产。测试子进程中的环境变量不会覆盖当前 PowerShell 窗口的设置。

若改动涉及全局壳层、路由、主题、公开首页/专题导航或烟测脚本，还需按项目规范运行 Chromium 烟测。部署后的线上核验使用：

```bash
node scripts/verify-live.mjs https://buaa-hep-hub.pages.dev
```

最后一条是线上核验，不应在部署前被描述为已通过；本地构建成功也不等于生产验收成功。

## 3. D1 数据与 schema 变更

- 当前 D1 schema 源文件为 `scripts/schema_d1.sql`。
- 不要把全量 schema 文件当作对现有生产数据库安全的增量迁移，也不要把演示 seed 数据导入生产库。
- 任何生产 schema 变更都必须先核对实际线上 schema 与现有数据，提交单独的版本化迁移，说明备份、向前迁移、失败处理和回滚/恢复策略，并在隔离数据库上验证。
- 不要在每次用户请求中执行 `ALTER TABLE` 来隐式迁移生产数据。请求路径只应使用已经完成并核验的 schema。
- 本文档更新本身不修改数据库、迁移文件、绑定或生产数据。

## 4. R2 / 其他对象存储的未来启用门槛

当前配置没有绑定 R2，因此以下内容是**未来变更的验收门槛，不是当前部署步骤**。

1. 先由项目负责人确认可用的账户/付款条件、配额和费用边界。不要因仓库存在可选代码而假设存储服务已可用。
2. 单独确定存储后端。当前代码包含 R2 适配，而另一个架构提案讨论了 Workers KV；两者不能在未评估一致性、大小限制、访问控制、备份和成本的情况下互换。
3. 若最终批准 R2，才创建指定桶并在 `frontend/wrangler.json` 配置 `FILES_BUCKET` 绑定。绑定名称、目标桶、部署环境和账户必须逐项核对；不要绑定到未知或生产不相关的桶。
4. 在隔离环境验证：1 MiB 边界、目标最大文件大小、文件头/MIME 检查、重复文件处理、授权下载、对象写入成功但 D1 元数据写入失败、D1 元数据存在但对象缺失、存储不可用时的错误路径。
5. 只有隔离环境测试通过且用户界面提示与后端限制一致后，才可提出生产变更 PR。该 PR 必须明确是否会触发 Pages 发布；合并后重新检查精确 SHA、部署记录和线上上传/下载行为。

在 R2 未绑定时，不要把前端显示的 15 MiB 当成实际可用上限，也不要把大文件自动回退写入 D1。当前 API 对超出 D1 回退上限的文件应返回明确错误；如果实际行为与此不符，应先修复并测试，再考虑启用新存储后端。

## 5. 本文档的权威边界

- 本文档记录仓库中可核查的配置与流程，不记录 Cloudflare 控制台中未被读取/验证的资源状态。
- `frontend/wrangler.json` 中存在 D1 配置，不足以证明数据库可访问、生产环境正在运行最新版本或线上健康检查成功。
- 工作流文件存在，不足以证明 GitHub Secrets 已配置；必须检查实际工作流结果。
- 任何旧版 README、上游 LabOrbit 部署说明或历史测试计数都不能替代当前仓库的配置、最新提交的测试证据和线上核验结果。
