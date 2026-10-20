# BUAA HEP Hub 国际物理研究组网站深度对标研究 v2

## 逐站、逐页面的功能拆解与可迁移设计方案

-   **研究对象：** BUAA HEP Hub（公开官网）与 `/hub` 受保护的组内工作台
-   **对标站点：** MIT Center for Theoretical Physics -- a Leinweber
    Institute、Kavli IPMU、CERN Theory、DESY Theory Group、Harvard High
    Energy Theory Group、Perimeter Institute
-   **研究日期：** 2026-10-21
-   **用途：** 为现有 Vue 前端、Cloudflare Pages Functions /
    D1、论文搜索与 BibTeX、组会和内部资料库提供可实施的设计参考
-   **边界：**
    本报告基于可访问的官方网页、页面文本/导航结构与公开资料做内容和功能审查。没有在本轮完成所有站点的逐像素截图比较、完整移动设备实测、Lighthouse
    跑分或无障碍审计；凡未实测的内容均标为"未验证"，不将推断写成事实。

------------------------------------------------------------------------

## 0. 本轮相较上一版增加了什么

上一版主要给出"MIT 看论文、IPMU 看信息架构、CERN
看学术活动"等概括。本版进一步按每个机构的**主页、研究方向、论文/出版物、成员、研讨会、访问/招聘/联系**逐类检查可访问页面，并将观察转化为
BUAA HEP Hub 的组件、数据字段、用户流程和验收标准。

本版不是要复制某一家机构的整个网站，而是抽取可验证的功能模式：

1.  MIT：论文摘要展开、按角色筛选成员、明确的学术活动与研究生/访问者信息。
2.  Kavli
    IPMU：把科学成员、预印本、正式出版物、会议报告、年度报告和公众传播拆成不同资源类型。
3.  CERN Theory：按 seminar series
    组织活动、提供组织者和邮件订阅，并支持 iCalendar 订阅。
4.  DESY
    Theory：研究问题导向的简介、清楚的人员/访客/活动/职位/内部入口分类；也暴露了历史栏目和多级导航可能产生的维护负担。
5.  Harvard
    HETG：较精简的导航与人员角色分类，但主页新闻更新陈旧，说明简洁结构仍需要内容治理。
6.  Perimeter
    Institute：研究方向采用"核心问题---说明---研究人员"结构；研究项目、访问者、研讨会系列和可检索讲座档案相互连接。

## 1. 研究方法与证据等级

### 1.1 证据等级

-   **A：官方页面直接显示。**
    例如页面明确列出导航、论文元数据、摘要展开、seminar 系列或 iCalendar
    说明。
-   **B：基于页面结构的设计判断。**
    例如将独立栏目理解为内容模型的分离；属于合理推断，需结合源码或编辑流程验证。
-   **C：未实测的技术假设。**
    例如移动端体验、真实首屏性能、键盘无障碍或交互失败状态。不得当作已经发现的
    bug。

### 1.2 研究范围

检查重点包括：

-   主页：信息层级、研究定位、新闻/活动是否可发现。
-   研究方向：是否解释问题、方法、联系和相关成果。
-   论文：标题、作者、日期、摘要、预印本、出版信息、分页/搜索/筛选。
-   成员：角色分类、个人简介、研究方向、联系方式、历史成员。
-   活动：系列、日期、时间、地点、讲者、摘要、组织者、历史档案、日历。
-   招聘与访问：职位、访问计划、申请入口和面向外部人员的信息。
-   内部资源：公开站点是否把内部入口明确分开；不尝试绕过登录。
-   可迁移性：与 BUAA HEP Hub 现有 Vue、D1、Cloudflare Pages Functions
    结构的兼容性。

### 1.3 不在本轮中声称已经完成的检查

没有对所有目标站点进行以下实测：手机真机/多视口截图、Lighthouse
性能、Core Web
Vitals、屏幕阅读器、键盘全流程、表单安全测试、站点后台编辑流程。报告中的"优点/缺点"主要针对可观察的信息架构与内容维护，不等同于全面的工程质量排名。

------------------------------------------------------------------------

# 2. MIT Center for Theoretical Physics -- a Leinweber Institute

## 2.1 核心页面与来源

-   中心主页：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/>
-   研究介绍：从中心主页的 "Our Research" 导航进入。
-   成员目录：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/people/>
-   出版物：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/center-for-theoretical-physics-publications/>
-   研讨会入口：从中心主页 "Seminars" 进入。
-   招聘：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/job-opportunities/>

官方主页导航还包含 News、Getting Started、Norms and
Expectations、Graduate Student Guidelines、Travel Guidelines
等信息页。来源：主页导航与说明
<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/>。

## 2.2 主页与信息架构

### 可直接观察到的设计

1.  主页首先说明中心的组织归属：MIT Physics、Laboratory for Nuclear
    Science 与 Leinweber Institutes
    的关系。这不是装饰性介绍，而是帮助访问者理解中心在更大研究组织中的位置。
2.  "Important links" 把近期研讨会与招聘放在显眼位置。
3.  "Our Research"
    用从高能弦论/宇宙学到标准模型、QCD、强子、夸克物质与原子核的范围介绍研究覆盖面，并说明理论与实验及其他研究方向之间的联系。
4.  导航不只面向公众，也包含研究生指南、中心规范和旅行指南等内部/半内部信息。

### 对 BUAA HEP Hub 的价值

-   首屏需要回答"这是哪个研究组、隶属什么组织、研究什么、近期有什么、如何联系"，不要仅展示一句宏大标语。
-   公开首页可以有一个轻量的"近期组会/学术活动"和"招聘/访问"区域，但应在内容为空时优雅隐藏，避免显示过期占位。
-   研究组规范、组会指南、旅行报销说明等可以放在
    `/hub`，不要与公开研究介绍混在同一导航层级。
-   如果要表达研究范围广度，使用"研究问题与连接关系"而不是无解释的领域名词墙。

## 2.3 论文/出版物页面

### 可直接观察到的设计

MIT 的 CTP-LI Publications 页面逐条列出论文标题、作者、日期和 arXiv
链接；摘要默认以 "Abstract: (click to show)"
折叠，用户可按需展开。该列表有分页页面。来源：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/center-for-theoretical-physics-publications/>。

### 为什么这个模式有效

-   默认视图保持紧凑，不会让几十篇论文的摘要把页面拉得过长。
-   标题与作者先回答"这是什么、谁做的"，日期与 arXiv
    链接再回答"什么时候、去哪里读"。
-   摘要展开减少页面视觉噪声，同时保留研究细节。
-   分页能控制单页长度，但对不断增长的列表而言，若没有筛选/搜索，仍会增加找论文的成本。

### 适合 BUAA 的实现

每个论文条目建议有：

-   标题、作者、年份/日期。
-   arXiv ID 和链接、DOI、期刊/卷页/文章编号。
-   发表状态：预印本、已接收、已发表、勘误/修订（需要人工确认）。
-   研究标签：暗物质、中微子、Higgs/EFT、对撞机、相变/引力波、量子计量学等。
-   摘要折叠区。
-   "打开 arXiv""打开期刊""复制 BibTeX"操作。
-   如公开可用，添加代码、数据、补充材料链接。

不要直接复制 MIT 的静态列表实现。BUAA 现有论文搜索与 BibTeX
功能应升级为**一个数据源、多种展示视图**：首页精选列表、完整论文页、研究专题页都读取同一条论文记录。

