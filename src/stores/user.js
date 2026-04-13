/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  function login(userData) {
    user.value = userData
    localStorage.setItem('drama_user', JSON.stringify({
      ...userData,
      loginAt: Date.now()
    }))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('drama_user')
  }

  // 初始化：从 LocalStorage 恢复
  try {
    const saved = localStorage.getItem('drama_user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  } catch {}

  return { user, isLoggedIn, login, logout }
})
