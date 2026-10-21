# 并行开发与 PR 协作规范

> 状态：第一版工程规范。本文定义代码协作边界，不替代代码、测试和线上运行证据。
> 本规范与仓库根目录 `AGENTS.md` 及 [GPT 优先开发工作流](GPT_FIRST_DEVELOPMENT_WORKFLOW.md) 配合使用。GPT / ChatGPT 是主要开发入口，DSH 与 WorkBuddy 复用同一规范。若历史说明与本文冲突，以当前 `main` 上的 CI/部署配置和本规范为准；历史说明中的直接推送、直接生产部署指令不得执行。
> 详细模块依赖、共享热点和多会话责任边界见 [模块边界与并行开发责任图](architecture/MODULE_BOUNDARIES_AND_OWNERSHIP.md)；当前开放 PR 的文件交集与 CI 状态见 [并行开发架构审计](audit/并行开发架构审计-2026-10-21.md)。

## 1. 基本工作流

1. 从最新 `main` 创建一个短生命周期的任务分支。
2. 一个分支/PR 聚焦一个可描述、可验收的目标；相关联的代码、测试和文档放在同一 PR。
3. 开发期间在分支上提交，PR 描述明确变更范围、接口/数据影响、风险、测试和回滚方式。
4. CI 必须针对 PR 当前 HEAD 通过。新提交产生后，旧 SHA 的绿灯不代表新 HEAD 已通过。
5. 审查文件差异、检查冲突与依赖，必要时更新分支并重新运行 CI。
6. 仅通过 PR 合并到 `main`。默认生产发布流程由 `.github/workflows/deploy.yml` 控制；合并后核对部署结果和线上健康/授权检查。

### 多会话/多 Agent 开工前检查（强制）

在任何代码写入之前，先检查 GitHub 上所有相关开放 PR，而不只是当前会话创建的 PR：

1. 记录当前 `main` SHA 与任务分支的基线。
2. 获取相关 PR 的最新 head SHA 和 changed-files 列表。
3. 将本任务拟修改路径与这些文件列表求交集。
4. 有交集时，不直接写入其他会话的分支；先确认主导 PR、依赖顺序和接口边界。若没有明确授权，就只读审查或选择不冲突的工作。
5. 一个文件同一时段只由一个明确的主导任务修改。不同会话并不构成文件锁；不同分支也不保证语义上没有冲突。
6. 开发中保持 Draft 是正常状态。功能未完成或 CI 失败时，继续修复与验证，不为“让 PR 变绿”而跳过有意义的测试，也不因 CI 失败而提前合并。
7. 合并前检查最新 head SHA、CI、文件交集及分支是否落后/分叉；任何新提交都需要对应的新验证结果。

开工前必须完成只读预检（在任何文件写入前）。在有本地 checkout 与已认证 GitHub CLI 的环境中，可执行仓库内的预检工具：

```bash
node scripts/agent-preflight.mjs --paths frontend/src/index.css frontend/tests/audit-browser-smoke.mjs
```

将示例路径替换为本任务计划修改的全部仓库相对路径。工具会刷新本地 `origin/main` 跟踪引用，核对 GitHub 上的最新 base SHA，并读取所有指向同一 base 的开放 PR 与 changed-files 列表；它不会修改源文件或远端分支。需要本地 Git、GitHub CLI (`gh`) 和有效的 `gh auth status`。退出码非零表示预检被阻止或无法完成：不要继续写入；先解决过期基线/路径交集，或在 GPT 通过 GitHub 连接器等没有 CLI 的环境中完成等价的只读检查并记录证据。`--allow-overlap` 与 `--allow-stale-base` 只能在用户明确授权后使用，不能用来绕过协作规则。

### 禁止默认执行的操作

- 不直接向 `main` 推送提交。
- 未经用户明确授权，不执行 `npm run pages:deploy`、Cloudflare 生产发布、远程 D1 写操作或生产数据迁移。
- 不为通过 CI 而删除现有的安全检查、授权检查或数据兼容逻辑。
- 不把“构建通过”“单元测试通过”表述为“全部线上行为已验收”。
- 不把旧提交的 CI 结果用于证明新提交通过。

## 2. 分支命名与 PR 范围

推荐分支前缀：

- `feat/<short-topic>`：新功能
- `fix/<short-topic>`：缺陷修复
- `physics/<short-topic>`：公开物理导读、公式说明、资源索引
- `test/<short-topic>`：测试与验收
- `docs/<short-topic>`：文档
- `refactor/<short-topic>`：不改变外部行为的结构整理
- `security/<short-topic>`：认证、授权、敏感数据和安全审计
- `ci/<short-topic>`：CI、发布与开发流程

PR 可以包含多个文件，但应围绕一个验收目标。若改动跨越 UI、API、数据库或部署边界，必须在 PR 中说明为什么这些改动不能安全拆分，以及它们之间的依赖顺序。

## 3. 模块边界与并行开发分区

### A. 相对适合并行

| 工作类型 | 主要边界 | 必须附带的验证 |
|---|---|---|
| 公开物理专题内容 | `frontend/src/views/ResearchTopicView.vue`、公开内容数据与对应测试 | 公式/假设/适用范围/来源链接；桌面和移动端浏览器检查 |
| 独立展示组件 | `frontend/src/components/<Component>.vue` 及同目录测试 | 组件行为、可访问性、主题兼容性 |
| 单一 API 业务域 | `frontend/functions/api/routes/<domain>.ts`、相关前端 API 调用和测试 | 请求/响应契约、授权边界、错误路径 |
| 自建后端业务域 | `backend/routers/`、`backend/services/` 和相应测试 | FastAPI 路由行为、数据隔离、与托管 API 的契约兼容 |
| 纯文档任务 | 对应 `docs/` 文档 | 链接、命令、资源名称和当前代码一致 |

