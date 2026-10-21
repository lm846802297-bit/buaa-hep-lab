export function filterPublications(papers, { category = 'all', query = '', year = 'all', sort = 'newest' } = {}) {
  const term = query.trim().toLowerCase()
  return papers.filter(paper =>
    (category === 'all' || (paper.categories || [paper.category]).includes(category)) &&
    (year === 'all' || String(paper.year) === String(year)) &&
    [paper.title, ...paper.authors, paper.id, paper.year, paper.journal, paper.doi, ...(paper.tags || [])].join(' ').toLowerCase().includes(term)
  ).sort((a, b) => (sort === 'oldest' ? 1 : -1) * (Number(a.year) - Number(b.year) || a.published.localeCompare(b.published)))
}

export function citationText(paper) {
  return `${paper.authors.join(', ')}. ${paper.title}. ${paper.journal || `arXiv:${paper.id} (预印本)`}${paper.doi ? `. https://doi.org/${paper.doi}` : ''}.`
}

export function publicationBibtex(papers) {
  return papers.map(paper => {
    const fields = {
      title: paper.citation_title || paper.title,
      author: paper.authors.join(' and '),
      year: paper.year,
      ...(paper.journal ? { journal: paper.journal } : {}),
      eprint: paper.id,
      archivePrefix: 'arXiv',
      ...(paper.primary_class ? { primaryClass: paper.primary_class } : {}),
      ...(paper.doi ? { doi: paper.doi } : {}),
      url: paper.source_url,
      ...(paper.status === 'preprint' ? { note: 'Preprint' } : {}),
    }
    return `@${paper.status === 'preprint' ? 'misc' : 'article'}{arXiv${paper.id.replace('.', '')},\n${Object.entries(fields).map(([key, value]) => `  ${key} = {${value}}`).join(',\n')}\n}`
  }).join('\n\n')
}