## 2.4 成员目录

MIT 成员目录有按 Title/角色筛选的输入控件，涵盖
Faculty、Postdocs、Long-term Visitors、Staff、Graduate Students
等；部分成员条目还提供研究简介。来源：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/people/>。

### 值得学习

-   角色分类可以在成员数量增长后保持可浏览。
-   简短的研究简介能解释成员为什么与该中心相关，而不只是显示姓名和职位。
-   访客、学生、博士后与教师属于不同生命周期；不应长期放在一个不分角色的名单里。

### BUAA 适配建议

成员数据模型至少包含：

`id, name_zh, name_en, role, research_tags, bio_short, email_public, homepage_url, scholar_url, orcid, photo_url, display_order, active, start_date, end_date`

注意：

-   不要要求每位成员都公开个人邮箱；可以允许只链接个人主页。
-   `active` 与任职时间需要维护，避免毕业成员继续出现在当前成员列表。
-   学生导师关系是否公开，应由课题组确认。
-   角色筛选与研究方向筛选可以并存，但移动端应使用折叠筛选面板，避免占据整个首屏。

## 2.5 研讨会、招聘与内部规范

MIT 的中心导航把研讨会和招聘作为直接入口，也提供 Graduate Student
Guidelines、Travel Guidelines、Norms and Expectations
等资源。招聘页面明确列出不同类型的岗位和申请入口。来源：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/job-opportunities/>。

### 对 BUAA 的可迁移功能

-   公开层：近期公开讲座、访问学者报告、招聘/招生说明、联系信息。
-   内部层：组会规范、报告模板、差旅指南、数据/代码提交规范、论文写作流程。
-   招聘页只展示当前有效机会；每项应有截止日期、适用对象、官方申请链接和最后核对日期。

### 不应照搬

MIT 的中心规模、行政结构和岗位类型远超一般课题组。BUAA
不必创建大量空栏目。建议只在有真实内容和维护负责人时启用"访问""招聘""规范"等模块。

## 2.6 MIT 模式总结

**最值得借鉴：**
论文摘要折叠、成员角色筛选、公开活动/招聘入口、内部规范与公共科研介绍分层。

**潜在问题/风险：**
论文分页不等于高效搜索；人员与岗位数据需要持续维护；组织层级较复杂，不适合照搬为小组设置同样多的行政页面。

**建议优先级：P1。**
论文卡片与成员目录可以较低成本迁移，内部规范归档适合后续建设。

------------------------------------------------------------------------

# 3. Kavli Institute for the Physics and Mathematics of the Universe (Kavli IPMU)

## 3.1 核心页面与来源

-   首页：<https://www.ipmu.jp/>
-   Research Activities：<https://www.ipmu.jp/en/research-activities>
-   Seminars &
    Conferences：<https://www.ipmu.jp/en/research-activities/seminars-conferences>
-   Public
    Events：<https://www.ipmu.jp/en/public-communications/public-events>
-   人员目录入口：从首页导航 "Our People" 进入。

官方主导航明确把 Our People、Research、News、Outreach、Jobs、For
Visitors、For Employees、For Students、Access、Contact 分开。Research
下又分 Research Program、Seminars & Conferences、Publications、IPMU
Preprints、Conference Talks、Annual
Reports。来源：<https://www.ipmu.jp/en/research-activities>。

## 3.2 首页内容分区

### 可直接观察到的设计

首页不是单一的新闻流，而是把
News、Outreach、Conference、Colloquia、Seminars、Campus News、Video
Contents 等内容类型分区呈现。每一类有独立的"View
more"或对应栏目入口。来源：<https://www.ipmu.jp/>。

### 设计逻辑

研究新闻与科学活动的更新周期不同：

-   新闻：研究突破、人员任命、奖项或机构动态。
-   会议/研讨会：有明确日期、地点和报名/参与信息。
-   公众传播：科普讲座、开放日、视频和问答。
-   科学出版物：长期可检索的学术记录。

如果这些内容都放进一个"News"表中，就会导致过滤困难、日期含义混乱，以及主页无法控制信息比例。

### BUAA 的适配

建议在数据层分开：

-   `publications`：论文与预印本。
-   `events`：组会、学术报告、研讨会、会议。
-   `news`：获奖、论文亮点、人员动态、网站公告。
-   `outreach`：科普、公开讲座、招生介绍（如果确实维护）。
-   `resources`：资料库和技术文档。

首页只是这些数据的精选视图，不应该成为数据录入的唯一位置。

## 3.3 Research Activities：预印本与正式出版物分开

IPMU 的 Research Activities 将 Publications 和 IPMU Preprints
作为不同入口，还提供 Conference Talks 和 Annual
Reports。来源：<https://www.ipmu.jp/en/research-activities>。

### 为什么值得借鉴

预印本与正式出版物并非同一种状态：

-   预印本可能正在投稿、修订或尚未发表。
-   正式出版物应有期刊、卷页/文章编号、DOI 等元数据。
-   Conference Talks 是研究人员的报告记录，不应混入论文表。
-   Annual Reports 是机构年度总结，不应被当成新闻或论文。

### BUAA 的数据建模建议

不要用一个 `status` 字符串去承担所有语义。建议分开：

-   `publication_type`: article / review / proceeding / thesis / other。
-   `publication_status`: preprint / submitted / accepted / published /
    corrected / withdrawn。
-   `arxiv_id`、`doi`、`journal_title`、`volume`、`page_or_article_number`、`publication_date`。
-   `record_checked_at` 与 `metadata_source`。
-   `talks` 单独建表，使用
    `speaker_id`、`event_id`、`slides_url`、`recording_url`。

期刊状态应由人核验后更新；自动抓取只能生成草稿，不能无审核覆盖人工确认结果。

## 3.4 人员目录与人员生命周期

IPMU 导航对 Director、Faculty、Senior Fellows、Project
Researchers、Cross Appointments、Affiliate Members、Graduate
Students、Visitors、Alumnae and Alumni、Past Admitted Students
等分类。来源：<https://www.ipmu.jp/>。

### 值得借鉴

-   现任人员与校友/历史成员分开。
-   访问者作为独立资源类型，而非永久成员的一个备注。
-   职位分类可以和研究方向交叉浏览。

### BUAA 不必复制的部分

IPMU
是大型国际研究机构，具有大量访客、附属成员、学生和校友。小组网站如果没有足够人员规模，不应一次性创建十几种角色。可从以下最小集合开始：

`faculty / postdoc / student / visitor / alumni / staff`

若人数少，访客只在实际访问期间显示；校友列表可以后续再加。

## 3.5 学术活动与公众传播

IPMU 的活动页和公众传播页是分开的。Public Events
包含面向公众的开放日、科学咖啡馆、联合公开讲座和科学论坛；Research
Activities 则承载专业研讨会、会议和
colloquia。来源：<https://www.ipmu.jp/en/public-communications/public-events>、<https://www.ipmu.jp/en/research-activities/seminars-conferences>。

### 对 BUAA 的启发

建立两个入口即可：

1.  **学术活动：** 组会、专题报告、journal club、访问学者报告、会议。
2.  **公开活动：** 对外开放的讲座、招生介绍、科普活动。

不要把内部组会的时间、会议链接或讲稿意外公开。事件应有 `visibility`
和后端访问控制，而不是只靠前端隐藏。

