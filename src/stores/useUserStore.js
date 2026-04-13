import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('dv_token') || '')
  const isLoading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.username || user.value?.email || '未登录')

  // Actions
  function setUser(data) {
    user.value = data
    if (data?.token) {
      token.value = data.token
      localStorage.setItem('dv_token', data.token)
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('dv_token')
    localStorage.removeItem('dv_admin_token')
  }

  return {
    user, token, isLoading,
    isLoggedIn, userName,
    setUser, logout,
  }
})
