// Detailed, assumption-aware research guides for the five public HEP phenomenology topics.
// Equations are orientation-level relations: each card states its assumptions and what it does not establish.
export const researchTopicDeepGuides = {
  "dark": {
    "framing": "本方向的研究不是只找一条“暗物质质量下限”，而是把宇宙学丰度、微观相互作用、实验响应与统计解释接成可追溯的计算链。不同暗物质候选者可能对应完全不同的产生机制和探测信号，不能把 WIMP、超轻场和非弹性暗态的公式不加区分地套用。",
    "prerequisites": [
      "量子场论与散射振幅的基本约定",
      "热场论/早期宇宙的基本量：H(T)、熵密度与有效自由度",
      "非相对论两体运动学，以及核反冲能量和探测器效率的概念"
    ],
    "keyRelations": [
      {
        "title": "热遗迹：从反应率到今日丰度",
        "label": "BOLTZMANN EQUATION",
        "formula": "dYχ/dx = −[s⟨σeff v⟩/(H x)] (Yχ² − Yχ,eq²),   x ≡ mχ/T",
        "meaning": "Yχ 是暗物质数密度与熵密度之比。化学退耦发生在湮灭反应跟不上宇宙膨胀之后；共湮灭存在时，⟨σeff v⟩ 需要包含热浴中近简并暗态的贡献。",
        "conditions": "常用形式假设辐射主导、熵近似守恒，并将相关物种压缩为单一有效 Boltzmann 方程；共湮灭处理还需要相应物种之间维持化学平衡。",
        "doesNotMean": "Ωχh² ≈ 0.12 是观测目标，不是任何模型自动得到的预测；不能只代入一个经验截面就宣称完成丰度计算。"
      },
      {
        "title": "非弹性散射：质量分裂改变运动学阈值",
        "label": "DIRECT-DETECTION KINEMATICS",
        "formula": "vmin(ER) = |mN ER/μχN + δ| / √(2 mN ER),   δ ≡ mχ₂ − mχ₁",
        "meaning": "在非相对论、两体散射近似下，给定核反冲 ER 所需的最小暗物质速度取决于质量分裂 δ 与约化质量 μχN。δ>0 的上态激发需要额外动能，可能切除低速粒子可贡献的反冲区域。",
        "conditions": "自然单位下的标准运动学关系；必须明确靶核质量、能量变量、δ 符号及实验分析的反冲能区。",
        "doesNotMean": "不能把弹性散射的标准 SI/SD 限制曲线直接当作非弹性模型的限制；仍需计算速度积分、核响应、能量分辨率、效率和统计似然。"
      },
      {
        "title": "从微分反冲率到预期事件数",
        "label": "DETECTOR RESPONSE",
        "formula": "Ns = MT ∫ dER ε(ER) [dR/dER]",
        "meaning": "理论微分率必须与探测器质量—时间暴露量、效率及能量响应结合，才能得到预期信号数。若重建能量与真实反冲能量不同，还需将响应函数卷积进预测。",
        "conditions": "这里将 dR/dER 定义为每单位探测器质量、时间和反冲能量的事件率；多同位素靶材需对各核素求和。",
        "doesNotMean": "理论截面更大不必然意味着实验排除更强；背景、阈值、接受度和分析窗口都可能改变灵敏度。"
      },
      {
        "title": "UV 模型与 EFT 的边界",
        "label": "MATCHING AND VALIDITY",
        "formula": "LEFT = LSM + Σi Ci(μ) Oi(μ) / Λ^(di−4)",
        "meaning": "重媒介可在低能下被积分掉，生成带有 Wilson 系数的有效算符。完整分析应记录匹配尺度、算符基底、重整化方案和 RG 演化，并把 UV 参数映射到可比较的低能系数。",
        "conditions": "局域 EFT 展开要求过程的相关动量尺度低于被积掉的新粒子质量尺度，并且截断误差可控。",
        "doesNotMean": "当硬动量接近媒介质量、传播子极点或新粒子可被实际产生时，EFT 结果不能无条件代替完整 UV 模型。"
      }
    ],
    "assumptions": [
      {
        "title": "宇宙学先验必须明示",
        "detail": "标准热遗迹结果依赖早期宇宙热史、有效自由度及熵演化。若存在晚期注入、非标准膨胀或多组分暗物质，应重新建立丰度方程。"
      },
      {
        "title": "核层面的算符映射不可省略",
        "detail": "核子层面的 SI/SD 系数不总能直接代表核响应；非标准算符、同位素组成和两体流可能影响信号。报告时应说明使用的核响应和近似。"
      },
      {
        "title": "允许区不是单一实验曲线",
        "detail": "理论可实现、已检查实验下允许、已排除、未评估和近似失效应分别标记。投影参数空间时保留非连通区，并记录 benchmark、扫描范围和采样方法。"
      },
      {
        "title": "模型解释与观测证据分开",
        "detail": "超轻标量的相干背景、味非对角耦合和时变信号都依赖场质量、局域密度、相干尺度及具体拉格朗日量；不能仅凭一个示意振荡式声称存在可探测信号。"
      }
    ],
    "researchQuestions": [
      {
        "title": "先确定候选者与产生机制",
        "detail": "暗物质是热遗迹、非热产生的粒子、相干场还是多组分？这个选择决定后续应解哪类演化方程。"
      },
      {
        "title": "写清可观测量的中间映射",
        "detail": "从 UV 参数出发，依次得到质量/宽度、散射或湮灭率、核反冲谱、探测器级事件数和统计量；每一步都保留单位与误差。"
      },
      {
        "title": "设计可复现的重铸",
        "detail": "固定实验数据版本、能量窗口、效率、背景和似然，先用已知 benchmark 验证实现，再扩展到完整扫描。"
      }
    ],
    "references": [
      {
        "title": "Particle Data Group — Review of Particle Physics",
        "url": "https://pdg.lbl.gov/2026/",
        "note": "粒子性质、暗物质综述和宇宙学基础数据；引用时记录具体章节和版本。"
      },
      {
        "title": "New Directions in Direct Dark Matter Searches",
        "url": "https://onlinelibrary.wiley.com/doi/full/10.1155/2014/681312",
        "note": "直接探测、非相对论算符和核反冲率形式的综述入口。"
      }
    ]
  },
  "neutrino": {
    "framing": "中微子专题需要把质量本征态、味本征态、混合参数、传播介质与产生/探测过程区分开。振荡、绝对质量、无中微子双贝塔衰变、宇宙学和长寿命粒子搜索探测的并非同一个参数组合；它们的互补性必须通过具体模型建立。",
    "prerequisites": [
      "量子力学中的态演化与两态混合",
      "PMNS 矩阵、质量平方差与自然单位",
      "粒子衰变宽度、混合诱导耦合和探测器接受度"
    ],
    "keyRelations": [
      {
        "title": "真空振荡：相位差来自质量平方差",
        "label": "OSCILLATION PROBABILITY",
        "formula": "P(να→νβ) = |Σi Uβi exp[−i mi² L/(2E)] U*αi|²",
        "meaning": "超相对论中微子在真空传播时，不同质量本征态积累不同相位，振荡概率由 PMNS 矩阵与质量平方差决定。",
        "conditions": "此式采用自然单位、真空传播和相干波包近似；在物质中传播时需加入有效物质势并重新求解演化。",
        "doesNotMean": "振荡本身不能确定绝对质量尺度，也不能单独判定中微子是 Dirac 还是 Majorana 粒子。"
      },
      {
        "title": "I 型 seesaw：轻质量与重尺度的联系",
        "label": "MASS GENERATION",
        "formula": "mν ≃ −mD MR⁻¹ mDᵀ",
        "meaning": "在典型 I 型 seesaw、重 Majorana 质量矩阵 MR 远大于 Dirac 质量矩阵 mD 时，积分掉重态可得到受抑制的轻中微子质量矩阵。",
        "conditions": "这是块对角化后的领先阶近似；矩阵维度、复共轭约定和高阶修正须与所用拉格朗日量一致。",
        "doesNotMean": "它不意味着每个 seesaw 模型都唯一确定重中微子质量或轻—重混合；一般还存在未知参数和可能的抵消。"
      },
      {
        "title": "长寿命粒子：宽度与位移长度",
        "label": "LONG-LIVED PARTICLES",
        "formula": "cτ = ℏc/Γ,   Llab ≃ βγ cτ",
        "meaning": "衰变宽度 Γ 决定静止系寿命，实验室平均衰变长度还要乘以 boost 因子 βγ。混合角既可能影响产生率，也可能影响寿命，因此质量—混合平面中的搜索接受度通常不是常数。",
        "conditions": "Llab 是单一粒子、近似固定 boost 下的平均衰变长度；真实事例预测需对动量分布和探测器几何积分。",
        "doesNotMean": "不能仅凭寿命长短判断实验一定可见；触发、重建、几何接受度和背景同样重要。"
      }
    ],
    "assumptions": [
      {
        "title": "振荡约束与绝对质量约束分开",
        "detail": "振荡实验主要约束 Δm² 和混合参数；β 衰变、无中微子双贝塔衰变和宇宙学探测不同的质量组合，并带有不同的模型或数据假设。"
      },
      {
        "title": "宇宙学结果依赖宇宙模型",
        "detail": "由结构形成或 CMB 推出的中微子质量和有效自由度限制依赖采用的宇宙学模型、数据集和粒子热史；应明确是否采用标准 ΛCDM 及其扩展。"
      },
      {
        "title": "重中微子限制依赖产生—衰变全链条",
        "detail": "混合诱导的产生截面、分支比、寿命、位移重建和背景共同决定灵敏度；prompt、displaced 与 detector-stable 区域不可混用同一效率。"
      },
      {
        "title": "新相互作用需检查理论一致性",
        "detail": "新规范玻色子的电荷分配、异常抵消、动能/质量混合和其他轻子约束必须在模型中一起核对。一个实验的限制不能直接视为模型无关的普适边界。"
      }
    ],
    "researchQuestions": [
      {
        "title": "明确模型究竟解释哪类观测",
        "detail": "是振荡参数、绝对质量、轻子数破坏、宇宙学异常还是长寿命粒子信号？不同目标需要不同参数化和统计量。"
      },
      {
        "title": "从质量矩阵走向可测量",
        "detail": "公开质量与混合矩阵约定，说明如何计算振荡概率、衰变宽度、有效质量或散射截面，并做维度和极限检查。"
      },
      {
        "title": "联合分析前先对齐假设",
        "detail": "将低能实验、对撞机、天体物理与宇宙学约束按适用模型和置信水平分类，再决定哪些似然可合法组合。"
      }
    ],
    "references": [
      {
        "title": "Particle Data Group — Review of Particle Physics",
        "url": "https://pdg.lbl.gov/2026/",
        "note": "中微子质量、混合与振荡的权威综述入口；重点核对参数定义与实验组合。"
      },
      {
        "title": "Neutrino oscillations: The rise of the PMNS paradigm",
        "url": "https://www.sciencedirect.com/science/article/abs/pii/S014664101730087X",
        "note": "三中微子振荡框架与实验参数的综述。"
      }
    ]
  },
  "collider": {
    "framing": "对撞机唯象学的完整对象不是 parton-level 截面本身，而是从模型拉格朗日量到探测器级分布、再到统计推断的链条。耦合、质量和分支比改变信号形状与归一化；接受度、重建、背景及系统误差决定这些差异能否被数据识别。",
    "prerequisites": [
      "标准模型场内容、费曼规则与散射截面",
      "PDF、因子化/重整化尺度及 Monte Carlo 基本概念",
      "事件选择、探测器接受度、统计似然和置信区间"
    ],
    "keyRelations": [
      {
        "title": "预期信号产额",
        "label": "FROM THEORY TO EVENTS",
        "formula": "Ns = Lint × σprod × BR × A × ε",
        "meaning": "积分亮度与产生截面给出产生事例规模，衰变分支比、几何/运动学接受度 A 和选择效率 ε 将其映射为分析区中的预期信号数。多级衰变时需使用相应分支比乘积。",
        "conditions": "这是因子化的产额估算；A 与 ε 可能依赖模型参数、寿命、事例形状和分析 cuts。",
        "doesNotMean": "不能将生成级事件数直接等同于实验可见事件数；干涉、宽共振、重建效应和系统不确定性可能要求完整模拟或差分分析。"
      },
      {
        "title": "分箱似然：比较数据与模型",
        "label": "STATISTICAL INFERENCE",
        "formula": "L(μ,θ) = Πi Pois(ni | μ si(θ) + bi(θ)) × π(θ)",
        "meaning": "常见分箱分析用观测计数 ni 与信号/背景期望 si、bi 构造似然，θ 表示系统误差 nuisance 参数，π(θ) 表示相应约束项。参数限制来自统计模型与数据的联合比较。",
        "conditions": "这是示意形式；实际分析可能包含控制区、相关系统误差、形状信息、非泊松项和实验专用统计约定。",
        "doesNotMean": "单独比较理论总截面与一个公开上限不保证统计解释一致；必须检查信号模型、置信水平、分支比、宽度和分析定义。"
      },
      {
        "title": "EFT 截断与高能尾部",
        "label": "EFFECTIVE FIELD THEORY",
        "formula": "A = ASM + C6 Q²/Λ² + O(Q⁴/Λ⁴)  (schematic)",
        "meaning": "EFT 通过能标展开组织新物理效应。维六振幅干涉项、维六平方项和维八干涉项可能处于不同的展开阶次，截断策略会影响高能尾部和参数限制。",
        "conditions": "Q 表示相关硬尺度，表达式仅为计数示意；实际振幅中的量纲、耦合与算符结构必须逐过程推导。",
        "doesNotMean": "不能把一个普适 Q/Λ 数字当作所有 EFT 的有效性判据；需结合 UV 完备模型、运动学分布、耦合和目标精度评估。"
      }
    ],
    "assumptions": [
      {
        "title": "模型实现先于大规模生成",
        "detail": "先验证拉格朗日量、规范荷、颜色因子、质量矩阵、顶点和分支比，再生成事例。UFO 文件能够被读取并不等于模型物理正确。"
      },
      {
        "title": "固定并保存运行配置",
        "detail": "记录软件版本、模型文件哈希、PDF 集、尺度方案、随机种子、生成 cuts、衰变链、事例数和日志；改变输入时判断哪些产物必须重跑。"
      },
      {
        "title": "理论误差不能藏在统计误差里",
        "detail": "明确微扰阶数、尺度变化、PDF 与 shower/匹配方案的影响；对接受度敏感的模型，应传播到最终产额和限制。"
      },
      {
        "title": "投影不是现有排除",
        "detail": "未来灵敏度必须注明能量、积分亮度、背景与系统误差假设；模型依赖的排除曲线只适用于其分析覆盖的信号拓扑。"
      }
    ],
    "researchQuestions": [
      {
        "title": "从拉格朗日量到可信模型文件",
        "detail": "对代表性顶点做手算或符号检查，验证守恒量、Hermiticity、颜色和洛伦兹结构，再与独立工具或极限比较。"
      },
      {
        "title": "从理论分布到分析区",
        "detail": "依次记录生成、衰变、parton shower、探测器模拟、重建和 cuts；为每一步保存配置、版本与产物指纹。"
      },
      {
        "title": "用数据定义统计结论",
        "detail": "优先使用公开的 HEPData 或实验分析材料，复现信号区和背景定义；把观测限制、重铸结果与未来投影分别报告。"
      }
    ],
    "references": [
      {
        "title": "PDG 2026 — Status of Higgs Boson Physics",
        "url": "https://pdg.lbl.gov/2026/reviews/rpp2026-rev-higgs-boson.pdf",
        "note": "希格斯产生、衰变、耦合测量与理论—实验比较的权威综述。"
      },
      {
        "title": "CERN Open Data Portal",
        "url": "https://opendata.cern.ch/",
        "note": "公开实验数据、软件和分析文档入口；使用时应核对数据发布级别。"
      }
    ]
  },
  "phase": {
    "framing": "相变引力波预言必须先证明给定模型在所选参数下存在并完成相应的一阶相变，再计算泡成核、流体运动和引力波源。有效势上的势垒、成核温度、相变完成条件与源项寿命共同决定信号；单独给出 α、β/H* 两个数并不足以构成可复现预测。",
    "prerequisites": [
      "有限温有效势、热力学势与相结构",
      "O(3) 热反弹解与作用量 S3/T",
      "辐射主导宇宙、泡壁动力学和随机引力波背景"
    ],
    "keyRelations": [
      {
        "title": "热成核率与相变时间尺度",
        "label": "BUBBLE NUCLEATION",
        "formula": "Γ(T) ≈ A(T) exp[−S3(T)/T],   β/H* ≃ Tn d(S3/T)/dT |Tn",
        "meaning": "热成核率受三维反弹作用量指数抑制；β⁻¹ 表征成核率快速变化的时间尺度。这里用 Tn 表示成核温度，避免把临界温度、成核温度和相变完成温度混为一谈。",
        "conditions": "后一个近似通常假定成核附近温度变化可局部展开，且 H* 变化缓慢；数值实现须统一 β 的符号约定并检查导数符号。",
        "doesNotMean": "得到一个临界温度或势垒并不证明相变会完成；还需要检验成核、渗流/完成条件以及真空能是否导致显著超冷。"
      },
      {
        "title": "相变强度参数 α",
        "label": "ENERGY RELEASE",
        "formula": "α = Δρ / ρrad,   ρ = Veff − T ∂Veff/∂T",
        "meaning": "α 比较相变释放的能量密度与辐射能量密度。能量密度来自自由能/有效势对温度的导数，因此不能简单把两个极小值的势能差在任意温度直接当作 Δρ。",
        "conditions": "必须明确 Δρ 是假真空与真真空能量密度之差、评估温度及有效势的重整化/热修正方案。",
        "doesNotMean": "α 不是与模型无关的输入常数；它受势能、成核温度、热史与定义约定影响。"
      },
      {
        "title": "引力波源项与可探测性",
        "label": "GW SPECTRUM",
        "formula": "ΩGW(f) = Ωsw(f) + Ωturb(f) + Ωcoll(f)  (model-dependent)",
        "meaning": "声波、湍流和泡壁碰撞等项是不同物理源的示意分解。相应幅度与谱形依赖泡壁速度、能量转化效率、流体动力学和源持续时间。",
        "conditions": "具体模型可能有某些源项不重要或不适用；声波源持续时间尤其可能偏离简单长寿命近似。",
        "doesNotMean": "理论谱与仪器灵敏度曲线交叉不自动等于发现或排除；需要统一置信度、噪声模型、频段和源模型。"
      }
    ],
    "assumptions": [
      {
        "title": "标准模型基线是 crossover",
        "detail": "对于观测到的约 125 GeV Higgs 的最小标准模型，电弱热演化是 crossover 而非一阶相变。若讨论强一阶电弱相变，必须明确额外自由度或新相互作用如何改变相结构。"
      },
      {
        "title": "有效势存在规范与微扰问题",
        "detail": "有限温有效势的环阶、规范选择、重整化方案和红外效应会影响势垒与相变参数；在强耦合或微扰展开不可靠的区域应说明限制，必要时考虑非微扰方法。"
      },
      {
        "title": "成核与完成是不同问题",
        "detail": "临界温度只表示两相自由能相等；成核温度与渗流/完成条件还涉及反弹作用量和宇宙膨胀。强超冷时，简单辐射主导近似可能需要重新评估。"
      },
      {
        "title": "引力波模板具有适用边界",
        "detail": "泡壁 runaway 判据、流体效率、声波寿命和湍流模型均有适用条件。报告必须把模型输入、数值算法、源项公式和不确定性写在一起。"
      }
    ],
    "researchQuestions": [
      {
        "title": "先画清热历史与相结构",
        "detail": "求 Veff(φ,T) 的极小值演化，检查全局/亚稳态、临界温度、成核温度和可能的多步相变。"
      },
      {
        "title": "证明相变可完成",
        "detail": "求解反弹作用量，检查成核率、渗流与真空能主导风险；不要只用一个 S3/T 阈值代替完整的完成条件。"
      },
      {
        "title": "把源模型不确定性传播到频谱",
        "detail": "记录 α、β/H*、Tn、泡壁速度、效率因子和自由度；对源寿命、流体处理及探测器噪声做敏感性分析。"
      }
    ],
    "references": [
      {
        "title": "Gravitational waves from a first order electroweak phase transition: a brief review",
        "url": "https://arxiv.org/abs/1705.01783",
        "note": "一阶相变、泡壁能量预算与引力波源项的综述；明确讨论标准模型电弱 crossover。"
      },
      {
        "title": "Gravitational waves from first-order cosmological phase transitions: lifetime of the sound wave source",
        "url": "https://arxiv.org/abs/2003.07360",
        "note": "讨论声波源持续时间与常用引力波估算的适用条件。"
      }
    ]
  },
  "precision": {
    "framing": "精密测量与量子计量研究参数如何编码在量子态或事件分布中，以及在给定测量、样本和误差模型下能够达到什么精度。量子 Fisher 信息给出理想量子态层面的界；经典 Fisher 信息、有限样本似然和系统误差则决定真实粒子物理分析的可达能力。",
    "prerequisites": [
      "概率论、估计理论与 Fisher 信息",
      "量子态、密度矩阵和参数依赖的测量概率",
      "高能物理中的分箱似然、nuisance 参数与系统误差"
    ],
    "keyRelations": [
      {
        "title": "量子 Cramér–Rao 界",
        "label": "QUANTUM METROLOGY",
        "formula": "Var(θ) ≥ 1 / [N FQ(θ)]",
        "meaning": "对于 N 个独立且同分布的探针，若 FQ 表示单个探针的量子 Fisher 信息，则无偏估计方差受该下界约束。FQ 量化量子态对参数变化的可辨识度。",
        "conditions": "这是单参数、独立探针的常见形式；多参数估计还涉及 Fisher 信息矩阵、参数间相关性及最优测量能否同时实现等条件。",
        "doesNotMean": "量子界不是任意测量都能达到的误差，也不自动包含有限样本、探测器损失、背景和系统误差。"
      },
      {
        "title": "量子 Fisher 信息的定义",
        "label": "SYMMETRIC LOGARITHMIC DERIVATIVE",
        "formula": "∂θρ = (Lθρ + ρLθ)/2,   FQ = Tr(ρ Lθ²)",
        "meaning": "对称对数导数 Lθ 将密度矩阵对参数的变化编码为算符，量子 Fisher 信息由该算符的二阶矩给出。对纯态和混合态，计算方式与可达性条件可能不同。",
        "conditions": "须说明状态 ρ(θ)、参数化、秩变化和所采用的定义；多参数情况下不能把各参数的单参数最优界简单当作同时可实现的结果。",
        "doesNotMean": "只给出一个 FQ 数值并不足以证明某种测量方案达到该界；还要构造测量并分析其可达性。"
      },
      {
        "title": "分箱事件的经典 Fisher 信息",
        "label": "COLLIDER PHENOMENOLOGY",
        "formula": "Iab = Σi (1/μi) (∂μi/∂θa)(∂μi/∂θb)",
        "meaning": "对独立 Poisson 分箱、期望计数 μi(θ) 且暂不考虑 nuisance 参数的理想模型，Fisher 信息矩阵可写成此形式。它能比较不同可观测量或分箱对模型参数的局部信息量。",
        "conditions": "假设分箱独立、计数服从 Poisson 分布，且 μi 对参数可微；引入系统误差和相关 nuisance 参数后需对完整似然进行剖面化或边缘化。",
        "doesNotMean": "信息矩阵的逆不自动等于真实分析的最终误差；还需检查参数退化、先验、非高斯性、有限样本和模型失配。"
      }
    ],
    "assumptions": [
      {
        "title": "先定义被估参数与数据模型",
        "detail": "说明 θ 的物理含义、单位、参考点、态/事件样本及其参数依赖。不同论文若参数归一化或可观测量定义不同，不能直接比较 Fisher 信息。"
      },
      {
        "title": "理想界、统计误差和实验误差分层",
        "detail": "先报告量子或经典理论界，再报告在选定估计器/似然下的统计精度，最后加入接受度、背景、重建和系统误差。"
      },
      {
        "title": "局部信息不保证全局可辨识",
        "detail": "Fisher 信息是局部灵敏度指标；多峰似然、离散简并和参数退化可能使局部高信息量无法转化为唯一的全局参数测量。"
      },
      {
        "title": "自旋与量子信息需可观测化",
        "detail": "理论密度矩阵、纠缠见证或量子 Fisher 信息只有在对应自旋关联/角分布可重建、且接受度与背景被控制时，才可转化为实验结论。"
      }
    ],
    "researchQuestions": [
      {
        "title": "从态或振幅定义信息量",
        "detail": "写清参数进入哈密顿量、密度矩阵、振幅或分布的方式，再按对应定义计算 QFI 或经典 Fisher 信息。"
      },
      {
        "title": "与可测量的统计模型对接",
        "detail": "把理想量映射到实际角分布、分箱或事件级似然，并显式纳入背景、效率、分辨率和系统误差。"
      },
      {
        "title": "检查独立极限与参数退化",
        "detail": "用已知极限、简单解析模型或独立代码验证结果；检查 Fisher 矩阵秩、相关系数和多参数界的可达性。"
      }
    ],
    "references": [
      {
        "title": "Quantum Fisher information matrix and multiparameter estimation",
        "url": "https://arxiv.org/abs/1907.08037",
        "note": "量子 Fisher 信息矩阵、多参数 Cramér–Rao 界和可达性条件的综述。"
      },
      {
        "title": "Journal of Physics A — published review",
        "url": "https://doi.org/10.1088/1751-8121/ab5d4d",
        "note": "上述综述的正式发表版本，便于核对出版信息。"
      }
    ]
  }
}
