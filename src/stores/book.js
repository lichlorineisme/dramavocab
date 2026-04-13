/**
 * 书籍数据 Store — 新版数据源
 * 
 * 📖 数据来源: novel-data.js（纯文本 raw + 独立词汇表）
 * 🔄 桥接转换: novel-data.js 格式 → 前端期望的 paragraphs/vocabList 格式
 * 
 * 三本书全部从 novel-data.js 加载，保持数据单一来源
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { normalizeImportedBook } from '@/lib/import/dramaProtocol.js'

// ===== 导入结构化小说数据 =====
import { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2 } from './novel-data.js'
import book1CoverImage from '@/assets/covers/book1-contract-addicted.png'
import book2CoverImage from '@/assets/covers/book2-npc-counterattack.png'

const IMPORTED_BOOKS_STORAGE_KEY = 'dramavocab_v3_imported_books'

/**
 * 将 novel-data.js 的章节格式转换为前端 ReaderContent 期望的格式
 * 
 * novel-data 格式: { id, title, stitle, para:[{raw}], vl:[{word,phonetic,meaning,...}] }
 * 前端期望格式:   { id, title, shortTitle, paragraphs:[{raw}], vocabList:[...] }
 */
function transformChapter(ch) {
  return {
    id: ch.id,
    title: ch.title,
    shortTitle: ch.stitle || ch.shortTitle || ch.title,
    // para → paragraphs（保持原始纯文本，不做任何 HTML 预处理）
    paragraphs: (ch.para || []).map(p => ({
      raw: p.raw            // 纯文本，英文单词自然融入
    })),
    // vl → vocabList（标准化字段）
    vocabList: (ch.vl || []).map(v => ({
      word: v.word,
      phonetic: v.phonetic || '',
      meaning: v.meaning || '',
      example: v.ex || '',
      difficulty: v.diff === 1 ? 'beginner' : v.diff === 3 ? 'advanced' : 'intermediate',
    }))
  }
}

// ===== Book 1: 《契约成瘾》 =====
const BOOK_DATA = {
  id: '1',
  title: '契约成瘾：傅总他蓄谋已久',
  subtitle: '两千万买三年，他却蓄谋了十年',
  author: '布吉岛',
  emoji: '🌙',
  description: `我叫林晚，25岁，自由同声传译员。父亲入狱三年，我欠了一屁股债。暴雨夜，傅氏集团董事长傅司宴开价两千万——娶我三年。我以为这是一场公平交易。直到后来我才知道，他调查我不止三天，而是整整十年。`,
  coverColor: 'linear-gradient(145deg, #7C3AED, #E11D48)',
  coverImage: book1CoverImage,
  status: 'published',
  sourceType: 'builtin',
  totalWords: (NOVEL_DATA_BOOK1 || []).reduce((sum, ch) => sum + (ch.vl || []).length, 0),
  chapters: (NOVEL_DATA_BOOK1 || []).map(transformChapter),
}

// ===== Book 2: 《NPC逆袭》=====
const BOOK2_DATA = {
  id: '2',
  title: 'NPC逆袭：我在霸总世界刷存在感',
  subtitle: '穿成路人甲？不，我要当女主！',
  author: '布吉岛',
  emoji: '🎮',
  description: '穿越到霸总文里成了连名字都没有的路人甲NPC？没关系，我有系统，我要逆袭！',
  coverColor: 'linear-gradient(145deg, #059669, #10B981)',
  coverImage: book2CoverImage,
  status: 'published',
  sourceType: 'builtin',
  totalWords: (NOVEL_DATA_BOOK2 || []).reduce((sum, ch) => sum + (ch.vl || []).length, 0),
  chapters: (NOVEL_DATA_BOOK2 || []).map(transformChapter),
}

const BOOK3_DATA = {
  id: '3',
  title: '寒光破晓：女王归来',
  subtitle: '曾经的我你爱理不理，现在的我你高攀不起',
  author: '布吉岛',
  emoji: '❄️',
  description: '三年前被家族抛弃的女孩，如今带着千亿商业帝国归来。这一次，她要让所有人仰望。',
  coverColor: 'linear-gradient(145deg, #0EA5E9, #6366F1)',
  status: 'coming_soon',
  sourceType: 'builtin',
  totalWords: 0,
  chapters: [],
}

function loadImportedBooks() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(IMPORTED_BOOKS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeImportedBook)
      .filter(Boolean)
  } catch {
    return []
  }
}

function persistImportedBooks(importedBooks) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(IMPORTED_BOOKS_STORAGE_KEY, JSON.stringify(importedBooks))
  } catch {}
}

export const useBookStore = defineStore('books', () => {
  const builtinBooks = ref([BOOK_DATA, BOOK2_DATA, BOOK3_DATA])
  const importedBooks = ref(loadImportedBooks())
  const currentBook = ref(null)
  const currentChapter = ref(null)
  const chapters = ref([])
  const isLoading = ref(false)

  const books = computed(() => [...builtinBooks.value, ...importedBooks.value])
  const publishedBooks = computed(() => books.value.filter(b => b.status === 'published'))
  const builtinPublishedBooks = computed(() => builtinBooks.value.filter(b => b.status === 'published'))
  const importedPublishedBooks = computed(() => importedBooks.value.filter(b => b.status === 'published'))
  const totalBooks = computed(() => publishedBooks.value.length)
  const currentBookTotalVocab = computed(() => currentBook.value?.totalWords || 0)

  function setBooks(data) { builtinBooks.value = data }
  function setCurrentBook(book) { currentBook.value = book }
  function setCurrentChapter(ch) { currentChapter.value = ch }
  function setChapters(data) { chapters.value = data }

  function addImportedBook(book) {
    const normalized = normalizeImportedBook(book)
    if (!normalized) return null

    importedBooks.value = [
      normalized,
      ...importedBooks.value.filter(item => item.id !== normalized.id),
    ]
    persistImportedBooks(importedBooks.value)
    return normalized
  }

  function removeImportedBook(bookId) {
    importedBooks.value = importedBooks.value.filter(book => String(book.id) !== String(bookId))
    persistImportedBooks(importedBooks.value)
  }

  function getBookById(bookId) {
    return books.value.find(book => String(book.id) === String(bookId)) || null
  }

  return {
    builtinBooks, importedBooks,
    books, currentBook, currentChapter, chapters, isLoading,
    publishedBooks, builtinPublishedBooks, importedPublishedBooks, totalBooks, currentBookTotalVocab,
    setBooks, setCurrentBook, setCurrentChapter, setChapters,
    addImportedBook, removeImportedBook, getBookById,
  }
})