## 3.6 IPMU 模式总结

**最值得借鉴：**
内容类型分离、预印本与正式论文分开、人员生命周期分类、专业活动与公众活动分层。

**成本：** 中等。需要统一的数据模型和维护规则，但可分阶段实现。

**建议优先级：P1。**
先把论文、活动、新闻、人员四类数据分开，再做复杂筛选。

------------------------------------------------------------------------

# 4. CERN Department of Theoretical Physics

## 4.1 核心页面与来源

-   理论物理部首页：<https://theory.cern/>
-   Seminars：<https://theory.cern/seminars>
-   CERN 理论物理部公开站点还链接到
    workshops、institutes、LPCC、FCC、CENF-TH、PBC 等活动/研究项目。

来源：<https://theory.cern/>、<https://theory.cern/seminars>。

## 4.2 首页与研究社区结构

### 可直接观察到的设计

CERN Theory 首页把近期 seminars 与 institutes/workshops
等大型学术活动放在首页内容中；研讨会页面列出不同系列、具体日期、时间、讲者、题目和房间。来源：<https://theory.cern/seminars>。

这意味着首页不仅是"介绍部门"，也是科研共同体的动态入口。

### 对 BUAA 的适配

公开首页可以展示近期 2--3 场对外开放的报告；`/hub` 则显示完整内部组会和
journal
club。公开与内部活动必须由同一数据模型区分可见性，避免双份手动维护。

## 4.3 Seminar series 是一等数据对象

CERN seminars
页面明确列出固定系列、组织者、时间与地点；还允许外部人员订阅邮件列表，并说明可以通过
Indico 的 iCalendar 图标订阅日历。来源：<https://theory.cern/seminars>。

### 关键设计

不要只把"组会"做成一张事件表。至少存在两个实体：

-   **系列（Series）：** 例如 BSM journal
    club、理论组会、访问学者报告；具有组织者、默认频率、默认地点、订阅方式。
-   **单次活动（Event）：**
    某一天的具体报告，具有讲者、标题、摘要、时间、地点、线上链接、材料与状态。

这样可以支持：

-   查看整个系列。
-   按系列过滤近期/历史活动。
-   给某个系列生成日历订阅。
-   只向某系列的订阅者发送提醒。
-   系列负责人离任后转交管理权，而不丢失历史记录。

### BUAA 的推荐事件模型

`seminar_series`: - `id`, `slug`, `name`, `description`,
`organizer_ids`, `default_location`, `default_timezone`,
`calendar_feed_token_hash`, `visibility`, `active`

`seminar_events`: - `id`, `series_id`, `title`, `speaker_id`,
`speaker_name`, `affiliation`, `start_at`, `end_at`, `timezone`,
`location`, `abstract`, `slides_url`, `recording_url`, `meeting_url`,
`visibility`, `status`, `created_by`, `updated_at`

订阅 Token 必须是可撤销的随机凭据；不要把用户登录 JWT 当成公开日历订阅
Token。内部事件的 feed 应有专门授权或一次性/可撤销的订阅机制。

## 4.4 组织者和责任归属

CERN 页面提示用户点击系列名称查看 seminar
organizers/managers。这个模式将活动内容与管理责任联系起来，而不只是一个没有维护者的日历。来源：<https://theory.cern/seminars>。

### BUAA 的适配

每个系列应显示一位联系人或组织者；后台记录
`owner_id`。管理员可接管，但普通成员不能修改不属于自己的系列。变更记录至少保存
`created_by`、`updated_by` 和更新时间。

## 4.5 日历集成和外部订阅

CERN
让访问者把活动放入个人日历，而不是强迫用户每天回来刷新网页。此功能特别适合研究组。

建议分阶段：

-   P1：每场活动有"添加到日历（.ics）"。
-   P2：每个公开系列有只读 iCalendar feed。
-   P2：内部系列使用受控订阅 Token；Token 可轮换/撤销。
-   P2：导入/导出 ICS 时保留时区、UID、更新版本与取消状态。

验收时检查：时区正确、修改时间后日历能更新、取消事件能同步、内部链接不会进入公开
feed。

## 4.6 CERN 模式总结

**最值得借鉴：** 系列与活动分离、组织者可发现、iCalendar
订阅、邮件订阅、首页展示动态学术活动。

**不应直接照搬：** CERN
有大量跨组织研讨会与专门活动系统；小组可先做简单系列与单场事件，不必重建
Indico。

**建议优先级：P1/P2。** 先完善活动元数据，再做 ICS 订阅。

------------------------------------------------------------------------

# 5. DESY Theory Group

## 5.1 核心页面与来源

-   首页：<https://theory-hamburg.desy.de/>
-   Theory
    Seminars：<https://theory-hamburg.desy.de/seminars/theory_seminars/index_eng.html>
-   首页导航可见
    Members、Visitors、Seminars、Events、Research、Positions、Partner
    Institutes、Third-party funding、Contact、Organisation
    plan、Internal。

来源：<https://theory-hamburg.desy.de/>。

## 5.2 研究介绍：用问题组织科学内容

DESY
的首页把研究放在基本问题上：基本粒子谱是什么、相互作用的性质是什么、质量如何产生、力是否统一、粒子物理如何影响早期宇宙、暗物质是什么、量子引力如何描述引力。它也明确说理论研究与
DESY
的实验粒子物理紧密联系，通过解释观测并预测未来实验信号发挥作用。来源：<https://theory-hamburg.desy.de/>。

### 这比简单的研究标签更有效

单纯列出 "Dark Matter / Neutrino / Higgs / EFT"
只能让专家知道关键词，却不能说明团队的问题意识。建议 BUAA
每个研究专题的开头用：

1.  **核心问题：** 当前要解释的物理现象或理论缺口。
2.  **理论框架：** 模型、对称性、有效场论或计算方法。
3.  **可观测量：** 截面、衰变率、振荡概率、引力波谱等。
4.  **检验途径：** 对撞机、直接/间接探测、宇宙学观测等。
5.  **本组代表成果：** 论文与项目链接。

内容必须由实际研究成果支撑，不要为了看起来覆盖广而把没有研究证据的方向写成"本组研究"。

## 5.3 站点导航：完整但层级偏重

DESY 的页面有较传统的多级导航，同时包含面向内部的 "Internal"
入口。其优点是职责明确：成员、访客、活动、研究、职位和合作机构都能直接找到。其代价是栏目多，若内容过期或空缺会让维护负担增大。来源：<https://theory-hamburg.desy.de/>。

### 对 BUAA 的建议

-   保留公开的 Research / Publications / People / Seminars / Contact。
-   内部资料统一进入 `/hub`，而不是把内部导航散落到公开主菜单。
-   "Funding""Organisation plan"等只有当确实需要公开且有维护人时再创建。
-   内部入口只展示登录入口，不应在公开导航泄漏会议链接、内部文档标题或未发表研究信息。

## 5.4 研讨会页面：日程可执行

DESY Theory Seminars
页面列出即将举行的报告、日期、时间、题目、讲者/机构、地点和房间；部分条目可点击查看详情。页面还明确各系列的固定频率与地点，并列出不同系列的组织者联系信息。来源：<https://theory-hamburg.desy.de/seminars/theory_seminars/index_eng.html>。

### 对 BUAA 的具体启发

