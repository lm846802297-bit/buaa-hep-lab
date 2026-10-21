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

## 本次核查记录（2026-10-21）

仓库：`lm846802297-bit/buaa-hep-lab`；PR：[#23](https://github.com/lm846802297-bit/buaa-hep-lab/pull/23)。

- PR API 的 `head.sha`：`dfdd08053ff3ab10f212e14b3503581495a3f276`。
- `refs/pull/23/head`：`dfdd08053ff3ab10f212e14b3503581495a3f276`。
- 源分支 `docs/module-boundaries-parallel-audit`：`2c772b70147899bc2dedffdc95c598063026fb40`，是上述 PR head 的后代提交。
- Actions run [#39621491530](https://github.com/lm846802297-bit/buaa-hep-lab/actions/runs/39621491530) 成功，但其 `head_sha` 是 `dfdd0805...`。
- 未找到针对 `2c772b70...` 的 Actions run。

**结论：阻塞。** 旧 SHA 的 CI 通过只证明旧提交通过；不能证明源分支最新提交已进入 PR，也不能作为最新提交的合并依据。应先解决引用同步，再针对同步后的精确 HEAD 重新验证。本记录不授权合并、部署或对其他功能分支写入。
