<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="word" class="sheet-overlay" @click.self="$emit('close')">
        <div class="sheet-panel">
          <!-- 拖拽条 -->
          <div class="sheet-handle">
            <span class="handle-bar" />
          </div>
          <!-- 内容 -->
          <div class="sheet-body">
            <div class="sheet-header">
              <span class="sheet-word" v-text="word.word" />
              <span class="sheet-phonetic" v-if="word.phonetic">/ {{ word.phonetic }} /</span>
            </div>

            <div class="sheet-meaning" v-if="word.meaning">
              {{ word.meaning }}
            </div>

            <div class="sheet-example" v-if="word.example">
              <div class="example-label">例句</div>
              {{ word.example }}
            </div>

            <div class="sheet-actions">
              <button class="action-btn tts-btn" @click="speakWord(word)">
                🔊 发音
              </button>
              <button
                class="action-btn add-btn"
                @click="$emit('add-to-vocab', word)"
              >
                + 加入生词本
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  word: { type: Object, default: null }
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
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
}
.sheet-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: #131128;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
}
.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
}
.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.15);
}

.sheet-body {
  padding: 12px 24px 32px;
}
.sheet-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}
.sheet-word {
  font-size: 1.6rem;
  font-weight: 800;
  color: #C084FC;
}
.sheet-phonetic {
  font-size: 0.9em;
  color: #9CA3AF;
  font-family: 'SF Mono', Monaco, monospace;
}

.sheet-meaning {
  font-size: 1.05rem;
  color: #F3F4F6;
  line-height: 1.6;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.15);
}

.sheet-example {
  margin-top: 16px;
  padding: 14px 16px;
  background: rgba(124, 58, 237, 0.06);
  border-radius: 12px;
  line-height: 1.7;
  color: #D1D5DB;
  font-size: 0.94rem;
}
.example-label {
  font-size: 11px;
  font-weight: 600;
  color: #F59E0B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.sheet-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.action-btn {
  flex: 1;
  height: 46px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
}
.tts-btn {
  color: #A78BFA;
  background: rgba(124, 58, 237, 0.12);
}
.tts-btn:active { background: rgba(124, 58, 237, 0.22); }
.add-btn {
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
}
.add-btn:active {
  transform: scale(0.97);
  box-shadow: none;
}

/* 动画 */
.sheet-enter-active .sheet-panel {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sheet-leave-active .sheet-panel {
  transition: transform 0.25s ease-in;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
.sheet-enter-active { transition: opacity 0.35s; }
.sheet-leave-active { transition: opacity 0.2s; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .sheet-panel {
    max-height: 78vh;
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
  }
  .sheet-body {
    padding: 10px 18px calc(28px + env(safe-area-inset-bottom));
  }
  .sheet-header {
    flex-wrap: wrap;
  }
  .sheet-word {
    font-size: 1.4rem;
  }
  .sheet-actions {
    flex-direction: column;
    gap: 10px;
  }
  .action-btn {
    height: 42px;
    font-size: 14px;
  }
}
</style>
