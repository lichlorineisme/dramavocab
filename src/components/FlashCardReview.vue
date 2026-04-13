<template>
  <div class="flashcard-review">
    <!-- 空状态 -->
    <div v-if="totalWords === 0" class="empty-hint">
      <span>📭</span>
      <p>没有可复习的单词</p>
      <button @click="$emit('exit')" class="exit-btn">← 返回</button>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <div class="card-area" v-if="currentIndex < totalWords">
        <!-- 正面：显示单词 -->
        <Transition name="flip" mode="out-in">
        <div v-if="showAnswer" key="back" class="card card-back">
          <div class="card-word">{{ currentWord.word }}</div>
          <div class="card-phonetic" v-if="currentWord.phonetic">/ {{ currentWord.phonetic }} /</div>
          <div class="card-meaning">{{ currentWord.meaning }}</div>
          <div class="card-example" v-if="currentWord.example">
            <span class="example-label">例句</span>
            {{ currentWord.example }}
          </div>
          <div class="card-actions">
            <button class="action-btn wrong-btn" @click="markWrong">❌ 不记得</button>
            <button class="action-btn correct-btn" @click="markCorrect">✅ 记得</button>
          </div>
        </div>
        <div v-else key="front" class="card card-front" @click="showAnswer = true">
          <div class="card-word">{{ currentWord?.word }}</div>
          <div class="card-hint">点击查看释义 👇</div>
        </div>
      </Transition>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="totalWords > 0">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: ((currentIndex + 1) / totalWords * 100) + '%' }"
        />
      </div>
      <span class="progress-text">{{ currentIndex + 1 }} / {{ totalWords }}</span>
    </div>
    </template>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  words: { type: Array, default: () => [] }
})
const emit = defineEmits(['complete', 'exit', 'update', 'error'])

const currentIndex = ref(0)
const showAnswer = ref(false)
const stats = ref({ correct: 0, wrong: 0 })

const currentWord = computed(() => props.words[currentIndex.value] || {})
const totalWords = computed(() => props.words.length)

function markCorrect() {
  stats.value.correct++
  emit('update', { word: currentWord.value, remembered: true })
  nextCard()
}

function markWrong() {
  stats.value.wrong++
  emit('update', { word: currentWord.value, remembered: false })
  nextCard()
}

function nextCard() {
  if (currentIndex.value >= totalWords.value - 1) {
    emit('complete', stats.value)
    return
  }
  currentIndex.value++
  showAnswer.value = false
}

// TTS 发音
function speak() {
  try {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(currentWord.value.word))
  } catch {}
}
</script>

<style scoped>
.flashcard-review { max-width: 480px; margin: 0 auto; padding: 40px 0; }

/* 空状态 */
.empty-hint {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 20px; text-align: center; color: #9CA3AF;
}
.empty-hint span { font-size: 48px; }
.empty-hint p { font-size: 1rem; }
.exit-btn {
  margin-top: 8px; padding: 8px 24px; font-size: 14px; font-weight: 600;
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 10px; color: #A78BFA; cursor: pointer;
}
.exit-btn:hover { background: rgba(124,58,237,0.15); }

.card-area { perspective: 1000px; min-height: 340px; }
.card {
  cursor: pointer;
  padding: 48px 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  min-height: 320px;
}
.card-front {
  background: linear-gradient(145deg, rgba(124,58,237,0.08), rgba(225,29,72,0.06));
  border: 2px solid rgba(124,58,237,0.18);
}
.card-back {
  background: linear-gradient(145deg, rgba(16,185,129,0.06), rgba(124,58,237,0.04));
  border: 2px solid rgba(16,185,129,0.18);
  cursor: default;
}

.card-word { font-size: 2.2rem; font-weight: 800; color: #C084FC; letter-spacing: 0.02em; }
.card-phonetic { font-size: 0.95em; color: #9CA3AF; font-family: 'SF Mono', Monaco, monospace; }
.card-meaning { font-size: 1.25rem; color: #F3F4F6; line-height: 1.6; padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 10px; }
.card-example {
  font-size: 0.88em; color: #D1D5DB;
  padding: 14px 18px; background: rgba(124,58,237,0.05); border-radius: 12px;
  text-align: left; line-height: 1.7; width: 100%;
}
.example-label { display: block; font-size: 11px; font-weight: 700; color: #F59E0B; margin-bottom: 6px; text-transform: uppercase; }
.card-hint { font-size: 13px; color: #9CA3AF; animation: pulse 2s infinite; }

.card-actions { display: flex; gap: 16px; margin-top: 12px; width: 100%; justify-content: center; }
.action-btn {
  flex: 1; max-width: 160px;
  padding: 14px 24px; font-size: 15px; font-weight: 700;
  border: none; border-radius: 12px; cursor: pointer; transition: all 0.25s;
}
.wrong-btn { background: rgba(239,68,68,0.1); color: #EF4444; }
.correct-btn { background: rgba(16,185,129,0.1); color: #10B981; }
.action-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }

/* 进度 */
.progress-bar { margin-top: 28px; display: flex; align-items: center; gap: 12px; }
.progress-track { flex: 1; height: 6px; background: rgba(156,163,175,0.15); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7C3AED, #A78BFA); border-radius: 3px; transition: width 0.4s ease; }
.progress-text { font-size: 13px; font-weight: 600; color: #9CA3AF; min-width: 48px; text-align: right; }

@keyframes pulse { 50% { opacity: 0.35; } }

.flip-enter-active, .flip-leave-active { transition: all 0.35s ease; }
.flip-enter-from { opacity: 0; transform: rotateY(90deg) scale(0.95); }
.flip-leave-to { opacity: 0; transform: rotateY(-90deg) scale(0.95); }
</style>
