import { describe, expect, it } from 'vitest'
import { filterPublications, publicationBibtex, citationText } from './publications'
import { publications, publicationCategories, directions } from '../content/lab'

describe('approved public bibliography', () => {
  it('publishes exactly the group-approved 16 papers, 6 categories and 5 directions', () => {
    expect(publications).toHaveLength(16)
    expect(publicationCategories).toHaveLength(6)
    expect(directions).toHaveLength(5)
    expect(publications.filter(p => p.status === 'published')).toHaveLength(13)
    expect(publications.filter(p => p.status === 'preprint')).toHaveLength(3)
    for (const paper of publications) {
      expect(paper.source_url).toBe(`https://arxiv.org/abs/${paper.id}`)
      expect(paper.last_verified_at).toBe('2026-10-20')
      expect(paper.inspire_url).toMatch(/^https:\/\/inspirehep.net\/literature\/\d+$/)
      expect(paper.authors).toContain('Xiao-Ping Wang')
      expect(paper.categories).toContain(paper.category)
      expect(paper.categories.every(id => publicationCategories.some(c => c.id === id))).toBe(true)
      if (paper.status === 'published') { expect(paper.doi).toMatch(/^10\./); expect(paper.journal).toBeTruthy() }
      else { expect(paper.journal).toBe(''); expect(paper.doi).toBe('') }
    }
  })
  it('searches identifiers, authors, DOI, journal and topics', () => {
    for (const term of ['2506.10673', '10.1103/3m4t-pk9b', 'Tengyu Ai']) expect(filterPublications(publications, { query: term }).some(p => p.id === '2506.10673')).toBe(true)
    expect(filterPublications(publications, { query: 'JHEP' }).length).toBeGreaterThan(0)
    expect(filterPublications(publications, { query: '散射纠缠熵' })[0].id).toBe('2505.06001')
  })
  it('supports multiple topics, year filtering, ordering and empty results', () => {
    expect(filterPublications(publications, { category: 'llp' }).some(p => p.id === '2508.13276')).toBe(true)
    expect(filterPublications(publications, { year: '2026' }).every(p => p.year === '2026')).toBe(true)
    expect(filterPublications(publications, { sort: 'oldest' })[0].year).toBe('2021')
    expect(filterPublications(publications, { query: 'does-not-exist' })).toEqual([])
  })
  it('exports journal papers and preprints without inventing publication data', () => {
    const preprint = publications.find(p => p.status === 'preprint')
    const text = publicationBibtex([preprint])
    expect(text).toContain('@misc{')
    expect(text).toContain('Preprint')
    expect(text).not.toContain('journal =')
    expect(text).not.toContain('doi =')
    expect(publicationBibtex(publications.filter(p => p.status === 'published'))).toContain('doi = {10.')
    expect(citationText(preprint)).toContain('预印本')
  })
})
