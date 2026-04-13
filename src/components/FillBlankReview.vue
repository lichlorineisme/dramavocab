<template>
  <div class="fillblank-review">
    <div v-if="currentIndex < totalWords" class="fb-card">
      <div class="question-hint">{{ currentWord.meaning || '根据释义拼写' }}</div>
      <div class="input-area">
        <input
          ref="inputRef"
          v-model="userInput"
          type="text"
          class="word-input"
          :class="{ correct: answered && isCorrect, wrong: answered && !isCorrect }"
          placeholder="输入英文单词..."
          autocomplete="off"
          spellcheck="false"
          :disabled="answered"
          @keydown.enter="submitAnswer"
        />
        <button v-if="!answered" class="submit-btn" @click="submitAnswer">确认</button>
      </div>

      <!-- 结果 -->
      <Transition name="fade">
        <div v-if="answered" class="result-feedback" :class="isCorrect ? 'correct' : 'wrong'">
          <span v-if="isCorrect">✅ 正确！</span>
          <span v-else>❌ 答案：<strong>{{ currentWord.word }}</strong></span>
          <button class="tts-btn" @click="speak(currentWord.word)">🔊</button>
        </div>
      </Transition>

      <button
        v-if="answered"
        class="next-btn"
        @click="nextQuestion"
      >{{ currentIndex >= totalWords - 1 ? '完成' : '下一题 →' }}</button>
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

const currentIndex = ref(0)
const userInput = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const inputRef = ref(null)
const stats = ref({ correct: 0, wrong: 0 })

const currentWord = computed(() => props.words[currentIndex.value] || {})
const totalWords = computed(() => props.words.length)
const progress = computed(() => ((currentIndex.value + (answered.value ? 1 : 0)) / Math.max(totalWords.value, 1)) * 100)

function submitAnswer() {
  if (!userInput.value.trim()) return
  const answer = userInput.value.trim().toLowerCase()
  const target = (currentWord.value.word || '').toLowerCase()
  isCorrect.value = answer === target
  answered.value = true

  if (isCorrect.value) {
    stats.value.correct++
    speak(currentWord.value.word)
  } else {
    stats.value.wrong++
    speak(currentWord.value.word)
  }

  // 通知父组件实时更新单词掌握度
  emit('update', { word: currentWord.value, remembered: isCorrect.value })
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

function speak(word) {
  try { window.speechSynthesis.speak(new SpeechSynthesisUtterance(word)) } catch {}
}
</script>

<style scoped>
.fillblank-review { max-width: 480px; margin: 0 auto; padding: 40px 0; text-align: center; }
.fb-card { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.question-hint { font-size: 1.2rem; color: #D1D5DB; padding: 12px 24px; background: rgba(124,58,237,0.06); border-radius: 12px; }

.input-area { display: flex; gap: 10px; align-items: center; justify-content: center; width: 100%; max-width: 320px; }
.word-input {
  flex: 1;
  height: 48px;
  padding: 0 18px;
  font-size: 18px;
  font-family: 'SF Mono', Monaco, monospace;
  text-align: center;
  letter-spacing: 3px;
  background: rgba(255,255,255,0.7);
  border: 2px solid rgba(156,163,175,0.2);
  border-radius: 12px;
  outline: none;
  transition: all 0.25s;
  color: inherit;
}
.dark .word-input { background: rgba(30,27,75,0.8); border-color: rgba(124,58,237,0.2); }
.word-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 4px rgba(124,58,237,0.12); }
.word-input.correct { border-color: #10B981; color: #10B981; font-weight: 700; }
.word-input.wrong { border-color: #EF4444; color: #EF4444; }

.submit-btn {
  height: 48px; padding: 0 28px;
  font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  color: #fff; border: none; border-radius: 12px; cursor: pointer; transition: all 0.25s;
}
.submit-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(124,58,237,0.3); }

.result-feedback {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600;
}
.result-feedback.correct { background: rgba(16,185,129,0.08); color: #10B981; }
.result-feedback.wrong { background: rgba(239,68,68,0.08); color: #EF4444; }
.tts-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px; }

.next-btn {
  padding: 12px 36px; font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  color: #fff; border: none; border-radius: 12px; cursor: pointer; transition: all 0.25s; margin-top: 8px;
}
.next-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

.progress-bar { display: flex; align-items: center; gap: 12px; margin-top: 32px; }
.progress-track { flex: 1; height: 6px; background: rgba(156,163,175,0.15); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7C3AED, #A78BFA); transition: width 0.35s ease; }
.progress-bar span { font-size: 13px; color: #9CA3AF; min-width: 48px; text-align: right; }
</style>
