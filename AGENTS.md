# UI 设计约定

- 新建页面或修改页面、组件样式前，必须先阅读项目根目录的 `design.md`，严格遵循其中的颜色、字体、间距、布局、组件和动效规则。
- 优先复用 `frontend/src/index.css` 的设计变量和现有通用组件；新增或调整规范时同步更新 `design.md`，保证所有页面风格一致。

# 并行开发与发布规则

- 开始编码前必须阅读 `docs/PARALLEL_DEVELOPMENT_WORKFLOW.md`；审计依据与整改顺序见 `docs/audit/并行开发架构审计-2026-10-21.md`。
- `main` 是稳定发布分支。默认通过独立任务分支和 PR 开发；禁止直接推送 `main`。
- 未经用户明确授权，不执行生产 `pages:deploy`、远程 D1 写入/迁移或其他会改变生产数据与资源的操作。
- 历史版 `docs/CODEX_COLLABORATOR_WORKFLOW.md` 与 `docs/CLOUDFLARE_DEPLOYMENT.md` 包含过期资源名和直接部署/推送指令。在完成统一修订前，不得执行其中与本规则冲突的步骤；以当前工作流文件、`frontend/wrangler.json` 和并行开发规范为准。
- 只有当前 PR HEAD SHA 的 CI 通过，才能把该 PR 标记为通过验证；新提交后必须重新检查对应 SHA 的状态。

# Vibe-Coding 与 Agent Skill 规范

- 项目内置专属全栈开发与定制技能：`vibe-coding-lab-orbit`。
- 规范文件位于 `.agents/skills/vibe-coding-lab-orbit/SKILL.md`，并在 `skills/vibe-coding-lab-orbit/SKILL.md` 镜像归档供开发者查阅。
- 任何 AI Agent（如 Antigravity、Claude Code、Cursor、Windsurf、Codex 等）在承接功能咨询、业务调整、界面重构、学科课题组迁移适配、前后端接口对接、数据库迁移或动效调优时，必须先阅读并遵循该 Skill 的标准作业程序。
- 代码变更前后应按任务范围运行相关测试；前端逻辑变更至少执行 `npm --prefix frontend test`，并根据风险执行 build、bundle、浏览器与后端测试。不要在规则中固定一个容易过时的测试数量。
