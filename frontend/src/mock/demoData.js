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
  { id: 2, name: '陈晨（演示组员）', real_name: '陈晨', email: 'member@example.invalid', role: 'member', identity: 'student', bio: '虚构账号：非弹性暗物质与长寿命粒子。', can_manage_seminars: true, is_tutorial_completed: true, tutorial_completed: true, created_at: '2026-03-01T09:00:00Z' },
  { id: 3, name: '示例研究员', real_name: '示例研究员', email: 'researcher@example.invalid', role: 'member', identity: 'postdoc', bio: '虚构账号：中微子新相互作用与电弱相变。', can_manage_seminars: true, is_tutorial_completed: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 4, name: '示例学生', real_name: '示例学生', email: 'student@example.invalid', role: 'member', identity: 'student', bio: '虚构账号：对撞机精密测量与暗物质唯象学。', can_manage_seminars: false, is_tutorial_completed: true, created_at: '2026-05-20T14:30:00Z' },
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
  '讨论热共湮灭、质量分裂、相变与长寿命粒子信号，区分基准点和完整参数空间。',
  '比较惰性中微子位移顶点与相变引力波；灵敏度预测不等于观测。',
  '讨论太阳中微子源的轻子第五力及其对缪子 g−2 昼夜信号的影响。',
  '比较量子 Fisher 信息界与可观测量实际可达精度。',
  '讨论长寿命惰性中微子搜索对质量、混合、寿命与探测器接受度的依赖。',
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
const DEMO_PAPER_IDS = ['2508.13276', '2509.23925', '2510.20672', '2506.10673', '2409.17243', '2603.17237', '2610.04971']
export const DEMO_PAPER_CATALOG = DEMO_PAPER_IDS
  .map(id => publications.find(paper => paper.id === id))
  .filter(Boolean)
export const DEMO_ARXIV_PAPERS = DEMO_PAPER_CATALOG.map((p, i) => ({
  id: 301 + i, arxiv_id: p.id, title: p.title, authors: p.authors.join(', '), journal: p.journal, primary_category: 'hep-ph',
  published_date: p.arxivSubmitted, source_url: `https://arxiv.org/abs/${p.id}`, pdf_url: `https://arxiv.org/pdf/${p.id}`,
  abstract: `演示用中文导读（非原文逐字摘要）：${p.summary}`, recommender: DEMO_MEMBERS[i % 2], recommended_by: DEMO_MEMBERS[i % 2].name,
  recommended_at: formatOffsetDate(-2 - i), notes: '演示推荐记录；摘要为课题组中文导读而非原文逐字摘要。论文来自公开文献，推荐人与互动为虚构。',
  likes_count: 0, user_liked: false, is_liked_by_me: false, read: false, is_read_by_me: false, comments: [],
}))
export const DEMO_NOTICES = [{ id: 1, title: '欢迎体验粒子物理科研工作台', content: '组员、组会和交流记录均为演示。真实部署请使用管理员初始化向导。', is_pinned: true, created_by: DEMO_MEMBERS[0].name, created_at: formatOffsetDate(-1), priority: 'normal' }]
export const DEMO_RESOURCES_CATEGORIES = [
  { id: 1, name: '教材', is_default: true }, { id: 2, name: '工具', is_default: true },
  { id: 3, name: '综述与数据', is_default: true },
]
export const DEMO_BOOKS = [
  { title: 'Modern Particle Physics', authors: 'Mark Thomson', category: '教材', description: '粒子物理教材：散射、衰变、标准模型与新物理。', url: 'https://www.cambridge.org/cc/titles/modern-particle-physics' },
  { title: 'Quantum Field Theory and the Standard Model', authors: 'Matthew D. Schwartz', category: '教材', description: '量子场论、规范理论、重整化与有效场论。', url: 'https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799' },
  { title: 'Review of Particle Physics (2026)', authors: 'Particle Data Group', category: '综述与数据', description: '粒子性质与实验限制；引用时记录版本和勘误。', url: 'https://pdg.lbl.gov/2026/' },
  { title: 'FeynCalc Documentation', authors: 'FeynCalc Collaboration', category: '工具', description: 'Mathematica 符号计算：Dirac/颜色代数、迹与圈图。', url: 'https://feyncalc.github.io/' },
  { title: 'FeynRules', authors: 'FeynRules Collaboration', category: '工具', description: '从拉格朗日量导出费曼规则并生成模型文件。', url: 'https://feynrules.irmp.ucl.ac.be/' },
].map((book, i) => ({ ...book, id: i + 1, original_title: book.title, tutorial_url: book.url, exercise_url: '', github_url: '', download_url: '', cover_url: '', favorite_count: 0, is_favorited: i < 3, created_at: formatOffsetDate(-10) + 'T10:00:00Z' }))
const DEMO_SEMINAR_BY_PAPER = Object.fromEntries(seminarPaperIds.map((arxivId, i) => [arxivId, seminarIds[i]]))
export const DEMO_LIBRARY_PAPERS = DEMO_PAPER_CATALOG.map((p, i) => ({
  ...DEMO_ARXIV_PAPERS[i], id: i + 1, authors: p.authors, from_recommendation: true,
  from_seminar: p.id in DEMO_SEMINAR_BY_PAPER, seminar_id: DEMO_SEMINAR_BY_PAPER[p.id] ?? null,
  metadata_status: 'ready', created_at: formatOffsetDate(-3 - i),
}))
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
