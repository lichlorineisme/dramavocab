<template>
  <div class="choice-review" :class="{ dark }">
    <div class="choice-toolbar">
      <button type="button" class="toolbar-btn" @click="exitToCenter">← 返回复习中心</button>
      <span class="toolbar-progress" v-if="!finished && totalQuestions > 0">
        {{ currentIndex + 1 }} / {{ totalQuestions }}
      </span>
    </div>

    <div v-if="totalQuestions === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>当前没有可出题的单词</h3>
      <p>去阅读页挑战模式做几题，或先在生词本收藏几个词。</p>
      <button type="button" class="primary-btn" @click="exitToCenter">返回复习中心</button>
    </div>

    <template v-else-if="!finished && currentQuestion">
      <div class="question-card">
        <div class="question-word">{{ currentQuestion.word }}</div>
        <div v-if="currentQuestion.phonetic" class="question-phonetic">/ {{ currentQuestion.phonetic }} /</div>
        <div class="question-hint">请选择最合适的中文释义</div>
      </div>

      <div class="options-list">
        <button
          v-for="(opt, idx) in currentOptions"
          :key="`${currentQuestion.word}-${idx}`"
          type="button"
          class="option-btn"
          :class="optionClass(idx)"
          :disabled="answered"
          @click="selectOption(idx)"
        >
          <span class="option-tag">{{ optionTag(idx) }}</span>
          <span class="option-text">{{ opt }}</span>
        </button>
      </div>

      <div v-if="answered" class="answer-feedback" :class="{ correct: lastAnswerCorrect, wrong: !lastAnswerCorrect }">
        <span v-if="lastAnswerCorrect">✅ 回答正确</span>
        <span v-else>❌ 正确答案：{{ currentQuestion.meaning }}</span>
      </div>

      <button v-if="answered" type="button" class="primary-btn next-btn" @click="nextQuestion">
        {{ isLastQuestion ? '查看结果' : '下一题 →' }}
      </button>

      <div class="progress-line">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
      </div>
    </template>

    <div v-else class="summary-card">
      <div class="summary-icon">🎉</div>
      <h3>选择题完成</h3>
      <p>共 {{ totalQuestions }} 题，正确 {{ stats.correct }} 题</p>
      <p class="summary-rate">正确率 {{ accuracyRate }}%</p>
      <button type="button" class="primary-btn" @click="finishRound">返回复习中心</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useVocabStore } from '../../stores/vocab.js'

const props = defineProps({
  queue: { type: Array, default: () => [] },
  dark: { type: Boolean, default: false },
})

const emit = defineEmits(['finish', 'complete', 'exit', 'update', 'error'])
const vocabStore = useVocabStore()

const stableQueue = ref([])
const stableMeaningPool = ref([])
const currentIndex = ref(0)
const answered = ref(false)
const selectedIndex = ref(-1)
const currentOptions = ref([])
const finished = ref(false)
const lastAnswerCorrect = ref(false)
const stats = ref({ correct: 0, wrong: 0 })

const FALLBACK_DISTRACTORS = [
  '拒绝', '接受', '缓慢地', '立刻', '复杂的', '简单的',
  '危险', '机会', '真相', '谎言', '协议', '误会',
]

function normalizeWord(raw) {
  return String(raw || '').trim()
}

function isMeaningPlaceholder(value) {
  const text = String(value || '').trim()
  if (!text) return true
  const placeholders = ['(挑战模式)', '(无)', 'undefined', 'null', 'N/A', '待复习词汇']
  return placeholders.includes(text)
}

function resolveMeaningByStore(word) {
  if (!word || !vocabStore?.getWordByName) return ''
  const found = vocabStore.getWordByName(word)
  return String(found?.meaning || '').trim()
}

function normalizeQueueItem(item) {
  if (typeof item === 'string') {
    const w = normalizeWord(item)
    if (!w) return null
    const storeMeaning = resolveMeaningByStore(w)
    return { word: w, phonetic: '', meaning: storeMeaning || '（暂无释义）' }
  }
  if (!item || typeof item !== 'object') return null

  const word = normalizeWord(item.word || item.rawWord || item.text || item.token)
  if (!word) return null

  const phonetic = String(item.phonetic || item.phonetics || '').trim()
  const rawMeaning = String(item.meaning || item.translation || item.cn || '').trim()
  const storeMeaning = resolveMeaningByStore(word)
  const meaning = !isMeaningPlaceholder(rawMeaning)
    ? rawMeaning
    : (!isMeaningPlaceholder(storeMeaning) ? storeMeaning : '（暂无释义）')

  return { word, phonetic, meaning }
}

