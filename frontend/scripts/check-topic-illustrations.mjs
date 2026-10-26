import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(scriptsDir, '..')
const projectRoot = resolve(frontendRoot, '..')
const termsPath = resolve(scriptsDir, 'topic-illustration-terms.json')
const terms = JSON.parse(readFileSync(termsPath, 'utf8'))
const topicView = readFileSync(resolve(frontendRoot, 'src/views/ResearchTopicView.vue'), 'utf8')
const assetDir = resolve(frontendRoot, 'public/images/research-topics')

assert.equal(terms.version, 2, 'Update the validator when the terminology schema changes.')
assert.equal(terms.topics.length, 5, 'Exactly five research-topic illustrations are expected.')
assert.deepEqual(
  terms.topics.map(topic => topic.id).sort(),
  ['collider', 'dark', 'neutrino', 'phase', 'precision'],
  'The terminology whitelist must cover each of the five research topics.',
)

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeXmlText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

const svgPaths = []
for (const topic of terms.topics) {
  const svgPath = resolve(assetDir, topic.file)
  svgPaths.push(svgPath)
  const svg = readFileSync(svgPath, 'utf8')

  assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'), `${topic.file}: SVG namespace is missing.`)
  assert.ok(svg.includes(`<title id="title">${topic.title}</title>`), `${topic.file}: title differs from the reviewed whitelist.`)
  assert.ok(svg.includes(`<desc id="desc">${topic.description}</desc>`), `${topic.file}: description differs from the reviewed whitelist.`)
  assert.ok(svg.includes('role="img" aria-labelledby="title desc"'), `${topic.file}: accessible title/description references are missing.`)
  assert.ok(svg.includes('@media (max-width: 600px) { text { display: none; } }'), `${topic.file}: mobile artwork must suppress tiny embedded labels; readable labels are provided in the page layout.`)

  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(new Set(ids).size, ids.length, `${topic.file}: SVG IDs must be unique.`)
  const idSet = new Set(ids)
  for (const match of svg.matchAll(/\baria-labelledby="([^"]+)"/g)) {
    for (const reference of match[1].split(/\s+/)) {
      assert.ok(idSet.has(reference), `${topic.file}: aria-labelledby references missing ID "${reference}".`)
    }
  }

  const visibleText = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map(match => decodeXmlText(match[1].replace(/<[^>]+>/g, '').trim()))
  assert.deepEqual(
    [...visibleText].sort(),
    [...topic.visibleText].sort(),
    `${topic.file}: visible SVG text must match the manually reviewed whitelist exactly (independent of paint order).`,
  )
  // The desktop hero uses object-fit: cover in a wide frame. Keep every text baseline
  // within the conservative visible vertical band so labels cannot be cropped away.
  const textBaselines = [...svg.matchAll(/<text\b([^>]*)>/g)].map(match => {
    const y = match[1].match(/\by="([0-9.]+)"/)
    assert.ok(y, `${topic.file}: every visible text element must have an explicit y coordinate.`)
    return Number(y[1])
  })
  for (const y of textBaselines) {
    assert.ok(y >= 80 && y <= 320, `${topic.file}: text baseline y=${y} is outside the responsive crop-safe band (80–320).`)
  }

  for (const snippet of topic.requiredMarkup) {
    assert.ok(svg.includes(snippet), `${topic.file}: required typographic markup is missing: ${snippet}`)
  }

  const mapping = new RegExp(
    `${topic.id}:\\s*\\{\\s*src:\\s*'${escapeRegExp(`/images/research-topics/${topic.file}`)}',\\s*alt:\\s*'${escapeRegExp(topic.alt)}'[^}]*\\}`,
  )
  assert.ok(mapping.test(topicView), `${topic.id}: page image path or alt text differs from the reviewed whitelist.`)

  assert.ok(Array.isArray(topic.mobileLabels), `${topic.id}: reviewed mobile label whitelist is missing.`)
  assert.ok(Array.isArray(topic.approvedTerms) && topic.approvedTerms.length > 0, `${topic.id}: approved terminology whitelist is missing.`)
  const labelMapping = new RegExp(
    `${topic.id}:\\s*\\{[^\\n]*?labels:\\s*\\[([^\\]]*)\\]`,
  )
  const labelMatch = topicView.match(labelMapping)
  assert.ok(labelMatch, `${topic.id}: mobile-visible labels could not be extracted from ResearchTopicView.vue.`)
  const mobileLabels = [...labelMatch[1].matchAll(/'([^']*)'/g)]
    .map(match => match[1])
  assert.deepEqual(
    mobileLabels,
    topic.mobileLabels,
    `${topic.id}: rendered mobile illustration labels must match the reviewed manifest exactly and in order.`,
  )
  const normalizeTerm = term => term.normalize('NFKC').toLocaleLowerCase('en-US')
  const approvedTerms = new Set(topic.approvedTerms.map(normalizeTerm))
  for (const label of mobileLabels) {
    assert.ok(
      approvedTerms.has(normalizeTerm(label)),
      `${topic.id}: mobile label "${label}" is absent from approvedTerms.`,
    )
  }
}

// Use a real XML parser rather than relying on browser error recovery for malformed SVG.
const parserCode = 'import sys, xml.etree.ElementTree as ET; [ET.parse(path) for path in sys.argv[1:]]'
const pythonCommands = process.platform === 'win32'
  ? [
      { command: 'py', prefix: ['-3'] },
      { command: 'python', prefix: [] },
    ]
  : [
      { command: 'python3', prefix: [] },
      { command: 'python', prefix: [] },
    ]
let parsed = false
for (const candidate of pythonCommands) {
  const result = spawnSync(candidate.command, [...candidate.prefix, '-c', parserCode, ...svgPaths], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  if (result.error?.code === 'ENOENT') continue
  if (result.error) throw result.error
  assert.equal(result.status, 0, `SVG XML parsing failed:\n${result.stderr || result.stdout}`)
  parsed = true
  break
}
assert.ok(parsed, 'Python 3 is required for strict XML parsing of the SVG assets.')

console.log(`Validated ${terms.topics.length} research-topic SVGs: XML well-formedness, accessible metadata, exact desktop text and mobile-label whitelists, approved terminology, subscript markup, and page alt text.`)
