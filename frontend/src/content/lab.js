// Public content allowlist. Do not add contact details, office locations, CVs,
// funding, internal schedules or member records to this module.
export const lab = {
  name: '北航粒子物理研究组',
  provisional: true,
  shortName: 'BUAA · HEP',
  institution: '北京航空航天大学物理学院',
  field: '高能粒子物理唯象学',
  english: 'Particle Physics Phenomenology',
  advisor: '王小平',
  source: 'https://physics.buaa.edu.cn/info/1265/3153.htm',
  intro: '连接理论模型与实验信号，探索标准模型之外的物理。我们关注暗物质、中微子、希格斯与新粒子，通过加速器和非加速器探测研究基本相互作用。',
}

export const advisorProfile = {
  name: lab.advisor,
  groupRole: '导师',
  english: 'Xiao-Ping Wang',
  institution: lab.institution,
  title: '副教授 · 博士生导师',
  field: lab.field,
  topics: ['超出标准模型的新粒子', '暗物质模型与探测', '中微子模型与非标准相互作用', '希格斯物理', '加速器与非加速器新物理探测'],
  intro: '长期从事新物理理论与唯象学研究，关注基本粒子与相互作用的新机制，结合理论模型和实验观测，探索新粒子的可检验信号及不同探测途径的互补性。',
  source: lab.source,
}

// Group roles confirmed by the user; public academic details checked on faculty homepages.
export const collaborators = [
  {
    name: '刘佳',
    english: 'Jia Liu',
    groupRole: '学术指导',
    institution: '北京大学物理学院',
    title: '长聘副教授',
    field: '粒子物理理论',
    intro: '从事粒子物理理论研究，研究涵盖暗物质物理、对撞机物理、希格斯物理、中微子物理与粒子天体物理，围绕基本粒子、相互作用及标准模型之外的物理开展研究。',
    highlights: ['相关研究成果发表于 Physical Review Letters、Nature Communications、Physical Review D、JHEP、JCAP 和 Communications Physics 等学术期刊。'],
    topics: ['暗物质物理', '对撞机物理', '希格斯物理', '中微子物理', '粒子天体物理'],
    source: 'https://faculty.pku.edu.cn/liujia/zh_CN/index.htm',
  },
]

// All five directions and all sixteen publications approved by the group on 2026-10-20.
export const directions = [
  {
    "id": "dark",
    "number": "01",
    "title": "暗物质与暗扇区",
    "en": "DARK MATTER & DARK SECTORS",
    "symbol": "χ",
    "text": "构建暗物质理论模型，研究热遗迹、共湮灭、非弹性相互作用和超轻暗物质。连接对撞机、直接探测及宇宙学信息，分析不同检验途径的互补性。",
    "detail": "可观测信号取决于模型参数、产生机制与宇宙学假设；模型预言和实验排除范围需要在一致假设下比较。",
    "tags": [
      "暗物质模型",
      "暗扇区",
      "互补约束"
    ]
  },
  {
    "id": "neutrino",
    "number": "02",
    "title": "中微子与新相互作用",
    "en": "NEUTRINOS & NEW INTERACTIONS",
    "symbol": "ν",
    "text": "研究中微子质量相关模型、惰性中微子，以及轻子与中微子的新相互作用。联系太阳中微子、早期宇宙、精密观测与对撞机搜索。",
    "detail": "在具体模型中梳理不同实验约束的适用条件，并研究低能信号与高能探测之间的关联。",
    "tags": [
      "惰性中微子",
      "新相互作用",
      "非加速器探测"
    ]
  },
  {
    "id": "collider",
    "number": "03",
    "title": "希格斯与对撞机唯象",
    "en": "HIGGS & COLLIDER PHENOMENOLOGY",
    "symbol": "H",
    "text": "通过希格斯、顶夸克和长寿命粒子的产生与衰变，研究标准模型之外的新粒子与耦合。关注 LHC 与未来对撞机的可检验信号。",
    "detail": "区分理论截面、探测器接受度与实际实验约束；未来灵敏度是在给定运行条件和分析假设下的预测。",
    "tags": [
      "希格斯物理",
      "长寿命粒子",
      "未来对撞机"
    ]
  },
  {
    "id": "phase",
    "number": "04",
    "title": "相变与引力波",
    "en": "PHASE TRANSITIONS & GRAVITATIONAL WAVES",
    "symbol": "Ω",
    "text": "研究暗扇区与电弱相变中的动力学问题，探索粒子物理模型与随机引力波背景之间的联系，并与对撞机信号进行互补分析。",
    "detail": "相变机制、成核过程和引力波谱依赖具体计算与近似；预测进入探测器灵敏度范围不等同于已经或必然被观测。",
    "tags": [
      "一阶相变",
      "暗扇区",
      "引力波预言"
    ]
  },
  {
    "id": "precision",
    "number": "05",
    "title": "量子计量学与精密测量",
    "en": "QUANTUM METROLOGY & PRECISION",
    "symbol": "I",
    "text": "研究量子信息在对撞机精密测量中的作用，比较量子 Fisher 信息、可测观测量和统计分析能够保留的信息。",
    "detail": "量子精度极限描述理想条件下的界限；实际精度还受到衰变道、相空间选择、探测效率与系统误差影响。",
    "tags": [
      "量子 Fisher 信息",
      "自旋关联",
      "对撞机精度"
    ]
  }
]