“相对适合”不等于完全独立。只要触及共享接口、公共样式、数据库结构或认证逻辑，就必须按高耦合任务处理。

### B. 共享热点：默认一次由一个 PR 主导

以下文件会影响多个页面或测试，是并行开发的主要冲突点：

- 全局 UI：`frontend/src/index.css`、`frontend/src/App.vue`、`frontend/index.html`
- 主题系统：`frontend/src/composables/useThemeStyle.js`、`frontend/src/views/StyleView.vue`、`frontend/src/components/PublicThemeSwitcher.vue`、`frontend/src/components/WorldlineEffects.vue`
- 浏览器验收：`frontend/tests/audit-browser-smoke.mjs`
- API 公共入口/契约：`frontend/functions/api/[[route]].ts`、`frontend/functions/api/types.ts`、`frontend/src/api/client.js`
- 数据和发布：`scripts/schema_d1.sql`、`frontend/wrangler.json`、`.github/workflows/`

如果两个任务必须修改同一热点文件，应先约定接口/样式变量，或明确依赖顺序：先合并基础 PR，再让后续分支基于最新 `main` 更新。不要让多个 AI 分别重写同一份全局 CSS 或浏览器测试脚本后再一次性合并。

## 4. API、双后端与数据库约定

本项目存在两种后端实现路径：

- Cloudflare 托管：`frontend/functions/api/`（TypeScript + Hono + Pages Functions + D1）。
- 自建/本地模式：`backend/`（Python + FastAPI + SQLite）。

修改业务 API 时，先确认该功能支持哪种部署模式。如果两个模式都支持同一功能，应同步检查请求字段、响应结构、错误码、认证/授权与数据可见性；不能只因一个后端测试通过就推断另一个后端等价。

### 数据库变更

1. 任何表、列、索引或数据语义变更，必须在 PR 中明确列出。
2. 优先使用可追踪、可重复的版本化迁移；保持 D1 schema、SQLite/FastAPI 模型与迁移记录一致。
3. 不在功能 PR 中直接对生产 D1 执行临时 DDL，也不把“请求时自动补列”当作长期迁移方案。
4. 迁移需考虑已有数据、重复执行、失败恢复和旧代码兼容。
5. 未经明确授权，不备份/导出/修改生产用户数据，不在生产库做试验。
6. Cloudflare 资源名称与绑定以当前 `frontend/wrangler.json` 和已验证的部署配置为准，不复制历史文档里的资源名。

## 5. 测试与合并门槛

### 前端和托管 API

按变更范围执行并记录：

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run check:bundle
npx --prefix frontend playwright install --with-deps chromium
node frontend/tests/audit-browser-smoke.mjs
node scripts/verify-cloudflare.mjs
```

CI 当前会执行前端测试、构建、入口预算检查、Chromium 浏览器 smoke 和隔离 Pages 运行时安全检查。涉及主题、路由、导航、动效或响应式布局时，必须特别检查桌面/移动端、控制台错误、失败请求、减少动态效果偏好以及主题切换后的兼容性。

### 自建 FastAPI 后端

```bash
pip install -r backend/requirements-test.txt
python -m pytest backend -q
```

截至 `main` HEAD `7b30644199310c82f769079eb65ada615c0a5c0b`，`.github/workflows/deploy.yml` 已在验证阶段执行 `python -m pytest backend -q --junitxml=backend-test-results.xml`，即完整 FastAPI 后端测试套件。该 main 提交对应的 Actions 运行 [#39605482351](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39605482351) 中，完整后端测试、前端测试、构建、浏览器 smoke、隔离 Pages 安全检查及部署后健康/授权检查均通过。此结论只对应该 SHA；其他 PR 的最新 HEAD 必须单独核对。当前不应重复添加独立后端工作流，除非未来有意将验证流水线拆分并明确依赖关系。

### 特定高风险改动

- 认证/授权：测试未登录、普通成员、管理员、资源所有者和越权访问。
- 主题/全局布局：浏览器交互回归；不能只依赖 CSS 快照或源代码断言。
- 文件上传/下载：验证大小限制、MIME/内容校验、权限、失败回退和资源绑定状态。
- 数据迁移：对空库和已有数据分别测试；提供回滚或向前修复方案。
- 生产发布：只接受当前提交 SHA 的 CI 与部署/健康检查证据。

## 6. PR 描述必须回答的问题

- 这个 PR 解决什么问题？明确不解决什么问题？
- 哪些模块、页面、API、数据库表和部署资源受到影响？
- 是否修改共享热点文件？若是，和哪些任务/PR 有依赖或冲突？
- 新增/修改了哪些 API 契约、权限、schema 或迁移？
- 运行了哪些测试？结果对应哪个 HEAD SHA？
- 哪些行为仍未验证？是否有截图、日志、测试 Artifact 或线上验收证据？
- 失败时如何回滚？是否可能影响账号、现有数据或生产服务？

## 7. 主分支保护是仓库设置，不是 Markdown 规则

文档本身无法阻止直接推送。仓库管理员还需要在 GitHub Settings 中为 `main` 配置并验证：

- 合并必须通过 PR；
- 必需 CI 状态检查通过；
- 禁止 force-push 和删除 `main`；
- 要求解决 PR 讨论；
- 有其他维护者时再要求审批；若只有单一维护者，应避免设置无法满足的审批门槛；
- 检查管理员是否能够绕过规则，以及是否存在覆盖 `main` 的 Ruleset。

只有实际检查设置后，才能把“主分支保护已启用”标记为已验证。
