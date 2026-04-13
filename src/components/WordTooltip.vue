<template>
  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="word"
        class="word-tooltip"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
        @click.stop
      >
        <div class="tooltip-header">
          <span class="tooltip-word" v-text="word.word" />
          <span class="tooltip-phonetic" v-if="word.phonetic">/ {{ word.phonetic }} /</span>
          <button class="tooltip-close" @click="$emit('close')">✕</button>
        </div>
        <div class="tooltip-meaning" v-if="word.meaning">
          {{ word.meaning }}
        </div>
        <div class="tooltip-example" v-if="word.example">
          <span class="example-label">例句</span>
          {{ word.example }}
        </div>
        <div class="tooltip-actions">
          <button class="action-btn tts-btn" @click="speakWord(word)">
            🔊 发音
          </button>
          <button class="action-btn add-btn" @click="$emit('add-to-vocab', word)">
            + 加入生词本
          </button>
        </div>
        <!-- 箭头 -->
        <div class="tooltip-arrow" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  word: { type: Object, default: null },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) }
})
defineEmits(['close', 'add-to-vocab'])

/** 获取最佳年轻男声 */
function getYoungMaleVoice() {
  const voices = window.speechSynthesis.getVoices()
  const preferredVoices = ['Google US English Male', 'Microsoft Mark', 'Alex', 'Daniel', 'Tom']
  for (const preferred of preferredVoices) {
    const found = voices.find(v => v.name.includes(preferred))
    if (found) return found
  }
  const maleVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('male') || v.name.includes('Mark') || v.name.includes('Tom'))
  )
  if (maleVoice) return maleVoice
  return voices.find(v => v.lang.startsWith('en')) || null
}

function speakWord(word) {
  try {
    const utt = new SpeechSynthesisUtterance(word.word)
    utt.lang = 'en-US'
    utt.rate = 0.85
    const voice = getYoungMaleVoice()
    if (voice) utt.voice = voice
    window.speechSynthesis.speak(utt)
  } catch {}
}

// 预加载声音列表
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}
</script>

<style scoped>
.word-tooltip {
  position: fixed;
  z-index: 9999;
  min-width: 260px;
  max-width: 340px;
  padding: 16px;
  background: rgba(30, 27, 75, 0.97);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(124, 58, 237, 0.12);
  transform: translateX(-50%) translateY(-100%);
  margin-top: -12px;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.tooltip-word {
  font-size: 1.15rem;
  font-weight: 700;
  color: #C084FC;
}
.tooltip-phonetic {
  font-size: 0.82em;
  color: #9CA3AF;
  font-family: 'SF Mono', Monaco, monospace;
}
.tooltip-close {
  margin-left: auto;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
}
.tooltip-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.tooltip-meaning {
  font-size: 0.95rem;
  color: #F3F4F6;
  margin-bottom: 10px;
  padding-left: 2px;
  line-height: 1.5;
}

.tooltip-example {
  font-size: 0.84em;
  color: #9CA3AF;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.example-label {
  font-size: 11px;
  font-weight: 600;
  color: #F59E0B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tooltip-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  height: 34px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.tts-btn {
  color: #A78BFA;
  background: rgba(124, 58, 237, 0.12);
}
.tts-btn:hover { background: rgba(124, 58, 237, 0.22); }
.add-btn {
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
}
.add-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

/* 箭头 */
.tooltip-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: rgba(30, 27, 75, 0.97);
  border-right: 1px solid rgba(124, 58, 237, 0.25);
  border-bottom: 1px solid rgba(124, 58, 237, 0.25);
  transform: translateX(-50%) rotate(45deg);
}

/* 动画 */
.tooltip-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tooltip-leave-active {
  transition: all 0.15s ease-in;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-100%) scale(0.9);
}
</style>