一张活动卡片应能回答"什么时候、谁来讲、讲什么、在哪、我还需要做什么"。建议活动列表展示：

-   日期与时间（明确时区）。
-   系列标签。
-   标题和讲者。
-   所属机构。
-   地点或会议方式。
-   详情页链接。
-   状态：计划中、已变更、取消、已完成。
-   摘要与相关论文（如有）。

内部组会可以额外包含讲稿、会议链接、主持人、讨论问题和会后记录，但必须经过后端授权。

## 5.5 访客与职位

DESY 将 Visitors 和 Positions
作为独立栏目。对于研究组网站，这比将访问学者、招聘广告放入新闻流更利于查找。

BUAA 可先做轻量版：

-   `Visit the group`：访问方式、联系方式、交通/校园信息。
-   `Open positions`：只显示当前有效岗位或明确说明暂无岗位。
-   招聘项包含发布时间、截止日期、申请入口、联系人和最后核对日期。
-   不要用静态页面宣称长期招人；过期职位应自动隐藏或显示已截止。

## 5.6 DESY 模式总结

**最值得借鉴：**
问题导向的科学介绍、活动日程完整字段、人员/访客/职位分开、公开与内部入口分层。

**需避免：**
复杂的旧式多级导航和长期存在的历史栏目。栏目数量必须匹配实际内容与维护能力。

**建议优先级：P0/P1。**
先改写研究专题和活动详情字段，不必先引入复杂前端框架。

------------------------------------------------------------------------

# 6. Harvard High Energy Theory Group / Center for the Fundamental Laws of Nature

## 6.1 核心页面与来源

-   首页：<https://hetg.physics.harvard.edu/>
-   Members：<https://hetg.physics.harvard.edu/members>
-   Research：<https://hetg.physics.harvard.edu/research>
-   Seminars：<https://hetg.physics.harvard.edu/research-seminars>
-   News & Events、Resources、Contact 可从主导航进入。

来源：上述 Harvard 官方页面。

## 6.2 导航和内容层级

Harvard 站点的一级导航相对简洁：Seminar
Schedule、Members、Research、News &
Events、Resources、Contact。首页说明团队由 faculty、postdocs、graduate
students 和 affiliates 构成，并有 Particle Theory 与 String Theory 两个
seminar series。来源：<https://hetg.physics.harvard.edu/>。

### 可迁移之处

对于小型研究组，六个清楚的一级入口足够：

-   Research
-   Publications
-   People
-   Seminars
-   Resources
-   Contact

公开官网中的内部协作入口可作为单独按钮，不要把所有 `/hub`
功能都放进公开导航。

## 6.3 研究方向列表：短而明确

Harvard Research
页面列出非微扰量子引力、黑洞量子力学、弦论代数几何、弦唯象、全息对偶、弦宇宙学、LHC、BSM、暗物质和
EFT 等方向。来源：<https://hetg.physics.harvard.edu/research>。

优点是快速说明覆盖范围；不足是仅列名称时，读者很难了解每个方向的具体问题、研究方法和本组贡献。

### BUAA 的改进方法

可以保留短标签，但每个标签必须链接到详细专题页。专题页不要只是重复关键词，而要包含：

-   100--200 字的方向简介。
-   一张经过授权的概念图或实际科学图。
-   本组实际研究的问题与方法。
-   3--5 篇代表论文。
-   相关人员与学术活动。
-   最近更新日期。

## 6.4 人员页面：角色分类清楚

Harvard Members 页面把 Faculty、Post-Docs、Graduate Students、Visiting
Scholars、Affiliates、Staff
分开。来源：<https://hetg.physics.harvard.edu/members>。

这对 BUAA
的意义不是必须照搬六类，而是建立一致的人员生命周期与角色体系。人员卡片建议显示：

-   姓名（中英文可选）。
-   当前角色。
-   研究兴趣标签。
-   个人主页 / ORCID / INSPIRE / Google Scholar（仅链接已确认的账户）。
-   联系方式（由本人选择是否公开）。
-   论文关联。

## 6.5 Seminar Schedule

Harvard 的 seminar
页面按不同系列给出固定时间，并链接到周边大学的相关研讨会资源。来源：<https://hetg.physics.harvard.edu/research-seminars>。

这体现两个实用点：

1.  活动系列有稳定的组织者和时间规则。
2.  研究组不必把所有学术活动都收进本组；可以链接附近或相关研究机构的外部活动日历。

BUAA 可以建立"相关学术活动"资源页，链接北航、北京其他高校、IHEP
等机构的公开讲座日历，但必须核验来源、更新频率与外部链接是否仍有效。

## 6.6 内容维护的反面教材

当前可访问的 Harvard 首页仍展示多条 2018--2019
年的新闻。来源：<https://hetg.physics.harvard.edu/>。

这说明即使研究机构声誉很高，旧新闻模块也可能长期不更新。对访客而言，过期内容会让整个网站显得无人维护。

### BUAA 应采用的治理规则

-   首页 News 模块只展示最近 6--12 个月的内容。
-   没有新消息时，改为展示最新论文或即将到来的活动，而不是填充旧新闻。
-   每条新闻存 `published_at`、`last_reviewed_at`、`status`。
-   对超过阈值的招聘、活动和新闻做过期检查。
-   "最后更新"必须来自真实数据，不能靠静态写死日期伪装活跃。

## 6.7 Harvard 模式总结

**最值得借鉴：**
简洁导航、人员角色分类、研究方向短入口、研讨会系列与外部资源链接。

**不应照搬：** 单纯的研究方向列表和长期不更新的新闻区域。

**建议优先级：P0/P1。** 适合小组先快速落地，再逐步丰富专题内容。

------------------------------------------------------------------------

# 7. Perimeter Institute

## 7.1 核心页面与来源

-   Research 总览：<https://perimeterinstitute.ca/research>
-   Research
    Areas：<https://perimeterinstitute.ca/research/research-areas>
-   Particle
    Physics：<https://perimeterinstitute.ca/research/research-areas/particle-physics>
-   Quantum Fields and
    Strings：<https://perimeterinstitute.ca/research/research-areas/quantum-fields-and-strings>
-   Seminars：<https://perimeterinstitute.ca/research/seminars>
-   Researchers /
    Visitors：<https://perimeterinstitute.ca/info/researchers>
-   Research Centres and
    Initiatives：<https://perimeterinstitute.ca/research/research-centres-and-initiatives>

## 7.2 Research 总览：不只是研究领域列表

Perimeter 的 Research 页面把 Researchers、Research Areas、Research
Centres and Initiatives、Visitor Programs、Conferences、Seminars
等并列展示。来源：<https://perimeterinstitute.ca/research>。

### 设计意义

一个科研平台不只有"研究方向"这一个分类维度，还存在：

-   人：谁在研究。
-   领域：研究什么。
-   项目/倡议：哪些人跨方向协作。
-   活动：在哪些场景讨论。
-   访问计划：外部研究者如何参与。
-   资源：哪里能继续学习或观看报告。

这些内容应通过链接形成关系，而不是各自成为孤岛页面。

## 7.3 研究方向页面：问题导向的编辑模板

Perimeter Research Areas 为不同方向配置图片和简短介绍。Particle Physics
页面从标准模型的基本组成与希格斯出发，提出暗物质、暗能量、质量层级等未解决问题，再解释相关研究与实验交叉，并列出研究人员。Quantum
Fields and Strings
页面则先解释量子场论在粒子物理、凝聚态和早期宇宙中的作用，再介绍弦论的联系。来源：

