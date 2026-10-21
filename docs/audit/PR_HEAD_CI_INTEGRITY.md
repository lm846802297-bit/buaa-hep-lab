# PR HEAD 与 CI 证据一致性检查

> 用途：防止把旧提交的 CI 绿灯误当成当前 PR 的验收结果。
> 规则：只有 PR 当前 head SHA 与成功 CI run 的 head SHA 完全一致时，才可将该 PR 标记为通过验证。

## 强制核对顺序

1. 读取 PR 元数据中的 `head.sha`、`head.ref` 和 `base.sha`。
2. 独立读取源分支的最新 SHA。
3. 如 PR head SHA 与源分支 SHA 不同，立即标记为阻塞；不要合并、不要以旧 CI 代替验证。
4. 查询 PR head SHA 对应的 Actions runs，并确认 run 的 `head_sha` 与 PR head 完全一致。
5. 若源分支已前进但 PR head 未前进，先确认 GitHub 引用状态；只采用可审计、非破坏性的同步方法。未经明确授权，不 force-push、不关闭重建 PR、不覆盖他人分支。
6. 同步后重新读取 PR head、分支 SHA 和 CI。必须三者一致，且最新 HEAD 的所有必需检查通过。
7. 将验证结论记录为“已验证”“阻塞”或“未验证”，并附完整 SHA、Actions run 链接和时间。

## 历史核查记录（2026-10-21，已由后续记录覆盖）

仓库：`lm846802297-bit/buaa-hep-lab`；PR：[#23](https://github.com/lm846802297-bit/buaa-hep-lab/pull/23)。

- 当时 PR API 的 `head.sha`：`dfdd08053ff3ab10f212e14b3503581495a3f276`。
- 当时 `refs/pull/23/head`：`dfdd08053ff3ab10f212e14b3503581495a3f276`。
- 当时源分支 `docs/module-boundaries-parallel-audit`：`2c772b70147899bc2dedffdc95c598063026fb40`，是上述 PR head 的后代提交。
- Actions run [#39621491530](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39621491530) 成功，但其 `head_sha` 是 `dfdd0805...`。
- 当时未找到针对 `2c772b70...` 的 Actions run。

**当时结论：阻塞。** 旧 SHA 的 CI 通过只证明旧提交通过；不能证明源分支最新提交已进入 PR。该结论准确描述了当时的状态，但不再代表当前状态。

## 同步恢复与 CI 验证记录（2026-10-21）

- PR：[#23](https://github.com/lm846802297-bit/buaa-hep-lab/pull/23)。
- 已同步的 PR HEAD 与源分支 HEAD：`6a6fa8ff2354e15ad04b5e26cce3fedfa2e92281`。
- 目标分支 `main` 基线：`7b30644199310c82f769079eb65ada615c0a5c0b`。
- 相对该基线的比较结果：ahead 15、behind 0；未发现合并冲突（GitHub `mergeable: true`）。
- 对应 Actions run [#39627856559](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39627856559) 的 `head_sha` 与上述 SHA 完全一致。
- `validate` job 通过；前端/API 安全回归、前端构建、完整 FastAPI 后端回归、浏览器 smoke、隔离 Pages 运行时安全检查均成功。
- `deploy` job 跳过，符合 PR 验证流程预期；该次运行没有部署生产环境。

**该快照结论：已解除 HEAD 同步阻塞，且 SHA `6a6fa8ff...` 的验证通过。** 本节是对该次检查的可追溯记录。后续任何新提交都必须以其自己的完整 HEAD SHA 重新核对 CI；不得将本次绿灯移用于新提交。

## 本次后续修订的验收要求

本文件本身的修订会生成新的提交，因此不能仅凭上面的历史成功记录判定最新 PR 已通过。必须等待修订后新 HEAD 对应的 Actions 验证完成，并再次确认 PR HEAD、源分支 HEAD 与 CI 的 `head_sha` 完全一致后，才能作出合并判断。
