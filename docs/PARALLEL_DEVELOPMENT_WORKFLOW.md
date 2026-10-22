# 并行开发与 PR 协作规范

> 状态：第一版工程规范。本文定义代码协作边界，不替代代码、测试和线上运行证据。
> 本规范与仓库根目录 `AGENTS.md` 及 [GPT 优先开发工作流](GPT_FIRST_DEVELOPMENT_WORKFLOW.md) 配合使用。GPT / ChatGPT 是主要开发入口，DSH 与 WorkBuddy 复用同一规范。若历史说明与本文冲突，以当前 `main` 上的 CI/部署配置和本规范为准；历史说明中的直接推送、直接生产部署指令不得执行。
> 详细模块依赖、共享热点和多会话责任边界见 [模块边界与并行开发责任图](architecture/MODULE_BOUNDARIES_AND_OWNERSHIP.md)；当前开放 PR 的文件交集与 CI 状态见 [并行开发架构审计](audit/并行开发架构审计-2026-10-21.md)。

## 1. 基本工作流与 PR 生命周期

1. 从最新主分支创建一个短生命周期的任务分支，先明确任务目标、验收标准和计划修改路径。
2. **一个明确、可验收的功能目标对应一个 PR。** PR 可以修改多个文件；紧密耦合的前后端、测试和文档可以放在同一个 PR，但必须围绕同一验收目标并解释依赖。无关功能分开提交。
3. 在任务范围和分支确定后，**尽早创建 Draft PR**，公开目标、文件范围、负责人、依赖和初步验证计划，帮助其他会话避开冲突。未完成的功能保持 Draft，不为提前合并而降低质量门槛。
4. 每个 PR 独立审查、独立验证。满足审查与 CI 门槛后及时合并，**不等待无关 PR 一起完成**；避免积累大量已完成但未审查的 PR。
5. 有实际依赖关系的 PR 按顺序合并，例如先合并基础组件、API 契约或 schema，再处理依赖它的功能。每次合并后，检查所有其他开放 PR：是否落后于最新主分支、是否需要解决冲突、是否影响测试；更新分支后重新运行受影响的验证。
6. PR 描述明确变更范围、接口/数据影响、风险、测试、未验证项和回滚方式。CI 必须针对 PR 当前 HEAD 通过；新提交产生后，旧 SHA 的绿灯不代表新 HEAD 已通过。
7. GPT / ChatGPT 是本项目主要开发入口，负责重点代码审查、跨 PR 依赖协调、合并顺序和最终集成验收。DSH 与 WorkBuddy 等其他开发会话可以承担独立功能实现和初步测试，但应提供可复核的差异、测试命令、结果和对应 SHA。
8. 仅通过 PR 合并到主分支。合并后检查主分支 CI；只有影响 Cloudflare Pages 的代码/配置改动才触发发布。实际发生部署时，再检查部署结果与线上健康检查。纯文档和仅自建 FastAPI 的改动不应无条件发布静态站点。PR 绿灯不等于部署成功，生产验收必须有独立证据。

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
node scripts/agent-preflight.mjs --paths path/to/file1 path/to/file2
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

采用**按路径触发、按风险升级**的验证方式，不再让每次提交都重复执行整套测试。工作流的实际路径判定以 `.github/workflows/deploy.yml` 为准；本节定义预期行为。

### 快速通道

| 改动类型 | 必需检查 | 默认跳过 |
|---|---|---|
| 纯文档/说明文件 | 文档差异与链接人工检查 | 前端构建、浏览器、后端与 Cloudflare 测试；不触发 Pages 发布 |
| 前端逻辑/组件测试文件，但不改页面行为 | `npm --prefix frontend test` | 构建、bundle、浏览器和后端回归 |
| UI、路由、主题、布局、动效 | 前端测试、构建、bundle 检查、Chromium 浏览器烟测 | 不相关的 FastAPI 与物理基准测试 |
| FastAPI 自建后端 | `python -m pytest backend -q` | 不相关的前端构建和 Pages 发布 |
| 学习内容/物理基准 | 对应教学基准脚本；若改动前端内容则同时运行前端测试/构建 | 无关后端回归与浏览器测试 |
| Cloudflare Functions、D1 schema、Wrangler 或发布工作流 | 前端/API 相关测试、构建产物（发布需要时）及隔离 Pages 运行时检查 | 不相关的 UI 浏览器烟测 |

### 高风险升级

- 认证/授权、文件访问权限、数据库 schema/迁移、双后端契约或核心依赖升级，必须运行受影响的前后端回归与隔离运行时检查；如果同时改 UI，再运行浏览器烟测。
- 一次 PR 跨越多个模块或无法明确划分影响范围时，使用完整相关回归，不要把“改动文件少”误当成低风险。
- Chromium 烟测只在页面、路由、主题、组件、全局样式或烟测脚本发生变化时运行。烟测失败时先看具体失败断言与截图/日志；若是时间敏感的动画断言，应修正不稳定的等待条件或真实 UI 缺陷，不要通过跳过烟测来制造绿灯。

### 合并与发布

- PR 的验证必须对应当前候选代码；有新的提交就重新运行受影响的检查。
- 主分支不再对每个提交机械地重跑所有测试，而是根据合并提交的实际文件范围执行相关验证。Pages 相关改动在验证/构建成功后部署同一工作流生成的产物，并执行线上健康、公开页面与匿名授权检查。
- 纯文档和仅自建 FastAPI 的改动不触发 Cloudflare Pages 发布。`[skip-prod-deploy]` 仍可阻止一次发布；手动 `workflow_dispatch` 默认不部署，只有显式勾选 `deploy_production` 才发布。
- 如果发布工作流本身发生变化，至少运行隔离 Cloudflare 检查与发布构建；若更改影响应用代码，还要按相应路径运行应用测试。
- 不用旧 SHA 的绿灯证明新 SHA 已验证；不把构建成功表述为线上行为已经验收。

### 常用命令（按需选择，不要无条件全部执行）

```bash
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run check:bundle
npx --prefix frontend playwright install --with-deps chromium
node frontend/tests/audit-browser-smoke.mjs
node scripts/verify-cloudflare.mjs
python -m pytest backend -q
python frontend/public/learning/two_body_decay.py
```

浏览器验收重点包括：主题切换、桌面/移动端布局、导航与关键交互、控制台错误、失败请求以及减少动态效果偏好。安全测试重点包括匿名访问、角色权限、资源所有权和双后端授权一致性。

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
