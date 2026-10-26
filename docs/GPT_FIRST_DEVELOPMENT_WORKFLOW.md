# GPT 优先的快速开发工作流

本页只规定日常开发最短路径。项目规则以根目录 `AGENTS.md` 为准；多会话或共享文件任务再阅读 [并行开发规范](PARALLEL_DEVELOPMENT_WORKFLOW.md)。

## 日常流程

1. **理解改动。** 阅读 `AGENTS.md` 和直接相关的源码；改 UI 时再读 `design.md`。确定目标与要改的文件。
2. **检查冲突。** 确认最新 `main` SHA，只查看与这些文件有交集的开放 PR。只有涉及共享热点、多会话或文件交集不明确时，才运行 `scripts/agent-preflight.mjs` 并执行完整协调。
3. **开发并提交。** 在任务分支修改。普通小功能无需先建 Draft PR；长任务或需要其他会话协调时再提前建立 Draft。一个 PR 对应一个明确目标。
4. **运行相关检查。** 不要对每个小改动机械运行整套测试：
   - 文档：检查差异与链接。
   - 前端代码：`npm --prefix frontend test`；前端源文件/资源变化再运行 `npm --prefix frontend run build` 与 `npm --prefix frontend run check:bundle`。
   - 全局壳层、路由、主题、公开首页/研究专题导航或烟测脚本：额外运行 Chromium 浏览器烟测。
   - 后端：`python -m pytest backend -q`。
   - Cloudflare Functions、Wrangler、D1 schema：运行 `node scripts/verify-cloudflare.mjs`；认证、授权、文件权限或 schema 变更需同时验证相关前后端路径。
5. **合并与发布。** PR 最新 HEAD 的相关 CI 通过后合并。主分支只重新构建最终版本、检查公开页面完整性；仅 Pages 相关变更自动部署，并执行线上健康和匿名授权检查。发布工作流会核对合并 PR 的最新 HEAD 有成功 CI，因此不再在合并后重复整套单元、后端和浏览器测试。
6. **交接。** 简要记录改动、PR/提交 SHA、实际运行的测试、发布状态和仍未验证的风险。未运行的检查不要写成已通过。

## 何时升级到完整流程

以下情况才采用更完整的审查与验证：认证/授权、数据库迁移、双后端 API 契约、文件上传/下载、邮件与外部 URL 抓取、部署配置、跨模块重构，或多个会话同时修改共享文件。细节见 `docs/PARALLEL_DEVELOPMENT_WORKFLOW.md` 和 `.agents/skills/vibe-coding-lab-orbit/SKILL.md`。

## 生产安全边界

不手动执行生产部署、远程 D1 写入/迁移或生产数据修改，除非用户明确授权。自动发布仅由主分支工作流按已验证的 PR 与文件范围触发。
