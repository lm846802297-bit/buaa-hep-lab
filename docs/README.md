# 文档导航

本文是 `docs/` 下文档的入口索引，帮助开发者先找到权威说明，再阅读历史审计或专项材料。它不替代各文档本身，也不表示所有记录中的状态仍然有效。

## 开始这里

| 目的 | 文档 | 维护范围 |
|---|---|---|
| 了解项目当前开发顺序 | [网站设计与开发路线图](DEVELOPMENT_ROADMAP.md) | 模块、阶段、优先级、当前待办；状态需要随实际进度更新 |
| 修改 UI 或前端样式 | [根目录设计规范](../design.md) | UI 实现约定、主题与组件约束 |
| 了解系统边界 | [模块边界与所有权](architecture/MODULE_BOUNDARIES_AND_OWNERSHIP.md) | 模块职责和跨模块依赖 |
| 了解文献与附件存储 | [文献与附件存储设计](architecture/BUAA_HEP_Hub_文献与附件存储设计方案.md) | 存储方案与边界 |
| 了解部署流程 | [Cloudflare 部署指南](CLOUDFLARE_DEPLOYMENT.md) | Pages、D1 与部署步骤；实际环境状态需另行核验 |
| 准备研究内容 | [研究内容模板](research-content-template.md) | 新增研究内容时使用的模板 |
| 了解仓库组织计划 | [仓库整理计划](REPOSITORY_ORGANIZATION_PLAN.md) | 文档治理和后续低风险整理顺序 |

## 按用途浏览

### 设计与产品规划

- [官网 UI 与前端改版设计方案](design/BUAA-HEP-Hub官网UI与前端改版设计方案.md)：页面、布局与视觉方向的详细设计材料。
- [网站国际化对标研究](<planning/BUAA HEP Hub 国际物理研究组网站深度对标研究.md>)：外部网站研究与设计参考。
- [网站审计与物理内容完善方案](planning/BUAA_HEP_Hub_网站审计与物理内容完善方案.md)：网站内容、公开信息和待完善事项的审计方案。
- [命运石之门风格转译与验收方案](命运石之门风格转译与验收方案.md)：终端主题的设计转译与验收约定。
- [研究方向插图术语约定](RESEARCH_TOPIC_ILLUSTRATION_TERMINOLOGY.md)：研究方向插图的术语与标注约束。

### 架构与开发流程

- [模块边界与所有权](architecture/MODULE_BOUNDARIES_AND_OWNERSHIP.md)：模块职责与依赖边界。
- [GPT 首次开发工作流](GPT_FIRST_DEVELOPMENT_WORKFLOW.md)：AI 协作开发流程。
- [Codex 协作者工作流](CODEX_COLLABORATOR_WORKFLOW.md)：协作与交接规则。
- [并行开发工作流](PARALLEL_DEVELOPMENT_WORKFLOW.md)：多分支/并行任务协调。
- [Cloudflare 部署指南](CLOUDFLARE_DEPLOYMENT.md)：托管部署操作。
- [云迁移目录](cloud-migration/README.md)：自建部署向云端迁移的专项材料。

### 审计、测试与证据

`audit/` 保存审计报告、核查记录、测试基线和证据快照。此类材料常带有时间、提交 SHA 或特定环境假设；引用前应核对日期、目标提交与适用范围，不能仅因文件存在就视为当前结论。

当前主要材料包括：

- [PR HEAD 与 CI 证据完整性](audit/PR_HEAD_CI_INTEGRITY.md)
- [SEC-04 bcrypt 基准](<audit/SEC-04-bcrypt基准.md>)
- [物理内容审查](audit/physics-content-review.md)
- [实施与验收报告](<audit/实施与验收报告.md>)
- [并行开发架构审计](<audit/并行开发架构审计-2026-10-21.md>)

其他审计清单、论文候选和 JSON 基准文件保留在同一目录，不应在未检查引用关系前删除或移动。

### 图片与素材

- `images/`：文档中引用的图片和图形素材。删除或移动前必须检查 Markdown、README 与外部链接引用。

## 文档维护约定

1. **一个主题指定一个主要维护位置。** 其他文档通过链接引用，避免复制第二份完整清单。
2. **区分规范、计划和证据。** 规范说明长期规则；路线图说明阶段顺序；审计记录说明某次检查在特定提交上的结果。
3. **状态必须带上下文。** 测试或部署结论应尽可能记录提交 SHA、日期、环境和实际命令。
4. **先检查引用，再移动或删除。** 初期整理优先新增索引和修正入口，不做批量重命名。
5. **不要把 PR 分支中的未合并文档写成 main 已有内容。** PR 中的提案在合并前仍属于候选材料。
6. **公开与内部内容分离。** 不将秘密、生产数据、用户信息或未经批准的内部研究材料写入公开文档。
