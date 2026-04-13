import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVocabStore = defineStore('vocabulary', () => {
  // State
  const vocabulary = ref([])           // 全部生词
  const masteredCount = ref(0)
  const pendingReview = ref(0)
  const isLoading = ref(false)

  // Getters
  const totalVocab = computed(() => vocabulary.value.length)

  // Actions
  function setVocabulary(data) { vocabulary.value = data }
  function addWord(word) { vocabulary.value.push(word) }
  function removeWord(wordId) {
    vocabulary.value = vocabulary.value.filter(w => w.id !== wordId)
  }

  // 更新单词掌握状态（挑战/复习后调用）
  function updateMastery(wordId, isCorrect) {
    const word = vocabulary.value.find(w => w.word?.toLowerCase() === wordId.toLowerCase()
      || w.id === wordId)
    if (!word) return

    if (isCorrect) {
      word.mastery_level = Math.min(5, (word.mastery_level || 0) + 1)
    } else {
      word.mastery_level = Math.max(0, (word.mastery_mode || 5) - 1)
      word.wrong_count = (word.wrong_count || 0) + 1
    }
    word.last_reviewed = new Date().toISOString()
    word.review_count = (word.review_count || 0) + 1
  }

  return {
    vocabulary, masteredCount, pendingReview, isLoading,
    totalVocab,
    setVocabulary, addWord, removeWord, updateMastery,
  }
})
