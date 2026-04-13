<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, BookOpen, Library, LogOut, Shield,
  ChevronLeft,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/useUserStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const adminLinks = [
  { to: '/admin', label: '数据看板', icon: LayoutDashboard },
  { to: '/admin/books', label: '书籍管理', icon: BookOpen },
  { to: '/admin/vocab-library', label: '中央词库', icon: Library },
]

function handleLogout() {
  userStore.logout()
  router.push({ name: 'AdminLogin' })
}
</script>

<template>
  <div class="min-h-screen bg-night-950 flex">
    <!-- 侧边栏 -->
    <aside class="hidden lg:flex w-56 flex-col border-r border-night-600/30 bg-night-900">
      <!-- Logo区 -->
      <div class="h-14 flex items-center gap-2 px-5 border-b border-night-600/30">
        <Shield :size="20" class="text-brand-purple" />
        <span class="font-bold text-sm text-white">管理后台</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <RouterLink
          v-for="link in adminLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            route.path === link.to || route.path.startsWith(link.to + '/')
              ? 'bg-brand-purple/15 text-brand-purple-light'
              : 'text-gray-400 hover:text-white hover:bg-night-700/50',
          ]"
        >
          <component :is="link.icon" :size="17" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- 底部操作 -->
      <div class="p-3 border-t border-night-600/30">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut :size="17" />
          退出登录
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 顶栏 -->
      <header class="h-14 flex items-center justify-between px-6 border-b border-night-600/30 bg-night-900/50">
        <h1 class="text-sm font-semibold text-gray-300">{{ route.meta?.title || '管理后台' }}</h1>
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-gold transition-colors"
        >
          <ChevronLeft :size="14" />
          返回C端
        </RouterLink>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
