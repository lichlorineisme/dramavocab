<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BookOpen, PlayCircle, List, ArrowLeft, ChevronRight, BookMarked, Clock } from 'lucide-vue-next'

const route = useRoute()

// TODO: Phase 2 从 Supabase 拉取书籍详情
const book = ref({
  id: 'demo',
  title: '契约甜妻：霸总的千亿宠婚',
  author: '有栖',
  description: '一场意外，林晚与A城首富顾夜寒签下了一份契约婚姻。她以为只是各取所需，却不知早已沦陷……\n\n当霸总遇上英语系才女，会擦出怎样的火花？在追剧的同时，轻松掌握四/六级、雅思核心词汇。',
  total_vocab_count: 119,
  chapters_count: 3,
  status: 'published',
})

const mockChapters = [
  { id: 'ch1', number: 1, title: '第一章 契约开始', vocab_count: 47 },
  { id: 'ch2', number: 2, title: '第二章 暧昧升温', vocab_count: 51 },
  { id: 'ch3', number: 3, title: '第三章 真相大白', vocab_count: 21 },
]

const lastReadChapter = localStorage.getItem('dv_last_chapter') || null
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 返回 -->
    <RouterLink to="/" class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
      <ArrowLeft :size="16" />
      返回首页
    </RouterLink>

    <!-- 书籍头部 -->
    <div class="flex flex-col sm:flex-row gap-6 mb-8">
      <!-- 封面 -->
      <div class="w-40 h-56 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-rose/20 flex items-center justify-center shrink-0 border border-night-600/30">
        <BookOpen :size="48" class="text-night-500" />
      </div>

      <!-- 信息 -->
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-white mb-2">{{ book.title }}</h1>
        <p class="text-sm text-gray-400 mb-3">{{ book.author }}</p>
        <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-4">{{ book.description }}</p>

        <!-- 标签 -->
        <div class="flex flex-wrap gap-2 mb-5">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-gold/10 text-brand-gold">
            📖 {{ book.total_vocab_count }} 个核心词汇
          </span>
          <span class="px-2.5 py-1 rounded-full text-xs bg-night-700 text-gray-300">
            {{ book.chapters_count }} 章
          </span>
          <span class="px-2.5 py-1 rounded-full text-xs bg-success/10 text-success">四/六级 · 雅思</span>
        </div>

        <!-- CTA 按钮 -->
        <div class="flex gap-3">
          <RouterLink
            :to="`/read/${book.id}/${lastReadChapter || 'ch1'}`"
            class="btn-primary inline-flex items-center gap-2"
          >
            <PlayCircle :size="16" />
            {{ lastReadChapter ? '继续阅读' : '开始阅读' }}
          </RouterLink>
          <RouterLink
            :to="`/read/${book.id}/ch1`"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-gray-300 border border-night-500 hover:border-brand-purple hover:text-white transition-all text-sm"
          >
            从头开始
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- 章节目录 -->
    <div class="card-drama p-6">
      <h2 class="flex items-center gap-2 text-lg font-bold text-white mb-4">
        <List :size="18" class="text-brand-purple" />
        章节目录
      </h2>

      <div class="space-y-2">
        <RouterLink
          v-for="ch in mockChapters"
          :key="ch.id"
          :to="`/read/${book.id}/${ch.id}`"
          class="group flex items-center justify-between px-4 py-3 rounded-xl bg-night-800/50 hover:bg-night-700/50 border border-transparent hover:border-brand-purple/20 transition-all"
        >
          <div class="flex items-center gap-3">
            <ChevronRight :size="16" class="text-night-500 group-hover:text-brand-purple transition-colors" />
            <span class="text-sm text-gray-200 group-hover:text-white transition-colors">{{ ch.title }}</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span class="flex items-center gap-1"><BookMarked :size="12" />{{ ch.vocab_count }} 词</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>