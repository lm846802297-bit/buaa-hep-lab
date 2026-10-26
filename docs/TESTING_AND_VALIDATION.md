# 测试与验证命令对照表

> 本文记录当前 `main` 中实际存在的验证入口。命令用途来自根目录和 `frontend/` 的 package scripts、`.github/workflows/deploy.yml`、`AGENTS.md` 及对应脚本源码；不把尚未合并的 PR 中新增的检查写成当前能力。
>
> 适用基线：仓库整理阶段的 `main` 提交 `a648585f4f1e6e64cdf896dcbd5a558a351cde60`。后续使用前先确认脚本未被更新。

## 1. 快速选择

| 变更类型 | 最小建议验证 | 何时增加检查 |
|---|---|---|
| 纯 Markdown / 文档导航 | 检查 diff、Markdown 相对链接与引用目标 | 文档变更涉及可执行命令时，核对命令是否真实存在；不需要运行完整前后端测试 |
| 普通 Vue 组件或前端逻辑 | `npm ci`；`npm run test:unit` | 若修改了构建产物、样式入口、公共页面资源，再构建并检查 bundle |
| 页面、样式、主题、路由、公开首页/研究专题导航 | `npm ci`；`npm run test:unit`；`npm run build`；`npm run check:bundle` | 对全局壳层、主题切换、公开首页/专题导航或浏览器烟测脚本的改动，再运行 Chromium 烟测 |
| 后端 FastAPI / SQLite | 安装后端测试依赖；`python -m pytest backend -q` | 涉及认证、授权、资源所有权或数据库迁移时，增加对应的前后端/隔离环境回归 |
| Cloudflare Pages Functions、Wrangler、D1 schema | `npm ci`；`npm run verify:cloudflare` | 前端静态资源或构建入口也变化时，运行 `npm run build` 与 `npm run check:bundle` |
| 教学基准脚本 | `python frontend/public/learning/two_body_decay.py` | 只有相关教学代码或数据变化时才需要 |
| Demo 版构建 | `npm --prefix frontend run build:demo` | 与生产构建分别检查；Demo 数据应保持合成数据并与生产后端隔离 |
| GitHub Actions / 发布规则 | 检查工作流 diff、触发条件、权限、环境边界和准确 SHA 上的运行结果 | 不能用旧 SHA 的绿灯代替新 SHA；CI 不可用时明确记录阻塞，不标记通过 |

## 2. 安装依赖

从仓库根目录运行：

```bash
npm ci
```

根目录 `package.json` 的 `postinstall` 会继续执行 `npm --prefix frontend ci`，因此会安装根适配器与前端依赖。若只做前端局部工作，也可按需在 `frontend/` 安装依赖，但不要在没有必要时重复安装。

后端测试依赖：

```bash
python -m pip install -r backend/requirements-test.txt
```

该文件会引用 `backend/requirements.txt`，再安装 pytest 和 httpx。请使用项目虚拟环境；不要把本地数据库、环境变量文件或凭据提交到仓库。

## 3. 前端测试、构建与 bundle 检查

### 单元测试

```bash
npm run test:unit
```

根脚本会调用 `npm --prefix frontend test`。当前前端测试脚本先运行 `frontend/scripts/check-topic-illustrations.mjs`，再运行 Vitest。它不是浏览器端到端测试的替代品。

### 生产形态本地构建

```bash
npm run build
```

当前根脚本依次执行：

1. `npm --prefix frontend run build`；
2. `npm run verify:cloudflare`；
3. 将 `frontend/dist` 与 `frontend/functions` 复制到根目录的 `dist`、`functions`。

因此，`npm run build` 不只是 Vite 打包，还包含本地 Cloudflare Functions 验证。它不会因为命令名里有 build 就自动部署生产环境。

**Windows 注意：** 根目录脚本最后使用 `rm -rf` 与 `cp -a`，面向 POSIX shell；在原生 PowerShell/CMD 中可能失败。Windows 原生环境可分别运行 `npm --prefix frontend run build`、`npm run verify:cloudflare` 和 `npm run check:bundle`，或在 WSL/Git Bash 中运行根目录构建。

### 公开入口与 bundle 检查

```bash
npm run check:bundle
```

此检查依赖前一步生成的 `frontend/dist/.vite/manifest.json`，会检查公开入口依赖、预渲染页面内容、公开白名单、私有路由的 noindex 规则及 sitemap。脚本会输出 gzip 体积测量值；**当前脚本没有固定的 gzip 字节数阈值**，不要把测量值描述成固定体积预算门槛。

### Demo 构建

```bash
npm --prefix frontend run build:demo
```

Demo 构建使用 `VITE_DEMO_MODE=true` 和 GitHub Pages base 路径，产物位于 `frontend/dist-demo`。它与生产形态构建的用途不同，不应把 Demo 构建成功当成生产构建或后端权限测试通过。

## 4. Chromium 浏览器烟测

仅在高影响的 UI 变更时运行，例如全局壳层、路由、主题系统、公开首页/研究专题导航，以及浏览器烟测脚本本身的改动。

