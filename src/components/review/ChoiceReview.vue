<template>
  <div class="choice-review flex flex-col items-center justify-center min-h-[60vh] px-4">
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
          <h3 class="text-xl font-bold text-white mb-2">选择题完成！</h3>
          <p class="text-gray-400 mb-6">本轮 {{ queue.length }} 题 · 正确率 {{ correctRate }}%</p>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-green-500/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-green-400">{{ correctCount }}</div>
              <div class="text-xs text-gray-400">正确</div>
            </div>
            <div class="bg-red-500/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-red-400">{{ wrongCount }}</div>
              <div class="text-xs text-gray-400">错误</div>
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

    <!-- ===== 选择题主体 ===== -->
    <template v-if="queue.length && !showSummary">
      <!-- 进度条 -->
      <div class="w-full max-w-md mb-8">
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>第 {{ currentIndex + 1 }} / {{ queue.length }} 题</span>
          <span>正确率: {{ runningAccuracy }}%</span>
        </div>
        <div class="w-full h-1.5 bg-night-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-brand-purple to-pink-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- 题干：单词 -->
      <div class="w-full max-w-lg mb-8 text-center">
        <div class="inline-block px-6 py-3 bg-night-800 border border-night-600/50 rounded-2xl">
          <span class="text-3xl font-bold text-white tracking-wide">{{ currentWord.word }}</span>
          <span v-if="currentWord.phonetic" class="ml-3 text-base text-gray-400">{{ currentWord.phonetic }}</span>
        </div>
        <p class="mt-3 text-sm text-gray-500">请选择正确的中文释义</p>
      </div>

      <!-- 选项列表 -->
      <div class="w-full max-w-lg space-y-3">
        <button
          v-for="(opt, idx) in currentOptions"
          :key="`${currentIndex}-${idx}`"
          @click="selectOption(idx)"
          :disabled="hasAnswered"
          :class="[
            'w-full p-4 rounded-xl text-left transition-all duration-200',
            optionClass(idx)
          ]"
        >
          <span
            :class="['inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mr-3',
              optionLabelClass(idx)]"
          >
            {{ 'ABCD'[idx] }}
          </span>
          <span :class="optionTextClass(idx)">{{ opt }}</span>
        </button>

        <!-- 已回答后的反馈 + 下一题按钮 -->
        <Transition name="fade-up">
          <div v-if="hasAnswered" class="flex justify-center mt-6">
            <button
              @click="nextQuestion"
              class="px-8 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-brand-purple/20"
            >
              {{ isLastQuestion ? '查看结果' : '下一题 →' }}
            </button>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 选择题模式 - 重构版
 * 题干：英文单词 | 选项：1个正确 + 3个干扰项（从队列中随机抽取不同meaning）
 */
import { ref, computed, watch } from 'vue'
import { useVocabStore } from '../../stores/vocab.js'

const props = defineProps({
  /** 复习队列 */
  queue: { type: Array, default: () => [] },
})

const emit = defineEmits(['finish'])

const vocabStore = useVocabStore()

// 状态
const currentIndex = ref(0)
const selectedIndex = ref(-1) // -1=未选, 0-3=选中索引
const showSummary = ref(false)
const results = ref([])

// 当前词
const currentWord = computed(() => props.queue[currentIndex.value] || {})

// 是否是最后一题
const isLastQuestion = computed(() => currentIndex.value >= props.queue.length - 1)

// 是否已回答当前题
const hasAnswered = computed(() => selectedIndex.value >= 0)

// 进度百分比
const progressPercent = computed(() => {
  if (!props.queue.length) return 0
  return Math.round(((currentIndex.value + (hasAnswered.value ? 1 : 0)) / props.queue.length) * 100)
})

// 实时正确率
const runningAccuracy = computed(() => {
  if (!results.value.length) return '--'
  const c = results.value.filter(r => r.isCorrect).length
  return Math.round((c / results.value.length) * 100)
})

// 结算数据
const correctCount = computed(() => results.value.filter(r => r.isCorrect).length)
const wrongCount = computed(() => results.value.filter(r => !r.isCorrect).length)
const correctRate = computed(() => {
  if (!results.value.length) return 0
  return Math.round((correctCount.value / results.value.length) * 100)
})
const summaryEmoji = computed(() => {
  if (correctRate.value >= 80) return '🏆'
  if (correctRate.value >= 60) return '💪'
  if (correctRate.value >= 40) return '📖'
  return '💪'
})

