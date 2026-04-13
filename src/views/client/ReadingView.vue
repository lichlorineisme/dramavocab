<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/useReadingStore'
import {
  Brain, Eye, PenTool, Volume2, Type, Moon, Sun,
  ChevronLeft, ChevronRight, Menu, Languages,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const readingStore = useReadingStore()

const currentChapter = ref({
  id: route.params.chapterId || 'ch1',
  title: '第一章 契约开始',
  number: 1,
  bookId: route.params.bookId || 'demo',
})

// TODO: Phase 2 从 novel-data.js 迁移完整阅读逻辑
// - 三种模式渲染（沉浸/透视/挑战）
// - WordTooltip / BottomSheet 查词
// - TTS 发音
// - 段落翻译
// - 进度保存
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- 阅读工具栏 -->
    <header class="sticky top-14 z-40 bg-night-950/90 backdrop-blur-md border-b border-night-600/20 px-4 py-2.5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <!-- 左：章节选择 -->
        <button class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/15 transition-all">
          <Menu :size="14" />
          {{ currentChapter.title }}
        </button>

        <!-- 中：三档模式切换 -->
        <div class="flex items-center gap-1 bg-night-800 rounded-xl p-1">
          <button
            :class="[
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              readingStore.mode === 'immersive' ? 'bg-night-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200',
            ]"
            @click="readingStore.setMode('immersive')"
          >
            <Brain :size="13" /> 沉浸
          </button>
          <button
            :class="[
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              readingStore.mode === 'perspective' ? 'bg-night-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200',
            ]"
            @click="readingStore.setMode('perspective')"
          >
            <Eye :size="13" /> 透视
          </button>
          <button
            :class="[
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              readingStore.mode === 'challenge' ? 'bg-night-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200',
            ]"
            @click="readingStore.setMode('challenge')"
          >
            <PenTool :size="13" /> 挑战
          </button>
        </div>

        <!-- 右：工具按钮 -->
        <div class="flex items-center gap-1 shrink-0">
          <button class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-night-700 transition-all" title="TTS朗读">
            <Volume2 :size="16" />
          </button>
          <button class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-night-700 transition-all" title="字号">
            <Type :size="16" />
          </button>
          <button class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-night-700 transition-all" :title="readingStore.isDarkMode?'护眼':'暗夜'" @click="readingStore.toggleDarkMode()">
            <Moon v-if="readingStore.isDarkMode" :size="16" />
            <Sun v-else :size="16" />
          </button>
          <button class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-night-700 transition-all" title="翻译">
            <Languages :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- 阅读内容区 -->
    <article class="px-5 py-8 font-reading min-h-[60vh]">
      <!-- TODO: Phase 2 渲染小说段落内容 -->
      <div class="text-center py-20">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-purple/10 flex items-center justify-center">
          <BookOpen :size="28" class="text-brand-purple" />
        </div>
        <h2 class="text-lg font-bold text-white mb-2">{{ currentChapter.title }}</h2>
        <p class="text-sm text-gray-500 max-w-md mx-auto">
          阅读核心组件正在迁移中（Phase 2）<br/>
          三档阅读模式、查词交互、TTS发音 即将上线 ✨
        </p>

        <!-- 模式说明 -->
        <div class="mt-6 inline-flex flex-col sm:flex-row gap-3 text-xs text-left">
          <div class="px-4 py-3 rounded-xl bg-night-800/50 border border-night-700">
            <span class="font-bold text-brand-purple">🧠 沉浸：</span>英文嵌入，无释义
          </div>
          <div class="px-4 py-3 rounded-xl bg-night-800/50 border border-night-700">
            <span class="font-bold text-brand-rose">👁️ 透视：</span>括号中文提示
          </div>
          <div class="px-4 py-3 rounded-xl bg-night-800/50 border border-night-700">
            <span class="font-bold text-brand-gold">✏️ 挑战：</span>输入框填空判对错
          </div>
        </div>
      </div>
    </article>

    <!-- 章节导航（底部） -->
    <nav class="sticky bottom-0 bg-night-900/95 backdrop-blur-md border-t border-night-600/30 px-4 py-3 flex justify-between items-center">
      <button
        :disabled="currentChapter.number <= 1"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-night-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft :size="16" /> 上一章
      </button>
      <span class="text-xs text-gray-500">第 {{ currentChapter.number }} 章</span>
      <button
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-night-700 transition-all"
      >
        下一章 <ChevronRight :size="16" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { BookOpen } from 'lucide-vue-next'
</script>
