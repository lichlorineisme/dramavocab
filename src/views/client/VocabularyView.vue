<script setup>
import { ref } from 'vue'
import { Search, Filter, Trash2, Download, BookMarked, Star } from 'lucide-vue-next'

const searchQuery = ref('')
const filterLevel = ref('all') // all / mastered / learning

// TODO: Phase 2 接入生词本数据
const mockVocab = [
  { word: 'senior', phonetic: '/ˈsiːniər/', meaning: 'n. 大四学生；adj. 高级的', mastery_level: 5 },
  { word: 'tuition', phonetic: '/tuˈɪʃn/', meaning: 'n. 学费', mastery_level: 3 },
  { word: 'afford', phonetic: '/əˈfɔːrd/', meaning: 'v. 负担得起', mastery_level: 2 },
]

const filteredVocab = mockVocab.filter(v => {
  if (filterLevel.value === 'mastered' && v.mastery_level < 5) return false
  if (filterLevel.value === 'learning' && v.mastery_level >= 5) return false
  return true
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 页头 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <BookMarked :size="22" class="text-brand-purple" />
          生词本
        </h1>
        <p class="text-sm text-gray-400 mt-1">共 {{ filteredVocab.length }} 个单词</p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-night-500 text-gray-300 hover:border-brand-gold hover:text-brand-gold transition-all">
          <Download :size="14" /> 导出
        </button>
      </div>
    </div>

    <!-- 搜索 + 筛选栏 -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder搜索单词、释义..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-night-800 border border-night-600 text-white placeholder-gray-500 text-sm focus:border-brand-purple outline-none transition-all"
        />
      </div>

      <!-- 筛选标签 -->
      <div class="flex gap-1.5">
        <button
          v-for="opt in [{value:'all',label:'全部'}, {value:'mastered',label:'已掌握'}, {value:'learning',label:'学习中'}]"
          :key="opt.value"
          :class="[
            'px-3 py-2 rounded-lg text-xs font-medium transition-all',
            filterLevel === opt.value ? 'bg-brand-purple/15 text-brand-purple-light border border-brand-purple/30' : 'bg-night-800 text-gray-400 border border-transparent hover:text-white',
          ]"
          @click="filterLevel = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- 单词列表 -->
    <div class="space-y-3">
      <div
        v-for="v in filteredVocab"
        :key="v.word"
        class="card-drama p-4 flex items-center justify-between group hover:border-brand-purple/20 transition-all cursor-pointer"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="font-bold text-white">{{ v.word }}</span>
            <span class="text-xs text-gray-500 font-mono">{{ v.phonetic }}</span>
            <span
              v-if="v.mastery_level >= 5"
              class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success"
            >✓ 已掌握</span>
          </div>
          <p class="text-sm text-gray-400 truncate">{{ v.meaning }}</p>
        </div>

        <button class="shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="删除">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredVocab.length === 0" class="text-center py-20">
      <Star :size="40" class="mx-auto text-night-600 mb-3" />
      <p class="text-gray-500">暂无单词，去阅读页收藏吧 ✨</p>
    </div>
  </div>
</template>