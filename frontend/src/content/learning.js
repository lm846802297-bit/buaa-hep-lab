// Non-confidential study notes. Kept out of the approved public homepage.
// Source checking does not constitute group academic review or independent reproduction.
export const learningRevision = { version: '0.1', checkedAt: '2026-10-20', status: '学习初稿 · 待学术审核', maintainer: '待课题组指定' }

export const learningSources = [
  { id: 'pdg', name: 'Particle Data Group', category: '理论与数据', url: 'https://pdg.lbl.gov/', use: '粒子性质、标准模型和实验方法的综述入口。引用具体条目时记录年份、章节和勘误。', checked: '已核对入口' },
  { id: 'kinematics', name: 'PDG · Kinematics（2025 版）', category: '理论与数据', url: 'https://pdg.lbl.gov/2025/reviews/rpp2025-rev-kinematics.pdf', use: '第 49.3–49.5 节：振幅归一化、相空间、衰变与截面；本指南的运动学公式采用这一版本。', checked: '已核对正文' },
  { id: 'smeft', name: 'Brivio & Trott · SMEFT 综述', category: '理论与数据', url: 'https://arxiv.org/abs/1706.08945', use: '有效场论的能标展开、算符、匹配和重整化群；阅读时核对文中基底与归一化。', checked: '已核对论文记录' },
  { id: 'singlet', name: 'Cline 等 · 实标量暗物质模型', category: '理论与数据', url: 'https://arxiv.org/abs/1306.4710v5', use: 'Z₂ 单态标量与 Higgs 门户的原始研究参考。历史实验限制不作为当前数值；本指南的树级有界条件由所列势能配方得到。', checked: '已核对论文记录 · 约束为历史结果' },
  { id: 'feyncalc', name: 'FeynCalc · DiracTrace 手册', category: '计算工具', url: 'https://feyncalc.github.io/FeynCalcBookDev/DiracTrace.html', use: 'Dirac 迹与求值示例。该链接为开发版手册，语法须与本机安装版核对。', checked: '已核对正文' },
  { id: 'simplify', name: 'FeynCalc · DiracSimplify 手册', category: '计算工具', url: 'https://feyncalc.github.io/FeynCalcBookDev/DiracSimplify.html', use: 'Dirac 代数化简、四维与 D 维的处理；不能忽略 γ₅ 与维数约定。', checked: '已核对正文' },
  { id: 'hepdata', name: 'HEPData', category: '实验与文献', url: 'https://www.hepdata.net/', use: '实验论文关联的表格和机器可读数据。保存记录 DOI、版本和相关系统误差；不把高层数据表当作完整事例数据。', checked: '检索记录可用 · 正文读取受限' },
  { id: 'opendata', name: 'CERN Open Data', category: '实验与文献', url: 'https://opendata.cern.ch/', use: '公开数据、软件、环境和文档；先核对发布级别、许可证和推荐分析环境。', checked: '已核对入口' },
  { id: 'arxiv', name: 'arXiv · hep-ph', category: '实验与文献', url: 'https://arxiv.org/list/hep-ph/recent', use: '发现高能唯象学预印本；引用须保存具体编号和版本，预印本不等于期刊发表。', checked: '官方资源索引' },
  { id: 'inspire', name: 'INSPIRE-HEP', category: '实验与文献', url: 'https://inspirehep.net/', use: '交叉核对作者、期刊、DOI 与引用关系，并返回原始论文核实重要结论。', checked: '官方资源索引' },
  { id: 'reana', name: 'REANA · Reusable Analyses', category: '计算工具', url: 'https://reanahub.io/', use: '参考其组织输入、环境、工作流与输出的方式；本站没有部署 REANA 服务。', checked: '已核对入口' },
]