-   <https://perimeterinstitute.ca/research/research-areas/particle-physics>
-   <https://perimeterinstitute.ca/research/research-areas/quantum-fields-and-strings>

### 这是一种很适合 BUAA 的专题结构

建议每个专题按如下顺序组织：

1.  **科学问题：** 目前有哪些关键未知。
2.  **本组切入点：** 本组具体研究什么，不要泛泛复述领域介绍。
3.  **理论工具：** 模型、有效算符、数值/解析方法。
4.  **实验联系：** 对撞机、直接探测、宇宙学等观测量。
5.  **代表成果：** 与此方向直接相关的论文。
6.  **研究人员：** 相关成员。
7.  **延伸资源：** 代码、数据、讲座和综述。

不能将 Perimeter 的广泛领域直接搬成 BUAA
的研究声明；只保留有本组论文或项目支持的方向。

## 7.4 Research initiatives：展示跨方向连接

Perimeter 的 Research Centres and Initiatives
页面展示一组具体研究倡议，例如 Centre for the Universe、Gravitational
Waves Initiative、Event Horizon Telescope Initiative
等，并用简短说明解释其目标。来源：<https://perimeterinstitute.ca/research/research-centres-and-initiatives>。

### BUAA 可用的轻量替代方案

如果课题组有真实跨方向主题，可以创建"研究主题交叉"模块，例如：

-   暗物质 ↔ 对撞机 ↔ 直接探测。
-   中微子 ↔ 轻子新物理 ↔ 宇宙学。
-   Higgs portal ↔ UV--EFT ↔ 精密测量。
-   电弱相变 ↔ 引力波 ↔ 新粒子探测。

每条连接必须链接到实际论文或专题，不能只为视觉效果绘制网络图。

## 7.5 Seminar 页面：系列、负责人、固定时段与历史资源

Perimeter Seminars 页面按研究领域列出 seminar
series，并显示系列负责人、主题、固定时段，以及 upcoming/past talks
链接。页面说明学年活动周期，并链接到 PIRSA
讲座档案。来源：<https://perimeterinstitute.ca/research/seminars>。

### 对 BUAA 的建议

-   组会、journal club、访问学者报告可作为不同系列。
-   系列页显示组织者、活动频率、默认地点和参与规则。
-   单场活动有独立详情页。
-   已完成活动进入历史档案，而不是从系统中删除。
-   若有讲稿、视频、论文，挂接到同一活动条目。
-   只有经过授权的录屏才公开；内部报告可标记为仅组内可见。

Perimeter 的 PIRSA
说明还体现出讲座档案可以是长期、可搜索、可引用的学术资源。BUAA
不必自行搭建视频平台，可以链接到授权的公开视频或校内平台。

## 7.6 研究人员与访客

Perimeter 的 Research 页面和 Researchers
页面把研究领域、当前研究人员、访问者与访问计划连接起来；访客信息包含机构、访问时间和研究领域。来源：<https://perimeterinstitute.ca/info/researchers>。

BUAA
可在访问者实际来访期间展示简短条目，并在结束后归档；公开之前应征得本人同意。内部工作台可以保留更详细的接待信息，但不应公开私人行程、联系方式或内部会议链接。

## 7.7 Perimeter 模式总结

**最值得借鉴：** 研究领域编辑模板、研究倡议/跨方向连接、seminar series
与历史档案、访客计划和研究人员互链。

**成本：**
中到高。需要内容编辑流程与关联数据；可先用静态配置和现有论文/活动数据实现，不必一次性构建复杂
CMS。

**建议优先级：P1/P2。**
先建研究专题模板，再逐步增加跨方向关联和活动档案。

------------------------------------------------------------------------

# 8. 六站对比：模式、适用性与不应照搬的部分

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  能力           MIT CTP-LI                                Kavli IPMU                 CERN Theory                    DESY Theory              Harvard HETG                Perimeter
  -------------- ----------------------------------------- -------------------------- ------------------------------ ------------------------ --------------------------- -----------------------------
  研究问题表达   研究范围广并解释理论/实验联系             机构研究项目分类           研究与活动组织联系             明确列出基本物理问题     方向列表简洁                专题从核心问题展开

  论文/预印本    标题、作者、日期、摘要折叠、arXiv、分页   Publications 与 Preprints  不是主页的唯一核心             需从研究站点进一步浏览   非核心入口                  研究人员/专题与领域相连
                                                           分开                                                                                                           

  成员模型       角色筛选与简介                            细粒度人员生命周期         研究部门/系列组织者            Members、Visitors 独立   Faculty、Postdoc、Student   研究方向、人员与访客关联
                                                                                                                                              等分类                      

  活动模型       多个 seminar 系列                         专业活动与公众活动分离     系列、组织者、邮件订阅、iCal   日程、地点、系列频率     系列固定时间和外部资源      系列负责人、历史档案、PIRSA

  访问/招聘      专门职位和研究生指南                      Jobs、Visitors、Students   多个研究活动/机构入口          Visitors、Positions      Contact/Resources           Visitor Programs

  可迁移性       论文与成员功能高                          内容分类高                 日历与系列模型高               研究文案与日程字段高     简洁导航高                  专题模板与活动档案高

  主要风险       行政结构过复杂                            分类过细导致维护成本       小组不需要完整 Indico 复杂度   多级导航与旧栏目负担     新闻可能长期陈旧            大型研究倡议模式对小组过重
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 8.1 推荐组合

BUAA HEP Hub 最适合的组合不是单一模板，而是：

-   **论文：MIT 模式** ------ 紧凑条目、摘要展开、元数据和外链。
-   **内容类型：IPMU 模式** ------
    论文、预印本、活动、新闻、人员分别管理。
-   **学术活动：CERN 模式** ------ 系列、组织者、订阅与 iCalendar。
-   **研究介绍：DESY + Perimeter 模式** ------
    从物理问题写起，连接方法、观测量、论文与人员。
-   **导航：Harvard 模式** ------ 公开一级导航保持短而清楚。

------------------------------------------------------------------------

# 9. 针对 BUAA HEP Hub 现有功能的具体设计

本节是对标研究的落地核心。以下建议针对现有项目已知结构：Vue
前端、公开首页、研究方向切换、论文搜索与 BibTeX 导出、受保护的 `/hub`
工作台，以及 Cloudflare Pages Functions / D1。

## 9.1 建议的信息架构

``` text
Public Site
├── Home
│   ├── Research overview
│   ├── Selected publications
│   ├── Upcoming public seminars
│   └── Latest verified news
├── Research
│   ├── Dark Matter & Dark Sector
│   ├── Neutrinos & New Interactions
│   ├── Higgs / EFT / Collider Phenomenology
│   └── Phase Transitions & Gravitational Waves
├── Publications
│   ├── Search / Filter
│   ├── Published papers
│   ├── Preprints
│   └── BibTeX export
├── People
├── Seminars & Events
├── Opportunities / Visitors (only when maintained)
├── Contact
└── Group Workspace → /hub (login required)

Protected /hub
├── Research Library
├── Group Seminars
├── Internal Notes / Documents
├── Research Tools
├── Member-only Resources
└── Administration (role-gated)
```

这里的专题名称只是建议分类，最终应依据
INSPIRE-HEP、arXiv、课题组成员确认的真实成果来决定。不能把没有论文支撑的方向作为本组现有研究的事实陈述。