/**
 * 🔑 核心：生成当前题的选项
 * 正确答案 = 当前词的 meaning（fallback 到 "待复习词汇"）
 * 干扰项 = 从 queue 中随机抽取 3 个不同的 meaning
 */
function generateOptions() {
  const word = currentWord.value
  if (!word.word) return []

  // 防呆：meaning 可能为空（旧数据或手动添加的词）
  const correctMeaning = (word.meaning && word.meaning.trim()) || '待复习词汇'

  // 收集所有可用的干扰项 meaning（排除正确答案）
  const distractors = []
  for (const item of props.queue) {
    if (item.word === word.word) continue
    const m = item.meaning?.trim()
    if (m && m !== correctMeaning && m !== '(挑战模式)' && m !== '待复习词汇' && !distractors.includes(m)) {
      distractors.push(m)
    }
  }

  // 随机取3个，不够就重复填充
  const selected = shuffleArray(distractors).slice(0, 3)
  while (selected.length < 3 && distractors.length > 0) {
    const extra = distractors[Math.floor(Math.random() * distractors.length)]
    if (!selected.includes(extra)) selected.push(extra)
  }
  // 如果连3个都没有，用占位符兜底
  while (selected.length < 3) {
    selected.push(`其他释义 ${selected.length + 1}`)
  }

  // 拼接并打乱顺序
  const allOptions = [correctMeaning, ...selected]
  return shuffleArray(allOptions)
}

// 响应式选项（每次切换题目重新生成）
const options = ref([])

// 监听题目切换，重新生成选项
watch(currentIndex, () => {
  selectedIndex.value = -1
  options.value = generateOptions()
}, { immediate: true })

// 当前选项（带防呆）
const currentOptions = computed(() =>
  options.value.length === 4 ? options.value : generateOptions()
)

// Fisher-Yates 洗牌
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 选项样式
function optionClass(idx) {
  if (!hasAnswered.value) {
    return 'bg-night-800/70 border border-night-600/40 hover:border-brand-purple/50 hover:bg-night-800 cursor-pointer'
  }
  const isCorrectIdx = currentOptions.value[idx] === currentWord.value.meaning
  const isSelected = idx === selectedIndex.value

  if (isCorrectIdx) return 'bg-green-500/15 border-2 border-green-500/50'
  if (isSelected && !isCorrectIdx) return 'bg-red-500/15 border-2 border-red-500/50 opacity-60'
  return 'bg-night-800/50 border border-night-600/30 opacity-40'
}

function optionLabelClass(idx) {
  if (!hasAnswered.value) return 'bg-night-700 text-gray-300'
  const isCorrectIdx = currentOptions.value[idx] === currentWord.value.meaning
  const isSelected = idx === selectedIndex.value

  if (isCorrectIdx) return 'bg-green-500 text-white'
  if (isSelected && !isCorrectIdx) return 'bg-red-500 text-white'
  return 'bg-night-700 text-gray-500'
}

function optionTextClass(idx) {
  if (!hasAnswered.value) return 'text-gray-200'
  const isCorrectIdx = currentOptions.value[idx] === currentWord.value.meaning
  const isSelected = idx === selectedIndex.value

  if (isCorrectIdx) return 'text-green-300 font-semibold'
  if (isSelected && !isCorrectIdx) return 'text-red-300'
  return 'text-gray-400'
}

// 选择答案
function selectOption(idx) {
  if (hasAnswered.value) return
  selectedIndex.value = idx

  const isCorrect = currentOptions.value[idx] === currentWord.value.meaning

  // 记录结果
  results.value.push({
    word: currentWord.value.word,
    isCorrect,
    selected: currentOptions.value[idx],
    correct: currentWord.value.meaning,
  })

  // 更新store掌握等级
  vocabStore.updateWordReview(currentWord.value.word, isCorrect)
}

// 下一题或显示结算
function nextQuestion() {
  if (isLastQuestion.value) {
    showSummary.value = true
    return
  }
  currentIndex.value++
}

// 键盘支持
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (showSummary.value || !props.queue.length) return
    const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 }
    const num = e.key.toLowerCase()
    if (keyMap[num] !== undefined && !hasAnswered.value) {
      selectOption(keyMap[num])
    }
    if ((e.key === 'Enter' || e.key === ' ') && hasAnswered.value) {
      nextQuestion()
    }
  })
}
</script>

<style scoped>
.fade-scale-enter-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.92); }

.fade-up-enter-active { transition: all 0.3s ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(12px); }

/* 选项 hover 微动效 */
button:not(:disabled):hover { transform: translateX(4px); }
</style>
