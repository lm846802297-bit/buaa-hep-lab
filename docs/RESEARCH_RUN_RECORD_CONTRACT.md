# 计算记录（Research Run）：数据模型与 API 契约

- **状态：设计提案 v1.0.0，待审阅。**
- **本次范围：** 定义跨 FastAPI、Cloudflare Pages Functions 与 Demo Adapter 的逻辑数据模型和接口语义。
- **不在本次范围内：** 数据库表、迁移、生产 API、自动计算执行器、生产存储绑定或任何生产数据修改。
- **实现门槛：** 先批准本契约，再单独实现并审查 schema/migration、两套后端、Demo Adapter、契约测试和权限测试。

## 1. 设计目标

计算记录用于保存一项符号推导、数值计算、参数扫描、UV–EFT 匹配、唯象学重铸或基准测试的可追溯上下文。它应回答：

1. **计算了什么？** 研究问题、模型、约定、输入参数、假设和适用范围。
2. **基于什么？** 相关论文、规范化文献标识、代码仓库与精确 commit。
3. **怎样得到结果？** 软件与包版本、入口脚本、执行命令、输入文件指纹和输出产物。
4. **结果经过什么核查？** 来源核查、解析推导检查、软件执行、独立复现和实验约束评估分别记录。
5. **谁可以访问？** 默认私有；只有显式共享后，组内成员才可读取。

### 非目标

- 不把计算记录等同于论文、研究专题正文或普通文件夹。
- 不将一次代码成功退出解释为物理推导正确。
- 不自动将某个结果标记为实验允许、全局可行或已独立复现。
- v1 不执行任意 Mathematica、Python、FeynCalc 或外部代码；不提供远程代码执行服务。
- v1 不把未公开计算记录直接同步到公开首页或公开 API。
- 不因本契约创建新存储桶、切换 D1/R2/KV 或改变现有附件大小限制。

## 2. 科学状态语义：不同维度必须分开

不能用单一的 `validated=true` 或 `status=passed` 表示整项研究已验证。以下维度相互独立：

| 维度 | 允许值 | 解释 |
|---|---|---|
| 记录生命周期 `lifecycle_state` | `draft` / `active` / `archived` | 记录是否仍在编辑、使用或已归档 |
| 执行状态 `execution_status` | `not_run` / `running` / `succeeded` / `failed` / `cancelled` | 仅表示所记录的执行过程，不表示物理正确性 |
| 来源核查 | `not_assessed` / `in_progress` / `verified` / `needs_correction` | 论文、数据、代码来源是否已核对 |
| 解析/推导审查 | `not_assessed` / `in_progress` / `reviewed` / `needs_revision` | 推导与约定是否经过明确的检查 |
| 独立复现 | `not_attempted` / `in_progress` / `reproduced` / `not_reproduced` / `not_applicable` | 是否由独立实现、独立计算或可核查基准复现 |
| 实验约束评估 | `not_evaluated` / `partially_evaluated` / `evaluated` | 相关约束是否在明确假设下评估 |

每个来源/推导/复现审查都应是一条带时间、责任人和证据的记录，不应只覆盖一个可编辑的布尔字段。

对单项实验约束，结果使用 `not_evaluated`、`excluded`、`not_excluded` 或 `not_applicable`。`not_excluded` 只表示**在该项约束及记录的假设下没有被排除**，不代表该参数点满足所有理论、实验和宇宙学要求。未评估的约束不得默认视为允许。

## 3. 逻辑数据模型

本节定义 API 层的规范对象。具体数据库范式、JSON 列或子表布局留给后续实现 PR 决定；不得在未审阅生产 schema 的情况下直接执行迁移。

### 3.1 `ResearchRun`

