<script setup>
import { RouterLink } from 'vue-router'
import { BookOpen, Brain, PenTool, BarChart3, ArrowRight, Sparkles, Heart } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-[80vh] flex items-center">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <!-- Hero 区域 -->
      <div class="mb-4">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-purple/10 text-brand-purple-light border border-brand-purple/20">
          <Sparkles :size="12" />
          沉浸式英语学习
        </span>
      </div>

      <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
        <span class="text-white">看最狗血的文，</span>
        <br />
        <span class="text-gradient">背最高级的词。</span>
      </h1>

      <p class="text-lg text-gray-400 max-w-xl mx-auto mb-2">
        三分讥笑，三分薄凉，四分漫不经心地搞定
        <span class="text-brand-gold font-semibold">四/六级、雅思单词</span>。
      </p>

      <!-- 特色卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 mb-10">
        <div class="card-drama p-5 text-left">
          <Brain class="text-brand-purple mb-3" :size="24" />
          <h3 class="font-bold text-white mb-1">🧠 沉浸模式</h3>
          <p class="text-xs text-gray-400">英文单词无缝嵌入中文小说，自然语境中高频接触目标词汇。</p>
        </div>
        <div class="card-drama p-5 text-left">
          <Eye class="text-brand-rose mb-3" :size="24" />
          <h3 class="font-bold text-white mb-1">👁️ 透视模式</h3>
          <p class="text-xs text-gray-400">每个词汇附带中文释义提示，边读边记，降低理解门槛。</p>
        </div>
        <div class="card-drama p-5 text-left">
          <PenTool class="text-brand-gold mb-3" :size="24" />
          <h3 class="font-bold text-white mb-1">✏️ 挑战模式</h3>
          <p class="text-xs text-gray-400">根据中文释义输入英文，答对即掌握，答错自动收录生词本。</p>
        </div>
      </div>

      <!-- CTA 按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <RouterLink to="/read/1/ch01" class="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
          <BookOpen :size="18" />
          开始阅读
        </RouterLink>
        <RouterLink
          to="/read/demo/1"
          class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-gray-300 border border-night-500 hover:border-brand-purple hover:text-white transition-all"
        >
          <ArrowRight :size="18" />
          立即体验阅读
        </RouterLink>
      </div>

      <!-- 副Slogan -->
      <p class="mt-8 text-xs text-night-500 italic flex items-center justify-center gap-1">
        <Heart :size="11" class="text-brand-rose" />
        DramaVocab — 让背单词像追剧一样上瘾
      </p>
    </div>
  </div>
</template>

<script setup>
import { Eye } from 'lucide-vue-next'
</script>
