<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { BarChart3, BookMarked, House, Import, Menu, X } from 'lucide-vue-next'
import logoUrl from '@/assets/brand/dramavocab-logo-horse.jpg'
import { useReadingStore } from '@/stores/reading.js'

const route = useRoute()
const router = useRouter()
const readingStore = useReadingStore()
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/', label: '首页', icon: House },
  { to: '/import', label: '导入中心', icon: Import },
  { to: '/vocabulary', label: '生词本', icon: BookMarked },
  { to: '/dashboard', label: '数据', icon: BarChart3 },
]

const mobileLabel = computed(() => (mobileMenuOpen.value ? '关闭菜单' : '打开菜单'))

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function closeMenu() {
  mobileMenuOpen.value = false
}

function startReading(forceCloseMenu = false) {
  readingStore.setMode('immersive')
  if (forceCloseMenu) closeMenu()
  router.push({
    name: 'Reading',
    params: {
      bid: '1',
      cid: '1',
    },
  })
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-white/8 bg-night-900/72 backdrop-blur-xl">
    <div class="page-container flex h-20 items-center justify-between gap-6">
      <RouterLink to="/" class="flex min-w-0 items-center gap-3" @click="closeMenu">
        <img :src="logoUrl" alt="DramaVocab" class="h-12 w-12 rounded-full object-cover shadow-lg shadow-brand-purple/20" />
        <div class="min-w-0">
          <div class="truncate font-display text-lg font-extrabold tracking-tight text-gradient">DramaVocab</div>
          <div class="truncate text-xs text-white/60">抓马英语 · 看最狗血的文，背最高级的词</div>
        </div>
      </RouterLink>

      <nav class="hidden items-center gap-2 lg:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
          :class="isActive(link.to)
            ? 'bg-white/12 text-white shadow-inner'
            : 'text-white/68 hover:bg-white/6 hover:text-white'"
        >
          <component :is="link.icon" :size="16" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="hidden items-center gap-3 lg:flex">
        <button type="button" class="btn-secondary text-sm" @click="startReading">开始阅读</button>
        <RouterLink to="/import" class="btn-primary text-sm">导入私藏小说</RouterLink>
      </div>

      <button
        type="button"
        class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/80 transition hover:bg-white/8 lg:hidden"
        :aria-label="mobileLabel"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <Menu v-if="!mobileMenuOpen" :size="20" />
        <X v-else :size="20" />
      </button>
    </div>

    <transition name="slide-down">
      <div v-if="mobileMenuOpen" class="border-t border-white/8 bg-night-900/94 px-4 pb-4 pt-3 backdrop-blur-xl lg:hidden">
        <div class="page-container flex flex-col gap-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
            :class="isActive(link.to)
              ? 'bg-white/12 text-white'
              : 'text-white/72 hover:bg-white/6 hover:text-white'"
            @click="closeMenu"
          >
            <component :is="link.icon" :size="17" />
            {{ link.label }}
          </RouterLink>
          <button type="button" class="btn-secondary mt-2 text-sm" @click="startReading(true)">开始阅读</button>
          <RouterLink to="/import" class="btn-primary mt-2 text-sm" @click="closeMenu">导入私藏小说</RouterLink>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.24s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
