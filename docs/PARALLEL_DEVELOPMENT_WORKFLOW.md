# 并行开发与 PR 协作规范

> 本文是**多会话、共享文件和跨模块任务的高级参考**，不是每个小改动都必须执行的检查清单。普通任务按根目录 `AGENTS.md` 的快速流程即可。

## 1. 基本工作流

1. 从最新 `main` 创建任务分支；一个 PR 围绕一个清晰目标。
2. 普通小功能完成后再开 PR。只有长任务、跨会话或需要提前协调时才建 Draft PR。
3. PR 只运行与改动相关的检查；最新 HEAD 通过后即可合并，不等待无关 PR。
4. 开工时只查看与计划修改文件有交集的开放 PR，不必逐个检查整个队列。共享文件由一个任务主导；存在交集时先协调所有权。
5. 合并后，主分支仅构建最终 Pages 版本、检查公开页面并执行发布后的健康/匿名授权检查；不重复 PR 阶段的单元、后端和浏览器测试。
6. 认证、授权、数据迁移、文件/邮件/外部网络与双后端契约属于高风险任务，按影响范围升级验证。
7. 不直接推送 `main`；不手动执行生产部署或远程 D1 写入/迁移，除非用户明确授权。

### 多会话或共享热点任务的额外预检

只有多个会话可能修改相同路径、要修改全局入口/主题/路由/数据库 schema，或无法确认文件归属时，才执行完整预检：

```bash
node scripts/agent-preflight.mjs --paths path/to/file1 path/to/file2
```

将路径替换为本任务计划修改的文件。工具会读取最新 `main` 和开放 PR 的文件交集；如果检测到冲突，先确认主导 PR 与依赖顺序，不覆盖其他会话的分支。普通独立页面或文档改动无需机械运行这一步。

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
| 普通页面/组件改动 | 前端测试、构建与公开页面完整性检查 | 浏览器烟测及不相关后端测试 |
| 全局壳层、路由、主题、公开首页/专题导航、烟测脚本 | 前端测试、构建、公开页面检查、Chromium 烟测 | 不相关的 FastAPI 与物理基准测试 |
| FastAPI 自建后端 | `python -m pytest backend -q` | 不相关的前端构建和 Pages 发布 |
| 学习内容/物理基准 | 对应教学基准脚本；若改动前端内容则同时运行前端测试/构建 | 无关后端回归与浏览器测试 |
| Cloudflare Functions、D1 schema、Wrangler 或发布工作流 | 前端/API 相关测试、构建产物（发布需要时）及隔离 Pages 运行时检查 | 不相关的 UI 浏览器烟测 |

### 高风险升级

- 认证/授权、文件访问权限、数据库 schema/迁移、双后端契约或核心依赖升级，必须运行受影响的前后端回归与隔离运行时检查；如果同时改 UI，再运行浏览器烟测。
- 一次 PR 跨越多个模块或无法明确划分影响范围时，使用完整相关回归，不要把“改动文件少”误当成低风险。
- Chromium 烟测只在页面、路由、主题、组件、全局样式或烟测脚本发生变化时运行。烟测失败时先看具体失败断言与截图/日志；若是时间敏感的动画断言，应修正不稳定的等待条件或真实 UI 缺陷，不要通过跳过烟测来制造绿灯。

### 合并与发布

- PR 的验证必须对应当前候选代码；有新的提交就重新运行受影响的检查。
- PR 阶段执行相关测试；合并后的主分支只重新构建最终版本、检查公开页面完整性，再部署 Pages 并执行线上健康与匿名授权检查，不重复单元、后端和浏览器测试。发布前会核对合并 PR 最新 HEAD 的 CI 已成功。
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
