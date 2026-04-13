import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 复习模式枚举
export const ReviewMode = {
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  FILL_BLANK: 'fill_blank',
  DICTATION: 'dictation',
  CONTEXT: 'context',
}

export const useReviewStore = defineStore('review', () => {
  // State
  const currentMode = ref('')
  const queue = ref([])              // 当前复习队列
  const currentIndex = ref(0)        // 当前题目位置
  const sessionStats = ref({         // 本次复习统计
    total: 0,
    correct: 0,
    wrong: 0,
  })

  // Getters
  const currentWord = computed(() => queue.value[currentIndex.value] || null)
  const progress = computed(() =>
    queue.value.length > 0 ? Math.round((currentIndex.value / queue.value.length) * 100) : 0
  )
  const isFinished = computed(() => currentIndex.value >= queue.value.length)

  // Actions
  function setQueue(words, mode) {
    queue.value = words
    currentIndex.value = 0
    currentMode.value = mode
    sessionStats.value = { total: words.length, correct: 0, wrong: 0 }
  }

  function recordAnswer(isCorrect) {
    if (isCorrect) {
      sessionStats.value.correct++
    } else {
      sessionStats.value.wrong++
    }
    currentIndex.value++
  }

  function reset() {
    queue.value = []
    currentIndex.value = 0
    sessionStats.value = { total: 0, correct: 0, wrong: 0 }
  }

  return {
    currentMode, queue, currentIndex, sessionStats,
    currentWord, progress, isFinished,
    setQueue, recordAnswer, reset, ReviewMode,
  }
})