## 9.2 首页推荐线框

``` text
┌─────────────────────────────────────────────────────────┐
│ BUAA HEP Hub       Research Publications People Seminars │
│                                      [Group Workspace]   │
├─────────────────────────────────────────────────────────┤
│ Research at the interface of theory and phenomenology   │
│ 一句话介绍课题组已确认的研究目标                         │
│ [Explore research] [Browse publications]                 │
├─────────────────────────────────────────────────────────┤
│ RESEARCH DIRECTIONS                                      │
│ [Dark matter] [Neutrinos] [Higgs/EFT] [Phase transitions]│
│ 每张卡：物理问题 + 本组切入点 + 相关论文数               │
├─────────────────────────────────────────────────────────┤
│ SELECTED PUBLICATIONS                                    │
│ 标题 / 作者 / 年份 / 期刊状态 / arXiv / 摘要展开        │
│ [All publications]                                       │
├─────────────────────────┬───────────────────────────────┤
│ UPCOMING SEMINARS       │ LATEST VERIFIED NEWS          │
│ 日期 / 讲者 / 标题      │ 论文亮点 / 奖项 / 公开活动    │
├─────────────────────────┴───────────────────────────────┤
│ PEOPLE · CONTACT · INSTITUTIONAL LINKS                   │
└─────────────────────────────────────────────────────────┘
```

设计原则：

-   首页最多放 3--5 篇精选论文，不展示完整论文数据库。
-   活动区只显示未来活动；没有活动时提供"查看历史活动"，不要显示过期内容。
-   研究方向卡片必须链接到专题详情页。
-   `/hub` 是清楚的独立入口，不在公开首页暴露内部资料标题。
-   首页视觉图应服务于研究方向，不应让动效占据首屏主要带宽。

## 9.3 研究专题详情页模板

每个专题使用同一个组件模板：

1.  `Hero / Introduction`：1 段简洁介绍，说明核心问题。
2.  `Open Questions`：2--4 个真实物理问题。
3.  `Our Approach`：模型、理论框架和计算/实验方法。
4.  `From Theory to Observables`：说明参数如何影响可测量量。
5.  `Selected Publications`：从统一论文库按标签查询。
6.  `People`：关联相关成员。
7.  `Seminars / Resources`：有关报告、讲稿或公开代码。
8.  `References / Last reviewed`：来源与最近审核日期。

例如"暗物质与暗扇区"可用热遗迹、共湮灭、门户相互作用和多探测途径来组织，但只有在课题组实际成果支撑的地方才写成"本组研究"。其他可写成"背景介绍"或"相关方向"，并标注来源。

## 9.4 论文条目与数据模型

建议论文表最少包含：

``` text
Publication
- id
- title
- authors[]
- year
- published_date
- arxiv_id
- arxiv_url
- doi
- journal
- volume
- page_or_article_number
- publication_status
- abstract
- research_tags[]
- author_confirmed
- metadata_source
- source_checked_at
- code_url?
- data_url?
- supplementary_url?
- featured
- visibility
- created_at
- updated_at
```

### 关键约束

-   arXiv ID 不能代替 DOI；两者都可能有，也可能只有其一。
-   "预印本"和"已发表"是不同状态；期刊信息必须有来源。
-   `visibility` 应区分公开与组内内容。
-   `author_confirmed` 与 `source_checked_at`
    有助于避免自动抓取数据未经核验直接发布。
-   BibTeX 应从同一记录生成，避免手工维护第二份元数据。
-   论文摘要可能受版权与许可限制，建议优先使用作者提交的摘要或官方可合法展示的元数据。

## 9.5 活动与日历数据模型

``` text
SeminarSeries
- id, name, slug, description
- organizer_ids[]
- default_location
- default_timezone
- visibility
- active

SeminarEvent
- id, series_id, title
- speaker_name, speaker_affiliation
- start_at, end_at, timezone
- location, meeting_url
- abstract, slides_url, recording_url
- visibility, status
- created_by, updated_by, updated_at
```

建议用户流程：

1.  访问者在公开首页查看即将举行的公开讲座。
2.  进入活动详情查看讲者、摘要、时间与地点。
3.  点击 `.ics` 下载单次活动，或订阅公开系列日历。
4.  组内成员登录 `/hub` 后查看内部组会详情。
5.  组织者修改时间后，系统保留更新记录，并同步更新日历条目。
6.  取消活动时标记 `cancelled`，而不是直接删除历史记录。

安全要求：内部活动的会议链接和资料必须由 API 权限控制。公开 iCalendar
feed 不得包含内部活动；私有订阅 Token
应独立、可撤销、只读且不等同于用户登录 JWT。

## 9.6 人员数据模型

``` text
Person
- id
- name_zh
- name_en
- role
- research_tags[]
- bio_short
- photo_url?
- email_public?
- homepage_url?
- orcid?
- inspire_author_url?
- scholar_url?
- active
- start_date?
- end_date?
- display_order
```

个人主页应关联论文记录，而不是让每个人重复维护一份出版物列表。角色可先从
faculty、postdoc、student、visitor、alumni、staff
开始；没有足够内容的分类不要提前建空页面。

------------------------------------------------------------------------

# 10. UI 与视觉系统：把参考站点转成可实现的组件规则

## 10.1 公开站点与内部工作台

### 公共站点

目标：学术可信、内容清楚、便于发现研究成果。

-   背景以白色/浅灰为主，深海军蓝用于标题和导航。
-   使用少量蓝青色强调链接与选中状态。
-   首屏图像使用真实科学图、经过授权的探测器图像或本组自制示意图。
-   降低动画强度，不把大面积动态背景当作主要品牌。
-   论文、成员和活动卡片统一结构与间距。

### 内部工作台

目标：高信息密度、快速检索、日常科研操作。

-   可使用更深的色彩体系，但保证文字对比度。
-   左侧/顶部导航按资源、组会、笔记、工具和管理分组。
-   复杂功能使用可折叠面板，不在首页同时展示全部模块。
-   允许用户保存筛选条件或最近使用的资源（前提是实现了可靠的用户级存储）。
-   公开与内部页面共享字体、按钮、表单、图标、焦点样式和间距令牌，但不必强行使用完全相同的背景与布局。

## 10.2 设计令牌建议

以下为**建议初值**，不是从参考网站提取的精确品牌色：

  Token                   建议值                     用途
  ----------------------- -------------------------- --------------------
  `--color-ink`           `#142338`                  主标题、深色文字
  `--color-accent`        `#2864A8`                  链接、主操作
  `--color-accent-soft`   `#EAF1F8`                  选中标签、浅色提示
  `--color-bg`            `#F7F9FC`                  页面背景
  `--color-surface`       `#FFFFFF`                  卡片背景
  `--color-border`        `#DCE4ED`                  边框与分隔线
  `--color-muted`         `#58677A`                  次级文字
  `--radius-card`         `12px`                     卡片圆角
  `--space-section`       `clamp(3rem, 7vw, 6rem)`   主要区块间距
  `--content-max`         `1160px`                   主内容宽度

正式落地前应检查与现有 `frontend/src/index.css`
的变量体系是否兼容，避免引入第二套重复 Token。

## 10.3 组件清单

优先统一以下组件：

