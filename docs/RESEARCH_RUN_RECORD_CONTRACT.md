# 科研记录索引与计算记录 API 契约（Research Record Index）

- **状态：设计提案 v1.0.0，待审阅。**
- **本次范围：** 定义课题组网站如何索引、展示和授权访问既有研究变更、计算运行、运行清单、产物与 claim–evidence 记录。
- **不在本次范围内：** 生产 API、数据库表、迁移、自动执行器、向研究仓库写入、生产存储绑定或任何生产数据修改。
- **关键设计决定：** 网站数据库是**协作索引与展示层**，不是新的科学记录事实源。不要复制一套与研究仓库并行的 run manifest、artifact 和 claim schema。来源访问默认采用 `link_only`；只有经明确审批的有限摘要/片段才允许作为 `attached_snapshot` 展示。

## 1. 为什么采用索引层，而不是另建一套科学记录

课题组已有独立的 [high-energy-theory-research](https://github.com/lm846802297-bit/high-energy-theory-research) 工作流，用于维护研究变更、运行证据、产物指纹和物理 claim。该仓库的现有结构包括：

- [研究变更 RC-001](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/research/RC-001-vll-higgs-singlet-uv-eft.md) 与 [RC-001 claim–evidence matrix](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/research/RC-001-claim-evidence-matrix.md)；
- 候选 schema 中的 [run](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/schema/v1.4.3.7/schemas/run.schema.json)、[run_manifest](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/schema/v1.4.3.7/schemas/run_manifest.schema.json) 与 [artifact](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/schema/v1.4.3.7/schemas/artifact.schema.json)；
- [Scientific Diff 工作流](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/docs/scientific-diff-workflow.md) 与 [research-change 模板](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/templates/research-change.md)。

这些结构已经覆盖代码/配置/环境快照、运行状态、输入引用、输出、内容指纹、产物来源和 claim 证据。如果课题组网站再保存一份独立的参数、环境、输出、验证和实验约束真值，将造成两套状态可能分叉。

### 1.1 现有研究 schema 的批准状态

[high-energy-theory-research 的候选 schema 说明](https://github.com/lm846802297-bit/high-energy-theory-research/blob/d6143c2aa15191ac8521e062d90860ba86713f00/schema/v1.4.3.7/README.md) 明确标记为 **candidate / not released**；`DD-ART-007` 至 `DD-ART-010` 仍待批准。候选包中部分 schema 的标题和 `$id` 仍标注 v1.4.2 或 v1.4.3.6，而目录版本为 v1.4.3.7。网站不得将该候选包当作已发布的规范，也不得自行修补版本差异后声称兼容。

因此，v1 仅保存规范化来源指针与必要的展示快照。来源 schema 版本作为不透明元数据保存；在研究仓库正式批准并发布 schema 契约之前，不执行规范性 schema 校验或自动迁移。

## 2. 权威边界与状态语义

| 信息 | 权威来源 | 网站 v1 的处理方式 |
|---|---|---|
| 研究问题、基准、假设、推导与研究变更历史 | 对应 research-change 记录 | 保存仓库 URL、精确 commit、记录 ID 与路径；不另建重复正文 |
| 一次运行的执行状态、输入、代码、环境、输出和指纹 | 已批准版本的 run / run_manifest 记录 | 保存引用；若显示状态，明确标为来源快照 |
| 文件/目录身份、SHA-256、生成来源与完整性 | 已批准版本的 artifact 记录及仓库内实际文件 | 保存 artifact ID、路径和来源 commit；不把站内附件 ID 当成同一个 artifact ID |
| 物理 claim 与其证据、适用范围和未解决事项 | claim 记录或 claim–evidence matrix | 链接到来源；展示的摘要必须注明来源路径、commit 与快照时间 |
| 网站内部的标题、专题入口、组内可见性和收藏导航 | 本网站 | 网站自己的数据库可维护这些协作元数据 |

不得用单一的 `validated=true` 或 `status=passed` 表示整项研究已经验证。以下是互相独立的维度：

- **网站记录生命周期：** `draft` / `active` / `archived`；
- **来源完整性：** `not_checked` / `linked` / `hash_match` / `hash_mismatch` / `unavailable`；
- **来源 schema 兼容性：** `not_checked` / `candidate_unapproved` / `compatible_with_approved_schema` / `incompatible` / `not_applicable`；
- **运行状态快照：** `not_imported` / `unknown` / `not_applicable`，或来自已识别 run manifest 的状态；
- **claim 状态摘要：** 只从指定的 claim–evidence 来源读取或人工引用，不能由网站的链接成功、文件上传成功或 CI 绿灯推导。

`linked` 只表示已找到来源路径；`hash_match` 只表示内容指纹与指定来源一致。两者都不代表物理推导正确或 claim 已被独立复现。

## 3. 逻辑数据模型：`ResearchRecordIndex`

网站记录只保存索引与协作元数据。具体数据库表和 SQL 结构留给后续实现 PR 决定。

| 字段 | 类型 | 必需 | 约束与说明 |
|---|---|---:|---|
| `id` | UUID 字符串 | 是 | 网站内部索引 ID，不代替来源仓库的 record/run/artifact ID |
| `schema_version` | 字符串 | 是 | 网站索引契约版本，当前提案为 `1.0.0`；与来源 schema 版本分开 |
| `record_version` | 正整数 | 是 | 网站索引记录的并发更新版本 |
| `title` | 字符串 | 是 | 去除首尾空白，1–200 字符 |
| `summary` | 字符串 | 否 | 简短导航摘要；不得把未核实结果写成已证实物理结论 |
| `topic_slug` | 字符串 | 否 | 关联静态研究专题的稳定 slug，不使用后端自增 ID |
| `record_kind` | 枚举 | 是 | `research_change` / `run_manifest` / `artifact_bundle` / `claim_evidence_matrix` / `external_record` / `manual_note` |
| `lifecycle_state` | 枚举 | 是 | `draft` / `active` / `archived` |
| `visibility` | 枚举 | 是 | v1 仅支持 `private` / `group`；公开发布需独立审核 |
| `owner_user_id` | 本地用户 ID | 是 | 只在当前后端解释，不跨环境假定 ID 相同 |
| `source_ref` | 对象 | 是 | 精确标识来源仓库、commit、记录类型/ID/路径、来源访问模式和可用的 manifest/artifact 指针 |
| `display_snapshot` | 对象 | 是 | 网站用于展示的来源检查、运行状态与 claim 摘要快照；不能覆盖来源真值 |
| `site_attachment_ids` | 字符串数组 | 是 | 网站自己的附件 ID；不与研究仓库的 artifact ID 混用 |
| `snapshot_approvals` | 对象数组 | 是 | 经批准的来源摘要/片段的审批与指纹记录；默认空数组；不得仅因附件已上传而自动批准 |
| `created_at` / `updated_at` | RFC 3339 时间 | 是 | UTC 时间，API 输出统一使用 `Z` 结尾 |
| `supersedes_id` | UUID 字符串或 null | 否 | 网站索引记录的替代关系；不覆盖或改写来源仓库历史 |

### 3.1 `source_ref`

`source_ref` 至少包含：

- `source_kind`：`research_change` / `run_manifest` / `artifact_bundle` / `claim_evidence_matrix` / `external_record`；
- `source_access_mode`：`link_only`（默认）或 `attached_snapshot`；后者仍保留来源链接，只允许展示通过独立审批的有限快照；
- `repository_url`：来源仓库 URL；
- `commit_sha`：若来源在 Git 仓库中，使用精确 commit SHA；仅记录分支名不够；
- `project_id`、`workstream_id`：若来源登记了这些层级，则保存其稳定 ID；
- `record_id` 与 `record_path`：例如 `RC-001` 和 `research/RC-001-vll-higgs-singlet-uv-eft.md`；
- `task_id`、`run_id`、`run_plan_id`、`manifest_id`、`manifest_revision`：仅当来源确实存在这些记录时填写；不存在时必须为 null，不得从脚本文件名或日志名猜测；
- `artifact_ids`：仅当来源中确实存在规范 artifact ID 时填写，作为不透明引用；
- `artifact_refs`：来源仓库内可直接追溯的文件引用，至少记录 `path`、精确 `commit_sha`、可获得的 `git_blob_sha`、可选 `sha256`、`role` 与 `description`。如果没有规范 artifact ID，保留 `artifact_id: null`，不得从文件名推造 ID。`git_blob_sha` 是 Git 对象标识，不是 SHA-256；两者必须使用不同字段。
- `claim_evidence_path`：可选的 claim–evidence matrix 路径；
- `source_schema_version`：来源 schema 版本，作为不透明字符串保存；
- `source_content_sha256` 与 `hash_unavailable_reason`：有实际计算的内容 SHA-256 时记录；否则显式为 null 并说明原因。

来源身份应由仓库 URL、精确 commit、project/workstream、record 类型/ID/路径及适用的 manifest revision/fingerprint 共同确定。仅有 `run_id` 或文件名不足以跨项目、跨仓库唯一识别来源。

### 3.2 `display_snapshot`

该对象只保存 UI 展示需要的快照：

- `source_integrity_status` 与 `source_checked_at`；
- `schema_compatibility_status`；
- `execution_status_snapshot` 与 `execution_snapshot_at`，只在来源确实提供运行状态时填写；
- `claim_status_summary`、`claim_status_source_path`、`claim_status_source_commit` 与 `summary_snapshot_at`。

claim 摘要应保留来源的限定语，例如“Verification in progress; overall model-level claim unresolved”。网站不得将其转换为笼统的“验证通过”；当显式来源检查发现来源 commit 或文件内容变化时，必须标记相关摘要/快照为 stale，不能静默沿用旧摘要。v1 不承诺持续轮询私有仓库。

### 3.3 不在网站索引中复制的字段

v1 不将以下内容作为网站数据库的独立科学真值：

- 运行参数、配置快照、软件环境、执行命令与退出码；
- 完整数值输出、输入/输出文件哈希和目录 manifest；
- 独立复现记录、验证活动和实验约束评估；
- 物理 claim 的正式状态与证据链。

这些内容应继续留在来源 research-change、run_manifest、artifact 和 claim–evidence 记录中。若 UI 需要展示，后续应通过有版本约束的只读解析/投影来实现，并展示来源 commit、manifest revision/fingerprint 和读取时间。不得在本 PR 中实现远程代码执行或向研究仓库写入。

## 4. 示例索引对象（RC-001 映射草案，不是已创建记录）

下面示例将 RC-001 表示为研究变更索引，而不是单次计算运行。commit SHA 是本次仓库检查时的来源快照；示例本身没有声称站内已执行来源哈希校验，也没有虚构 run/manifest ID。

```json
{
  "id": "b7b12064-1cc2-49df-aab4-8e4c0f86c0e2",
  "schema_version": "1.0.0",
  "record_version": 1,
  "title": "RC-001 — VLL–Higgs–Singlet UV–EFT matching",
  "summary": "Index entry only; inspect the pinned source record for the current claim status.",
  "topic_slug": null,
  "record_kind": "research_change",
  "lifecycle_state": "active",
  "visibility": "private",
  "owner_user_id": "site-local-user-id",
  "source_ref": {
    "source_kind": "research_change",
    "repository_url": "https://github.com/lm846802297-bit/high-energy-theory-research",
    "commit_sha": "d6143c2aa15191ac8521e062d90860ba86713f00",
    "project_id": "axial-vector-model-building",
    "workstream_id": "vll-higgs-singlet-uv-eft",
    "record_id": "RC-001",
    "record_path": "research/RC-001-vll-higgs-singlet-uv-eft.md",
    "claim_evidence_path": "research/RC-001-claim-evidence-matrix.md",
    "task_id": null,
    "run_id": null,
    "run_plan_id": null,
    "manifest_id": null,
    "manifest_revision": null,
    "artifact_ids": [],
    "artifact_refs": [
      {
        "artifact_id": null,
        "path": "validation/RC-001-local-validation-status-2026-10-23.md",
        "commit_sha": "d6143c2aa15191ac8521e062d90860ba86713f00",
        "git_blob_sha": "b5c09b4d215c36aefef62659f479f78354af007f",
        "sha256": null,
        "hash_unavailable_reason": "The index example has not independently computed SHA-256; git_blob_sha is a Git object ID, not SHA-256.",
        "role": "validation_summary",
        "description": "Local checks and explicit CI disposition; not a CI pass or physics correctness certificate."
      },
      {
        "artifact_id": null,
        "path": "validation/RC-001-uv-eft-two-point-difference.txt",
        "commit_sha": "d6143c2aa15191ac8521e062d90860ba86713f00",
        "git_blob_sha": "0bcc0bd1b393db6026580f88a668100921be8223",
        "sha256": null,
        "hash_unavailable_reason": "The index example has not independently computed SHA-256; git_blob_sha is a Git object ID, not SHA-256.",
        "role": "validation_evidence",
        "description": "Recorded exact symbolic/algebraic checks for the stated two-point UV–EFT subset."
      },
      {
        "artifact_id": null,
        "path": "validation/RC-001-dim6-independent-kernel-check.txt",
        "commit_sha": "d6143c2aa15191ac8521e062d90860ba86713f00",
        "git_blob_sha": "6fc04e3bcaa23e851517374eb8a064280eb001dd",
        "sha256": null,
        "hash_unavailable_reason": "The index example has not independently computed SHA-256; git_blob_sha is a Git object ID, not SHA-256.",
        "role": "validation_evidence",
        "description": "Recorded exact kernel/integral checks within the explicitly limited scope."
      }
    ],
    "source_schema_version": null,
    "source_content_sha256": null,
    "hash_unavailable_reason": "This draft index does not include a computed source-content SHA-256.",
    "source_access_mode": "link_only"
  },
  "display_snapshot": {
    "source_integrity_status": "not_checked",
    "source_checked_at": null,
    "schema_compatibility_status": "not_applicable",
    "execution_status_snapshot": "not_applicable",
    "execution_snapshot_at": null,
    "claim_status_summary": null,
    "claim_status_source_path": null,
    "claim_status_source_commit": null,
    "summary_snapshot_at": null
  },
  "site_attachment_ids": [],
  "snapshot_approvals": [],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  "supersedes_id": null
}
```

示例中的 UUID 和时间是说明字段形状的占位值，不代表已创建真实网站记录。`source_integrity_status` 保持 `not_checked`，因为固定来源 commit 不等于站内已完成内容哈希核验；`run_id` 和 `manifest_id` 保持 null，因为 RC-001 是研究变更记录，不是单次 run。私有仓库的链接也不会自动授予其他网站成员 GitHub 访问权。示例采用默认的 `link_only`，因此 `snapshot_approvals` 为空。

## 5. 附件与来源访问

网站附件与研究仓库 artifact 是两个不同的命名空间：

- 来源仓库中的产物使用 `artifact_id`、来源路径、commit 和内容指纹引用；
- 网站上传的讲义、内部展示附件或经过批准的快照使用 `site_attachment_ids`；
- 服务端必须检查当前用户是否有权引用站内附件，不能只检查 ID 是否存在；
- 外链使用 HTTPS；链接可访问不等于其内容已哈希或物理结论已核查；
- 当前 Pages 配置未绑定 `FILES_BUCKET`，站内附件上限仍为 1 MiB。更大的研究产物应留在批准的研究仓库/外部存储，并通过受控链接访问。

来源仓库是私有的时，保存链接不会自动授予网站成员 GitHub 访问权。v1 默认使用 `link_only`：成员需要自行拥有来源仓库权限。若组员确实需要在网站内查看有限内容，可以选择 `attached_snapshot`，但必须逐项经过来源内容所有者或被明确授权的维护者审批。快照仅限必要的摘要、节选、图表或脱敏报告；不得默默复制整个私有仓库、完整计算目录或未公开研究文件。

每项获准快照都必须有 `snapshot_approvals` 记录，至少包含：

- `site_attachment_id`、`snapshot_kind`、`scope_description`；
- `source_commit_sha`、`source_path`，以及可获得时的 `source_content_sha256`；
- 对已上传附件实际计算的 `snapshot_sha256`；
- `approved_by_user_id`、`approver_role`、`approved_at`、`target_visibility`；
- `redaction_status` 与必要的 `redaction_notes`；
- `approval_event`：`approved` / `revoked` / `expired`。每次审批、撤销或过期事件追加一条记录；当前有效状态由事件序列推导，不原位覆盖历史。

审批必须发生在快照对目标受众可见之前；上传者不能仅凭上传行为批准自己的快照，除非其同时具备来源所有者/授权维护者权限。`target_visibility` 不得比索引记录的可见范围更宽。快照是固定副本，不是实时镜像；v1 不假定网站会持续轮询来源仓库。只有在用户触发来源检查、导入新来源版本或发现源文件哈希不匹配时，才能据证据将快照标记为 stale；在完成重新核验和审批前不得替换展示内容。源文件哈希与快照文件哈希是不同指纹，不得混用。

## 6. API 契约

以下是网站**索引 API** 的提案，不是科学运行执行 API；当前尚未实现。FastAPI、Cloudflare Pages Functions 和 Demo Adapter 必须保持相同的请求/响应语义。

| 方法与路径 | 用途 | 权限/语义 |
|---|---|---|
| `GET /api/research-records` | 列表与筛选 | 只返回当前用户有权查看的记录；支持 `query`、`topic_slug`、`record_kind`、`lifecycle_state`、`cursor`、`limit` |
| `POST /api/research-records` | 新建索引记录 | 需要登录；创建为 `draft`、默认 `private`；不创建真实 run 或 manifest；返回 `201` |
| `GET /api/research-records/{id}` | 获取详情 | 无权访问的私有记录不得泄露内容 |
| `PATCH /api/research-records/{id}` | 更新网站元数据 | 必须提交 `expected_record_version`；版本冲突返回 `409` |
| `POST /api/research-records/{id}/source-checks` | 追加来源检查记录 | 只记录链接/哈希/schema 兼容性检查，不代表物理核查 |
| `POST /api/research-records/{id}/attachments` | 关联网站附件 | 只关联现有站内文件；服务端检查文件所有权/可见性；未经批准的来源快照不得向组员展示 |
| `POST /api/research-records/{id}/snapshot-approvals` | 追加快照审批记录 | 仅来源所有者或明确授权的维护者可批准；保存来源/快照指纹、范围、目标受众与审批时间；撤销/过期不得静默删除历史 |
| `GET /api/research-records/{id}/export` | 导出索引 manifest | 导出网站索引与来源指针，不冒充完整 run manifest 或 claim-evidence 数据 |

### 6.1 请求规则

- 新建和更新使用严格 schema 校验；拒绝未知字段、无效枚举、过长文本、格式错误的 UUID 和不完整的来源身份。
- 更新必须携带 `expected_record_version`；若当前版本不同，返回 `409 Conflict`，不得覆盖并发修改。
- 一旦来源身份已核对，不能通过 `PATCH` 静默把来源改成另一个 commit、manifest 或 artifact。若更换来源，应创建新索引记录并使用 `supersedes_id` 关联旧记录。
- 来源检查记录和快照审批记录是追加式的；失败或不匹配的历史记录不得被静默删除或改写为通过。撤销或过期应新增状态事件/审批记录，且立即阻止对相应快照的展示。当前审批状态由最新适用的追加事件推导。
- 网站索引创建成功只表示元数据已保存，不代表来源内容、schema 或物理结论已验证。
- v1 不提供 `POST /api/research-runs/{id}/execute`、任意代码执行、自动扫描、对研究仓库的 commit/push 或自动 claim 状态更新。

### 6.2 错误状态码

| HTTP | 场景 |
|---|---|
| `400` | 请求格式或操作不合法 |
| `401` | 需要登录 |
| `403` | 已识别用户但没有执行该操作的权限 |
| `404` | 记录不存在，或按隐私策略不应暴露其存在 |
| `409` | `expected_record_version` 与当前版本不一致 |
| `422` | 请求字段或来源身份未通过 schema/语义校验 |
| `503` | 数据库或附件存储暂不可用；不得伪报保存成功 |

## 7. 权限与隐私

- 所有写入端点都需要认证；v1 不开放匿名查询。
- `private` 记录只对所有者和具有明确管理权限的管理员开放；`group` 记录对已认证的组内成员可读。编辑权限由所有者/管理员策略控制。
- 不得依赖前端隐藏按钮作为授权措施；每个后端端点必须重新检查记录可见性与操作权限。
- 用户 ID 是后端本地标识，不能跨 FastAPI/D1 环境假定相同。
- Demo Adapter 使用合成数据并隔离于真实后端；不得写入生产 API、生产 D1 或私有研究仓库。
- 快照默认不可见；只有审批状态为 `approved`、指纹匹配且目标受众有权限时才可读取。`revoked`、`expired`、来源已变化或指纹不匹配的快照必须隐藏并标记为需复核。
- 未公开论文、审稿回复、私人计算、访问令牌、邮箱凭据和生产数据库内容不应放入公开静态文件或演示种子数据。

## 8. 现有研究仓库的映射规则

对接 [high-energy-theory-research](https://github.com/lm846802297-bit/high-energy-theory-research) 时，网站索引应遵守其现有层级：

`project → workstream → research change → run → manifest/artifact → claim`

- `project_id`（例如 `axial-vector-model-building`）不是 `RC-001`；
- `workstream_id`（例如 `vll-higgs-singlet-uv-eft`）不是单次运行；
- `RC-001` 是研究变更记录；`CL-001` 等是 claim ID；
- 只有在来源仓库中存在实际 run/manifest 记录时，才填写 `run_id` 和 `manifest_id`；
- 存在脚本、输出日志或校验结果不自动意味着存在完整 run manifest，更不代表对应 claim 已通过；
- 不将候选 schema 的 ID、版本或状态擅自升级为已批准的规范。

## 9. 首个真实任务试点：RC-001

建议先用现有 RC-001 做**研究变更索引试点**，而不是伪造一个“已完成”的计算运行。以下示例中的来源文件路径和 Git blob SHA 已在固定 commit 上核对；它们是可追溯的仓库文件引用，不是网站附件，也不冒充规范 artifact ID：

- `project_id`：`axial-vector-model-building`；
- `workstream_id`：`vll-higgs-singlet-uv-eft`；
- `research_change_id`：`RC-001`；
- 来源记录：`research/RC-001-vll-higgs-singlet-uv-eft.md`；
- claim–evidence matrix：`research/RC-001-claim-evidence-matrix.md`；
- 来源记录当前状态为 verification in progress，整体 model-level claim unresolved；
- 当前未找到该活跃记录对应的已提交规范 run/manifest 实例，因此试点索引必须把 `run_id`、`manifest_id` 和 `manifest_revision` 留空。只有真实记录被创建、验证并提交后才能补上。
- RC-001 将主基线 v153 标识为 ChatGPT Library 中的源文件，并明确说明该完整源文件尚未提交到研究仓库。网站索引可追溯到已提交的 RC-001、证据矩阵和 validation 文件，但不能声称网站已直接提供或验证未提交的完整 v153 源文件；若要让组员在网站内读取其内容，必须另行批准一个有限摘要快照，或在独立 PR 中审查后归档完整源文件。

试点验收应检查：来源 commit 固定、索引可检索、私有/组内权限生效、claim 摘要指向正确来源、来源变更能被标记为过期、导出不会把索引伪装成完整运行清单。若组员没有私有研究仓库的访问权，应先决定是否提供经过批准的摘要/快照，不应通过公开链接绕过权限。

## 10. 后续实现的验收清单

- [ ] 网站索引不复制或重写来源 run_manifest、artifact 或 claim-evidence 真值。
- [ ] 来源身份包含精确 commit 与稳定记录路径/ID；单独的分支名或文件名不够。
- [ ] 对没有规范 artifact ID 的来源文件，使用精确 commit + path + Git blob SHA；不把 Git blob SHA 误写为 SHA-256，也不虚构 artifact ID。
- [ ] 不存在的 run/manifest ID 不会从脚本、日志或文件名推断出来。
- [ ] 来源完整性、schema 兼容性、执行状态和 claim 状态在 UI 中分别显示。
- [ ] `linked` 或 `hash_match` 不被展示成“物理结论已验证”。
- [ ] 私有记录不能被其他普通成员通过列表、详情、导出或附件引用端点读取。
- [ ] 未审批、已撤销、已过期或指纹不匹配的摘要快照不会向组员显示；审批身份、目标可见性、来源 commit/path 与源/快照哈希可追溯。
- [ ] 快照可见性不会超过索引记录可见性，来源更新会使相关快照进入待复核状态。
- [ ] `record_version` 冲突不会覆盖并发修改；来源变更保留旧索引记录和替代关系。
- [ ] Demo 数据明确标记为合成数据，且不访问生产后端或私有研究仓库。
- [ ] 候选 schema 在正式批准前仅作为不透明来源元数据，不被网站当作已发布的规范。
- [ ] 当前 PR 的文档静态检查通过；实际 API/数据库实现测试只在后续实现 PR 中声称通过。

## 11. 当前决定与下一步

本提案定义网站索引层，不创建数据库表，也不实现 API。优先审阅：

1. `ResearchRecordIndex` 是否足以支持网站的搜索、权限和研究导航；
2. 是否接受“默认 `link_only`，必要时逐项审批 `attached_snapshot`”的访问策略；
3. 哪些摘要适合缓存到网站，哪些必须实时读取或只提供跳转；
4. 研究仓库 schema 获得正式批准后，采用何种版本化适配器映射 run、manifest、artifact 和 claim。

确认后再单独实现索引 API；研究仓库候选 schema 的正式发布、迁移和物理结果的科学验收仍由各自的治理与研究流程决定。