| 字段 | 类型 | 必需 | 约束与说明 |
|---|---|---:|---|
| `id` | UUID 字符串 | 是 | 跨后端稳定的记录 ID；不得依赖 SQLite/D1 的自增 ID |
| `schema_version` | 字符串 | 是 | 当前提案为 `1.0.0`；升级需说明兼容策略 |
| `record_version` | 正整数 | 是 | 每次成功修改递增，用于并发更新检测 |
| `title` | 字符串 | 是 | 去除首尾空白，1–200 字符 |
| `summary` | 字符串 | 否 | 结果/任务摘要；不得把未核实结果写成已证实结论 |
| `topic_slug` | 字符串 | 否 | 对应静态研究专题的稳定 slug，不使用某一后端的数据库行 ID |
| `research_kind` | 枚举 | 是 | `analytic_derivation` / `symbolic_computation` / `numerical_scan` / `uv_eft_matching` / `phenomenology_recast` / `benchmark` / `literature_review` / `other` |
| `lifecycle_state` | 枚举 | 是 | `draft` / `active` / `archived` |
| `execution_status` | 枚举 | 是 | 取第 2 节定义的执行状态 |
| `visibility` | 枚举 | 是 | v1 仅支持 `private` / `group`；公开发布必须走单独的内容审核流程 |
| `owner_user_id` | 本地用户 ID | 是 | 仅在当前后端内解释；不得跨环境复制后假设 ID 相同 |
| `model_context` | 对象 | 否 | 模型名称/版本、拉格朗日量或定义文件、场与荷约定、度规、归一化、EFT 基底、匹配尺度、重整化方案等 |
| `assumptions` | 字符串数组 | 是 | 明确近似、先验、适用范围与已知局限；无内容时为空数组 |
| `parameters` | 对象数组 | 是 | 参数名称、精确值、单位、定义及来源；无内容时为空数组 |
| `references` | 对象数组 | 是 | 论文、数据、代码或约束来源；无内容时为空数组 |
| `code_context` | 对象 | 否 | 仓库 URL、commit SHA、工作区状态、入口、执行命令和输入指纹 |
| `environment` | 对象 | 否 | 软件/包版本、操作系统、架构及必要的运行环境信息 |
| `outputs` | 对象数组 | 是 | 结果名称、精确表示、单位、精度说明与相关产物 ID |
| `artifacts` | 对象数组 | 是 | 输入、日志、表格、图、数据、笔记本或报告的附件引用 |
| `created_at` / `updated_at` | RFC 3339 时间 | 是 | 使用 UTC 时间；API 输出统一使用 `Z` 结尾 |
| `parent_run_id` | UUID 字符串 | 否 | 派生计算或参数扫描的父记录 |
| `supersedes_id` | UUID 字符串 | 否 | 修正或替代的先前记录；不得静默覆盖旧结果 |

### 3.2 精确数值与参数约定

物理参数和高精度结果的 `value` 应使用字符串保存，例如 `"1.234567890123456789e-6"`，避免经过 JavaScript 二进制浮点数后丢失有效位。单位单独保存，不把单位隐式编码进数值。

每个参数至少包含：

- `name`：稳定的机器可读名称；
- `value`：原始精度的字符串；
- `unit`：明确单位，或明确标记无量纲；
- `definition`：物理含义与采用的约定；
- `source_ref`：来自论文、模型文件、先验或扫描配置的引用；
- `role`：如 `input`、`derived`、`fixed_benchmark` 或 `prior`。

派生参数应保留其定义或可追踪的推导引用；不能只记录最终数值而丢失它的计算关系。

### 3.3 引用对象 `Reference`

每个引用至少包含：

- `kind`：`arxiv`、`doi`、`url`、`dataset` 或 `code_repository`；
- `identifier`：规范化标识，如 arXiv ID、DOI、数据集版本或仓库 URL；
- `role`：`background`、`method`、`input_data`、`comparison` 或 `constraint`；
- `note`：该来源支持记录中的哪项定义、方法或结论。

优先保存稳定的 arXiv ID、DOI、数据版本或 Git commit，而不是只保存标题。可以附加本地文献库 ID 作为导航缓存，但它不能成为跨后端的唯一身份。文献元数据与记录之间的链接不意味着已独立复核论文中的物理结论。

### 3.4 代码上下文与环境

代码上下文应尽可能包含：

- `repository_url`、`commit_sha`、`working_tree_state`（`clean` / `dirty` / `unknown`）；
- `entrypoint`、`command`、参数文件引用和输入文件 SHA-256；
- 若工作区为 `dirty`，应附补丁/源码快照或明确标记不可精确复现；
- 软件环境列表，每项包含软件名、版本和必要的包版本；
- 随机扫描还应记录随机种子、采样方法、先验、扫描范围、样本数和失败点处理规则。

