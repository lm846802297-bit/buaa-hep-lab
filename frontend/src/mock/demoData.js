import { lab, publications } from '../content/lab'

// Fictional sandbox people and schedules; no actual private group data.
export const DEMO_BASE_DATE_STR = '2026-10-21'
function formatOffsetDate(offset = 0) {
  const d = new Date(`${DEMO_BASE_DATE_STR}T12:00:00+08:00`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}
export const DEMO_MEMBERS = [
  { id: 1, name: '李华（演示管理员）', real_name: '李华', email: 'admin@example.invalid', role: 'admin', identity: 'teacher', bio: '虚构账号，仅用于展示管理功能。', can_manage_seminars: true, is_tutorial_completed: true, tutorial_completed: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 2, name: '陈晨（演示组员）', real_name: '陈晨', email: 'member@example.invalid', role: 'member', identity: 'student', bio: '虚构账号：研读非弹性暗物质、热共湮灭与长寿命粒子信号。', can_manage_seminars: true, is_tutorial_completed: true, tutorial_completed: true, created_at: '2026-03-01T09:00:00Z' },
  { id: 3, name: '示例研究员', real_name: '示例研究员', email: 'researcher@example.invalid', role: 'member', identity: 'postdoc', bio: '虚构研究员账号：研究中微子新相互作用、惰性中微子与电弱相变。', can_manage_seminars: true, is_tutorial_completed: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 4, name: '示例学生', real_name: '示例学生', email: 'student@example.invalid', role: 'member', identity: 'student', bio: '虚构学生账号：研究对撞机精密测量、位移顶点与暗物质唯象学。', can_manage_seminars: false, is_tutorial_completed: true, created_at: '2026-05-20T14:30:00Z' },
]
export const DEMO_SITE_CONFIG = {
  initialized: true, user_count: 4, lab_name: `${lab.name}（演示）`, lab_short_name: lab.shortName,
  site_slogan: '高能粒子物理唯象学 · 科研协作', site_title: lab.name, institution: lab.institution,
  default_location: '待确认（演示地点）', invite_code_enabled: true, public_feed_enabled: true, version: 'buaa-hep-demo-1',
}
const seminarIds = [101, 102, 103, 100, 99]
const seminarTopics = [
  '纯非弹性标量暗物质：热共湮灭、相变与长寿命粒子信号',
  '标量介导惰性中微子：相变引力波与位移顶点',
  '太阳中微子源的轴矢量轻子第五力',
  '对撞机量子精度极限：可达条件与案例分析',
  '未来 μ 子对撞机中的长寿命惰性中微子搜索',
]
const seminarPaperIds = ['2508.13276', '2509.23925', '2510.20672', '2506.10673', '2409.17243']
const seminarPresenterIds = [2, 3, 4, 1, 4]
const seminarAbstracts = [
  '围绕纯非弹性标量暗物质讨论热共湮灭、质量分裂、一阶相变与长寿命粒子信号；需区分模型假设、基准点和完整参数空间。',
  '讨论标量介导惰性中微子模型中相变引力波与位移顶点搜索的互补性；灵敏度预测不等于观测证据。',
  '讨论太阳中微子作为延展源产生的轴矢量轻子第五力及其唯象学约束，重点关注模型定义和适用假设。',
  '梳理对撞机量子精度极限的成立条件和案例，区分量子信息界、统计误差与具体实验可达精度。',
  '讨论未来 μ 子对撞机中的长寿命惰性中微子搜索，明确质量、混合、寿命和探测器接受度的依赖。',
]
export const DEMO_SEMINARS = [2, 9, 16, -5, -12].map((offset, i) => {
  const presenterId = seminarPresenterIds[i]
  return {
    id: seminarIds[i], date: formatOffsetDate(offset), time: '14:30', location: '待确认（虚构演示排期）',
    presenter_id: presenterId, presenter_name: DEMO_MEMBERS[presenterId - 1].name,
    topic: `${seminarTopics[i]}（演示）`, abstract: seminarAbstracts[i],
    slides_url: '', status: offset > 0 ? 'upcoming' : 'completed', created_at: formatOffsetDate(-14) + 'T10:00:00Z',
    presentations: [{ id: 201 + i, seminar_id: seminarIds[i], position: 0, presenter_id: presenterId, presenter_name: DEMO_MEMBERS[presenterId - 1].name, arxiv_id: seminarPaperIds[i], slides_url: '' }],
  }
})
export const DEMO_ARXIV_PAPERS = publications.map((p, i) => ({
  id: 301 + i, arxiv_id: p.id, title: p.title, authors: p.authors.join(', '), journal: p.journal, primary_category: 'hep-ph',
  published_date: p.arxivSubmitted, source_url: `https://arxiv.org/abs/${p.id}`, pdf_url: `https://arxiv.org/pdf/${p.id}`,
  abstract: `演示用中文导读（非原文逐字摘要）：${p.summary}`, recommender: DEMO_MEMBERS[i % 2], recommended_by: DEMO_MEMBERS[i % 2].name,
  recommended_at: formatOffsetDate(-2 - i), notes: '演示推荐记录；摘要为课题组中文导读而非原文逐字摘要。论文来自公开文献，推荐人与互动为虚构。',
  likes_count: 0, user_liked: false, is_liked_by_me: false, read: false, is_read_by_me: false, comments: [],
}))
export const DEMO_NOTICES = [{ id: 1, title: '欢迎体验粒子物理科研工作台', content: '组员、组会和交流记录均为演示。真实部署请使用管理员初始化向导。', is_pinned: true, created_by: DEMO_MEMBERS[0].name, created_at: formatOffsetDate(-1), priority: 'normal' }]
export const DEMO_RESOURCES_CATEGORIES = [
  { id: 1, name: '教材', is_default: true }, { id: 2, name: '工具', is_default: true },
  { id: 3, name: '网站', is_default: true }, { id: 4, name: '综述与数据', is_default: true },
]
export const DEMO_BOOKS = [
  { title: 'Modern Particle Physics', authors: 'Mark Thomson', category: '教材', description: '粒子物理研究生入门教材，涵盖散射、衰变、标准模型、希格斯与新物理。', url: 'https://www.cambridge.org/cc/titles/modern-particle-physics' },
  { title: 'Quantum Field Theory and the Standard Model', authors: 'Matthew D. Schwartz', category: '教材', description: '量子场论、规范理论、重整化、标准模型与有效场论的研究生教材。', url: 'https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799' },
  { title: 'Review of Particle Physics (2026)', authors: 'Particle Data Group', category: '综述与数据', description: '粒子性质、标准模型综述和实验限制的权威入口；引用时记录版本、条目与勘误。', url: 'https://pdg.lbl.gov/2026/' },
  { title: 'arXiv · hep-ph', authors: 'arXiv', category: '网站', description: '高能粒子物理唯象学预印本入口；须区分预印本与期刊发表状态。', url: 'https://arxiv.org/list/hep-ph/recent' },
  { title: 'INSPIRE HEP', authors: 'INSPIRE', category: '工具', description: '高能物理文献检索、作者消歧和引文追踪。', url: 'https://inspirehep.net/' },
  { title: 'FeynCalc Documentation', authors: 'FeynCalc Collaboration', category: '工具', description: 'Mathematica 中的费曼振幅、Dirac/颜色代数和圈图计算工具文档。', url: 'https://feyncalc.github.io/' },
  { title: 'FeynRules', authors: 'FeynRules Collaboration', category: '工具', description: '从拉格朗日量导出 Feynman rules 并生成模型文件的工具入口。', url: 'https://feynrules.irmp.ucl.ac.be/' },
  { title: 'HEPData', authors: 'HEPData', category: '综述与数据', description: '实验发布的数值数据表与协方差信息入口，适用于可追溯的唯象学重解释。', url: 'https://www.hepdata.net/' },
].map((book, i) => ({ ...book, id: i + 1, original_title: book.title, tutorial_url: book.url, exercise_url: '', github_url: '', download_url: '', cover_url: '', favorite_count: 0, is_favorited: i < 3 || i === 5, created_at: formatOffsetDate(-10) + 'T10:00:00Z' }))
const DEMO_SEMINAR_BY_PAPER = Object.fromEntries(seminarPaperIds.map((arxivId, i) => [arxivId, seminarIds[i]]))
export const DEMO_LIBRARY_PAPERS = publications.map((p, i) => {
  const seminarId = DEMO_SEMINAR_BY_PAPER[p.id] ?? null
  return {
    ...DEMO_ARXIV_PAPERS[i], id: i + 1, authors: p.authors, from_recommendation: true,
    from_seminar: seminarId !== null, seminar_id: seminarId, metadata_status: 'ready', created_at: formatOffsetDate(-3 - i),
  }
})
export const DEMO_PENDING_IMPORTS = []
export const DEMO_TALKS = []
export const DEMO_EMAILS = ['文献分享使用说明', '组会摘要填写示例', '资料归档使用说明', '日历导出使用说明'].map((title, i) => ({
  uid: String(i + 1), id: i + 1, subject: `【演示】${title}`, sender_name: '虚构演示通知', sender_email: 'demo@example.invalid',
  date: formatOffsetDate(-i) + 'T08:00:00Z', snippet: '虚构示例邮件，不连接真实邮箱。', body_text: '虚构示例邮件，不连接真实邮箱。',
  body_html: '<p>虚构示例邮件，不连接真实邮箱。</p>', is_read: i > 0, has_attachments: false,
}))
export const DEMO_FEEDBACK_ITEMS = [
  { id: 1, title: '日历导出提醒建议（演示）', content: '希望能够设置提醒时间。', author: DEMO_MEMBERS[1].name, author_id: 2, page: '/seminars', resolved: true, created_at: formatOffsetDate(-3) + 'T10:00:00', replies: [] },
  { id: 2, title: '文献讨论使用建议（演示）', content: '希望在组会上讨论参考文献。', author: DEMO_MEMBERS[3].name, author_id: 4, page: '/arxiv', resolved: false, created_at: formatOffsetDate(-1) + 'T10:00:00', replies: [] },
]
export const DEMO_FAVORITES = [{ kind: 'paper', target: '2508.13276', saved_at: formatOffsetDate(-1), item: DEMO_ARXIV_PAPERS.find(p => p.arxiv_id === '2508.13276') }, ...[0, 1, 2, 5].map(i => ({ kind: 'book', target: String(i + 1), saved_at: formatOffsetDate(-1), item: DEMO_BOOKS[i] }))]
