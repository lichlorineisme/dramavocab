<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { Mail, Lock, User, ArrowRight, Sparkles, CloudSync } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true) // 登录/注册切换
const form = ref({
  email: '',
  username: '',
  password: '',
})
const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  if (!form.value.email || !form.value.password) { errorMsg.value = '请填写完整信息'; return }

  loading.value = true

  // TODO: Phase 3 接入 Supabase Auth
  try {
    // 模拟登录
    await new Promise(r => setTimeout(r, 800))
    userStore.setUser({ id: 'demo', email: form.value.email, username: form.value.username || form.value.email })
    router.push('/')
  } catch (e) {
    errorMsg.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- 卡片 -->
      <div class="card-drama p-8">
        <!-- Logo -->
        <div class="text-center mb-6">
          <h1 class="text-xl font-bold text-gradient mb-1">DramaVocab</h1>
          <p class="text-xs text-gray-500">{{ isLogin ? '欢迎回来，继续你的学习之旅' : '加入抓马英语，开始背单词' }}</p>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 用户名（仅注册） -->
          <div v-if="!isLogin" class="relative">
            <User :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              v-model="form.username"
              type="text"
              placeholder="用户名"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-night-800 border border-night-600 text-white placeholder-gray-500 text-sm focus:border-brand-purple outline-none transition-all"
            />
          </div>

          <!-- 邮箱 -->
          <div class="relative">
            <Mail :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              v-model="form.email"
              type="email"
              placeholder="邮箱地址"
              autocomplete="email"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-night-800 border border-night-600 text-white placeholder-gray-500 text-sm focus:border-brand-purple outline-none transition-all"
            />
          </div>

          <!-- 密码 -->
          <div class="relative">
            <Lock :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              v-model="form.password"
              type="password"
              placeholder="密码"
              autocomplete="current-password"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-night-800 border border-night-600 text-white placeholder-gray-500 text-sm focus:border-brand-purple outline-none transition-all"
            />
          </div>

          <!-- 错误提示 -->
          <p v-if="errorMsg" class="text-sm text-red-400 text-center">{{ errorMsg }}</p>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!loading">{{ isLogin ? '登 录' : '注 册' }}</span>
            <span v-else class="animate-pulse">处理中...</span>
            <ArrowRight v-if="!loading" :size="15" />
          </button>
        </form>

        <!-- 切换登录/注册 -->
        <p class="text-center mt-5 text-sm text-gray-500">
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
          <button
            @click="isLogin = !isLogin; errorMsg = ''"
            class="font-semibold text-brand-purple-light hover:text-white transition-colors"
          >
            {{ isLogin ? '立即注册' : '去登录' }}
          </button>
        </p>

        <!-- 云同步提示 -->
        <div class="mt-5 pt-4 border-t border-night-600/20">
          <p class="flex items-center gap-1.5 text-[11px] text-night-400 justify-center">
            <CloudSync :size="12" />
            登录后可自动同步学习进度到云端
          </p>
        </div>
      </div>

      <!-- 返回首页 -->
      <p class="text-center mt-4">
        <router-link to="/" class="text-xs text-gray-500 hover:text-white transition-colors">← 返回首页</router-link>
      </p>
    </div>
  </div>
</template>