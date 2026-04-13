<script setup>
import { useRoute, RouterLink } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-night-950 flex flex-col">
    <!-- 顶栏 -->
    <AppHeader />

    <!-- 主内容区 -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- 底栏（首页和书城显示，阅读页隐藏） -->
    <AppFooter v-if="!route.path.startsWith('/read')" />
  </div>
</template>
