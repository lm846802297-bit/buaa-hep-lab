# UI 设计约定

- 新建页面或修改页面、组件样式前，必须先阅读项目根目录的 `design.md`，严格遵循其中的颜色、字体、间距、布局、组件和动效规则。
- 优先复用 `frontend/src/index.css` 的设计变量和现有通用组件；新增或调整规范时同步更新 `design.md`，保证所有页面风格一致。

# 并行开发与发布规则

- 本项目以 GPT / ChatGPT 为主要开发入口，DSH 和 WorkBuddy 为辅助工具；三者共用同一套仓库规范。开始编码前必须阅读 `docs/GPT_FIRST_DEVELOPMENT_WORKFLOW.md` 与 `docs/PARALLEL_DEVELOPMENT_WORKFLOW.md`；审计报告是历史快照，开放 PR 状态必须从 GitHub 实时查询。
- 写入任何文件前，先列出拟修改路径并完成实时预检：若环境具备本地 checkout 和已认证的 `gh` CLI，运行 `node scripts/agent-preflight.mjs --paths <path1> <path2> ...`；若 GPT 通过 GitHub 连接器工作或没有 CLI，则用连接器执行等价的只读检查。若预检失败、报告路径交集、远端状态不明或分支落后，必须停止写入并协调；只有用户明确授权时才可使用覆盖选项。记录 main SHA、相关开放 PR HEAD 与 changed-files 证据。
- `main` 是稳定发布分支。默认通过独立任务分支和 PR 开发；禁止直接推送 `main`。
- 一个明确、可验收的功能目标对应一个 PR；确定任务范围后尽早创建 Draft PR，供其他开发会话协调。每个 PR 独立审查、独立验证，满足门槛后及时合并，不等待无关功能。
- 有依赖关系的 PR 按顺序合并；每次合并后检查其他分支是否需要同步最新 main、解决冲突并重新运行受影响的测试。
- GPT / ChatGPT 负责重点代码审查、跨 PR 依赖协调与最终集成验收；DSH、WorkBuddy 等会话可以负责各自功能的实现和初步测试。合并后必须检查 main CI 与部署/健康检查；PR 绿灯不能代替生产验收证据。
- 未经用户明确授权，不执行生产 `pages:deploy`、远程 D1 写入/迁移或其他会改变生产数据与资源的操作。
- 历史版 `docs/CODEX_COLLABORATOR_WORKFLOW.md` 与 `docs/CLOUDFLARE_DEPLOYMENT.md` 包含过期资源名和直接部署/推送指令。在完成统一修订前，不得执行其中与本规则冲突的步骤；以当前工作流文件、`frontend/wrangler.json` 和并行开发规范为准。
- 只有当前 PR HEAD SHA 的 CI 通过，才能把该 PR 标记为通过验证；新提交后必须重新检查对应 SHA 的状态。

# Vibe-Coding 与 Agent Skill 规范

- 项目内置专属全栈开发与定制技能：`vibe-coding-lab-orbit`。
- 规范文件位于 `.agents/skills/vibe-coding-lab-orbit/SKILL.md`，并在 `skills/vibe-coding-lab-orbit/SKILL.md` 镜像归档供开发者查阅。
- GPT / ChatGPT（主要开发入口）、DSH 与 WorkBuddy 在承接功能咨询、业务调整、界面重构、课题组迁移适配、前后端接口对接、数据库迁移或动效调优时，必须先阅读并遵循该 Skill 的标准作业程序。暂不维护其他工具的独立配置。
- 代码变更前后应按任务范围运行相关测试；前端逻辑变更至少执行 `npm --prefix frontend test`，并根据风险执行 build、bundle、浏览器与后端测试。不要在规则中固定一个容易过时的测试数量。
