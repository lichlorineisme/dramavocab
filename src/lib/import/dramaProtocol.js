export const DRAMA_PROTOCOL_VERSION = '3.0.0'

const FALLBACK_COVERS = [
  'linear-gradient(145deg, #A855F7, #FB7185)',
  'linear-gradient(145deg, #FB7185, #F59E0B)',
  'linear-gradient(145deg, #22C55E, #14B8A6)',
  'linear-gradient(145deg, #60A5FA, #A855F7)',
]

const DIFFICULTY_SET = new Set(['beginner', 'intermediate', 'advanced'])
const POS_PREFIX_RE = /^(adj|adv|n|v|vt|vi|aux|art|phr|prep|pron|conj|num)\.?\s*[·、:：]?\s*/i

function cleanText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim()
}

function compactSpaces(value) {
  return cleanText(value).replace(/\s+/g, ' ')
}

function inferShortTitle(title) {
  const cleaned = cleanText(title)
  return cleaned.replace(/^第\s*[0-9一二三四五六七八九十百零]+\s*[章节回]\s*/, '').trim() || cleaned
}

function pickCover(id = '') {
  const chars = String(id)
  let total = 0
  for (const char of chars) total += char.charCodeAt(0)
  return FALLBACK_COVERS[total % FALLBACK_COVERS.length]
}

function ensureDifficulty(value) {
  return DIFFICULTY_SET.has(value) ? value : 'intermediate'
}

function sanitizeParagraph(paragraph) {
  const raw = compactSpaces(paragraph?.raw || paragraph)
  if (!raw) return null
  return { raw }
}

function sanitizeVocabEntry(entry, fallbackIndex = 0) {
  const word = compactSpaces(entry?.word || entry?.surface || '')
  if (!word) return null

  return {
    word,
    phonetic: cleanText(entry?.phonetic),
    meaning: cleanText(entry?.meaning || entry?.gloss),
    example: compactSpaces(entry?.example || entry?.context || ''),
    difficulty: ensureDifficulty(entry?.difficulty),
    pos: cleanText(entry?.pos),
    lexicon: Array.isArray(entry?.lexicon)
      ? entry.lexicon.filter(Boolean).map(String)
      : entry?.lexicon ? [String(entry.lexicon)] : [],
    source: cleanText(entry?.source) || 'import',
    sortIndex: Number.isFinite(entry?.sortIndex) ? Number(entry.sortIndex) : fallbackIndex,
  }
}

function dedupeVocab(entries) {
  const vocabMap = new Map()

  entries.forEach((entry, index) => {
    const normalized = sanitizeVocabEntry(entry, index)
    if (!normalized) return

    const key = normalized.word.toLowerCase()
    if (!vocabMap.has(key)) {
      vocabMap.set(key, normalized)
      return
    }

    const current = vocabMap.get(key)
    if (!current.meaning && normalized.meaning) current.meaning = normalized.meaning
    if (!current.phonetic && normalized.phonetic) current.phonetic = normalized.phonetic
    if (!current.example && normalized.example) current.example = normalized.example
    if (!current.pos && normalized.pos) current.pos = normalized.pos
    current.lexicon = [...new Set([...current.lexicon, ...normalized.lexicon])]
  })

  return [...vocabMap.values()].sort((a, b) => a.sortIndex - b.sortIndex)
}

export function splitMeaningMeta(rawMeaning) {
  const text = compactSpaces(rawMeaning)
  if (!text) return { pos: '', meaning: '' }

  const posMatch = text.match(POS_PREFIX_RE)
  if (!posMatch) return { pos: '', meaning: text }

  const pos = posMatch[1].toLowerCase() + '.'
  const meaning = text.replace(POS_PREFIX_RE, '').trim()
  return { pos, meaning: meaning || text }
}

export function createChapterRecord({
  id,
  title,
  shortTitle,
  paragraphs = [],
  vocabList = [],
}) {
  const normalizedTitle = cleanText(title) || `第${String(id || '1').padStart(2, '0')}章`
  const normalizedParagraphs = paragraphs
    .map(sanitizeParagraph)
    .filter(Boolean)

  return {
    id: String(id || '1'),
    title: normalizedTitle,
    shortTitle: cleanText(shortTitle) || inferShortTitle(normalizedTitle),
    paragraphs: normalizedParagraphs,
    vocabList: dedupeVocab(vocabList),
  }
}

export function createBookRecord({
  id,
  title,
  subtitle = '',
  author = '匿名作者',
  emoji = '📘',
  description = '',
  coverColor,
  status = 'published',
  sourceType = 'imported',
  schemaVersion = DRAMA_PROTOCOL_VERSION,
  importMeta = {},
  chapters = [],
}) {
  const normalizedTitle = cleanText(title) || '未命名书籍'
  const normalizedId = String(id || `import-${Date.now()}`)
  const normalizedChapters = chapters.map((chapter, index) =>
    createChapterRecord({
      id: chapter?.id || String(index + 1),
      title: chapter?.title,
      shortTitle: chapter?.shortTitle,
      paragraphs: chapter?.paragraphs,
      vocabList: chapter?.vocabList,
    })
  )

  return {
    id: normalizedId,
    title: normalizedTitle,
    subtitle: cleanText(subtitle),
    author: cleanText(author) || '匿名作者',
    emoji: cleanText(emoji) || '📘',
    description: cleanText(description),
    coverColor: cleanText(coverColor) || pickCover(normalizedId),
    status: cleanText(status) || 'published',
    sourceType,
    schemaVersion,
    importMeta: {
      createdAt: importMeta.createdAt || new Date().toISOString(),
      parser: cleanText(importMeta.parser) || 'manual',
      selectedLexicons: Array.isArray(importMeta.selectedLexicons)
        ? importMeta.selectedLexicons
        : [],
      notes: cleanText(importMeta.notes),
      ...importMeta,
    },
    totalWords: normalizedChapters.reduce((sum, chapter) => sum + chapter.vocabList.length, 0),
    chapters: normalizedChapters,
  }
}

export function normalizeImportedBook(book) {
  if (!book || typeof book !== 'object') return null
  return createBookRecord({
    ...book,
    sourceType: cleanText(book.sourceType) || 'imported',
    chapters: Array.isArray(book.chapters) ? book.chapters : [],
  })
}

export function summarizeBook(book) {
  const normalized = normalizeImportedBook(book)
  if (!normalized) {
    return {
      chapterCount: 0,
      paragraphCount: 0,
      vocabCount: 0,
      lexiconCount: 0,
    }
  }

  const lexiconSet = new Set()
  let paragraphCount = 0

  normalized.chapters.forEach((chapter) => {
    paragraphCount += chapter.paragraphs.length
    chapter.vocabList.forEach((item) => item.lexicon.forEach((lexicon) => lexiconSet.add(lexicon)))
  })

  return {
    chapterCount: normalized.chapters.length,
    paragraphCount,
    vocabCount: normalized.totalWords,
    lexiconCount: lexiconSet.size,
  }
}