function buildMeaningPool(normalizedQueue) {
  const set = new Set()
  for (const q of normalizedQueue) {
    if (!isMeaningPlaceholder(q.meaning)) set.add(q.meaning)
  }
  for (const w of (vocabStore.words || [])) {
    const m = String(w?.meaning || '').trim()
    if (!isMeaningPlaceholder(m)) set.add(m)
  }
  return Array.from(set)
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function buildOptions(question) {
  if (!question) return []
  const correct = question.meaning || '（暂无释义）'

  const distractors = []
  for (const m of shuffle(stableMeaningPool.value)) {
    if (m !== correct && !distractors.includes(m)) {
      distractors.push(m)
    }
    if (distractors.length >= 3) break
  }

  if (distractors.length < 3) {
    for (const fb of shuffle(FALLBACK_DISTRACTORS)) {
      if (distractors.length >= 3) break
      if (fb !== correct && !distractors.includes(fb)) {
        distractors.push(fb)
      }
    }
  }

  while (distractors.length < 3) {
    distractors.push(`干扰项 ${distractors.length + 1}`)
  }

  return shuffle([correct, ...distractors])
}

function resetStepState() {
  answered.value = false
  selectedIndex.value = -1
  lastAnswerCorrect.value = false
}

function prepareQuestion() {
  resetStepState()
  currentOptions.value = buildOptions(currentQuestion.value)
}

function resetRoundFromQueue(rawQueue) {
  const source = Array.isArray(rawQueue) ? rawQueue : []
  const normalized = source.map(normalizeQueueItem).filter(Boolean)
  stableQueue.value = normalized
  stableMeaningPool.value = buildMeaningPool(normalized)
  currentIndex.value = 0
  finished.value = false
  stats.value = { correct: 0, wrong: 0 }
  prepareQuestion()
}

const totalQuestions = computed(() => stableQueue.value.length)
const currentQuestion = computed(() => stableQueue.value[currentIndex.value] || null)
const isLastQuestion = computed(() => currentIndex.value >= totalQuestions.value - 1)
const progressPercent = computed(() => {
  if (totalQuestions.value <= 0) return 0
  const done = currentIndex.value + (answered.value ? 1 : 0)
  return Math.round((done / totalQuestions.value) * 100)
})
const accuracyRate = computed(() => {
  const total = stats.value.correct + stats.value.wrong
  if (!total) return 0
  return Math.round((stats.value.correct / total) * 100)
})

function correctOptionIndex() {
  const correct = currentQuestion.value?.meaning || ''
  return currentOptions.value.findIndex((opt) => opt === correct)
}

function selectOption(idx) {
  if (answered.value || !currentQuestion.value) return

  selectedIndex.value = idx
  answered.value = true
  const isCorrect = idx === correctOptionIndex()
  lastAnswerCorrect.value = isCorrect

  if (isCorrect) stats.value.correct += 1
  else stats.value.wrong += 1

  try {
    vocabStore.updateWordReview(currentQuestion.value.word, isCorrect)
  } catch (error) {
    emit('error', error?.message || '更新复习结果失败')
  }

  emit('update', { word: currentQuestion.value, remembered: isCorrect })
}

function nextQuestion() {
  if (!answered.value) return
  if (isLastQuestion.value) {
    finished.value = true
    return
  }
  currentIndex.value += 1
}

function optionTag(idx) {
  return String.fromCharCode(65 + idx)
}

function optionClass(idx) {
  if (!answered.value) return ''
  const correctIdx = correctOptionIndex()
  if (idx === correctIdx) return 'correct'
  if (idx === selectedIndex.value) return 'wrong'
  return 'dimmed'
}

function finishRound() {
  emit('complete', {
    correct: stats.value.correct,
    wrong: stats.value.wrong,
    total: totalQuestions.value,
  })
  emit('finish')
}

function exitToCenter() {
  emit('exit')
  emit('finish')
}

watch(() => props.queue, (queue) => {
  resetRoundFromQueue(queue)
}, { immediate: true })

watch(currentIndex, () => {
  if (finished.value) return
  if (currentIndex.value >= totalQuestions.value) {
    currentIndex.value = Math.max(totalQuestions.value - 1, 0)
  }
  prepareQuestion()
})
</script>

<style scoped>
.choice-review {
  max-width: 760px;
  margin: 0 auto;
  padding: 12px 0 28px;
  color: #1f2937;
}

.choice-review.dark {
  color: #e5e7eb;
}

.choice-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-btn {
  border: 1px solid rgba(124, 58, 237, 0.28);
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #7c3aed;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
}

.choice-review.dark .toolbar-btn {
  background: rgba(124, 58, 237, 0.16);
  color: #c4b5fd;
  border-color: rgba(124, 58, 237, 0.38);
}

.toolbar-progress {
  font-size: 13px;
  color: #6b7280;
  font-weight: 700;
}

.choice-review.dark .toolbar-progress {
  color: #9ca3af;
}

.question-card {
  border: 1px solid rgba(124, 58, 237, 0.18);
  border-radius: 16px;
  padding: 22px 18px;
  background: rgba(124, 58, 237, 0.06);
  text-align: center;
  margin-bottom: 16px;
}

.choice-review.dark .question-card {
  background: rgba(49, 26, 86, 0.58);
  border-color: rgba(167, 139, 250, 0.24);
}

.question-word {
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 800;
  color: #6d28d9;
}

.choice-review.dark .question-word {
  color: #d8b4fe;
}

.question-phonetic {
  margin-top: 8px;
  font-size: 0.95rem;
  color: #6b7280;
}

.question-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #6b7280;
}

