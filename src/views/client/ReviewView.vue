<script setup>
import { ref } from 'vue-router'
import {
  RotateCcw, Layers, CircleDot, PenTool, Headphones, BookOpen,
  ArrowRight, Zap,
} from 'lucide-vue-next'
import { useReviewStore, ReviewMode } from '@/stores/useReviewStore'

const reviewStore = useReviewStore()

const modes = [
  { key: ReviewMode.FLASHCARD, label: '闪卡模式', icon: Layers, desc: '看英文想释义，翻转查看答案', color: 'purple' },
  { key: ReviewMode.QUIZ, label: '选择题', icon: CircleDot, desc: '四选一，快速检验记忆', color: 'rose' },
  { key: ReviewMode.FILL_BLANK, label: '填空题', icon: PenTool, desc: '看中文输入英文单词', color: 'gold' },
  { key: ReviewMode.DICTATION, label: '听写模式', icon: Headphones, desc: '听发音拼写单词', color: 'blue' },
  { key: ReviewMode.CONTEXT, label: '语境挖空', icon: BookOpen, desc: '小说原句填词，语境强化', color: 'green' },
]

const colorMap = {
  purple: 'border-brand-purple/20 hover:border-brand-purple/40 group-hover:bg-brand-purple/5',
  rose: 'border-brand-rose/20 hover:border-brand-rose/40 group-hover:bg-brand-rose/5',
  gold: 'border-brand-gold/20 hover:border-brand-gold/40 group-hover:bg-brand-gold/5',
  blue: 'border-info/20 hover:border-info/40 group-hover:bg-info/5',
  green: 'border-success/20 hover:border-success/40 group-hover:bg-success/5',
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 页头 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white flex items-center gap-2">
        <RotateCcw :size="22" class="text-brand-gold" />
        复习中心
      </h1>
      <p class="text-sm text-gray-400 mt-1">选择复习模式，巩固你的词汇记忆</p>
    </div>

    <!-- 待复习提示 -->
    <div class="card-drama p-4 mb-6 flex items-center justify-between border-l-4 border-l-brand-gold">
      <div class="flex items-center gap-3">
        <Zap :size="18" class="text-brand-gold" />
        <div>
          <p class="text-sm font-semibold text-white">今日待复习</p>
          <p class="text-xs text-gray-400">根据艾宾浩斯遗忘曲线智能推送</p>
        </div>
      </div>
      <span class="text-xl font-bold text-brand-gold">12</span>
    </div>

    <!-- 五种复习模式 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        v-for="mode in modes"
        :key="mode.key"
        :class="[
          'card-drama p-5 text-left transition-all duration-300 border group cursor-pointer',
          colorMap[mode.color],
        ]"
      >
        <component :is="mode.icon" :size="24" class="mb-3 text-gray-300 group-hover:text-white transition-colors" />
        <h3 class="font-bold text-white mb-1">{{ mode.label }}</h3>
        <p class="text-xs text-gray-400 mb-3">{{ mode.desc }}</p>
        <span class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
          开始练习 <ArrowRight :size="12" />
        </span>
      </button>
    </div>

    <!-- 复习统计（底部） -->
    <div class="mt-10 card-drama p-6">
      <h2 class="text-sm font-bold text-gray-300 mb-4">📊 本周复习数据</h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div><p class="text-2xl font-bold text-brand-purple">47</p><p class="text-xs text-gray-500 mt-1">已复习</p></div>
        <div><p class="text-2xl font-bold text-success">38</p><p class="text-xs text-gray-500 mt-1">答对</p></div>
        <div><p class="text-2xl font-bold text-error">9</p><p class="text-xs text-gray-500 mt-1">需加强</p></div>
      </div>
    </div>
  </div>
</template>