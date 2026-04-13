/**
 * 生词本状态管理
 * 管理用户收藏的单词、掌握状态、复习计划
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBookStore } from './book.js'

/** 从全局词汇表构建 lookup Map（用于补全生词本中缺失的 phonetic/meaning/example） */
let _vocabMapCache = null
let _vocabMapCacheKey = ''
function buildVocabLookupMap() {
  try {
    const bookStore = useBookStore()
    const cacheKey = bookStore.books.map(b => b.chapters?.length || 0).join(',')
    if (_vocabMapCache && _vocabMapCacheKey === cacheKey) return _vocabMapCache

    const map = new Map()
    for (const book of (bookStore.books || [])) {
      for (const ch of (book.chapters || [])) {
        for (const v of (ch.vocabList || [])) {
          if (v.word) map.set(v.word.toLowerCase(), v)
        }
      }
    }
    _vocabMapCache = map
    _vocabMapCacheKey = cacheKey
    return map
  } catch { return new Map() }
}

/** 记录学习活动到 localStorage */
function recordActivity() {
  try {
    const log = JSON.parse(localStorage.getItem('drama_activity_log') || '{}')
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    log[today] = (log[today] || 0) + 1
    localStorage.setItem('drama_activity_log', JSON.stringify(log))
  } catch {}
}

