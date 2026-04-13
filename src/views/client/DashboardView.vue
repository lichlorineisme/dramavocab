<script setup>
import { ref } from 'vue'
import {
  BarChart3, TrendingUp, BookMarked, Target, Flame,
  Calendar, ArrowRight,
} from 'lucide-vue-next'

// TODO: Phase 2 接入真实学习数据

// 模拟热力图数据（84天）
const heatmapDays = Array.from({ length: 84 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - 83 + i)
  // 随机模拟活跃度：0-4级
  const level = Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0
  return {
    date: date.toISOString().split('T')[0],
    level,
  }
})

const stats = [
  { label: '累计词汇', value: '119', icon: BookMarked, color: 'text-brand-purple' },
  { label: '已掌握', value: '47', icon: Target, color: 'text-success' },
  { label: '待复习', value: '12', icon: TrendingUp, color: 'text-brand-gold' },
  { label: '连续天数', value: '7', icon: Flame, color: 'text-brand-rose' },
]

const levelColor = ['bg-night-800', 'bg-brand-green/20 text-brand-green', 'bg-success/30', 'bg-success/50', 'bg-success']
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 页头 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 :size="22" class="text-brand-purple" />
        学习数据面板
      </h1>
      <p class="text-sm text-gray-400 mt-1">追踪你的学习进度，见证每一次成长 ✨</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="card-drama p-4 text-center">
        <component :is="stat.icon" :size="22" :class="['mx-auto mb-2', stat.color]" />
        <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <!-- 热力图 -->
    <div class="card-drama p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="flex items-center gap-2 text-sm font-bold text-gray-300">
          <Calendar :size="16" class="text-brand-gold" />
          连续学习热力图（近84天）
        </h2>
      </div>

      <!-- 热力图规则说明 -->
      <p class="text-xs text-gray-500 mb-3 pb-3 border-b border-night-600/20">
        当天有收藏单词、复习单词、或阅读记录即记为活跃
        <span class="ml-1 text-night-400">· 颜色越深 = 当天学习次数越多</span>
      </p>

      <!-- 热力图网格 -->
      <div class="overflow-x-auto">
        <div class="flex gap-0.5 flex-wrap" style="width: fit-content;">
          <div
            v-for="(day, idx) in heatmapDays"
            :key="idx"
            :title="`${day.date} · ${day.level > 0 ? day.level + '次活跃' : '无记录'}`"
            :class="[
              'w-[13px] h-[13px] rounded-sm transition-all hover:ring-1 hover:ring-white/40',
              levelColor[day.level] || 'bg-night-800',
            ]"
          ></div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-gray-500">
        <span>少</span>
        <span v-for="i in 5" :key="i" :class="['w-[11px] h-[11px] rounded-sm', levelColor[i - 1]]"></span>
        <span>多</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <a href="/read/1/ch01" class="card-drama p-5 flex items-center gap-4 group hover:border-brand-purple/30 cursor-pointer transition-all">
        <div class="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center shrink-0 group-hover:bg-brand-purple/15 transition-colors">
          <BookMarked :size="18" class="text-brand-purple-light" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-white text-sm">继续阅读</p>
          <p class="text-xs text-gray-500 truncate">回到上次阅读位置</p>
        </div>
        <ArrowRight :size="16" class="text-night-500 group-hover:text-brand-purple transition-colors" />
      </a>

      <a href="/review" class="card-drama p-5 flex items-center gap-4 group hover:border-brand-gold/30 cursor-pointer transition-all">
        <div class="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0 group-hover:bg-brand-gold/15 transition-colors">
          <Target :size="18" class="text-brand-gold" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-white text-sm">开始复习</p>
          <p class="text-xs text-gray-500 truncate">12个单词待复习中</p>
        </div>
        <ArrowRight :size="16" class="text-night-500 group-hover:text-brand-gold transition-colors" />
      </a>
    </div>
  </div>
</template>