只记录分支名（如 `main`）不够，因为分支内容会移动。应记录精确 commit SHA；若计算使用未提交修改，必须同时保存修改快照或标记复现受限。

### 3.5 附件对象 `Artifact`

附件是现有文件服务的引用，不在 `ResearchRun` 中重复存储二进制内容。每项至少包含：

- `kind`：`source`、`input`、`log`、`table`、`plot`、`dataset`、`notebook` 或 `report`；
- `description`、`media_type`、`size_bytes`；
- `file_id`（现有站内附件 ID）或 `external_url`，二者必须且只能提供一个；服务端必须验证调用者有权引用该站内文件，不能只检查 ID 是否存在；
- `sha256`：已知内容指纹；若无法获取，显式为 `null`，不能声称内容已校验。

站内附件继续使用既有文件 API。当前 Pages 配置未绑定 `FILES_BUCKET`，因此单文件限制仍为 1 MiB；大文件只能引用经过确认的外部存储链接。外链必须为 HTTPS，并仍受访问权限和可用性限制。

### 3.6 核查记录与约束评估

`ValidationRecord` 是追加式证据记录，至少包括 `id`、`kind`、`status`、`method`、`conclusion`、`evidence_artifact_ids`、`reviewer_user_id`、`checked_at` 和 `notes`。`kind` 可为来源核查、解析推导审查、软件执行核验、独立复现或统计方法核查。没有证据的状态不得标记为 `passed`、`verified` 或 `reproduced`。

`ConstraintEvaluation` 是某项具体实验/观测约束的评估，至少包括：

- `constraint_id` 或来源标识；
- `outcome`：`not_evaluated` / `excluded` / `not_excluded` / `not_applicable`；
- 使用的模型参数、质量范围、耦合定义、数据版本和关键假设；
- 证据产物、来源链接、评估者与时间；
- `scope_note`：明确哪些效应已包含、哪些效应未评估。

不同实验流、不同耦合结构或不同衰变/产生假设的约束不得只凭名称相近就自动复用。

### 3.7 执行事件与版本递增

§ExecutionEvent§ 是追加式状态变更记录，至少包含 §id§、§event_type§、§from_status§、§to_status§、§occurred_at§、§actor_user_id§、§summary§、§exit_code§（可空）和 §artifact_ids§。§execution_status§ 应由有效事件序列推导，而不是允许客户端任意写入。

允许的状态转移：

| 当前状态 | 事件 | 新状态 |
|---|---|---|
| §not_run§ | §execution_started§ | §running§ |
| §running§ | §execution_succeeded§ | §succeeded§ |
| §running§ | §execution_failed§ | §failed§ |
| §running§ | §execution_cancelled§ | §cancelled§ |

终态 §succeeded§、§failed§、§cancelled§ 不允许原位转换。重跑或纠正输入/代码时新建记录，通过 §parent_run_id§ 或 §supersedes_id§ 关联。

任何修改主记录或追加子记录（执行事件、核查记录、约束评估、附件引用）的成功写操作，都必须在同一事务中递增主记录 §record_version§。这样并发 §PATCH§ 才能检测到在其读取之后发生的子记录变更。若当前后端无法保证原子性，实现前必须先设计事务/补偿策略。

## 4. 示例对象（示意，不是当前 API 响应）

