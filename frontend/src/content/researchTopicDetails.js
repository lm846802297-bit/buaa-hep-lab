// Topic-specific research notes and official external resources.
// The page is an orientation guide: claims and limits must be checked against the cited paper/data release.
export const researchTopicDetails = {
  dark: {
    lead: '把暗物质问题拆成三个相互关联、但不能混为一谈的任务：解释宇宙学丰度、建立自洽的微观模型、以及计算可与实验比较的信号。',
    mechanisms: [
      {
        title: '热遗迹、冻结与共湮灭',
        label: 'EARLY-UNIVERSE COSMOLOGY',
        body: '在标准热史中，暗物质与热浴的反应率随宇宙膨胀下降，化学退耦后留下今日丰度。若有质量接近的暗态，次轻态与暗物质的共湮灭可能显著改变有效反应率；只计算单一粒子的湮灭截面可能不够。',
        checks: ['说明采用的宇宙学热史和自由度', '区分目标丰度、次主导组分与过量丰度', '记录共湮灭态的质量差与耦合']
      },
      {
        title: '非弹性暗物质与核反冲',
        label: 'DIRECT-DETECTION KINEMATICS',
        body: '对 χ₁ N → χ₂ N，质量分裂 δ = m₂ − m₁ 会改变散射的运动学阈值和最小入射速度，因而改变反冲谱及实验接受度。弹性散射的标准 SI/SD 排除曲线不能不经重铸就直接套用于非弹性模型。',
        checks: ['明确 δ 的符号与质量约定', '使用与目标核、能量窗口一致的响应', '把晕分布、局域密度和探测效率作为假设记录']
      },
      {
        title: '超轻标量与味非对角耦合',
        label: 'TIME-DEPENDENT & FLAVOR PHYSICS',
        body: '若超轻标量构成相干暗物质场，它可在适用的质量和相干尺度下产生随时间变化的背景；味非对角耦合则可能关联粒子跃迁、味观测和时域信号。可检验性取决于具体耦合结构，而不是“超轻暗物质”这一名称本身。',
        checks: ['说明局域暗物质密度与相干假设', '逐项写清味指标和耦合归一化', '区分现有数据限制与未来灵敏度预测']
      },
      {
        title: '媒介粒子、UV 模型与 EFT',
        label: 'MODEL CONSISTENCY',
        body: '媒介粒子的质量、宽度、分支比和暗态耦合共同决定产生与探测信号。UV 参数映射到低能 Wilson 系数需要明确匹配尺度、算符基底与重整化约定；当过程能标接近媒介粒子质量时，EFT 近似可能失效。',
        checks: ['检查势能稳定性、微扰性和模型对称性', '给出 UV 参数到物理参数/ Wilson 系数的映射', '标注 EFT 的适用能标与失效区域']
      }
    ],
    workflow: [
      { step: '01', title: '定义模型', detail: '列出场内容、规范荷、拉格朗日量、暗态稳定性来源和独立参数；明确质量与耦合的约定。' },
      { step: '02', title: '检查理论一致性', detail: '检查势能有界性、真空结构、微扰性和必要的规范一致性；说明采用的宇宙学历史。' },
      { step: '03', title: '计算可观测量', detail: '按模型计算热遗迹、衰变宽度、散射/湮灭率、对撞机末态或相变信号，不把不同模型的公式直接混用。' },
      { step: '04', title: '重铸实验结果', detail: '核对数据版本、效率、能量窗口、背景模型和统计方法；只有在模型预测与实验分析可比较时才作排除判断。' },
      { step: '05', title: '报告参数空间', detail: '给出扫描范围、先验/采样方法、固定基准和不确定性，并逐点标注理论不可行、已排除、在已检查约束下允许、未评估或 EFT 失效。' }
    ],
    interpretation: [
      { title: '理论可实现', tag: 'MODEL', detail: '满足模型定义、真空/稳定性与微扰性等所声明的理论条件；这本身不表示实验允许。' },
      { title: '实验排除', tag: 'EXCLUDED', detail: '在明确的模型、数据集、统计判据和天体物理假设下，与数据不相容的参数点或区域。' },
      { title: '在已检查约束下允许', tag: 'ALLOWED', detail: '仅表示通过本次列明的约束检查；必须列出覆盖的实验、扫描范围和未覆盖的限制，不能称为无条件“全球允许”。' },
      { title: '未评估 / 近似失效', tag: 'OPEN', detail: '尚未完成重铸、所需数据不可用，或 EFT/其他近似不满足适用条件时，不应擅自归类为允许或排除。' }
    ],
    resourceIds: ['pdg', 'inspire', 'arxiv-hepph', 'hepdata', 'lz', 'pandax', 'madgraph', 'feyncalc']
  },
  neutrino: {
    lead: '中微子专题同时关注质量起源、轻子味结构和可能的新相互作用。不同观测通常约束的是不同组合的质量、混合角、耦合、寿命和宇宙学参数，必须在具体模型中建立联系。',
    mechanisms: [
      { title: '质量生成与轻子味', label: 'MASS & FLAVOR', body: '从质量矩阵、混合结构和可能的 seesaw 扩展出发，检查参数如何进入振荡、衰变和精密测量；模型中引入新粒子不自动意味着它能解释全部中微子数据。', checks: ['注明质量排序和相位约定', '区分振荡量与绝对质量观测', '说明模型是否产生额外轻子味破坏'] },
      { title: '惰性中微子与长寿命粒子', label: 'STERILE STATES & LLP', body: '惰性中微子的产生、混合与衰变长度相互关联。对撞机灵敏度还取决于产生截面、寿命、几何接受度、重建效率和背景，而不仅是质量与混合角。', checks: ['同时报告质量、混合和寿命', '区分 prompt、displaced 与 detector-stable 区域', '明确灵敏度预测所用探测器假设'] },
      { title: '轻子新相互作用', label: 'NEW INTERACTIONS', body: '轻标量或新规范媒介可影响低能散射、轻子精密观测及宇宙演化。每项限制都依赖模型的电荷分配、耦合结构、媒介质量和可能的其他贡献。', checks: ['从完整拉格朗日量推导相互作用', '检查规范一致性及可能的混合项', '避免将模型特定限制当作普适边界'] }
    ],
    workflow: [
      { step: '01', title: '建立质量与相互作用结构', detail: '列出轻子和新粒子场、质量矩阵、混合参数及对称性，说明哪些参数独立。' },
      { step: '02', title: '映射到实验量', detail: '将参数映射到振荡概率、衰变率、散射截面、寿命和宇宙学量，并明确近似。' },
      { step: '03', title: '联合检验', detail: '对比低能精密实验、天体物理/宇宙学和对撞机搜索，防止重复计入或遗漏相关约束。' },
      { step: '04', title: '报告覆盖边界', detail: '把已测试区域、未测试区域、依赖特定宇宙学假设的结果和未来灵敏度分开。' }
    ],
    interpretation: [
      { title: '振荡数据', tag: 'OSCILLATION', detail: '主要约束质量平方差与混合参数组合，不单独确定绝对质量尺度。' },
      { title: '宇宙学限制', tag: 'COSMOLOGY', detail: '依赖宇宙学模型、粒子热史和数据组合；应说明是否假设标准 ΛCDM。' },
      { title: '对撞机限制', tag: 'COLLIDER', detail: '依赖产生率、衰变模式、寿命与探测器接受度，不能只用一条质量下限概括。' },
      { title: '模型联合解释', tag: 'MODEL-DEPENDENT', detail: '缪子磁矩等精密观测只有在该模型给出相应贡献时才构成约束或解释。' }
    ],
    resourceIds: ['pdg', 'inspire', 'arxiv-hepph', 'hepdata', 'icecube', 'superk', 'cern-open-data']
  },
  collider: {
    lead: '对撞机唯象学的核心是把拉格朗日量中的耦合与质量，转化为可重现的产生、衰变和探测器级信号。理论截面、事例选择后的预期产额与实验排除是不同层次的量。',
    mechanisms: [
      { title: '希格斯与新耦合', label: 'HIGGS PHENOMENOLOGY', body: '希格斯产生率、衰变分支比和运动学分布可检验标量门户及其他新相互作用。应同时说明标准模型参考值、干涉效应和参数相关性。', checks: ['列出耦合定义和归一化', '区分产生率偏离与分支比偏离', '记录所采用的实验组合'] },
      { title: '顶夸克与自旋关联', label: 'TOP QUARKS & SPIN', body: '顶夸克衰变中的角分布和自旋关联可对 Wtb 等耦合提供信息。量子信息界或理想统计精度不等同于包含重建、背景和系统误差后的实际精度。', checks: ['写明自旋基底和可观测量定义', '核对选择切和重建效率', '比较理想界与实际统计分析'] },
      { title: '缺失能量与长寿命粒子', label: 'MET & DISPLACED SIGNALS', body: '暗态可表现为缺失横动量，长寿命粒子则可能产生位移顶点或非指向喷注。寿命与耦合通常相关，搜索策略需与探测器几何和触发条件一致。', checks: ['区分 parton-level 与 detector-level 结果', '记录截面、分支比和接受度', '用对应寿命和末态重铸搜索结果'] }
    ],
    workflow: [
      { step: '01', title: '模型文件与费曼规则', detail: '从拉格朗日量推导顶点，交叉检查电荷、符号、颜色因子和质量约定。' },
      { step: '02', title: '矩阵元与事例生成', detail: '固定软件版本、模型文件、PDF、尺度、衰变链和随机种子；保留运行清单。' },
      { step: '03', title: '分析与探测器效应', detail: '明确 cuts、效率、背景和系统误差；不要将 parton-level 产额直接当成实验事件数。' },
      { step: '04', title: '与公开结果比较', detail: '优先使用公开数据、HEPData 表格或正式分析结果，记录数据版本和统计解释。' }
    ],
    interpretation: [
      { title: '理论预测', tag: 'PREDICTION', detail: '给定模型与参数后的截面、衰变率或分布；需记录微扰阶数、尺度和软件设置。' },
      { title: '实验排除', tag: 'EXCLUSION', detail: '需要与分析定义相容的信号模型、接受度和统计方法；不能只比较总截面。' },
      { title: '未来灵敏度', tag: 'PROJECTION', detail: '依赖积分亮度、能量、探测器和分析假设，应与现有观测限制分开标记。' },
      { title: '可复现性', tag: 'REPRODUCIBILITY', detail: '保存输入卡、软件/模型版本、运行命令、日志和产物指纹，确保第三方能追溯结果。' }
    ],
    resourceIds: ['pdg', 'inspire', 'arxiv-hepph', 'hepdata', 'cern-open-data', 'atlas', 'cms', 'madgraph', 'root']
  },
  phase: {
    lead: '相变与引力波研究需要从有限温有效势和相变动力学出发，再将相变参数映射到引力波谱。只有模型确实产生满足条件的一阶相变时，才适合讨论相应的泡壁和引力波源。',
    mechanisms: [
      { title: '有限温有效势与相变类型', label: 'FINITE-TEMPERATURE FIELD THEORY', body: '需要分析有效势随温度的演化、相的局部/全局稳定性和临界温度，并区分临界、成核与相变完成。标准模型 125 GeV 希格斯对应的电弱热演化是 crossover，而不是一阶相变。', checks: ['注明有效势阶数、规范与重整化方案', '区分临界温度和成核温度', '验证真空转变是否实际完成'] },
      { title: '泡成核与热力学参数', label: 'BUBBLE NUCLEATION', body: '引力波预测常用 α、β/H* 和泡壁速度等量概括相变强度与时间尺度。它们来自模型势能、反弹解及流体假设，不应作为与模型无关的自由数字。', checks: ['记录反弹作用量与成核判据', '说明 α、β/H* 的定义与温度', '检查泡壁速度和流体处理假设'] },
      { title: '引力波源与多信使', label: 'GRAVITATIONAL-WAVE SOURCES', body: '声波、湍流和泡壁碰撞的贡献取决于相变动力学与源项建模；频谱峰值、幅度和可探测性均具有模型依赖性。若同一模型有新粒子信号，可与对撞机搜索互补。', checks: ['标明采用的源项模型与适用范围', '区分理论谱、仪器灵敏度与实际观测', '把 PTA 与空间干涉仪的频段/假设分开讨论'] }
    ],
    workflow: [
      { step: '01', title: '检查标量势与真空', detail: '写明树级势、环修正和热修正，检查势能有界性、真空结构及质量谱。' },
      { step: '02', title: '求解相变动力学', detail: '求临界/成核温度和反弹解，验证相变完成，并给出 α、β/H* 等参数的定义。' },
      { step: '03', title: '生成引力波谱', detail: '声明泡壁速度、效率因子和源项模型，传播参数与建模不确定性。' },
      { step: '04', title: '比较探测前景', detail: '使用对应频段的实验灵敏度，并将引力波结果与同一模型的粒子搜索分别呈现。' }
    ],
    interpretation: [
      { title: '相变存在', tag: 'THERMAL HISTORY', detail: '先证明模型在所选参数下具有所需相结构和可完成的相变，再计算引力波。' },
      { title: '谱的预测', tag: 'PREDICTION', detail: '谱形依赖源项和流体处理，须给出公式、参数定义及适用条件。' },
      { title: '探测器灵敏度', tag: 'SENSITIVITY', detail: '与仪器噪声曲线的交叉只是给定假设下的前景判断，不自动等于排除或发现。' },
      { title: '跨探测器互补', tag: 'COMPLEMENTARITY', detail: 'PTA、空间干涉仪和对撞机覆盖不同观测量与能标，应避免把不同假设下的曲线直接拼成统一结论。' }
    ],
    resourceIds: ['pdg', 'inspire', 'arxiv-hepph', 'hepdata', 'lisa', 'nanograv', 'gwosc', 'reana']
  },
  precision: {
    lead: '量子计量学研究的是量子态及其参数依赖所允许的信息上限，以及真实实验可观测量能够保留多少信息。理论界限、有限样本统计精度和最终实验不确定度需要分层报告。',
    mechanisms: [
      { title: '量子 Fisher 信息与 Cramér–Rao 界', label: 'QUANTUM INFORMATION', body: '量子 Fisher 信息刻画量子态对参数变化的可辨识度，并给出在相应正则条件下的理想精度界。该界不保证某个具体测量、有限样本估计器或真实探测器可以达到。', checks: ['说明参数化、态和量子 Fisher 信息定义', '检查估计器无偏性等适用条件', '分开写理想界与可实现测量'] },
      { title: '自旋密度矩阵与关联', label: 'SPIN CORRELATIONS', body: '在顶夸克等过程里，自旋密度矩阵和角分布将耦合信息编码在关联观测量中。基底选择、不可见自由度和运动学切会影响实际保留的信息。', checks: ['给出自旋基底与归一化', '核对可测角变量和接受度', '比较不同观测量的信息损失'] },
      { title: '从理想信息到实验精度', label: 'REALISTIC SENSITIVITY', body: '有限积分亮度、背景、探测器响应、事件重建和系统误差都会降低实际灵敏度。对比研究应尽可能在相同事件样本、参数定义和统计假设下进行。', checks: ['报告样本量和统计模型', '列出主要系统误差来源', '将可达精度与预期排除/发现能力区分'] }
    ],
    workflow: [
      { step: '01', title: '定义参数和量子态', detail: '说明被测耦合、过程、密度矩阵与运动学范围。' },
      { step: '02', title: '求理想信息界', detail: '按一致约定计算量子 Fisher 信息和相应精度下界，检查推导条件。' },
      { step: '03', title: '构造实际可观测量', detail: '选择角分布、自旋关联或其他可测量，并考虑可见末态和接受度。' },
      { step: '04', title: '评估真实误差', detail: '引入有限样本、背景、重建和系统误差，明确理想界与实验投影的差距。' }
    ],
    interpretation: [
      { title: '量子界限', tag: 'IDEAL BOUND', detail: '由模型化的量子态与参数定义得到；必须陈述数学条件和测量假设。' },
      { title: '统计精度', tag: 'STATISTICS', detail: '由样本数、似然和估计方法决定，通常不会自动达到量子界限。' },
      { title: '实验精度', tag: 'EXPERIMENT', detail: '进一步受接受度、背景和系统误差影响，需有明确的分析流程或投影假设。' },
      { title: '公平比较', tag: 'COMPARISON', detail: '不同论文的数值比较应统一参数、单位、可观测量和运行条件，并记录所有差异。' }
    ],
    resourceIds: ['pdg', 'inspire', 'arxiv-hepph', 'hepdata', 'madgraph', 'root', 'feyncalc']
  }
}