-   `SiteHeader`：公开导航、移动菜单、工作台入口。
-   `ResearchDirectionCard`：标题、简述、研究标签、相关成果数。
-   `PublicationCard`：标题、作者、年份、状态、摘要展开、外链与 BibTeX。
-   `PublicationFilters`：关键词、年份、方向、发表状态。
-   `PersonCard`：姓名、角色、研究兴趣、个人链接。
-   `SeminarSeriesCard`：系列、负责人、频率、订阅入口。
-   `SeminarEventCard`：时间、讲者、题目、地点、状态。
-   `SourceCitation`：参考文献/来源、最后核对时间。
-   `EmptyState`：没有论文/活动/搜索结果时的清楚反馈。
-   `ErrorState`：数据源失败时提示重试，不伪装成"暂无内容"。
-   `WorkspaceEntry`：公开站点进入 `/hub` 的单独入口。

## 10.4 图片策略

建议优先级：

1.  本组自行绘制并审核的理论示意图。
2.  课题组拥有使用权的实验图像、数值结果图与研究照片。
3.  官方实验合作组/机构明确允许使用的图片，保留来源与署名。
4.  有明确开放许可的素材。

每张图需要记录
`source_url`、`license`、`credit`、`alt_text`、`caption`。不能因为图片出现在大学官网就默认可以复制到自己的站点。

------------------------------------------------------------------------

# 11. P0 / P1 / P2 实施路线图

## P0：可靠性与内容可信度

### P0-1 统一论文数据源

-   [ ] 核对当前论文列表与 BibTeX 数据是否来自同一数据结构。
-   [ ] 增加发表状态、DOI、arXiv ID、来源与核对日期字段。
-   [ ] 自动抓取只创建待审核记录，不自动覆盖已核验的期刊状态。
-   [ ] 为所有主页精选论文增加明确的来源链接。

**验收标准：**
同一篇论文在首页、完整列表和研究专题页的标题、作者、年份与状态一致；BibTeX
与显示记录一致。

### P0-2 公开/内部边界

-   [ ] 所有活动、文档、论文记录具有明确的公开/内部可见性。
-   [ ] 后端 API 对每次读取和修改执行权限检查。
-   [ ] 内部活动会议链接不出现在公开页面、搜索索引或公开日历中。
-   [ ] `/hub` 不通过前端隐藏代替后端授权。

**验收标准：** 未认证用户无法通过直接调用 API
读取内部数据；公开页面不暴露内部资源标题、链接或摘要。

### P0-3 首页过期内容治理

-   [ ] News、招聘和活动都记录发布日期、截止日期和最近核对时间。
-   [ ] 过期招聘自动隐藏或标记截止。
-   [ ] 没有近期新闻时显示近期论文/活动，而非旧新闻。
-   [ ] 对外部论文链接和人员主页建立周期性检查。

**验收标准：**
不出现超过设定期限仍被当作"最新"的旧新闻；所有在招职位均有明确截止日期或最后核对日期。

## P1：高收益科研功能

### P1-1 论文卡片升级（MIT 模式）

-   [ ] 摘要默认折叠。
-   [ ] 增加期刊状态、DOI、arXiv、代码/数据链接。
-   [ ] 支持按方向、年份、状态筛选。
-   [ ] 支持复制 BibTeX 与打开原文。

**验收标准：** 键盘可操作摘要展开和所有按钮；筛选结果正确；缺失 DOI
或摘要时不显示假数据。

### P1-2 研究专题模板（DESY + Perimeter 模式）

-   [ ] 每个真实研究方向有独立详情页。
-   [ ] 每页按问题、方法、观测量、代表成果、成员和资源组织。
-   [ ] 方向与论文通过标签关系连接。
-   [ ] 记录内容审核人和最近审核时间。

**验收标准：**
专题页中的代表论文均真实支持该专题；没有论文支撑的方向不会被宣称为本组当前研究。

### P1-3 人员目录（MIT + Harvard 模式）

-   [ ] 角色筛选。
-   [ ] 简短研究简介。
-   [ ] 个人主页/ORCID/INSPIRE 链接。
-   [ ] 人员离组后从当前列表移出，可选归档到校友页。

**验收标准：**
无失效个人链接；现任/历史成员区分清楚；不公开未获本人同意的私人信息。

### P1-4 活动详情（CERN + DESY 模式）

-   [ ] 活动系列和单次活动分开。
-   [ ] 每场活动显示时间、时区、讲者、机构、题目、地点、摘要和状态。
-   [ ] 支持单次活动 `.ics`。
-   [ ] 组内活动和公开活动由后端权限区分。

**验收标准：** 活动修改和取消状态正确；时区无误；内部事件不会进入公开
feed。

## P2：研究社区与长期知识积累

### P2-1 系列日历与提醒

-   [ ] 公开系列可订阅 iCalendar。
-   [ ] 内部系列有独立、可撤销的只读订阅 Token。
-   [ ] 订阅者可选择是否接收邮件提醒（如实现）。

### P2-2 活动档案

-   [ ] 已结束活动自动进入历史列表。
-   [ ] 讲稿、录像和相关论文挂接在活动记录下。
-   [ ] 公开资料使用授权后才发布。

### P2-3 研究交叉图

-   [ ] 只展示经过确认的方向---论文---人员关系。
-   [ ] 图上的每个节点可点击打开详情。
-   [ ] 无数据的方向不绘制虚假连接。

### P2-4 公开资源与内部资源互链

-   [ ] 公开论文可在内部笔记中引用。
-   [ ] 内部笔记可以引用公开 DOI/arXiv
    元数据，但不复制不必要的整篇受版权保护文本。
-   [ ] 公开站点不索引内部内容。
-   [ ] 公开资源由人工批准的静态白名单驱动，按文献与综述、实验与数据、计算与复现说明用途；不由内部资料库、成员表或日程接口派生。
-   [ ] 外部资源链接使用 HTTPS、新标签页与 `noopener noreferrer`；不嵌入第三方脚本、图片或追踪。
-   [ ] 研究方向说明和资源链接在无 JavaScript 时仍可访问；公开端的筛选操作不访问内部 API。

------------------------------------------------------------------------

# 12. 验收矩阵

  ----------------------------------------------------------------------------------------------------------------------
  维度                    测试方法                                通过标准
  ----------------------- --------------------------------------- ------------------------------------------------------
  桌面布局                1280、1440、1920 px                     主内容宽度可读，论文/成员/活动卡片对齐

  移动布局                320、360、390、768 px                   无整页横向溢出；导航可用；公式/表格有合理滚动

  键盘                    Tab、Shift+Tab、Enter、Space、Esc       所有交互可操作；焦点明显；弹层可关闭

  对比度                  自动检查 + 人工抽查                     正文和关键控件达到 WCAG 2.2 AA 目标

  论文搜索                空查询、中文/英文、年份、方向、无结果   过滤准确，空状态清楚，无结果时不崩溃

  BibTeX                  缺 DOI、有 arXiv、正式发表、多人作者    导出字段正确，转义字符合理，不伪造卷页/DOI

  活动                    新建、修改、取消、跨时区、ICS 导出      状态、时区和历史记录一致

  权限                    未认证、普通成员、授权组织者、管理员    API 权限和 UI 状态一致，越权请求被拒绝

  过期数据                过期活动、截止招聘、旧新闻              不再显示为未来/最新内容

  图片                    慢网、失败、窄屏、暗色模式              有 alt/caption，加载失败有回退，不拉伸

  性能                    Lighthouse、Network 面板、Core Web      记录优化前后数据；不以"看起来快"作为验收
                          Vitals                                  

  SEO                     title、description、canonical、Open     公开页元数据准确；内部页面不泄漏、且由服务端权限保护
                          Graph、sitemap                          
  ----------------------------------------------------------------------------------------------------------------------

