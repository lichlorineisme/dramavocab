<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, BookOpen, Filter, Grid3X3 } from 'lucide-vue-next'

// TODO: Phase 2 接入 Supabase 数据
const searchQuery = ref('')
const mockBooks = ref([
  {
    id: 'demo',
    title: '契约甜妻：霸总的千亿宠婚',
    author: '有栖',
    cover_url: '',
    description: '一场意外，林晚与A城首富顾夜寒签下了一份契约婚姻。她以为只是各取所需，却不知早已沦陷……',
    total_vocab_count: 119,
    status: 'published',
    chapters_count: 3,
  },
])
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- 页头 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">📚 书城</h1>
      <p class="text-sm text-gray-400">选择一本小说，开启你的沉浸式背单词之旅</p>
    </div>

    <!-- 搜索栏 -->
    <div class="relative mb-8">
      <Search :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索书名、作者..."
        class="w-full pl-11 pr-4 py-3 rounded-xl bg-night-800 border border-night-600 text-white placeholder-gray-500 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all outline-none"
      />
    </div>

    <!-- 书籍网格 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="book in mockBooks"
        :key="book.id"
        :to="`/book/${book.id}`"
        class="card-drama p-5 block hover:border-brand-purple/30 hover:-translate-y-1 transition-all duration-300 group"
      >
        <!-- 封面占位 -->
        <div class="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-rose/20 flex items-center justify-center mb-4 border border-night-600/30">
          <BookOpen :size="40" class="text-night-500 group-hover:text-brand-purple transition-colors" />
        </div>

        <!-- 信息 -->
        <h3 class="font-bold text-white group-hover:text-brand-purple-light transition-colors line-clamp-1">
          {{ book.title }}
        </h3>
        <p class="text-xs text-gray-500 mt-1">{{ book.author }} · {{ book.chapters_count }} 章</p>

        <!-- 词汇标签 -->
        <div class="mt-3 flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-gold/10 text-brand-gold">
            {{ book.total_vocab_count }} 词
          </span>
          <span class="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">已上架</span>
        </div>
      </RouterLink>
    </div>

    <!-- 空状态 -->
    <div v-if="mockBooks.length === 0" class="text-center py-20">
      <Grid3X3 :size="48" class="mx-auto text-night-600 mb-3" />
      <p class="text-gray-500">暂无书籍，管理员正在努力上架中…</p>
    </div>
  </div>
</template>
