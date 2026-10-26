# 北航粒子物理研究组网站（暂定名称）

面向高能粒子物理研究组的公开学术官网与组内协作平台。本站基于 [LabOrbit](https://github.com/Chocologism/lab-orbit) 项目定制，当前名称仍为暂定名称。

- **网站入口：** <https://buaa-hep-hub.pages.dev/>
- **Windows 本地使用：** [北航课题组使用说明](北航课题组使用说明.md)
- **部署与存储边界：** [Cloudflare Pages 部署说明](docs/CLOUDFLARE_DEPLOYMENT.md)
- **开发与验证规则：** [AGENTS.md](AGENTS.md)
- **文档导航：** [文档索引](docs/README.md)
- **测试与验证命令：** [测试与验证命令对照表](docs/TESTING_AND_VALIDATION.md)
- **研究内容模板：** [研究专题审核与复现模板](docs/research-content-template.md)
- **审计与验收记录：** [实施与验收报告](docs/audit/实施与验收报告.md)
- **来源与协作致谢：** [CONTRIBUTORS.md](CONTRIBUTORS.md)

> 网站入口不等同于部署验收结论。当前线上状态应以对应的发布记录和健康检查为准；仅凭仓库配置不能认定某次生产部署成功。

## 项目功能

- **公开学术官网：** 研究方向、代表论文、团队与学术指导信息、公开学术资源。
- **研究专题与文献：** 研究方向导航、论文元数据、外部文献入口与 BibTeX 导出。
- **组会与协作：** 登录后的学术日程、文献归档、资源和个人工作台，具体权限以应用实现为准。
- **学习与计算：** `/learning` 提供基础学习资料与计算示例。现有内容仍有待学术维护者审核；不得把学习初稿当作已独立复现的研究结论，也不要存放未公开或保密材料。
- **演示模式：** 演示数据与真实协作数据隔离。上游 [LabOrbit 在线演示](https://chocologism.github.io/lab-orbit/) 属于独立演示站点，不是本仓库生产实例。

## 架构与部署状态

| 形态 | 主要组件 | 说明 |
|---|---|---|
| 前端 | Vue 3、Vite | 公开页面、工作台与演示构建 |
| 自建后端 | FastAPI、SQLite | 适用于本地或自建服务，具体启动方式见使用说明 |
| Cloudflare 托管 | Pages Functions、D1 | 当前仓库配置声明 D1 绑定 `DB` |
| 对象存储 | R2（可选扩展） | 当前配置未声明 `FILES_BUCKET`；未绑定时附件回退到 D1，单文件上限为 1 MiB |

部署凭据和生产数据不存放在公开源码中。不要将密钥、初始化码、数据库文件或用户数据提交到仓库。R2 是否启用必须依据实际绑定与隔离环境上传/下载验收确认，不能从代码中存在相关适配器推断。

生产发布由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 管理。发布必须满足工作流中的验证与发布条件；带有 `[skip-prod-deploy]` 标记的变更不会按常规路径自动发布，手动触发时也必须显式选择 `deploy_production`。未经明确授权，不要直接运行 `wrangler pages deploy` 或对远程 D1 执行写入/迁移。

## 本地开发与验证

### 环境要求

- Node.js 24（与当前 CI 配置一致）。
- Python 3.11 或更新版本（运行自建后端及其测试时需要）。

Windows 用户请优先按[课题组使用说明](北航课题组使用说明.md)启动本地版本。源码构建与本地运行是两回事：构建前端不会自动启动 FastAPI 服务，也不会连接生产数据库。

### 常用命令

从仓库根目录执行：

```bash
# 安装根目录与前端依赖
npm ci

# 前端单元测试
npm run test:unit

# 构建前端，并执行本地 Cloudflare Functions 隔离验证
npm run build

# 检查公开入口、预渲染内容与 bundle 依赖
npm run check:bundle
```

后端回归测试：

```bash
python -m pip install -r backend/requirements-test.txt
python -m pytest backend -q
```

根据改动范围选择必要检查，不要求纯文档修改运行完整应用测试。新提交必须用对应 SHA 的实际结果验收；跳过、未运行或被基础设施阻塞的检查不能记作通过。更细的验证入口见 [测试与验证命令对照表](docs/TESTING_AND_VALIDATION.md)；开发规则见 [AGENTS.md](AGENTS.md)。

## 科研记录与学术内容边界

拟议的科研记录索引将作为协作导航与展示层，不替代研究仓库中的研究变更、运行清单、产物指纹和 claim–evidence 记录。此处描述的是设计方向，不表示相关生产 API、数据库表、迁移或自动执行器已经实现。

公开研究内容应经过来源核对与学术审核，并区分模型预言、实验灵敏度、实验允许/排除与已观测结论。未经批准，不要将内部研究资料、未公开结果或用户信息放入公开页面或静态文件。

## 上游来源、贡献与许可

本项目基于 [LabOrbit](https://github.com/Chocologism/lab-orbit) 定制。上游作者、协作贡献和使用的开源组件见 [CONTRIBUTORS.md](CONTRIBUTORS.md)；上游项目的操作说明和演示数据不一定适用于本仓库。

当前仓库根目录未发现 `LICENSE` 文件，因此不要仅凭上游 README 中的徽章推断本仓库自身的许可状态。公开再分发前应核对上游许可证，并确认本仓库是否需要补充明确的许可文件。

---

# English Documentation

This repository contains a customized academic website and collaboration hub for a high-energy particle physics group. It is derived from [LabOrbit](https://github.com/Chocologism/lab-orbit); the site name is still provisional.

## Key links

- **Website:** <https://buaa-hep-hub.pages.dev/>
- **Windows setup and user guide:** [北航课题组使用说明](北航课题组使用说明.md)
- **Cloudflare deployment boundaries:** [Deployment guide](docs/CLOUDFLARE_DEPLOYMENT.md)
- **Development rules:** [AGENTS.md](AGENTS.md)
- **Documentation index:** [docs/README.md](docs/README.md)
- **Test and validation commands:** [Testing and validation matrix](docs/TESTING_AND_VALIDATION.md)
- **Research-content template:** [Review and reproducibility template](docs/research-content-template.md)
- **Audit record:** [Implementation and acceptance report](docs/audit/实施与验收报告.md)
- **Credits:** [CONTRIBUTORS.md](CONTRIBUTORS.md)

The website URL alone is not evidence of a successful deployment. Check the corresponding release run and health checks for current deployment status.

## Features and architecture

- Public research pages, paper links, team/advisor information and curated academic resources.
- Research-topic navigation, literature metadata and BibTeX export.
- Authenticated collaboration features for seminars, literature, resources and personal workspace.
- A `/learning` area with introductory notes and computation examples. Some material remains a draft pending academic review; it must not be presented as independently reproduced research.
- Vue 3/Vite frontend; FastAPI/SQLite self-hosted backend; Cloudflare Pages Functions with D1 for the hosted deployment.

The current Cloudflare configuration declares D1 binding `DB` and does not declare `FILES_BUCKET`/R2. Without an R2 binding, the current attachment fallback is D1 with a 1 MiB per-file limit. Credentials, production databases and user data must never be committed to source control.

Production release is governed by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Follow its validation and release conditions; do not manually run `wrangler pages deploy` or write to remote D1 without explicit authorization. The upstream [LabOrbit demo](https://chocologism.github.io/lab-orbit/) is a separate demo site, not this repository's production instance.

## Development and testing

Use Node.js 24 for the current CI-compatible frontend workflow. Python 3.11+ is required for the self-hosted backend and its tests.

From the repository root:

```bash
npm ci
npm run test:unit
npm run build
npm run check:bundle
```

For backend tests:

```bash
python -m pip install -r backend/requirements-test.txt
python -m pytest backend -q
```

Choose checks according to the change. A skipped or blocked check is not a pass, and validation results must refer to the exact commit SHA. See the [test and validation matrix](docs/TESTING_AND_VALIDATION.md) for available checks and [AGENTS.md](AGENTS.md) for development rules.

The proposed research-record index is intended as a collaboration/navigation layer, not a replacement for canonical research-change records, run manifests, artifacts or claim–evidence records. This describes the intended design only; it does not imply that a production API, database migration or execution service exists.

## Upstream credit and licensing

This project is customized from [LabOrbit](https://github.com/Chocologism/lab-orbit). See [CONTRIBUTORS.md](CONTRIBUTORS.md) for project provenance and acknowledgements. Upstream setup instructions and demo data may not apply to this repository.

No root-level `LICENSE` file is currently present in this repository. Do not infer this repository's license solely from an inherited upstream README badge; verify the upstream license and confirm the appropriate license file before redistribution.
