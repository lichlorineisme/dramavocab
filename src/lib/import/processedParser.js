import { createBookRecord, createChapterRecord, splitMeaningMeta } from './dramaProtocol.js'

const CHAPTER_LINE_RE = /^(?:#{1,6}\s*)?(第\s*[0-9一二三四五六七八九十百零]+\s*[章节回][^\n]*)$/i
const INLINE_WORD_RE = /([A-Za-z][A-Za-z'/-]*(?:\s+[A-Za-z][A-Za-z'/-]*){0,3})\s*[（(]([^（）()]{1,48})[)）]/g

function compactSpaces(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function splitRawChapters(rawText) {
  const text = String(rawText || '').replace(/\r\n?/g, '\n').trim()
  if (!text) return []

  const lines = text.split('\n')
  const chapters = []
  let current = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const heading = line.match(CHAPTER_LINE_RE)

    if (heading) {
      if (current) chapters.push(current)
      current = { title: heading[1].trim(), lines: [] }
      continue
    }

    if (!current) {
      current = { title: '第01章 导入章节', lines: [] }
    }

    current.lines.push(rawLine)
  }

  if (current) chapters.push(current)

  return chapters.map((chapter, index) => ({
    id: String(index + 1),
    title: chapter.title || `第${String(index + 1).padStart(2, '0')}章`,
    body: chapter.lines.join('\n').trim(),
  }))
}

function normalizeWordSurface(rawWord) {
  return compactSpaces(rawWord).replace(/\s+/g, ' ')
}

function parseParagraph(block, vocabMap, chapterIndex) {
  const collected = []
  const raw = compactSpaces(
    String(block || '').replace(INLINE_WORD_RE, (_, rawWord, rawMeaning) => {
      const word = normalizeWordSurface(rawWord)
      const { pos, meaning } = splitMeaningMeta(rawMeaning)
      const key = word.toLowerCase()

      if (!vocabMap.has(key)) {
        vocabMap.set(key, {
          word,
          meaning,
          pos,
          difficulty: 'intermediate',
          source: 'processed-text',
          sortIndex: vocabMap.size + chapterIndex * 1000,
        })
      }

      collected.push(word)
      return word
    })
  )

  if (!raw) return null

  collected.forEach((word) => {
    const key = word.toLowerCase()
    const current = vocabMap.get(key)
    if (current && !current.example) {
      current.example = raw
    }
  })

  return { raw }
}

export function parseProcessedNovel({
  title,
  author,
  description,
  emoji,
  sourceText,
}) {
  const chapters = splitRawChapters(sourceText)
  if (!title || !compactSpaces(title)) {
    throw new Error('请先填写书名')
  }
  if (!chapters.length) {
    throw new Error('请先粘贴带有正文的已加工文本')
  }

  const normalizedChapters = chapters.map((chapter, index) => {
    const vocabMap = new Map()
    const paragraphs = chapter.body
      .split(/\n\s*\n/g)
      .map((block) => parseParagraph(block, vocabMap, index + 1))
      .filter(Boolean)

    return createChapterRecord({
      id: chapter.id,
      title: chapter.title,
      paragraphs,
      vocabList: [...vocabMap.values()],
    })
  })

  return createBookRecord({
    id: `import-${Date.now()}`,
    title,
    author,
    description,
    emoji,
    sourceType: 'processed-text',
    importMeta: {
      parser: 'processed-regex-v1',
      notes: '从 word(释义) 结构中自动抽取词汇',
    },
    chapters: normalizedChapters,
  })
}