export const researchTopicResources = [
  { id: 'pdg', name: 'Particle Data Group (PDG)', category: '综述与粒子性质', url: 'https://pdg.lbl.gov/', description: '查阅粒子性质、标准模型参数、假想粒子搜索综述和实验方法；引用时注明具体版本与勘误。' },
  { id: 'inspire', name: 'INSPIRE-HEP', category: '文献与引用关系', url: 'https://inspirehep.net/', description: '检索高能物理论文、作者、期刊信息和引用关系，适合追踪专题的后续研究。' },
  { id: 'arxiv-hepph', name: 'arXiv · hep-ph', category: '预印本与最新研究', url: 'https://arxiv.org/list/hep-ph/recent', description: '浏览高能唯象学预印本和版本历史；预印本状态与正式发表状态应分别核对。' },
  { id: 'hepdata', name: 'HEPData', category: '公开实验数据', url: 'https://www.hepdata.net/', description: '查找论文配套的表格、直方图和机器可读数据；记录数据版本、单位和相关不确定度。' },
  { id: 'cern-open-data', name: 'CERN Open Data', category: '公开实验数据', url: 'https://opendata.cern.ch/', description: '获取公开的实验数据、软件与分析文档；使用前核对数据发布级别和适用条件。' },
  { id: 'lz', name: 'LUX-ZEPLIN (LZ)', category: '直接探测实验', url: 'https://lz.lbl.gov/', description: '液氙暗物质实验的官方结果、论文和分析信息；使用限制曲线时核对相互作用模型与分析假设。' },
  { id: 'pandax', name: 'PandaX', category: '直接探测实验', url: 'https://pandax.sjtu.edu.cn/frontpage', description: '中国液氙暗物质实验项目与公开结果；注意不同运行阶段、能区和信号模型的区别。' },
  { id: 'icecube', name: 'IceCube Neutrino Observatory', category: '中微子与天体物理', url: 'https://icecube.wisc.edu/', description: '高能中微子观测、实验论文与数据发布信息。' },
  { id: 'superk', name: 'Super-Kamiokande', category: '中微子实验', url: 'https://www-sk.icrr.u-tokyo.ac.jp/en/', description: '中微子振荡、太阳中微子及相关实验结果的官方入口。' },
  { id: 'atlas', name: 'ATLAS Experiment', category: '对撞机实验', url: 'https://atlas.cern/', description: 'LHC 上的 ATLAS 实验公开结果、论文和物理分析信息。' },
  { id: 'cms', name: 'CMS Experiment', category: '对撞机实验', url: 'https://cms.cern/', description: 'LHC 上的 CMS 实验公开结果、论文和物理分析信息。' },
  { id: 'madgraph', name: 'MadGraph5_aMC@NLO', category: '计算与事例生成', url: 'https://launchpad.net/mg5amcnlo', description: '矩阵元和事例生成工具；复现时应记录版本、模型文件、PDF、尺度与运行卡。' },
  { id: 'root', name: 'ROOT', category: '计算与数据分析', url: 'https://root.cern/', description: '高能物理数据分析框架，提供数据处理、统计分析和可视化工具。' },
  { id: 'feyncalc', name: 'FeynCalc', category: '符号计算', url: 'https://feyncalc.github.io/', description: 'Mathematica 中的量子场论符号计算工具，适用于 Dirac/颜色代数、迹和圈图相关计算。' },
  { id: 'reana', name: 'REANA', category: '可复现工作流', url: 'https://reanahub.io/', description: '参考其对输入、环境、执行步骤与产物的组织方式，建立可追溯的分析工作流。' },
  { id: 'lisa', name: 'LISA Mission', category: '空间引力波探测', url: 'https://www.lisamission.org/', description: '空间激光干涉引力波探测任务的官方信息；相变谱与灵敏度比较需使用相应数据版本。' },
  { id: 'nanograv', name: 'NANOGrav', category: '脉冲星计时阵列', url: 'https://nanograv.org/', description: '脉冲星计时阵列观测、公开论文与数据发布信息；背景解释具有模型依赖性。' },
  { id: 'gwosc', name: 'Gravitational Wave Open Science Center', category: '引力波公开数据', url: 'https://gwosc.org/', description: '引力波公开数据、教程和分析工具；其地面干涉仪数据与早期宇宙相变的目标频段并不等同。' }
]
