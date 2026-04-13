import { defineStore } from 'pinia'
import { ref } from 'vue'

export const ReadingMode = {
  IMMERSIVE: 'immersive',   // 沉浸：纯英文高亮，无释义
  PERSPECTIVE: 'perspective', // 透视：单词+（中文释义）括号
  CHALLENGE: 'challenge',    // 挑战：输入框填空→判对错
}

export const useReadingStore = defineStore('reading', () => {
  // State
  const mode = ref(ReadingMode.IMMERSIVE)
  const fontSize = ref(18)
  const isDarkMode = ref(true)        // 默认暗夜模式
  const scrollPosition = ref(0)

  // Actions
  function setMode(newMode) { mode.value = newMode }
  function toggleDarkMode() { isDarkMode.value = !isDarkMode.value }
  function saveScroll(pos) { scrollPosition.value = pos }

  // 从 LocalStorage 恢复阅读设置
  function restoreSettings() {
    const saved = localStorage.getItem('dv_reading_settings')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        mode.value = s.mode || ReadingMode.IMMERSIVE
        fontSize.value = s.fontSize || 18
        isDarkMode.value = s.isDarkMode !== false // 默认暗夜
      } catch (e) { /* ignore */ }
    }
  }

  function persistSettings() {
    localStorage.setItem('dv_reading_settings', JSON.stringify({
      mode: mode.value,
      fontSize: fontSize.value,
      isDarkMode: isDarkMode.value,
    }))
  }

  return {
    mode, fontSize, isDarkMode, scrollPosition,
    setMode, toggleDarkMode, saveScroll,
    restoreSettings, persistSettings, ReadingMode,
  }
})