export const publicationCategories = [
  {
    "id": "dark",
    "label": "暗物质与暗扇区"
  },
  {
    "id": "neutrino",
    "label": "中微子与新相互作用"
  },
  {
    "id": "collider",
    "label": "希格斯与对撞机"
  },
  {
    "id": "llp",
    "label": "长寿命粒子"
  },
  {
    "id": "phase",
    "label": "相变与引力波"
  },
  {
    "id": "precision",
    "label": "量子计量与精度"
  }
]

// Bibliographic metadata cross-checked against arXiv and INSPIRE-HEP.
export const publications = [
  {
    "id": "2610.04971",
    "year": "2026",
    "category": "precision",
    "categories": [
      "precision",
      "collider"
    ],
    "tags": [
      "顶夸克",
      "自旋关联"
    ],
    "tag": "顶夸克 · 自旋关联",
    "title": "Probing anomalous Wtb couplings through bW spin correlations in top-quark pair production at the HL-LHC",
    "authors": [
      "Qi Bi",
      "Zekun Li",
      "Chuntao Liu",
      "Jia Liu",
      "Xiao-Ping Wang"
    ],
    "journal": "",
    "doi": "",
    "summary": "研究利用 b 夸克与 W 玻色子自旋关联检验异常 Wtb 耦合的方法，并估算 HL-LHC 条件下的统计灵敏度。",
    "published": "2026-10-04",
    "status": "preprint",
    "source_url": "https://arxiv.org/abs/2610.04971",
    "inspire_url": "https://inspirehep.net/literature/3211613",
    "last_verified_at": "2026-10-20",
    "citation_title": "Probing anomalous $Wtb$ couplings through $bW$ spin correlations in top-quark pair production at the HL-LHC"
  },
  {
    "id": "2608.27258",
    "year": "2026",
    "category": "neutrino",
    "categories": [
      "neutrino",
      "collider"
    ],
    "tags": [
      "轴矢量规范相互作用",
      "UV 完备性"
    ],
    "tag": "轴矢量规范相互作用 · UV 完备性",
    "title": "An Axial U_A(1)_{Lμ−Lτ}: UV Completion and Experimental Searches",
    "authors": [
      "Rundong Fang",
      "Jinhui Guo",
      "Ming Li",
      "Jia Liu",
      "Xiao-Ping Wang",
      "Yiheng Xiong"
    ],
    "journal": "",
    "doi": "",
    "summary": "构建轴矢量轻子规范相互作用的紫外完备模型，研究现有实验约束和未来对撞机的检验途径。",
    "published": "2026-08-27",
    "status": "preprint",
    "source_url": "https://arxiv.org/abs/2608.27258",
    "inspire_url": "https://inspirehep.net/literature/3196970",
    "last_verified_at": "2026-10-20",
    "citation_title": "An Axial $U_A(1)_{L_\\mu-L_\\tau}$: UV Completion and Experimental Searches"
  },
  {
    "id": "2604.01304",
    "year": "2026",
    "category": "phase",
    "categories": [
      "phase",
      "dark"
    ],
    "tags": [
      "暗扇区",
      "原初黑洞"
    ],
    "tag": "暗扇区 · 原初黑洞",
    "title": "Supermassive Primordial Black Holes from a Catalyzed Dark Phase Transition for Little Red Dots",
    "authors": [
      "Jinhui Guo",
      "Jia Liu",
      "Masanori Tanaka",
      "Xiao-Ping Wang",
      "Huangyu Xiao"
    ],
    "journal": "",
    "doi": "",
    "summary": "讨论暗扇区催化相变产生超大质量原初黑洞的机制及相关引力波信号。",
    "published": "2026-04-01",
    "status": "preprint",
    "source_url": "https://arxiv.org/abs/2604.01304",
    "inspire_url": "https://inspirehep.net/literature/3138837",
    "last_verified_at": "2026-10-20",
    "citation_title": "Supermassive Primordial Black Holes from a Catalyzed Dark Phase Transition for Little Red Dots"
  },
  {
    "id": "2603.17237",
    "year": "2026",
    "category": "dark",
    "categories": [
      "dark"
    ],
    "tags": [
      "超轻标量",
      "味物理"
    ],
    "tag": "超轻标量 · 味物理",
    "title": "Ultralight Scalar Dark Matter with Off-Diagonal Flavor Couplings",
    "authors": [
      "Jinhui Guo",
      "Jia Liu",
      "Chenhao Peng",
      "Xiao-Ping Wang",
      "Hang Zhao"
    ],
    "journal": "Phys.Rev.D 114 (2026) 015022",
    "doi": "10.1103/3c9n-gfvj",
    "summary": "研究具有非对角味耦合的超轻标量暗物质，以及时域观测和味物理检验的互补性。",
    "published": "2026-03-18",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2603.17237",
    "inspire_url": "https://inspirehep.net/literature/3131006",
    "last_verified_at": "2026-10-20",
    "citation_title": "Ultralight Scalar Dark Matter with Off-Diagonal Flavor Couplings"
  },
  {
    "id": "2510.20672",
    "year": "2026",
    "category": "neutrino",
    "categories": [
      "neutrino"
    ],
    "tags": [
      "太阳中微子",
      "第五力"
    ],
    "tag": "太阳中微子 · 第五力",
    "title": "An Axial-Vector Leptophilic Fifth Force Sourced by Solar Neutrinos",
    "authors": [
      "Rundong Fang",
      "Ji-Heng Guo",
      "Jia Liu",
      "Xiao-Ping Wang",
      "YanLi Zhao"
    ],
    "journal": "Phys.Rev.D 113 (2026) 055041",
    "doi": "10.1103/mrm8-qv1j",
    "summary": "研究太阳中微子作为源产生的轴矢量轻子第五力及其唯象学约束。",
    "published": "2025-10-23",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2510.20672",
    "inspire_url": "https://inspirehep.net/literature/3072560",
    "last_verified_at": "2026-10-20",
    "citation_title": "An Axial-Vector Leptophilic Fifth Force Sourced by Solar Neutrinos"
  },
  {
    "id": "2509.23925",
    "year": "2026",
    "category": "neutrino",
    "categories": [
      "neutrino",
      "phase",
      "collider"
    ],
    "tags": [
      "惰性中微子",
      "相变与引力波",
      "对撞机"
    ],
    "tag": "惰性中微子 · 相变与引力波 · 对撞机",
    "title": "Probing Scalar-Mediated Sterile Neutrinos with Gravitational Wave and Colliders Signals",
    "authors": [
      "Qi Bi",
      "Jinhui Guo",
      "Jian Liao",
      "Jia Liu",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 113 (2026) 095006",
    "doi": "10.1103/29kg-f6jb",
    "summary": "联系引力波和对撞机信号，研究标量介导的惰性中微子模型。",
    "published": "2025-09-28",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2509.23925",
    "inspire_url": "https://inspirehep.net/literature/2974387",
    "last_verified_at": "2026-10-20",
    "citation_title": "Probing Scalar-Mediated Sterile Neutrinos with Gravitational Wave and Colliders Signals"
  },
  {
    "id": "2508.13276",
    "year": "2025",
    "category": "dark",
    "categories": [
      "dark",
      "llp",
      "phase",
      "collider"
    ],
    "tags": [
      "非弹性暗物质",
      "长寿命粒子",
      "相变与引力波"
    ],
    "tag": "非弹性暗物质 · 长寿命粒子 · 相变与引力波",
    "title": "Probing Purely Inelastic Scalar Dark Matter Across Colliders and Gravitational Wave Observatories",
    "authors": [
      "Jinhui Guo",
      "Jia Liu",
      "Chenhao Peng",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 112 (2025) 115014",
    "doi": "10.1103/9myr-9xx5",
    "summary": "研究纯非弹性标量暗物质模型在对撞机和引力波观测途径中的互补信号。",
    "published": "2025-08-18",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2508.13276",
    "inspire_url": "https://inspirehep.net/literature/2962219",
    "last_verified_at": "2026-10-20",
    "citation_title": "Probing Purely Inelastic Scalar Dark Matter Across Colliders and Gravitational Wave Observatories"
  },
  {
    "id": "2506.10673",
    "year": "2025",
    "category": "precision",
    "categories": [
      "precision",
      "collider"
    ],
    "tags": [
      "量子精度",
      "对撞机"
    ],
    "tag": "量子精度 · 对撞机",
    "title": "Ultimate Quantum Precision Limit at Colliders: Conditions and Case Studies",
    "authors": [
      "Tengyu Ai",
      "Qi Bi",
      "Yuxin He",
      "Jia Liu",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.Lett. 135 (2025) 241804",
    "doi": "10.1103/3m4t-pk9b",
    "summary": "研究对撞机测量达到量子精度极限的条件，并通过案例讨论可用信息与可达精度。",
    "published": "2025-06-12",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2506.10673",
    "inspire_url": "https://inspirehep.net/literature/2933814",
    "last_verified_at": "2026-10-20",
    "citation_title": "Ultimate Quantum Precision Limit at Colliders: Conditions and Case Studies"
  },
  {
    "id": "2505.06001",
    "year": "2025",
    "category": "phase",
    "categories": [
      "phase",
      "precision"
    ],
    "tags": [
      "电弱相变",
      "散射纠缠熵"
    ],
    "tag": "电弱相变 · 散射纠缠熵",
    "title": "Scattering Entanglement Entropy and Its Implications for Electroweak Phase Transitions",
    "authors": [
      "Jia Liu",
      "Masanori Tanaka",
      "Xiao-Ping Wang",
      "Jing-Jun Zhang",
      "Zifan Zheng"
    ],
    "journal": "Phys.Rev.D 112 (2025) 015028",
    "doi": "10.1103/958t-h23m",
    "summary": "研究散射纠缠熵与电弱相变动力学之间的联系。",
    "published": "2025-05-09",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2505.06001",
    "inspire_url": "https://inspirehep.net/literature/2919815",
    "last_verified_at": "2026-10-20",
    "citation_title": "Scattering Entanglement Entropy and Its Implications for Electroweak Phase Transitions"
  },
  {
    "id": "2409.17243",
    "year": "2025",
    "category": "llp",
    "categories": [
      "llp",
      "neutrino",
      "collider"
    ],
    "tags": [
      "惰性中微子",
      "未来 μ 子对撞机"
    ],
    "tag": "惰性中微子 · 未来 μ 子对撞机",
    "title": "Long-lived Sterile Neutrino Searches at Future Muon Colliders",
    "authors": [
      "Qi Bi",
      "Jinhui Guo",
      "Jia Liu",
      "Yan Luo",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 111 (2025) 075001",
    "doi": "10.1103/PhysRevD.111.075001",
    "summary": "研究未来 μ 子对撞机中长寿命惰性中微子的搜索潜力。",
    "published": "2024-09-25",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2409.17243",
    "inspire_url": "https://inspirehep.net/literature/2833950",
    "last_verified_at": "2026-10-20",
    "citation_title": "Long-lived Sterile Neutrino Searches at Future Muon Colliders"
  },
  {
    "id": "2407.11653",
    "year": "2024",
    "category": "dark",
    "categories": [
      "dark",
      "phase"
    ],
    "tags": [
      "暗光子",
      "引力波",
      "WKB 近似"
    ],
    "tag": "暗光子 · 引力波 · WKB 近似",
    "title": "Particle Conversions Beyond the WKB Approximation and Solar-Induced Gravitational Waves from Dark Photon Dark Matter",
    "authors": [
      "Tengyu Ai",
      "Yuxuan He",
      "Jia Liu",
      "Xiaolin Ma",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 110 (2024) 115026",
    "doi": "10.1103/PhysRevD.110.115026",
    "summary": "研究超出 WKB 近似的粒子转换，并讨论暗光子暗物质在太阳环境中的引力波产生。",
    "published": "2024-07-16",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2407.11653",
    "inspire_url": "https://inspirehep.net/literature/2808213",
    "last_verified_at": "2026-10-20",
    "citation_title": "Particle Conversions Beyond the WKB Approximation and Solar-Induced Gravitational Waves from Dark Photon Dark Matter"
  },
  {
    "id": "2210.09335",
    "year": "2023",
    "category": "collider",
    "categories": [
      "collider",
      "dark"
    ],
    "tags": [
      "ALP",
      "缪子反常磁矩"
    ],
    "tag": "ALP · 缪子反常磁矩",
    "title": "The ALP explanation to muon (g−2) and its test at future Tera-Z and Higgs factories",
    "authors": [
      "Jia Liu",
      "Xiaolin Ma",
      "Lian-Tao Wang",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 107 (2023) 095016",
    "doi": "10.1103/PhysRevD.107.095016",
    "summary": "研究类轴子对缪子反常磁矩的解释及未来 Tera-Z 和希格斯工厂的检验。",
    "published": "2022-10-17",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2210.09335",
    "inspire_url": "https://inspirehep.net/literature/2166736",
    "last_verified_at": "2026-10-20",
    "citation_title": "The ALP explanation to muon $(g-2)$ and its test at future Tera-$Z$ and Higgs factories"
  },
  {
    "id": "2111.01164",
    "year": "2022",
    "category": "llp",
    "categories": [
      "llp",
      "dark",
      "collider"
    ],
    "tags": [
      "非弹性暗物质",
      "共湮灭",
      "LHC"
    ],
    "tag": "非弹性暗物质 · 共湮灭 · LHC",
    "title": "Heavy long-lived coannihilation partner from inelastic Dark Matter model and its signatures at the LHC",
    "authors": [
      "Jinhui Guo",
      "Yuxuan He",
      "Jia Liu",
      "Xiao-Ping Wang"
    ],
    "journal": "JHEP 04 (2022) 024",
    "doi": "10.1007/JHEP04(2022)024",
    "summary": "研究非弹性暗物质模型中长寿命共湮灭伙伴在 LHC 的信号。",
    "published": "2021-11-01",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2111.01164",
    "inspire_url": "https://inspirehep.net/literature/1958894",
    "last_verified_at": "2026-10-20",
    "citation_title": "Heavy long-lived coannihilation partner from inelastic Dark Matter model and its signatures at the LHC"
  },
  {
    "id": "2110.14665",
    "year": "2022",
    "category": "neutrino",
    "categories": [
      "neutrino"
    ],
    "tags": [
      "早期宇宙",
      "轻标量",
      "缪子反常磁矩"
    ],
    "tag": "早期宇宙 · 轻标量 · 缪子反常磁矩",
    "title": "A ν scalar in the early universe and (g−2)μ",
    "authors": [
      "Jia Liu",
      "Navin McGinnis",
      "Carlos E. M. Wagner",
      "Xiao-Ping Wang"
    ],
    "journal": "Phys.Rev.D 105 (2022) L051702",
    "doi": "10.1103/PhysRevD.105.L051702",
    "summary": "研究轻标量、中微子相互作用、早期宇宙约束与缪子反常磁矩之间的联系。",
    "published": "2021-10-27",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2110.14665",
    "inspire_url": "https://inspirehep.net/literature/1954952",
    "last_verified_at": "2026-10-20",
    "citation_title": "A $\\nu$ scalar in the early universe and $(g-2)_{\\mu}$"
  },
  {
    "id": "2104.06421",
    "year": "2021",
    "category": "dark",
    "categories": [
      "dark",
      "phase",
      "collider"
    ],
    "tags": [
      "轻子门户",
      "对撞机",
      "引力波"
    ],
    "tag": "轻子门户 · 对撞机 · 引力波",
    "title": "Searching for lepton portal dark matter with colliders and gravitational waves",
    "authors": [
      "Jia Liu",
      "Xiao-Ping Wang",
      "Ke-Pan Xie"
    ],
    "journal": "JHEP 06 (2021) 149",
    "doi": "10.1007/JHEP06(2021)149",
    "summary": "联系对撞机与引力波途径研究轻子门户暗物质。",
    "published": "2021-04-13",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2104.06421",
    "inspire_url": "https://inspirehep.net/literature/1858217",
    "last_verified_at": "2026-10-20",
    "citation_title": "Searching for lepton portal dark matter with colliders and gravitational waves"
  },
  {
    "id": "2102.10118",
    "year": "2021",
    "category": "dark",
    "categories": [
      "dark"
    ],
    "tags": [
      "QCD 轴子"
    ],
    "tag": "QCD 轴子",
    "title": "Challenges for a QCD Axion at the 10 MeV Scale",
    "authors": [
      "Jia Liu",
      "Navin McGinnis",
      "Carlos E. M. Wagner",
      "Xiao-Ping Wang"
    ],
    "journal": "JHEP 05 (2021) 138",
    "doi": "10.1007/JHEP05(2021)138",
    "summary": "分析约 10 MeV 尺度 QCD 轴子模型面临的唯象学挑战与约束。",
    "published": "2021-02-19",
    "status": "published",
    "source_url": "https://arxiv.org/abs/2102.10118",
    "inspire_url": "https://inspirehep.net/literature/1847786",
    "last_verified_at": "2026-10-20",
    "citation_title": "Challenges for a QCD Axion at the 10 MeV Scale"
  }
]
