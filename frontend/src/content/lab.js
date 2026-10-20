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
  english: 'Xiao-Ping Wang',
  institution: lab.institution,
  title: '副教授 · 博士生导师',
  field: lab.field,
  topics: ['超出标准模型的新粒子', '暗物质模型与探测', '中微子模型与非标准相互作用', '希格斯物理', '加速器与非加速器新物理探测'],
  intro: '长期从事新物理理论与唯象学研究，关注基本粒子与相互作用的新机制，结合理论模型和实验观测，探索新粒子的可检验信号及不同探测途径的互补性。',
  source: lab.source,
}

// Collaboration confirmed by the group; academic fields checked on the linked homepage.
export const collaborators = [
  {
    name: '刘佳',
    institution: '北京大学物理学院',
    field: '粒子物理理论',
    topics: ['暗物质物理', '对撞机物理', '希格斯物理', '中微子物理', '粒子天体物理'],
    source: 'https://faculty.pku.edu.cn/liujia/zh_CN/index.htm',
  },
]

export const directions = [
  { id: 'dark', number: '01', title: '暗物质与暗扇区', en: 'DARK MATTER & DARK SECTORS', symbol: 'χ', text: '构建暗物质理论模型，研究其产生、相互作用与可观测信号，联系不同探测途径。', tags: ['暗物质模型', '对撞机探测', '互补约束'] },
  { id: 'neutrino', number: '02', title: '中微子与新相互作用', en: 'NEUTRINOS & NEW INTERACTIONS', symbol: 'ν', text: '研究中微子相关理论模型与非标准相互作用，探索实验观测对新物理的检验。', tags: ['中微子模型', '非标准相互作用', '非加速器探测'] },
  { id: 'collider', number: '03', title: '希格斯与对撞机唯象', en: 'HIGGS & COLLIDER PHENOMENOLOGY', symbol: 'H', text: '寻找超出标准模型的新粒子，研究希格斯物理、长寿命粒子及未来对撞机中的实验信号。', tags: ['希格斯物理', '长寿命粒子', '新物理信号'] },
]

// Bibliographic metadata checked against each linked arXiv record.
export const publications = [
  { id: '2210.09335', year: '2023', category: 'collider', tag: 'ALP · 未来对撞机', title: 'The ALP explanation to muon (g−2) and its test at future Tera-Z and Higgs factories', authors: ['Jia Liu', 'Xiaolin Ma', 'Lian-Tao Wang', 'Xiao-Ping Wang'], journal: 'Phys. Rev. D 107, 095016', doi: '10.1103/PhysRevD.107.095016', summary: '研究类轴子解释与未来对撞机的检验。', published: '2022-10-17' },
  { id: '2111.01164', year: '2022', category: 'dark', tag: '暗物质 · 长寿命粒子', title: 'Heavy long-lived coannihilation partner from inelastic Dark Matter model and its signatures at the LHC', authors: ['Jinhui Guo', 'Yuxuan He', 'Jia Liu', 'Xiao-Ping Wang'], journal: 'JHEP 04 (2022) 024', doi: '10.1007/JHEP04(2022)024', summary: '研究非弹性暗物质模型中长寿命共湮灭伙伴的信号。', published: '2021-11-01' },
  { id: '2104.06421', year: '2021', category: 'dark', tag: '暗物质 · 引力波', title: 'Searching for lepton portal dark matter with colliders and gravitational waves', authors: ['Jia Liu', 'Xiao-Ping Wang', 'Ke-Pan Xie'], journal: 'JHEP 06 (2021) 149', doi: '10.1007/JHEP06(2021)149', summary: '联系对撞机与引力波途径研究轻子门户暗物质。', published: '2021-04-13' },
]
