/**
 * 复习状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useReviewStore = defineStore('review', () => {
  const reviewHistory = ref([])
  const todayReviewCount = ref(0)
  const todayCorrectRate = ref(0)

  /** 记录复习结果 */
  function recordResult(wordId, isCorrect) {
    reviewHistory.value.push({
      wordId, isCorrect, timestamp: Date.now()
    })
    todayReviewCount.value++
    saveHistory()
  }

  function saveHistory() {
    try { localStorage.setItem('drama_review_history', JSON.stringify(reviewHistory.value)) } catch {}
  }

  // 初始化恢复
  try {
    const saved = localStorage.getItem('drama_review_history')
    if (saved) reviewHistory.value = JSON.parse(saved)
  } catch {}

  return { reviewHistory, todayReviewCount, todayCorrectRate, recordResult }
})
