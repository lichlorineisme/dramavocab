<template>
  <div class="dictation-review">
    <div v-if="currentIndex < totalWords" class="dict-card">
      <!-- 播放按钮 -->
      <button
        v-if="!isPlaying"
        class="play-btn"
        @click="playAudio"
      >
        🔊 点击播放发音
      </button>
      <div v-else class="playing-indicator">
        <span class="sound-wave">🔊 正在播放...</span>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <input
          ref="inputRef"
          v-model="userInput"
          type="text"
          class="word-input"
          :class="{ correct: answered && isCorrect, wrong: answered && !isCorrect }"
          placeholder="听音拼写..."
          autocomplete="off" spellcheck="false"
          :disabled="answered || !hasPlayed"
          @keydown.enter="submitAnswer"
        />
        <button v-if="!answered && hasPlayed" class="replay-btn" @click="playAudio">🔄 重听</button>
      </div>

      <!-- 结果 -->
      <Transition name="fade">
        <div v-if="answered" class="result-feedback" :class="isCorrect ? 'correct' : 'wrong'">
          {{ isCorrect ? '✅ 拼写正确！' : `❌ 正确：${currentWord.word}` }}
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
const isPlaying = ref(false)
const hasPlayed = ref(false)
const stats = ref({ correct: 0, wrong: 0 })

const currentWord = computed(() => props.words[currentIndex.value] || {})
const totalWords = computed(() => props.words.length)
const progress = computed(() => ((currentIndex.value + (answered.value ? 1 : 0)) / Math.max(totalWords.value, 1)) * 100)

function playAudio() {
  if (!currentWord.value.word) return
  hasPlayed.value = true
  isPlaying.value = true
  try {
    const utt = new SpeechSynthesisUtterance(currentWord.value.word)
    utt.lang = 'en-US'
    utt.rate = 0.8
    utt.onend = () => { isPlaying.value = false; nextTick(() => inputRef.value?.focus()) }
    window.speechSynthesis.speak(utt)
  } catch {
    isPlaying.value = false
  }
}

function submitAnswer() {
  if (!userInput.value.trim() || !hasPlayed.value) return
  const answer = userInput.value.trim().toLowerCase()
  const target = (currentWord.value.word || '').toLowerCase()
  isCorrect.value = answer === target
  answered.value = true

  if (isCorrect.value) stats.value.correct++
  else stats.value.wrong++

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
  hasPlayed.value = false
  isPlaying.value = false
}
</script>

<style scoped>
.dictation-review { max-width: 480px; margin: 0 auto; padding: 40px 0; text-align: center; }
.dict-card { display: flex; flex-direction: column; align-items: center; gap: 24px; }

.play-btn, .replay-btn {
  width: 120px; height: 120px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  font-size: 14px; font-weight: 700;
  background: linear-gradient(145deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04));
  border: 2px dashed rgba(124,58,237,0.35);
  border-radius: 50%;
  cursor: pointer; color: inherit; transition: all 0.3s; white-space: nowrap;
}
.play-btn:hover { border-style: solid; transform: scale(1.06); box-shadow: 0 8px 32px rgba(124,58,237,0.2); }
.replay-btn { width: auto; height: 44px; border-radius: 22px; padding: 0 24px; }

.playing-indicator .sound-wave { animation: pulse 1s infinite ease-in-out; }
@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

.input-area { display: flex; gap: 10px; align-items: center; justify-content: center; }
.word-input {
  width: 240px; height: 48px; padding: 0 18px;
  font-size: 18px; font-family: monospace; text-align: center; letter-spacing: 3px;
  background: rgba(255,255,255,0.7); border: 2px solid rgba(156,163,175,0.2); border-radius: 12px;
  outline: none; transition: all 0.25s; color: inherit;
}
.dark .word-input { background: rgba(30,27,75,0.8); }
.word-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 4px rgba(124,58,237,0.12); }
.word-input.correct { border-color: #10B981; color: #10B981; font-weight: 700; }
.word-input.wrong { border-color: #EF4444; color: #EF4444; }

.result-feedback { padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600; }
.result-feedback.correct { background: rgba(16,185,129,0.08); color: #10B981; }
.result-feedback.wrong { background: rgba(239,68,68,0.08); color: #EF4444; }

.next-btn {
  padding: 12px 36px; font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  color: #fff; border: none; border-radius: 12px; cursor: pointer; margin-top: 8px;
}
.next-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

.progress-bar { display: flex; align-items: center; gap: 12px; margin-top: 28px; }
.progress-track { flex: 1; height: 6px; background: rgba(156,163,175,0.15); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7C3AED, #A78BFA); transition: width 0.35s ease; }
.progress-bar span { font-size: 13px; color: #9CA3AF; min-width: 48px; text-align: right; }
</style>