.choice-review.dark .question-phonetic,
.choice-review.dark .question-hint {
  color: #9ca3af;
}

.options-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  background: #ffffff;
  color: #1f2937;
  padding: 13px 14px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  touch-action: manipulation;
}

.choice-review.dark .option-btn {
  background: rgba(24, 17, 44, 0.92);
  color: #e5e7eb;
  border-color: rgba(124, 58, 237, 0.28);
}

.option-btn:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: rgba(124, 58, 237, 0.48);
}

.option-tag {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
  flex-shrink: 0;
}

.choice-review.dark .option-tag {
  background: rgba(167, 139, 250, 0.2);
  color: #ddd6fe;
}

.option-text {
  line-height: 1.45;
  font-weight: 600;
}

.option-btn.correct {
  border-color: rgba(16, 185, 129, 0.62);
  background: rgba(16, 185, 129, 0.1);
}

.option-btn.wrong {
  border-color: rgba(239, 68, 68, 0.65);
  background: rgba(239, 68, 68, 0.1);
}

.option-btn.dimmed {
  opacity: 0.55;
}

.answer-feedback {
  margin-top: 12px;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  font-size: 14px;
}

.answer-feedback.correct {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.answer-feedback.wrong {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.choice-review.dark .answer-feedback.correct {
  color: #6ee7b7;
}

.choice-review.dark .answer-feedback.wrong {
  color: #fca5a5;
}

.primary-btn {
  margin-top: 14px;
  border: none;
  border-radius: 999px;
  padding: 11px 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #7c3aed, #e11d48);
  touch-action: manipulation;
}

.next-btn {
  min-width: 140px;
}

.progress-line {
  margin-top: 16px;
}

.progress-track {
  width: 100%;
  height: 6px;
  border-radius: 99px;
  background: rgba(124, 58, 237, 0.15);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  transition: width 0.25s ease;
}

.summary-card,
.empty-state {
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 16px;
  background: rgba(124, 58, 237, 0.06);
  padding: 26px 18px;
  text-align: center;
}

.choice-review.dark .summary-card,
.choice-review.dark .empty-state {
  background: rgba(49, 26, 86, 0.55);
}

.summary-icon,
.empty-icon {
  font-size: 34px;
  margin-bottom: 8px;
}

.summary-rate {
  font-weight: 800;
  color: #7c3aed;
}

.choice-review.dark .summary-rate {
  color: #d8b4fe;
}

@media (max-width: 640px) {
  .choice-review {
    padding: 8px 0 24px;
  }

  .choice-toolbar {
    margin-bottom: 12px;
    gap: 8px;
  }

  .toolbar-btn {
    font-size: 12px;
    padding: 7px 10px;
    border-radius: 12px;
  }

  .toolbar-progress {
    font-size: 12px;
  }

  .question-card {
    border-radius: 14px;
    padding: 16px 12px;
    margin-bottom: 12px;
  }

  .question-word {
    font-size: 1.62rem;
  }

  .question-phonetic {
    margin-top: 6px;
    font-size: 0.84rem;
  }

  .question-hint {
    margin-top: 8px;
    font-size: 12px;
  }

  .options-list {
    gap: 8px;
  }

  .option-btn {
    min-height: 48px;
    border-radius: 12px;
    padding: 10px 10px;
    gap: 10px;
  }

  .option-tag {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    font-size: 11px;
  }

  .option-text {
    font-size: 13px;
    line-height: 1.42;
  }

  .answer-feedback {
    margin-top: 10px;
    border-radius: 9px;
    padding: 9px 10px;
    font-size: 13px;
    line-height: 1.45;
  }

  .primary-btn {
    width: 100%;
    min-height: 40px;
    margin-top: 10px;
    border-radius: 12px;
  }

  .progress-line {
    margin-top: 12px;
  }

  .summary-card,
  .empty-state {
    border-radius: 14px;
    padding: 20px 12px;
  }
}
</style>
