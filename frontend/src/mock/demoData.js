import { lab, publications } from '../content/lab'

// Fictional sandbox people and schedules; no actual private group data.
export const DEMO_BASE_DATE_STR = '2026-09-10'
function formatOffsetDate(offset = 0) {
  const d = new Date(`${DEMO_BASE_DATE_STR}T12:00:00+08:00`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}
export const DEMO_MEMBERS = [
  { id: 1, name: '李华（演示管理员）', real_name: '李华', email: 'admin@example.invalid', role: 'admin', identity: 'teacher', bio: '虚构账号，仅用于展示管理功能。', can_manage_seminars: true, is_tutorial_completed: true, tutorial_completed: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 2, name: '陈晨（演示组员）', real_name: '陈晨', email: 'member@example.invalid', role: 'member', identity: 'student', bio: '虚构账号，粒子物理文献研读示例。', can_manage_seminars: true, is_tutorial_completed: true, tutorial_completed: true, created_at: '2026-03-01T09:00:00Z' },
  { id: 3, name: '示例研究员', real_name: '示例研究员', email: 'researcher@example.invalid', role: 'member', identity: 'postdoc', bio: '虚构研究员账号。', can_manage_seminars: true, is_tutorial_completed: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 4, name: '示例学生', real_name: '示例学生', email: 'student@example.invalid', role: 'member', identity: 'student', bio: '虚构学生账号。', can_manage_seminars: false, is_tutorial_completed: true, created_at: '2026-05-20T14:30:00Z' },
]
export const DEMO_SITE_CONFIG = {
  initialized: true, user_count: 4, lab_name: `${lab.name}（演示）`, lab_short_name: lab.shortName,
  site_slogan: '高能粒子物理唯象学 · 科研协作', site_title: lab.name, institution: lab.institution,
  default_location: '待确认（演示地点）', invite_code_enabled: true, public_feed_enabled: true, version: 'buaa-hep-demo-1',
}
const seminarTopics = ['暗物质模型与长寿命粒子信号', '类轴子与未来对撞机探测', '中微子非标准相互作用研读', '轻子门户暗物质文献讨论', '标准模型之外的新物理概览']
export const DEMO_SEMINARS = [2, 9, 16, -5, -12].map((offset, i) => ({
  id: [101, 102, 103, 100, 99][i], date: formatOffsetDate(offset), time: '14:30', location: '待确认（虚构演示排期）',
  presenter_id: [2, 3, 1, 1, 4][i], presenter_name: DEMO_MEMBERS[[1, 2, 0, 0, 3][i]].name,
  topic: `${seminarTopics[i]}（演示）`, abstract: '用于体验排期与摘要填报的虚构安排，不代表课题组真实活动。',
  slides_url: '', status: offset > 0 ? 'upcoming' : 'completed', created_at: formatOffsetDate(-14) + 'T10:00:00Z',
  presentations: i < 3 ? [{ id: 201 + i, seminar_id: 101 + i, position: 0, presenter_id: 2, presenter_name: DEMO_MEMBERS[1].name, arxiv_id: publications[i].id, slides_url: '' }] : [],
}))
export const DEMO_ARXIV_PAPERS = publications.map((p, i) => ({
  id: 301 + i, arxiv_id: p.id, title: p.title, authors: p.authors.join(', '), journal: p.journal, primary_category: 'hep-ph',
  published_date: p.published, source_url: `https://arxiv.org/abs/${p.id}`, pdf_url: `https://arxiv.org/pdf/${p.id}`,
  abstract: p.summary, recommender: DEMO_MEMBERS[i % 2], recommended_by: DEMO_MEMBERS[i % 2].name,
  recommended_at: formatOffsetDate(-2 - i), notes: '演示推荐记录。论文为已核对的公开文献，推荐人与互动为虚构。',
  likes_count: 0, user_liked: false, is_liked_by_me: false, read: false, is_read_by_me: false, comments: [],
}))
export const DEMO_NOTICES = [{ id: 1, title: '欢迎体验粒子物理科研工作台', content: '组员、组会和交流记录均为演示。真实部署请使用管理员初始化向导。', is_pinned: true, created_by: DEMO_MEMBERS[0].name, created_at: formatOffsetDate(-1), priority: 'normal' }]
export const DEMO_RESOURCES_CATEGORIES = [{ id: 1, name: '教材', is_default: true }, { id: 2, name: '工具', is_default: true }, { id: 3, name: '网站', is_default: true }]
export const DEMO_BOOKS = [
  { title: 'PDG · Review of Particle Physics', authors: 'Particle Data Group', category: '教材', description: '粒子物理数据与专题综述入口。', url: 'https://pdg.lbl.gov/' },
  { title: 'CERN Document Server', authors: 'CERN', category: '教材', description: '高能物理公开文献与教学资料入口。', url: 'https://cds.cern.ch/' },
  { title: 'arXiv · hep-ph', authors: 'arXiv', category: '网站', description: '高能粒子物理唯象学预印本入口。', url: 'https://arxiv.org/list/hep-ph/recent' },
  { title: 'INSPIRE HEP', authors: 'INSPIRE', category: '工具', description: '高能物理文献检索与引文入口。', url: 'https://inspirehep.net/' },
].map((book, i) => ({ ...book, id: i + 1, original_title: book.title, tutorial_url: book.url, exercise_url: '', github_url: '', download_url: '', cover_url: '', favorite_count: 0, is_favorited: i < 2, created_at: formatOffsetDate(-10) + 'T10:00:00Z' }))
export const DEMO_LIBRARY_PAPERS = publications.map((p, i) => ({
  ...DEMO_ARXIV_PAPERS[i], id: i + 1, authors: p.authors, from_recommendation: true, from_seminar: i === 0, seminar_id: i === 0 ? 101 : null, metadata_status: 'ready', created_at: formatOffsetDate(-3 - i),
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
export const DEMO_FAVORITES = [{ kind: 'paper', target: publications[0].id, saved_at: formatOffsetDate(-1), item: DEMO_ARXIV_PAPERS[0] }, ...[0, 1, 3].map(i => ({ kind: 'book', target: String(i + 1), saved_at: formatOffsetDate(-1), item: DEMO_BOOKS[i] }))]
