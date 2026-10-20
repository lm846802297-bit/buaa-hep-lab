import { learningRevision, learningSources, reproductionChecklist } from '../content/learning'

export function searchLearning(items, query = '', category = 'all') {
  const terms = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return items.filter(item => (category === 'all' || item.category === category) && terms.every(term => JSON.stringify(item).toLocaleLowerCase().includes(term)))
}

export function sourceById(id) { return learningSources.find(source => source.id === id) }

export function topicMarkdown(topic) {
  if (!topic) return ''
  const lines = [`# ${topic.title}`, '', `版本：${learningRevision.version} · 核查日期：${learningRevision.checkedAt}`, `状态：${learningRevision.status} · 学术维护者：${learningRevision.maintainer}`, '', topic.summary, '', `前置知识：${topic.prerequisites}`, '', '## 学习目标', ...topic.goals.map(t => `- ${t}`)]
  for (const section of topic.sections) {
    lines.push('', `## ${section.title}`, '', ...section.paragraphs.flatMap(p => [p, '']))
    for (const formula of section.formulas || []) lines.push(formula.label, '', '$$', formula.latex, '$$', '')
    if (section.code) lines.push('```wolfram', section.code, '```', '')
    lines.push('本节来源：', ...section.sources.map(id => { const s = sourceById(id); return `- [${s.name}](${s.url}) — ${s.use}` }))
  }
  lines.push('', '## 假设、近似与适用范围', ...topic.assumptions.map(t => `- ${t}`), '', '## 自查练习', topic.exercise, '', '## 复现记录', ...reproductionChecklist.map(t => `- [ ] ${t}`), '', '学习初稿不代表课题组的新研究结论。来源核对、学术审核与独立复现分别记录。')
  return lines.join('\n') + '\n'
}

export function reproductionTemplate() {
  return '# 研究计算复现记录\n\n状态：草稿（不得默认标记已验证）\n维护者：待填写\n版本与核查日期：待填写\n\n' + reproductionChecklist.map(t => `## ${t}\n\n待填写。\n`).join('\n')
}

export function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = filename
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