export const learningTopics = [
  {
    id: 'standard-model', number: '01', title: '标准模型与电弱对称性破缺', level: '理论基础', prerequisites: '相对论量子力学、场论与群表示基础',
    summary: '先约定规范群、场的表示与超荷归一化，再从 Higgs 动能项和势能辨认质量与相互作用。',
    goals: ['写清场的量子数和协变导数约定。', '区分树级关系、重整化参数与实际测量。'],
    sections: [
      { id: 'conventions', title: '规范群与约定', paragraphs: ['采用自然单位 ℏ = c = 1、度规 (+,−,−,−)，并取 Q = T₃ + Y。Higgs 双重态的超荷为 Y = 1/2；其他资料若取 Q = T₃ + Y/2，须先转换超荷定义。', '标准模型拉格朗日量包含规范场动能、费米子动能、Higgs 动能与势能、Yukawa 相互作用。规范固定与鬼场项在量子化计算中也不可省略。'], formulas: [{ label: '规范群与电荷约定', latex: String.raw`G_{\rm SM}=SU(3)_C\times SU(2)_L\times U(1)_Y,\qquad Q=T_3+Y` }], sources: ['pdg', 'smeft'] },
      { id: 'lagrangian', title: '拉格朗日量的各部分', paragraphs: ['下式中 F 表示三种规范场强，求和包含其群指标；ψ 为各手征费米子多重态。Dμ 含各规范耦合与生成元，V(H) 为 Higgs 势，LY 为 Yukawa 相互作用。', '这只是经典拉格朗日量的结构。建立 Feynman 规则时仍须明确指标、动量流与协变导数的符号；圈图计算还需要规范固定、鬼场项及重整化约定。'], formulas: [{ label: '标准模型的经典拉格朗日量结构', latex: String.raw`\mathcal L_{\rm SM}=-\frac14\sum_F F_{\mu\nu}F^{\mu\nu}+\sum_\psi\bar\psi i\!\not\!D\psi+(D_\mu H)^\dagger D^\mu H-V(H)+\mathcal L_Y` }], sources: ['pdg', 'smeft'] },
      { id: 'symmetry-breaking', title: '从势能到树级质量', paragraphs: ['对 V(H) = −μ²H†H + λ(H†H)²，取 μ² > 0、λ > 0。沿中性方向写 H = (0, v+h)ᵀ/√2，极小值条件给出 v² = μ²/λ。', '将这一展开代入 Higgs 动能项得到 W、Z 的质量关系；展开势能得到 Higgs 质量。费米子质量来自 Yukawa 项，而不是裸质量项。'], formulas: [{ label: '树级质量关系', latex: String.raw`m_W=\frac{gv}{2},\quad m_Z=\frac{v}{2}\sqrt{g^2+g'^2},\quad m_h^2=2\lambda v^2,\quad m_f=\frac{y_fv}{\sqrt{2}}` }], sources: ['pdg', 'smeft'] },
      { id: 'checks', title: '阅读时做三个检查', paragraphs: ['检查质量项系数与场的规范化；实标量的质量项带 1/2，复场的写法不同。检查拉格朗日量各项的总质量维数是否为 4。', '把树级参数关系直接用于精密拟合之前，要说明输入方案、重整化尺度与圈级修正。最小标准模型中的中微子质量问题需要额外机制，不能把无质量中微子当作现实世界的完整描述。'], sources: ['pdg', 'smeft'] },
    ],
    assumptions: ['上述质量关系是树级关系，未包含电弱/QCD 辐射修正。', '不提供实验参数拟合；数值输入应来自具体版本的 PDG 或原始实验。'],
    exercise: '自行展开 (DμH)†DμH，并核对电荷、质量项和 hWW、hZZ 顶点之间的关系。记录所用协变导数符号。',
  },
  {
    id: 'amplitudes', number: '02', title: '振幅、截面与衰变宽度', level: '理论基础', prerequisites: '四动量、矩阵元与基本积分',
    summary: '从不变振幅到相空间积分，明确初态平均、末态求和和相同粒子因子。',
    goals: ['分清振幅、截面、宽度与事例数。', '用两体衰变练习阈值、量纲和相空间检查。'],
    sections: [
      { id: 'phase-space', title: '相空间与归一化', paragraphs: ['定义 dΦₙ 包含完整的 (2π)⁴δ⁴ 因子；因此下式的 dΓ 前面不再额外乘 (2π)⁴。对照 PDG 时须注意其相空间定义把该因子放在外面，两种写法等价。', '对未极化的散射通常平均初态自旋/颜色并求和末态；衰变也需明确母粒子的自旋态约定。末态有相同粒子时加入相应组合因子。'], formulas: [{ label: '本指南的相空间定义', latex: String.raw`d\Phi_n=(2\pi)^4\delta^{(4)}\!\left(P-\sum_i p_i\right)\prod_i\frac{d^3p_i}{(2\pi)^3 2E_i},\qquad d\Gamma=\frac{\overline{|\mathcal M|^2}}{2M}\,d\Phi_n` }], sources: ['kinematics'] },
      { id: 'two-body', title: '两体衰变的可检查基准', paragraphs: ['在母粒子静止系中，两末态粒子三动量大小相等。若振幅无角度依赖，可积分立体角得到下式。S 为对称因子的分母：可区分末态 S = 1，两个相同末态 S = 2。', '随附脚本采用三个不同的实标量，L_int = −g Xab，所以顶点大小为 g，且 S = 1。它不是 Higgs 衰变模型，也没有使用实验拟合。'], formulas: [{ label: '两体动量与常振幅宽度', latex: String.raw`p_* = \frac{\sqrt{[M^2-(m_1+m_2)^2][M^2-(m_1-m_2)^2]}}{2M},\qquad \Gamma=\frac{p_*|\mathcal M|^2}{8\pi M^2 S}` }], sources: ['kinematics'] },
      { id: 'events', title: '截面到实验事例数', paragraphs: ['散射截面还需要初态通量。质子碰撞须对部分子分布函数卷积，并说明能量、因子化尺度与微扰阶数。', '预期信号数可写为截面 × 积分亮度 × 分支比 × 接受度 × 效率；宽度没有面积单位。阈值以下的衰变为运动学禁止，不能对负根号取绝对值后继续计算。'], sources: ['kinematics'] },
    ],
    assumptions: ['两体积分公式假定角度无关的振幅；一般情况须积分角分布。', '本地基准仅检验树级标量例题的运动学与实现一致性，不验证真实研究论文。'],
    exercise: '运行两体衰变脚本，检查无质量极限、阈值、末态互换、g² 标度和质量量纲；再自行推导相同末态的 1/2 因子。',
    download: { path: 'learning/two_body_decay.py', filename: 'two_body_decay.py', label: '下载两体衰变 Python 基准', status: '仅用标准库；本地运行记录见本轮验收报告' },
  },
  {
    id: 'bsm-consistency', number: '03', title: 'BSM 模型构建与一致性', level: '模型方法', prerequisites: '标准模型、对称性与拉格朗日量',
    summary: '用最简实标量 Z₂ 模型练习：先证明模型的内部一致性，再讨论它在实验中的适用范围。',
    goals: ['区分理论一致性、实验约束与尚未评估。', '为模型检查记录可追溯的输入与近似。'],
    sections: [
      { id: 'model', title: '定义一个具体模型', paragraphs: ['令实标量 S 为标准模型规范单态，在 S → −S 下为奇，标准模型场为偶。取下式的势能约定；Z₂ 禁止奇数次 S 项。', '只有选定真空不自发破坏 Z₂，且 S 是最轻的奇粒子时，才能用这一对称性保护其稳定性。加入一个新 U(1) 规范对称性时，还需逐项检查混合规范异常与引力异常。'], formulas: [{ label: 'Z₂ 对称实标量势', latex: String.raw`V=-\mu_H^2 H^\dagger H+\lambda_H(H^\dagger H)^2+\frac{\mu_S^2}{2}S^2+\frac{\lambda_S}{4}S^4+\frac{\lambda_{HS}}{2}H^\dagger H S^2` }], sources: ['singlet'] },
      { id: 'stability', title: '树级大场稳定性', paragraphs: ['按上述归一化，令 x = H†H、y = S²，四次势可写成 (√λ_H x − √λ_S y/2)² + (λ_HS/2 + √(λ_H λ_S))xy。由 x,y ≥ 0 得到下列严格有界条件；等号情况含平坦方向，需要单独分析。还应比较不同驻点并检查目标真空的局部质量谱。', '微扰性、部分波幺正性与真空稳定性不是同一个判据。树级势的条件不能直接声称保证所有能标下稳定；若做高能外推，需记录 RG 演化和截止能标。'], formulas: [{ label: '这一归一化下的充分有界条件', latex: String.raw`\lambda_H>0,\qquad\lambda_S>0,\qquad\lambda_{HS}>-2\sqrt{\lambda_H\lambda_S}` }], sources: ['singlet'] },
      { id: 'evidence', title: '从模型到约束', paragraphs: ['固定场的表示、参数定义、目标真空和微扰阶数后，才生成质量谱与相互作用。对每项约束保存原始实验、数据版本、统计定义与所映射的参数。', '没有计算某项约束的参数点应标记为“未评估”；通过某项理论条件不代表实验允许，处于预计灵敏度内也不代表实际观测。'], sources: ['pdg', 'opendata'] },
    ],
    assumptions: ['标量例题只分析给定树级势，不包含热效应、隧穿或圈级修正。', '本页未计算遗迹丰度、直接探测或 LHC 排除区间。'],
    exercise: '令 x = H†H ≥ 0、y = S² ≥ 0，将四次势配方，独立推导混合耦合条件；再检查电弱真空中 S 的质量平方。',
  },
  {
    id: 'eft', number: '04', title: 'SMEFT 与 UV–EFT 匹配', level: '模型方法', prerequisites: '场的质量维数、低能展开与重整化基础',
    summary: '把 EFT 看成有明确截断误差的能标展开，并记录基底、尺度和系数约定。',
    goals: ['说明算符维数与展开阶数。', '辨认匹配、RG 演化与 EFT 有效性各自解决的问题。'],
    sections: [
      { id: 'expansion', title: '从能标展开开始', paragraphs: ['在指定轻场和对称性后，用高维算符组织低能效应。Wilson 系数的含义取决于是否把耦合或尺度因子吸收入定义；比较不同代码之前先统一约定。', 'Weinberg 五维算符可产生 Majorana 中微子质量；六维算符可修正许多标准模型过程。单个系数的约束不是对所有 UV 模型都通用的结论。'], formulas: [{ label: '有效拉格朗日量的维数展开', latex: String.raw`\mathcal L_{\rm EFT}=\mathcal L_{\rm SM}+\sum_{d>4}\sum_i\frac{C_i^{(d)}(\mu)}{\Lambda^{d-4}}\mathcal O_i^{(d)}` }], sources: ['smeft'] },
      { id: 'matching', title: '匹配与演化', paragraphs: ['匹配使 UV 理论和 EFT 在同一低能量下的物理振幅一致；树级和圈级匹配对应不同精度。RG 演化将匹配尺度的系数带到观测尺度，并可能混合算符。', '记录算符基底、输入参数方案、重整化方案、匹配尺度和演化尺度。改变基底不能只替换系数名称，还要转换算符关系与输入参数。'], sources: ['smeft'] },
      { id: 'validity', title: '截断与高能尾部', paragraphs: ['观测量中的维六干涉项为 1/Λ² 阶；维六平方项与维八干涉项都可能在 1/Λ⁴ 阶出现。保留某些项而舍弃另一些项，需要明确计数与误差假设。', '示意地展开一个重传播子需要 |q²| ≪ M²；接近极点时不能继续信任低阶展开。具体事件分析中，相关硬尺度、耦合和截断策略都必须说明。'], formulas: [{ label: '重传播子的低能展开示意', latex: String.raw`\frac{1}{M^2-q^2}=\frac{1}{M^2}\left(1+\frac{q^2}{M^2}+\cdots\right),\qquad |q^2|\ll M^2` }], sources: ['smeft'] },
    ],
    assumptions: ['传播子例子只演示级数展开，省略宽度、张量结构与耦合，不是完整匹配结果。', '本页未执行 SMEFT 拟合，也未给出通用的新物理能标下限。'],
    exercise: '选一个重标量交换过程，对低能振幅展开并做量纲检查；记录需要保留的算符与误差阶数，再与完整传播子比较。',
  },
  {
    id: 'feyncalc', number: '05', title: 'FeynCalc 与可复现计算', level: '计算实践', prerequisites: 'Dirac 代数与 Mathematica 基础',
    summary: '从可手算的迹开始，保留环境、符号约定与独立校验，而不是只保留软件输出。',
    goals: ['用简单恒等式检查环境与维数约定。', '为后续研究计算留下可以重复执行的记录。'],
    sections: [
      { id: 'environment', title: '先记录环境', paragraphs: ['记录 Mathematica 与 FeynCalc 的实际安装版本、操作系统、加载方式及包来源。参考链接指向开发版文档，因此须核对本机版本支持的函数。本站不提供云端 Mathematica 执行服务。', '四维与 D 维对象不能随意混用；γ₅、Levi-Civita 张量和维数正则化的方案也要明确。符号名字相同不代表两个表达式使用了相同约定。'], sources: ['feyncalc', 'simplify'] },
      { id: 'trace', title: '从两矩阵迹做独立检查', paragraphs: ['先手工用 Clifford 代数与 Tr(1) = 4 得到下式，再用 DiracTrace 和 DiracSimplify 对照。这个测试仅限四维、不含 γ₅ 的表达式。', '示例代码需要在本机有许可证的 Mathematica 环境执行。本轮没有运行 Mathematica，不能将预期恒等式标记为软件实测通过。'], formulas: [{ label: '四维、无 γ₅ 的迹恒等式', latex: String.raw`\mathrm{Tr}(\gamma^\mu\gamma^\nu)=4g^{\mu\nu},\qquad\mathrm{Tr}(\not p\not q)=4p\cdot q` }], code: 'Needs["FeynCalc`"]\nPrint[$Version];\ntrace = DiracSimplify[DiracTrace[GS[p] . GS[q]]];\ncheck = Simplify[trace - 4 SP[p, q]];\nPrint[check]; (* Expected: 0; run locally and retain output. *)', sources: ['feyncalc', 'simplify'] },
      { id: 'reproduce', title: '保存输入与验证证据', paragraphs: ['保存完整脚本、输入参数、软件版本、运行命令、预期输出和容差；随机过程还须记录种子。若输入来自实验，保存记录 DOI、版本与下载日期。', '先检查量纲、质量极限和对称性，再做独立方法对照；同一段代码重复运行不算独立推导。REANA 提供组织输入、环境、工作流和输出的参考结构，本站暂不部署该服务。'], sources: ['reana', 'opendata'] },
    ],
    assumptions: ['示例未在 Mathematica 中执行；学术审核与工具实测均待完成。', '不含圈图、γ₅ 或维数正则化计算；这些问题需额外方案与基准。'],
    exercise: '在本机运行示例，保存版本和输出；再手算四矩阵迹，用指标收缩与特殊动量检查两种实现。',
  },
]

export const reproductionChecklist = [
  '研究问题、模型定义、场与参数的归一化', '假设、近似、微扰阶数与适用能标', '代码版本或 commit、软件与依赖版本',
  '输入参数、数据 DOI / 版本、许可证与获取日期', '运行命令、随机种子（如适用）和资源需求', '预期输出、单位、数值容差与运行日志',
  '独立解析极限或另一实现的验证证据', '未完成的检查、已知问题、维护者与修订记录',
]