先完成构建，再安装 Playwright 对应的 Chromium（Windows 原生环境请按上面的构建平台说明选择命令）：

```bash
npm run build
npx --prefix frontend playwright install chromium
node frontend/tests/audit-browser-smoke.mjs
```

脚本从 `frontend/dist` 启动本地静态服务器，并检查多种视口尺寸、公开页面布局、导航/目录交互、资源加载、浏览器错误和截图证据。默认输出目录是 `frontend/test-results/audit/`，可用 `AUDIT_OUTPUT_DIR` 覆盖。

注意：

- 没有可用 Chromium 时，不能把“脚本存在”当成烟测通过。
- 浏览器烟测截图是特定构建与视口下的证据；报告应记录 commit SHA。
- 普通组件的小改动不必机械启动全套浏览器测试，按 `AGENTS.md` 的风险范围选择验证。

## 5. 后端回归测试

先安装依赖，再运行：

```bash
python -m pytest backend -q
```

GitHub Actions 当前在隔离环境中设置专用测试变量：

- `LABHUB_SECRET_KEY`：仅供测试使用的非生产密钥；
- `LABHUB_DB_PATH`：指向临时测试数据库；
- `SEED_DEMO_DATA=1`：启用测试需要的演示种子数据。

在 PowerShell 中需要本地设置时，可使用测试专用值，例如：

```powershell
$env:LABHUB_SECRET_KEY = "isolated-local-test-secret-never-for-production-32-plus"
$env:LABHUB_DB_PATH = "$env:TEMP\buaa-hep-test.db"
$env:SEED_DEMO_DATA = "1"
python -m pytest backend -q
```

不得把这些示例值用于生产，也不得让测试指向生产 D1、生产数据库或真实用户数据。认证/授权和迁移相关变更必须确认测试隔离生效。

## 6. Cloudflare Functions 与 D1 隔离检查

```bash
npm run verify:cloudflare
```

当前脚本会构建 Pages Functions，并使用 Miniflare 创建临时本地 D1 数据库和随机测试密钥，验证 API 行为。源码注释明确指出它不访问远程资源。

- 如果只修改 Functions、Wrangler 或 D1 schema，可单独运行此检查。
- 如果同时修改前端入口或构建资源，优先运行 `npm run build`，它已包含此验证，然后运行 `npm run check:bundle`。
- 本地 Miniflare 通过不等于 Cloudflare 预览或生产环境绑定已经正确配置；远程环境状态必须另行核验。

## 7. 教学基准

当教学基准脚本或其输入数据变化时运行：

```bash
python frontend/public/learning/two_body_decay.py
```

这项检查与常规前端单元测试、FastAPI 回归测试相互独立。

## 8. 本地 Pages 预览与生产部署的区别

| 命令 | 用途 | 边界 |
|---|---|---|
| `npm --prefix frontend run preview` | 预览已构建的前端静态产物 | 不等于 Pages Functions / D1 的完整本地运行时 |
| `npm --prefix frontend run pages:dev` | 使用 Wrangler 本地运行 Pages 目录 | 运行前确认 `frontend/dist` 已构建；仅使用隔离的本地资源 |
| `npm --prefix frontend run pages:deploy` | 调用 `wrangler pages deploy`，并指定 `--branch=main` | **可能触发生产分支部署；未经明确授权，不要运行** |

合并 PR、预览部署和生产部署是三种不同事件。文档整理 PR 不需要手动部署。生产发布只应按仓库现有发布规则、权限和用户授权执行。

## 9. 当前工作流的路径门控

`.github/workflows/deploy.yml` 会先根据 PR 的文件路径分类，再决定是否运行前端、后端、教学、Cloudflare、构建和浏览器检查。因此：

- 纯文档 PR 不一定运行前后端测试；这是路径门控设计，不代表这些测试通过。
- 后端文件变更会选择后端测试；高影响前端变更会选择浏览器烟测。
- 修改认证、权限或 D1 schema 等高风险路径时，工作流会扩大验证范围。
- 如果 `changes` 分类任务本身失败，且没有执行步骤/日志，结论应记为“验证流程阻塞/失败原因未明”，不能说成应用测试失败，也不能直接把它当成通过。
- CI 因计费、额度、runner 或其他基础设施问题无法运行时，应记录准确 SHA、运行链接、失败/跳过状态及未验证范围；不能用旧提交结果替代。

PR #57 中提议的模块边界与 Cloudflare 类型检查目前不作为本表的已合并基线。只有在相关实现合并到 `main` 后，才把它们列为当前可用命令。

## 10. 结果记录模板

每次报告验证结果时，至少记录：

- **变更范围：** 修改的路径与功能；
- **目标 SHA：** 被验证的准确提交；
- **命令/环境：** 实际执行的命令、运行环境和隔离方式；
- **结果：** 通过、失败、跳过、未运行或被基础设施阻塞；
- **证据：** 测试摘要、工作流运行链接或截图/日志位置；
- **限制：** 未运行的测试、未覆盖的环境与仍待确认的事项。

不要将“静态审查完成”“预览构建成功”“单元测试通过”和“生产部署成功”混为同一种状态。
