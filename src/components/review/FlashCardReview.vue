<template>
  <div class="flashcard-review flex flex-col items-center justify-center min-h-[60vh] px-4">
    <!-- ===== 空状态 ===== -->
    <div v-if="!queue.length" class="text-center py-16">
      <div class="text-6xl mb-4">🎉</div>
      <p class="text-gray-400 text-lg mb-2">没有待复习的词</p>
      <p class="text-gray-500 text-sm">去阅读页的挑战模式试试吧～</p>
    </div>

    <!-- ===== 结算弹窗 ===== -->
    <Transition name="fade-scale">
      <div v-if="showSummary" class="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 backdrop-blur-sm" @click.self="emit('finish')">
        <div class="bg-night-800 border border-brand-purple/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div class="text-5xl mb-4">{{ summaryEmoji }}</div>
          <h3 class="text-xl font-bold text-white mb-2">复习完成！</h3>
          <p class="text-gray-400 mb-6">本轮 {{ queue.length }} 个词 · 记住率 {{ correctRate }}%</p>

          <!-- 统计 -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-green-500/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-green-400">{{ rememberedCount }}</div>
              <div class="text-xs text-gray-400">记得</div>
            </div>
            <div class="bg-red-500/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-red-400">{{ forgottenCount }}</div>
              <div class="text-xs text-gray-400">没记住</div>
            </div>
          </div>

          <button
            @click="emit('finish')"
            class="w-full py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-medium transition-all"
          >
            返回生词本
          </button>
        </div>
      </div>
    </Transition>

    <!-- ===== 闪卡主体 ===== -->
    <template v-if="queue.length && !showSummary">
      <!-- 进度条 -->
      <div class="w-full max-w-md mb-8">
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>{{ currentIndex + 1 }} / {{ queue.length }}</span>
          <span>记住率: {{ runningCorrectRate }}%</span>
        </div>
        <div class="w-full h-1.5 bg-night-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-brand-purple to-pink-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- 卡片容器 -->
      <div
        class="card-container w-full max-w-sm cursor-pointer perspective-1000"
        @click="flipCard"
      >
        <div
          :class="['card-inner relative w-full', { 'is-flipped': isFlipped }]"
          style="transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d;"
          :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
          <!-- A面：正面（单词+音标） -->
          <div class="card-face card-front bg-night-800 border border-night-600/50 rounded-2xl p-8 text-center"
            style="backface-visibility: hidden;">
            <div class="text-4xl font-bold text-white mb-3 leading-relaxed tracking-wide">
              {{ currentWord.word }}
            </div>
            <div v-if="currentWord.phonetic" class="text-lg text-gray-400">
              {{ currentWord.phonetic }}
            </div>
            <div class="mt-6 text-xs text-gray-600">点击翻转查看释义 👆</div>
          </div>

          <!-- B面：反面（释义+原句） -->
          <div class="card-face card-back bg-night-800 border border-brand-purple/30 rounded-2xl p-8 text-center"
            style="backface-visibility: hidden; transform: rotateY(180deg);">
            <!-- 中文释义 -->
            <div class="text-xl font-semibold text-brand-gold mb-4 leading-relaxed">
              {{ displayMeaning }}
            </div>

            <!-- 小说原句 -->
            <div v-if="displayExample" class="mt-4 pt-4 border-t border-night-600/50">
              <div class="text-xs text-gray-500 mb-2">📖 原句语境</div>
              <div class="text-sm text-gray-300 italic leading-relaxed">
                "{{ displayExample }}"
              </div>
            </div>

            <div v-else class="mt-4 text-xs text-gray-600">点击翻转返回 👆</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮（只在B面显示） -->
      <Transition name="fade-up">
        <div v-if="isFlipped" class="flex gap-4 mt-8 w-full max-w-sm">
          <button
            @click.stop="handleRemembered(false)"
            class="flex-1 py-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl font-medium transition-all active:scale-95"
          >
            😕 没记住
          </button>
          <button
            @click.stop="handleRemembered(true)"
            class="flex-1 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 rounded-xl font-medium transition-all active:scale-95"
          >
            ✅ 记住了
          </button>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
/**
 * 闪卡模式 - 重构版
 * A面：word + phonetic → 点击翻转 → B面：meaning + example + 按钮
 */
import { ref, computed } from 'vue'
import { useVocabStore } from '../../stores/vocab.js'

const props = defineProps({
  /** 复习队列（从 getReviewQueue 获取，每个元素含 word/phonetic/meaning/example） */
  queue: { type: Array, default: () => [] },
})

const emit = defineEmits(['finish'])

const vocabStore = useVocabStore()

// 状态
const currentIndex = ref(0)
const isFlipped = ref(false)
const showSummary = ref(false)
const results = ref([]) // [{ remembered: bool }, ...]

// 当前词
const currentWord = computed(() => props.queue[currentIndex.value] || {})

// 显示释义（fallback 防空）
const displayMeaning = computed(() =>
  currentWord.value.meaning || '暂无释义'
)

// 显示原句（截断过长文本）
const displayExample = computed(() => {
  const ex = currentWord.value.example || ''
  if (!ex) return ''
  return ex.length > 80 ? ex.slice(0, 80) + '...' : ex
})

// 进度百分比
const progressPercent = computed(() => {
  if (!props.queue.length) return 0
  return Math.round((currentIndex.value / props.queue.length) * 100)
})

// 实时正确率
const runningCorrectRate = computed(() => {
  if (!results.value.length) return '--'
  const correct = results.value.filter(r => r.remembered).length
  return Math.round((correct / results.value.length) * 100)
})

// 结算数据
const rememberedCount = computed(() => results.value.filter(r => r.remembered).length)
const forgottenCount = computed(() => results.value.filter(r => !r.remembered).length)
const correctRate = computed(() => {
  if (!results.value.length) return 0
  return Math.round((rememberedCount.value / results.value.length) * 100)
})
const summaryEmoji = computed(() => {
  if (correctRate.value >= 80) return '🏆'
  if (correctRate.value >= 50) return '💪'
  return '📚'
})

// 翻转卡片
function flipCard() {
  isFlipped.value = !isFlipped.value
}

// 处理记得/不记得
function handleRemembered(remembered) {
  // 记录结果
  results.value.push({ remembered })

  // 更新store中的掌握等级
  vocabStore.updateWordReview(currentWord.value.word, remembered)

  // 自动翻回正面
  isFlipped.value = false

  // 延迟后切换到下一张
  setTimeout(() => {
    if (currentIndex.value < props.queue.length - 1) {
      currentIndex.value++
    } else {
      // 全部复习完毕 → 弹出结算
      showSummary.value = true
    }
  }, 200)
}

// 键盘支持
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (showSummary.value || !props.queue.length) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!isFlipped.value) flipCard()
    }
    if (e.key === 'ArrowLeft' && isFlipped.value) handleRemembered(false)
    if (e.key === 'ArrowRight' && isFlipped.value) handleRemembered(true)
  })
}
</script>

<style scoped>
.perspective-1000 { perspective: 1000px; }

.card-inner { height: 280px; }
.card-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.card-front { z-index: 2; }
.card-back { z-index: 1; }

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.fade-scale-enter-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.92); }

.fade-up-enter-active { transition: all 0.3s ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(12px); }

/* 卡片悬停效果 */
.card-container:hover .card-inner { box-shadow: none; }
.card-container .card-front,
.card-container .card-back {
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.12);
  transition: box-shadow 0.3s ease;
}
.card-container:hover .card-front,
.card-container:hover .card-back {
  box-shadow: 0 12px 48px rgba(124, 58, 237, 0.22);
}
</style>
