/**
 * 阅读状态管理 — 核心Store
 * 管理阅读模式、字号、暗夜模式、章节进度
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 记录学习活动到 localStorage */
function recordActivity() {
  try {
    const log = JSON.parse(localStorage.getItem('drama_activity_log') || '{}')
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    log[today] = (log[today] || 0) + 1
    localStorage.setItem('drama_activity_log', JSON.stringify(log))
  } catch {}
}

export const useReadingStore = defineStore('reading', () => {
  // ===== 阅读模式 =====
  const mode = ref('immersive') // immersive | perspective | challenge
  
  // ===== 阅读设置 =====
  const fontSize = ref(18) // 14-24px
  const isDark = ref(true) // 默认霸总暗夜主题
  const ttsEnabled = ref(false)
  const ttsVoice = ref('en-US') // en-US美音 | en-GB英音
  const ttsRate = ref(0.9) // 语速 0.5-1.5
  
  // ===== 章节进度 =====
  const currentBookId = ref(null)
  const currentChapterId = ref(null)
  const scrollPosition = ref(0) // 滚动位置保存
  const completedChapters = ref(new Set()) // 已完成章节ID集合
  const challengeAnswers = ref(new Map()) // 挑战模式答题记录 {word: boolean}
  
  // ===== Computed =====
  const modeLabel = computed(() => {
    const map = {
      immersive: '🧠 沉浸',
      perspective: '👁️ 透视',
      challenge: '✏️ 挑战'
    }
    return map[mode.value] || '沉浸'
  })
  
  const fontSizeClass = computed(() => {
    if (fontSize.value <= 16) return 'text-sm'
    if (fontSize.value <= 18) return 'text-base'
    if (fontSize.value <= 20) return 'text-lg'
    return 'text-xl'
  })
  
  const isChapterCompleted = computed(() =>
    completedChapters.value.has(currentChapterId.value)
  )
  
  // ===== Actions =====
  
  function setMode(m) {
    if (['immersive', 'perspective', 'challenge'].includes(m)) {
      mode.value = m
      saveSettings()
    }
  }
  
  function toggleDark() {
    isDark.value = !isDark.value
    saveSettings()
  }
  
  function increaseFontSize() {
    if (fontSize.value < 24) {
      fontSize.value += 2
      saveSettings()
    }
  }
  
  function decreaseFontSize() {
    if (fontSize.value > 14) {
      fontSize.value -= 2
      saveSettings()
    }
  }
  
  function setCurrentBook(bookId) {
    currentBookId.value = bookId
  }
  
  function setCurrentChapter(chapterId) {
    currentChapterId.value = chapterId
  }
  
  function saveScrollPosition(pos) {
    scrollPosition.value = pos
    try {
      localStorage.setItem('drama_scroll_pos', JSON.stringify({
        bookId: currentBookId.value,
        chapterId: currentChapterId.value,
        position: pos,
        timestamp: Date.now()
      }))
    } catch {}
  }
  
  function loadScrollPosition(bookId, chapterId) {
    try {
      const saved = localStorage.getItem('drama_scroll_pos')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.bookId === bookId && data.chapterId === chapterId) {
          // 24小时内有效
          if (Date.now() - data.timestamp < 86400000) {
            return data.position || 0
          }
        }
      }
    } catch {}
    return 0
  }
  
  function markChapterComplete(chapterId) {
    completedChapters.value.add(chapterId)
    recordActivity() // 记录学习活动
    try {
      localStorage.setItem(
        'drama_completed_chapters',
        JSON.stringify([...completedChapters.value])
      )
    } catch {}
  }
  
  function recordChallengeAnswer(word, isCorrect) {
    challengeAnswers.value.set(word.toLowerCase(), isCorrect)
  }
  
  function getChallengeAnswer(word) {
    return challengeAnswers.value.get(word.toLowerCase())
  }
  
  function clearChallengeSession() {
    challengeAnswers.value.clear()
  }

  /** 持久化阅读设置到 LocalStorage */
  function saveSettings() {
    try {
      localStorage.setItem('drama_reading_settings', JSON.stringify({
        mode: mode.value,
        fontSize: fontSize.value,
        isDark: isDark.value,
        ttsVoice: ttsVoice.value,
        ttsRate: ttsRate.value,
        ttsEnabled: ttsEnabled.value
      }))
    } catch {}
  }

  /** 从 LocalStorage 恢复阅读设置 */
  function loadSettings() {
    try {
      const saved = localStorage.getItem('drama_reading_settings')
      if (saved) {
        const s = JSON.parse(saved)
        mode.value = s.mode || 'immersive'
        fontSize.value = s.fontSize || 18
        isDark.value = s.isDark !== false
        ttsVoice.value = s.ttsVoice || 'en-US'
        ttsRate.value = s.ttsRate || 0.9
        ttsEnabled.value = s.ttsEnabled || false
      }
      
      // 恢复已完成章节
      const chapters = localStorage.getItem('drama_completed_chapters')
      if (chapters) {
        completedChapters.value = new Set(JSON.parse(chapters))
      }
    } catch {}
  }

  // 初始化时加载设置
  loadSettings()

  return {
    // State
    mode, fontSize, isDark,
    ttsEnabled, ttsVoice, ttsRate,
    currentBookId, currentChapterId,
    scrollPosition, completedChapters, challengeAnswers,
    // Computed
    modeLabel, fontSizeClass, isChapterCompleted,
    // Actions
    setMode, toggleDark,
    increaseFontSize, decreaseFontSize,
    setCurrentBook, setCurrentChapter,
    saveScrollPosition, loadScrollPosition,
    markChapterComplete, recordChallengeAnswer,
    getChallengeAnswer, clearChallengeSession,
    saveSettings, loadSettings
  }
})