export const useVocabStore = defineStore('vocab', () => {
  // ===== State =====
  /** 用户收藏的全部单词列表 */
  const words = ref([])

  // ===== Computed =====
  const totalWords = computed(() => words.value.length)
  const masteredWords = computed(() =>
    words.value.filter(w => (w.masteryLevel ?? 0) >= 4).length
  )
  const learningWords = computed(() =>
    words.value.filter(w => {
      const l = w.masteryLevel ?? 0
      return l >= 2 && l <= 3
    }).length
  )

  /** 待学习词数（masteryLevel 0-1，无论是否到期都应该出现） */
  const pendingWords = computed(() =>
    words.value.filter(w => (w.masteryLevel ?? 0) <= 1).length
  )

  /** 今日待复习队列（待学习 + 到期的学习中词，自动补全缺失字段） */
  function getReviewQueue(maxCount = 10) {
    const today = new Date().toISOString().split('T')[0]
    try {
      // 从全局词汇表构建 lookup Map（用于自动补全缺失的 phonetic/meaning/example）
      const vocabMap = buildVocabLookupMap()

      const queue = words.value.filter(w => {
        if (!w || !w.word) return false
        // 规则A：待学习的词（masteryLevel <= 1）立即可复习
        if ((w.masteryLevel ?? 0) <= 1) return true
        // 规则B：今天新收录的词（addedAt是今天）立即可复习
        if (w.addedAt && w.addedAt.startsWith(today)) return true
        // 规则C：学习中且到期的词
        if ((w.masteryLevel ?? 0) >= 2 && (w.masteryLevel ?? 0) <= 3) {
          if (!w.nextReview) return true
          try { return new Date(w.nextReview) <= new Date() }
          catch { return true }
        }
        // 已掌握(masteryLevel >= 4)不主动推送
        return false
      })
      // 自动补全缺失字段（从全局词汇表查找 phonetic/meaning/example）
      const enriched = queue.map(w => {
        if (!w.meaning || !w.phonetic) {
          const src = vocabMap.get((w.word || '').toLowerCase())
          if (src) {
            return {
              ...w,
              phonetic: w.phonetic || src.phonetic || '',
              meaning: w.meaning || src.meaning || '',
              example: w.example || src.example || '',
            }
          }
        }
        return w
      })
      // 打乱顺序 + 截断
      const shuffled = [...enriched].sort(() => Math.random() - 0.5)
      return maxCount > 0 ? shuffled.slice(0, maxCount) : shuffled
    } catch (e) {
      console.error('[getReviewQueue] error', e)
      return []
    }
  }

  /** 获取单个单词（用于"只复习这个词"的场景） */
  function getWordByName(wordName) {
    if (!wordName) return null
    const lower = wordName.toLowerCase()
    return words.value.find(w => (w.word || '').toLowerCase() === lower) || null
  }

  /**
   * 查询单词是否已掌握（挑战模式用）
   * @param {string} word - 单词（不区分大小写）
   * @returns {boolean} true=已掌握(masteryLevel>=4), false=未掌握或不存在
   */
  function isWordMastered(word) {
    if (!word) return false
    const lower = word.toLowerCase()
    const w = words.value.find(item => (item.word || '').toLowerCase() === lower)
    if (!w) return false
    return (w.masteryLevel ?? 0) >= 4
  }

  /**
   * 获取某单词在某章节的挑战状态（从 localStorage 读取持久化记录）
   * 格式: drama_challenge_mastery_{bookId}_{chapterId} = { "word": true|false }
   * @param {string} bookId
   * @param {string} chapterId
   * @param {string} word
   * @returns {boolean|null} true=已答对, false=答错过, null=无记录
   */
  function getChapterMastery(bookId, chapterId, word) {
    if (!bookId || !chapterId || !word) return null
    try {
      const key = `drama_challenge_mastery_${bookId}_${chapterId}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      const result = data[word.toLowerCase()]
      return result === true ? true : result === false ? false : null
    } catch {
      return null
    }
  }

  /**
   * 设置某单词在某章节的挑战结果（持久化到 localStorage）
   * @param {string} bookId
   * @param {string} chapterId
   * @param {string} word
   * @param {boolean} isCorrect - true=答对(已掌握), false=答错(待复习)
   */
  function setChapterMastery(bookId, chapterId, word, isCorrect) {
    if (!bookId || !chapterId || !word) return
    try {
      const key = `drama_challenge_mastery_${bookId}_${chapterId}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data[word.toLowerCase()] = isCorrect
      localStorage.setItem(key, JSON.stringify(data))
    } catch {}
  }

  /**
   * 批量获取某章所有单词的掌握状态
   * @param {string} bookId
   * @param {string} chapterId
   * @param {string[]} wordList - 单词数组
   * @returns {Object.<string, boolean>} { lowercaseWord: true|false }
   */
  function getChapterMasteryMap(bookId, chapterId, wordList) {
    const map = {}
    if (!bookId || !chapterId || !wordList?.length) return map
    try {
      const key = `drama_challenge_mastery_${bookId}_${chapterId}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      for (const w of wordList) {
        const lower = (w || '').toLowerCase()
        if (lower && data[lower] === true) map[lower] = true
      }
    } catch {}
    return map
  }

  // ===== Actions =====

  /** 添加单词到生词本 */
  async function addWord(wordData) {
    if (!wordData || !wordData.word) return false

    const lower = (wordData.word || '').toLowerCase()
    const existingIndex = words.value.findIndex(w =>
      (w.word || '').toLowerCase() === lower
    )

    if (existingIndex >= 0) {
      // 已存在：只更新非空字段（不覆盖已有数据）
      const existing = words.value[existingIndex]
      if (!existing.phonetic && wordData.phonetic) existing.phonetic = wordData.phonetic
      if (!existing.meaning && wordData.meaning) existing.meaning = wordData.meaning
      if (!existing.example && wordData.example) existing.example = wordData.example
      saveToStorage()
      return false
    }

    const now = new Date().toISOString()
    const newWord = {
      ...wordData,
      addedAt: wordData.addedAt || now,
      reviewCount: wordData.reviewCount ?? 0,
      lastReviewed: wordData.lastReviewed ?? null,
      wrongCount: wordData.wrongCount ?? 0,
      masteryLevel: wordData.masteryLevel ?? 0,
      challengeResults: Array.isArray(wordData.challengeResults)
        ? [...wordData.challengeResults]
        : []
    }
    // 新词的 nextReview 设为"现在"（立即可复习），而不是明天
    if (!wordData.nextReview) {
      newWord.nextReview = now
    }

    words.value.push(newWord)
    saveToStorage()
    recordActivity() // 记录学习活动
    return true
  }

  /** 移除单词 */
  async function removeWord(wordToRemove) {
    const target = typeof wordToRemove === 'string' ? wordToRemove : wordToRemove?.word
    if (!target) return

    const lower = target.toLowerCase()
    const idx = words.value.findIndex(w =>
      (w.word || '').toLowerCase() === lower
    )
    if (idx >= 0) {
      words.value.splice(idx, 1)
      saveToStorage()
    }
  }

  /**
   * 记录挑战模式结果
   * @param {string} word - 单词（不区分大小写）
   * @param {boolean} remembered - true=答对, false=答错
   * @param {Object|null} vocabInfo - 从vocabList传入的完整数据{word, phonetic, meaning, example}
   */
  async function recordChallengeResult(word, remembered, vocabInfo = null) {
    const lower = (word || '').toLowerCase()
    const existing = words.value.find(w =>
      (w.word || '').toLowerCase() === lower
    )

    if (!existing) {
      // 新单词：优先用传入的完整数据，fallback到基础结构
      await addWord({
        word: lower,
        phonetic: vocabInfo?.phonetic || '',
        meaning: vocabInfo?.meaning || '',
        example: vocabInfo?.example || (vocabInfo?.ex || ''),
        difficulty: vocabInfo?.difficulty || 'intermediate',
        sourceBookId: vocabInfo?.sourceBookId,
        sourceChapterId: vocabInfo?.sourceChapterId,
        challengeResults: [{ remembered, timestamp: Date.now() }],
        reviewCount: 1,
        lastReviewed: new Date().toISOString(),
        wrongCount: remembered ? 0 : 1,
        masteryLevel: remembered ? 5 : 0,
        nextReview: remembered ? new Date(Date.now() + 86400000 * 365).toISOString()
                            : calculateNextReviewDate(1)
      })
      return true
    }

    // 更新已有单词：如果之前是占位符数据，用完整数据覆盖
    if (vocabInfo) {
      if (!existing.phonetic && vocabInfo.phonetic)
        existing.phonetic = vocabInfo.phonetic
      if (!existing.meaning || existing.meaning === '(挑战模式)')
        existing.meaning = vocabInfo.meaning || ''
      if (!existing.example && (vocabInfo.example || vocabInfo?.ex))
        existing.example = vocabInfo.example || vocabInfo.ex || ''
    }

    if (!existing.challengeResults) existing.challengeResults = []
    existing.challengeResults.push({ remembered, timestamp: Date.now() })
    existing.lastReviewed = new Date().toISOString()
    existing.reviewCount = (existing.reviewCount || 0) + 1

    if (remembered) {
      existing.masteryLevel = 5
      existing.wrongCount = 0
      existing.nextReview = new Date(Date.now() + 86400000 * 365).toISOString()
    } else {
      existing.wrongCount = (existing.wrongCount || 0) + 1
      existing.masteryLevel = Math.max((existing.masteryLevel || 3) - 1, 1)
      existing.nextReview = calculateNextReviewDate(existing.reviewCount || 1)
    }

    saveToStorage()
    recordActivity() // 记录学习活动
    return true
  }

  /** 更新复习后的掌握等级 */
  function updateWordReview(wordId, isCorrect) {
    const w = words.value.find(x => x.word === wordId)
    if (!w) return

    w.lastReviewed = new Date().toISOString()
    w.reviewCount = (w.reviewCount || 0) + 1

    if (isCorrect) {
      // 已掌握的不升级了（避免覆盖挑战模式设的5级）
      if ((w.masteryLevel ?? 0) < 5) {
        w.masteryLevel = Math.min((w.masteryLevel || 0) + 1, 5)
      }
    } else {
      w.wrongCount = (w.wrongCount || 0) + 1
      w.masteryLevel = Math.max((w.masteryLevel || 3) - 1, 1)
    }

    w.nextReview = calculateNextReviewDate(w.reviewCount || 1)
    saveToStorage()
  }

  /** 计算下次复习时间（间隔重复算法） */
  function calculateNextReviewDate(reviewCount) {
    const intervals = [1, 2, 4, 7, 14, 30] // 天数
    const idx = Math.min(reviewCount, intervals.length - 1)
    const days = intervals[idx]
    const next = new Date(Date.now() + days * 86400000)
    return next.toISOString()
  }

  /** 持久化到 LocalStorage */
  function saveToStorage() {
    try {
      localStorage.setItem('drama_vocab_words', JSON.stringify(words.value))
    } catch {}
  }

  /** 从 LocalStorage 恢复 + 数据迁移（清洗旧脏数据） */
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('drama_vocab_words')
      if (saved) {
        const arr = JSON.parse(saved)
        let migrated = false
        for (const w of arr) {
          // 清洗旧版 "(挑战模式)" 占位符
          if (w.meaning === '(挑战模式)') {
            w.meaning = ''
            migrated = true
          }
          // 确保 challengeResults 是数组
          if (!w.challengeResults) w.challengeResults = []
          // 确保 masteryLevel 有默认值
          if (w.masteryLevel == null) w.masteryLevel = 0
        }
        words.value = arr
        // 如果有数据被修改，回写一次
        if (migrated) saveToStorage()
      }
    } catch {}
  }

  // 初始化加载
  loadFromStorage()

  return {
    words,
    totalWords,
    masteredWords,
    learningWords,
    pendingWords,       // 🆕 待学习词数
    getReviewQueue,     // 🆕 获取复习队列（带截断）
    getWordByName,      // 🆕 按名称查单词
    isWordMastered,     // 🆕 查询单词是否已掌握
    getChapterMastery,  // 🆕 查询章节内单词挑战状态
    setChapterMastery,  // 🆕 设置章节挑战结果(持久化)
    getChapterMasteryMap,//🆕 批量获取章节掌握状态
    addWord,
    removeWord,
    recordChallengeResult,
    updateWordReview,
    calculateNextReviewDate,
    saveToStorage,
    loadFromStorage,
  }
})