> WCAG 2.2 AA 是建议目标；是否完全符合需要工具与人工测试，不能只凭 CSS
> 源码宣布通过。

------------------------------------------------------------------------

# 13. 开发顺序与技术落地

## 13.1 先整理数据，再扩展页面

建议按以下顺序推进：

1.  审查现有 `frontend/src/content/lab.js` 和 D1
    数据结构，确定论文、成员、研究方向和活动各自的权威来源。
2.  将论文元数据规范化，优先补充
    `publication_status`、DOI、arXiv、来源和核对日期。
3.  用同一数据源驱动首页精选论文、完整列表与研究专题页。
4.  再实现人员目录和活动系列/单场活动模型。
5.  最后实现 ICS、提醒和研究交叉图等增强功能。

## 13.2 不要过早引入新依赖

-   论文筛选和摘要折叠可用 Vue 原生组件完成。
-   `.ics` 单场活动导出可先由服务端生成。
-   如果活动数量不大，不需要立即引入复杂日历库。
-   如果论文元数据来自
    INSPIRE/arXiv，应缓存和人工核验，不要让公开页面每次加载都依赖外部
    API。
-   对 PDF.js、Three.js 等重型功能继续按需加载，避免污染公共首页的初始
    bundle。

## 13.3 与现有项目规范的关系

-   `design.md`：只放长期有效的视觉令牌、组件规则、布局与交互约定。
-   [`BUAA_HEP_Hub_网站审计与物理内容完善方案.md`](./BUAA_HEP_Hub_网站审计与物理内容完善方案.md)：放总体目标、问题编号、内容建设计划、优先级、风险与验收结果。
-   本文：作为"国际站点深度对标研究"，保存逐站证据、设计模式与移植分析。
-   `docs/audit/实施与验收报告.md`：保存具体问题的实施状态、测试命令、CI
    运行证据和未完成事项。

不要在三个文档中各自维护一份不同的 P0/P1/P2
清单。总体优先级以审计主文档为准；本报告只提供设计证据和具体方案。

------------------------------------------------------------------------

# 14. 每个网站的最终可迁移清单

## MIT CTP-LI

-   [ ] 论文摘要折叠与 arXiv 直达。
-   [ ] 成员按角色筛选。
-   [ ] 招聘/访问入口与公开首页联动。
-   [ ] 内部规范独立于公开研究介绍。

## Kavli IPMU

-   [ ] Publications 与 Preprints 分离。
-   [ ] Conference Talks 与论文分离。
-   [ ] News、Events、Outreach 分开维护。
-   [ ] 当前成员、访客和校友分开管理。

## CERN Theory

-   [ ] Seminar Series 与 Seminar Event 分开。
-   [ ] 活动组织者与系列负责人可发现。
-   [ ] 支持 `.ics` 和公开系列日历。
-   [ ] 内部订阅凭据独立且可撤销。

## DESY Theory

-   [ ] 研究方向从问题出发介绍。
-   [ ] 活动列表补齐时间、地点、讲者、系列和详情链接。
-   [ ] 公开人员、访客、职位、内部资料入口职责明确。
-   [ ] 避免建立长期无内容的多级栏目。

## Harvard HETG

-   [ ] 保持一级导航简洁。
-   [ ] 研究方向链接到详细专题。
-   [ ] 人员按角色分类。
-   [ ] 新闻/招聘过期治理。

## Perimeter Institute

-   [ ] 专题页统一使用问题---方法---成果---人员模板。
-   [ ] 研究方向与论文、活动和成员互相链接。
-   [ ] 研究倡议只在有真实跨方向项目时启用。
-   [ ] 已结束活动保留历史档案，并链接授权的讲稿/录像。

------------------------------------------------------------------------

# 15. 官方来源索引

以下为本轮检查的官方入口。站点内容会变化，实施前应再次核对页面状态。

### MIT Center for Theoretical Physics -- a Leinweber Institute

-   首页/导航/研究：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/>
-   People：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/people/>
-   Publications：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/center-for-theoretical-physics-publications/>
-   Jobs：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/job-opportunities/>
-   String/Gravity Seminar
    示例：<https://physics.mit.edu/research/labs-centers/mit-center-for-theoretical-physics-leinweber-institute/ctp-seminars/string-gravity-theory-seminar/>

### Kavli IPMU

-   首页：<https://www.ipmu.jp/>
-   Research Activities：<https://www.ipmu.jp/en/research-activities>
-   Seminars &
    Conferences：<https://www.ipmu.jp/en/research-activities/seminars-conferences>
-   Public
    Events：<https://www.ipmu.jp/en/public-communications/public-events>

### CERN Theory

-   首页：<https://theory.cern/>
-   Seminars：<https://theory.cern/seminars>

### DESY Theory Group

-   首页：<https://theory-hamburg.desy.de/>
-   Theory
    Seminars：<https://theory-hamburg.desy.de/seminars/theory_seminars/index_eng.html>

### Harvard High Energy Theory Group

-   首页：<https://hetg.physics.harvard.edu/>
-   Members：<https://hetg.physics.harvard.edu/members>
-   Research：<https://hetg.physics.harvard.edu/research>
-   Seminars：<https://hetg.physics.harvard.edu/research-seminars>

### Perimeter Institute

-   Research：<https://perimeterinstitute.ca/research>
-   Research
    Areas：<https://perimeterinstitute.ca/research/research-areas>
-   Particle
    Physics：<https://perimeterinstitute.ca/research/research-areas/particle-physics>
-   Quantum Fields and
    Strings：<https://perimeterinstitute.ca/research/research-areas/quantum-fields-and-strings>
-   Seminars：<https://perimeterinstitute.ca/research/seminars>
-   Researchers/Visitors：<https://perimeterinstitute.ca/info/researchers>
-   Research Centres and
    Initiatives：<https://perimeterinstitute.ca/research/research-centres-and-initiatives>

------------------------------------------------------------------------

# 16. 最终结论

对 BUAA HEP
Hub，最值得做的不是全面仿制任何一家大型研究机构，而是把成熟模式按小组规模组合起来：

1.  用 MIT 的论文摘要与成员筛选提高检索效率。
2.  用 IPMU 的内容类型分离防止论文、预印本、新闻和活动混杂。
3.  用 CERN 的系列---活动模型和 iCalendar 让组会管理更可持续。
4.  用 DESY 与 Perimeter 的问题导向研究介绍把物理内容写得更具体。
5.  用 Harvard 的简洁导航控制网站复杂度，同时建立过期内容治理。
6.  保留 `/hub`
    的内部工作流，但确保所有私有内容由后端鉴权，而不是依赖前端隐藏。

**建议实施顺序：**
先核对现有数据与权限，再完善论文数据模型与首页论文卡片；随后建立研究专题模板、人员目录与活动系列；最后再做
ICS、研究交叉图和更丰富的视觉效果。

这份研究报告给出的是可落地的设计方案和验收规范，不表示这些改动已经写入代码或部署到生产环境。
