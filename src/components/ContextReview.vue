<template>
  <div class="context-review">
    <div v-if="currentIndex < totalWords" class="ctx-card">
      <!-- 语境句子（挖空） -->
      <div class="sentence-area">
        <p class="context-sentence" v-html="renderSentence(currentWord)" />
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <input
          ref="inputRef"
          v-model="userInput"
          type="text"
          class="word-input"
          :class="{ correct: answered && isCorrect, wrong: answered && !isCorrect }"
          placeholder="填入正确的单词..."
          autocomplete="off" spellcheck="false"
          :disabled="answered"
          @keydown.enter="submitAnswer"
        />
        <button v-if="!answered" class="submit-btn" @click="submitAnswer">确认</button>
      </div>

      <!-- 结果 -->
      <Transition name="fade">
        <div v-if="answered" class="result-feedback" :class="isCorrect ? 'correct' : 'wrong'">
          {{ isCorrect ? `✅ ${currentWord.word}` : `❌ 正确答案：${currentWord.word}` }}
        </div>
      </Transition>

      <!-- 完整原句 -->
      <div v-if="answered" class="full-sentence">
        📝 {{ currentWord.example || '' }}
      </div>

      <button
        v-if="answered"
        class="next-btn"
        @click="nextQuestion"
      >{{ currentIndex >= totalWords - 1 ? '完成' : '下一题 →' }}</button>
    </div>

    <!-- 无例句的词被过滤后的提示 -->
    <div v-else-if="totalWords === 0 && props.words.length > 0" class="no-context-hint">
      <span>📝</span>
      <p>当前没有带例句的单词</p>
      <p class="hint-sub">建议先使用其他复习模式</p>
    </div>

    <div class="progress-bar">
      <div class="progress-track"><div class="progress-fill" :style="{ width: progress + '%' }" /></div>
      <span>{{ currentIndex + (answered ? 1 : 0) }} / {{ totalWords }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({ words: { type: Array, default: () => [] } })
const emit = defineEmits(['complete', 'exit', 'update', 'error'])

/** 只展示有例句的词 */
const filteredWords = computed(() =>
  (props.words || []).filter(w => w.example && w.example.trim())
)

const currentIndex = ref(0)
const userInput = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const inputRef = ref(null)
const stats = ref({ correct: 0, wrong: 0 })

const currentWord = computed(() => filteredWords.value[currentIndex.value] || {})
const totalWords = computed(() => filteredWords.value.length)
const progress = computed(() => ((currentIndex.value + (answered.value ? 1 : 0)) / Math.max(totalWords.value, 1)) * 100)

/** 将例句中的目标单词替换为空白 */
function renderSentence(word) {
  if (!word?.example) return ''
  const target = word.word
  if (!target) return word.example

  // 用正则匹配单词（忽略大小写，匹配整个词）
  const regex = new RegExp(`\\b${escapeRegex(target)}\\b`, 'i')
  return word.example.replace(regex,
    `<span class="blank-slot">${answered.value ? '' : '_____'}</span>`
  )
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function submitAnswer() {
  if (!userInput.value.trim()) return
  const answer = userInput.value.trim().toLowerCase()
  const target = (currentWord.value.word || '').toLowerCase()
  isCorrect.value = answer === target
  answered.value = true

  if (isCorrect.value) stats.value.correct++
  else stats.value.wrong++

  // 通知父组件实时更新单词掌握度
  emit('update', { word: currentWord.value, remembered: isCorrect.value })

  try {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(currentWord.value.word))
  } catch {}
}

function nextQuestion() {
  if (currentIndex.value >= totalWords.value - 1) {
    emit('complete', stats.value)
    return
  }
  currentIndex.value++
  userInput.value = ''
  answered.value = false
  nextTick(() => inputRef.value?.focus())
}
</script>

<style scoped>
.context-review { max-width: 560px; margin: 0 auto; padding: 32px 0; text-align: center; }
.ctx-card { display: flex; flex-direction: column; align-items: center; gap: 20px; }

.sentence-area {
  width: 100%;
  padding: 28px 24px;
  background: rgba(124,58,237,0.04);
  border: 1px solid rgba(124,58,237,0.12);
  border-radius: 16px;
}
.context-sentence {
  font-size: 1.15rem;
  line-height: 2;
  color: inherit;
}
:deep(.blank-slot) {
  display: inline-block;
  min-width: 80px;
  height: 1.3em;
  border-bottom: 2px solid #7C3AED;
  color: #C084FC;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 2px;
  text-align: center;
  vertical-align: baseline;
}

.input-area { display: flex; gap: 10px; align-items: center; justify-content: center; width: 100%; max-width: 320px; }
.word-input {
  flex: 1;
  height: 46px; padding: 0 18px;
  font-size: 17px; font-family: monospace; text-align: center; letter-spacing: 2px;
  background: rgba(255,255,255,0.7); border: 2px solid rgba(156,163,175,0.2); border-radius: 12px;
  outline: none; transition: all 0.25s; color: inherit;
}
.dark .word-input { background: rgba(30,27,75,0.8); }
.word-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 4px rgba(124,58,237,0.12); }
.word-input.correct { border-color: #10B981; color: #10B981; font-weight: 700; }
.word-input.wrong { border-color: #EF4444; color: #EF4444; }

.submit-btn {
  height: 46px; padding: 0 24px;
  font-size: 14px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  color: #fff; border: none; border-radius: 12px; cursor: pointer;
}
.submit-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(124,58,237,0.3); }

.result-feedback { padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600; }
.result-feedback.correct { background: rgba(16,185,129,0.08); color: #10B981; }
.result-feedback.wrong { background: rgba(239,68,68,0.08); color: #EF4444; }

.full-sentence {
  width: 100%;
  padding: 16px 20px;
  background: rgba(245,158,11,0.04);
  border-left: 3px solid #F59E0B;
  border-radius: 0 10px 10px 0;
  font-size: 0.92em; line-height: 1.8;
  color: #D1D5DB; text-align: left;
}

.next-btn {
  padding: 12px 36px; font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  color: #fff; border: none; border-radius: 12px; cursor: pointer; margin-top: 8px;
}
.next-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

.no-context-hint { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 64px 20px; color: #9CA3AF; }
.hint-sub { font-size: 13px; opacity: 0.6; }

.progress-bar { display: flex; align-items: center; gap: 12px; margin-top: 28px; }
.progress-track { flex: 1; height: 6px; background: rgba(156,163,175,0.15); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7C3AED, #A78BFA); transition: width 0.35s ease; }
.progress-bar span { font-size: 13px; color: #9CA3AF; min-width: 48px; text-align: right; }
</style>