```json
{
  "id": "2a6cdd77-451a-4dd9-9b2c-4c4f9d847a12",
  "schema_version": "1.0.0",
  "record_version": 1,
  "title": "UV–EFT matching: benchmark A",
  "summary": "Comparison of the UV amplitude and the matched EFT coefficient.",
  "topic_slug": "higgs-portal-uv-eft",
  "research_kind": "uv_eft_matching",
  "lifecycle_state": "draft",
  "execution_status": "not_run",
  "visibility": "private",
  "owner_user_id": "backend-local-user-id",
  "model_context": {
    "model_name": "specified UV model",
    "conventions": ["metric and coupling conventions recorded in the linked note"],
    "matching_scale": "1000 GeV",
    "renormalization_scheme": "not_assessed"
  },
  "assumptions": [
    "The matching convention is explicitly stated in the attached derivation.",
    "No phenomenological exclusion is inferred from this record alone."
  ],
  "parameters": [
    {
      "name": "gX",
      "value": "1.0e-3",
      "unit": "1",
      "definition": "Gauge coupling under the conventions recorded in the model note.",
      "source_ref": "model-input:benchmark-A",
      "role": "fixed_benchmark"
    }
  ],
  "references": [
    {
      "kind": "arxiv",
      "identifier": "arXiv:YYMM.NNNNN",
      "role": "method",
      "note": "Replace with a verified identifier before saving a real record."
    }
  ],
  "code_context": {
    "repository_url": "https://github.com/owner/repository",
    "commit_sha": null,
    "working_tree_state": "unknown",
    "entrypoint": null,
    "command": null,
    "input_sha256": null
  },
  "environment": {
    "software": [],
    "notes": "Populate only with observed environment details."
  },
  "outputs": [],
  "artifacts": [],
  "validation_records": [],
  "constraint_evaluations": [],
  "created_at": "2026-10-25T17:00:00Z",
  "updated_at": "2026-10-25T17:00:00Z",
  "parent_run_id": null,
  "supersedes_id": null
}
```

此对象只展示字段形状。示例中的 arXiv 标识是明确标注的占位值，不得将其作为真实引用保存；正式实现应验证规范标识，并拒绝无效或未通过校验的引用。

## 5. API 契约

以下路径为提案中的规范路径，要求 FastAPI、Cloudflare Pages Functions 和 Demo Adapter 提供相同的请求/响应语义。它们在本 PR 中**尚未实现**。

| 方法与路径 | 用途 | 权限/语义 |
|---|---|---|
| `GET /api/research-runs` | 列表与筛选 | 只返回当前用户有权查看的记录；支持 `query`、`topic_slug`、`research_kind`、`lifecycle_state`、`execution_status`、`cursor`、`limit` |
| `POST /api/research-runs` | 新建记录 | 需要登录；创建为 `draft`、`not_run`，默认 `private`；返回 `201` |
| `GET /api/research-runs/{id}` | 获取详情 | 无权访问的私有记录不得泄露内容 |
| `PATCH /api/research-runs/{id}` | 更新可编辑元数据 | 必须提交 `expected_record_version`；版本冲突返回 `409` |
| `POST /api/research-runs/{id}/events` | 记录执行事件 | 追加式记录执行开始、成功、失败或取消；服务端校验合法状态转移 |
| `POST /api/research-runs/{id}/validation-records` | 追加核查证据 | 追加式；不得静默覆盖旧审查结论 |
| `POST /api/research-runs/{id}/constraint-evaluations` | 追加单项约束评估 | 追加式；必须保存约束来源、范围、假设和证据 |
| `POST /api/research-runs/{id}/artifacts` | 关联附件 | 只关联现有 `file_id` 或 HTTPS 外链，不直接上传二进制 |
| `GET /api/research-runs/{id}/export` | 导出可复现 manifest | 返回 JSON 元数据、引用、环境、指纹和证据；不保证外部文件永远可用 |

### 5.1 请求与响应规则

- 成功响应使用统一的字段名、枚举、时间格式与错误语义；不得让三个适配器对同一请求返回不同的权限结果。
- 新建和更新使用严格 schema 校验；拒绝未知字段、无效枚举、过长文本、非正数 `record_version`、格式错误的 UUID 和无效引用标识。
- 更新必须携带 `expected_record_version`。若数据库当前版本不同，返回 `409 Conflict`，不覆盖他人的修改。主记录与追加式子记录的成功写操作都递增该版本。
- 执行事件、核查记录和约束评估均为追加式证据。不得通过 `PATCH` 删除失败记录或将历史 `failed` 改写为 `succeeded`。
- 执行到达 `succeeded`、`failed` 或 `cancelled` 后，执行快照不再原位修改。需要更正代码、输入或结果时，应创建新记录并用 `supersedes_id` 指向旧记录；新扫描/新运行可用 `parent_run_id` 表达派生关系。
- 导出应保留数值字符串精度、软件版本、commit SHA、输入/产物指纹、核查状态和未评估项；不得把内部用户信息或未授权的私有记录导出给无权用户。

### 5.2 错误状态码

| HTTP | 场景 |
|---|---|
| `400` | 请求格式或状态转移不合法 |
| `401` | 需要登录 |
| `403` | 已识别用户但没有执行该操作的权限 |
| `404` | 记录不存在，或按项目隐私策略不应向当前用户暴露其存在 |
| `409` | `expected_record_version` 与当前版本不一致 |
| `422` | 请求字段未通过 schema/语义校验 |
| `503` | 依赖的存储/数据库暂不可用；不得伪报保存成功 |

如既有 API 有不同的错误封装，实现时应在公共契约测试中统一外部可观察行为，而不是只统一函数名。

## 6. 权限与隐私

- 所有写入端点都需要认证；v1 不开放匿名查询。
- `private` 记录只对所有者和具有明确管理权限的管理员开放；`group` 记录对已认证的组内成员可读。编辑权限由所有者/管理员策略控制。
- 不得依赖前端隐藏按钮作为授权措施；每个后端端点必须重新检查记录可见性与操作权限。
- 用户 ID 是后端本地标识，不能跨 FastAPI/D1 环境假定相同。跨环境导入时须重新映射所有者或进入待人工确认状态。
- Demo Adapter 使用合成数据并隔离于真实后端；它可以模拟同样的接口语义，但不得写入生产 API、生产 D1 或生产文件存储。
- 未公开论文、审稿回复、私人计算、访问令牌、邮箱凭据和生产数据库内容不应放入公开静态文件或演示种子数据。

## 7. 版本化与迁移原则

1. 先冻结并审阅本逻辑契约，再设计 SQLite/D1 物理 schema；不要在本提案中假定已存在可直接引用的表。
2. SQLite 与 D1 使用独立、可审计的版本化迁移；迁移前核对真实 schema 和已有数据，说明备份与恢复方法。
3. 不在请求处理器中通过吞掉 `ALTER TABLE` 错误来隐式建表或升级 schema。
4. API schema 版本与数据库迁移版本分开管理。新增可选字段应有默认值和向后兼容测试；破坏性变更必须显式升主版本或提供迁移路径。
5. 先用无敏感信息的 fixture 验证旧记录、空字段、精确数值字符串、权限和并发冲突，再考虑导入历史计算记录。
6. 不在这一阶段接入生产 R2/KV，不修改当前 1 MiB 附件限制，不触发生产发布。

## 8. 后续实现的验收清单

- [ ] 三个适配器对相同有效/无效请求给出一致的 schema、状态码、权限和响应字段。
- [ ] 数值字符串往返保存/导出后不改变有效数字与科学计数法表示。
- [ ] 每个真实引用都通过对应格式校验；占位符和无效 arXiv/DOI 被拒绝。
- [ ] `commit_sha`、工作区脏状态、输入/输出 SHA-256 和软件版本能被保存与导出。
- [ ] 私有记录不能被其他普通成员通过列表、详情、导出或附件引用端点读取。
- [ ] `record_version` 冲突不会覆盖并发修改；执行和核查事件不能被静默覆盖。
- [ ] `not_excluded` 不被展示成“模型整体可行”；`not_evaluated` 不会被折叠为允许。
- [ ] Demo 数据明确标记为合成数据，且不访问生产后端。
- [ ] 迁移在隔离 SQLite/D1 fixture 中验证，并有可核查的回滚/恢复说明。
- [ ] 当前 PR 的文档与 schema 静态检查通过；实际 API/数据库实现的测试只在后续实现 PR 中声称通过。

## 9. 当前决定与下一步

本提案先解决研究记录的语义与接口边界，不创建数据库表，也不实现 API。审阅时应优先确认：

1. `research_kind` 枚举是否覆盖课题组实际工作；
2. `model_context`、参数、环境和产物字段是否足以复现一项真实 UV–EFT 或 FeynCalc 计算；
3. 核查状态是否清楚区分来源核对、推导审查、软件执行、独立复现和实验约束；
4. `private` / `group` 权限与“执行完成后快照不可变”的规则是否合适。

确认后再单独提出数据库/API 实现 PR；在那之前，不应将本提案描述为已经上线的功能。
