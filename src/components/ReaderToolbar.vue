<template>
  <header class="reader-toolbar" :class="{ 'dark': store.isDark }">
    <div class="toolbar-left">
      <!-- 侧边栏开关 -->
      <button class="tool-btn sidebar-toggle" :class="{ dark: store.isDark }" title="章节目录" @click="$emit('toggleSidebar')">
        ☰
      </button>

      <!-- 章节选择器 -->
      <div class="chapter-selector" ref="chapterMenuRef">
        <button class="chapter-btn" @click="toggleChapterMenu">
          📖 第{{ currentChapterIndex + 1 }}章
          <span class="chevron">▾</span>
        </button>
        <Transition name="dropdown">
          <div v-if="showChapterMenu" class="chapter-dropdown">
            <div class="dropdown-header">📚 目录导航</div>
            <button
              v-for="(ch, idx) in chapters"
              :key="ch.id || idx"
              class="chapter-item"
              :class="{ active: String(ch.id) === String(currentChapterId), completed: store.completedChapters.has(ch.id) }"
              @click="selectChapter(idx)"
            >
              <span class="ch-num">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="ch-title">{{ ch.title }}</span>
              <span v-if="store.completedChapters.has(ch.id)" class="ch-done">✓</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- 上一章/下一章 -->
      <nav class="chapter-nav" v-if="chapters.length > 1">
        <button
          class="nav-btn"
          :disabled="currentChapterIndex === 0"
          @click="$emit('prevChapter')"
        >←</button>
        <button
          class="nav-btn"
          :disabled="currentChapterIndex >= chapters.length - 1"
          @click="$emit('nextChapter')"
        >→</button>
      </nav>
    </div>

    <!-- 工具按钮组 -->
    <div class="tool-group">
      <button
        class="tool-btn"
        :class="{ active: store.ttsEnabled, dark: store.isDark }"
        title="TTS朗读"
        @click="store.ttsEnabled = !store.ttsEnabled; saveSettings()"
      >
        🔊
      </button>
      <button
        class="tool-btn"
        :class="{ active: store.isDark, dark: store.isDark }"
        title="暗夜/护眼模式"
        @click="store.toggleDark()"
      >
        {{ store.isDark ? '🌙' : '☀️' }}
      </button>

      <!-- 字号调节 -->
      <div class="font-menu" ref="fontMenuRef">
        <button class="tool-btn font-toggle" :class="{ dark: store.isDark }" @click="toggleFontMenu">
          Aa
        </button>
        <Transition name="dropdown">
          <div v-if="showFontMenu" class="font-dropdown">
            <span class="font-label">字号：{{ store.fontSize }}px</span>
            <div class="font-controls">
              <button class="font-btn" @click="store.decreaseFontSize()" :disabled="store.fontSize <= 14">A−</button>
              <input
                type="range"
                min="14" max="24" step="2"
                :value="store.fontSize"
                @input="store.fontSize = Number($event.target.value); store.saveSettings()"
                class="font-slider"
              />
              <button class="font-btn" @click="store.increaseFontSize()" :disabled="store.fontSize >= 24">A+</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useReadingStore } from '../stores/reading.js'

const props = defineProps({
  chapters: { type: Array, default: () => [] },
  currentChapterId: { type: [String, Number], default: null }
})

const emit = defineEmits(['prevChapter', 'nextChapter', 'change-chapter', 'toggleSidebar'])

const store = useReadingStore()

// ===== 章节选择器 =====
const showChapterMenu = ref(false)
const chapterMenuRef = ref(null)
function toggleChapterMenu() {
  showChapterMenu.value = !showChapterMenu.value
  showFontMenu.value = false
}

const currentChapterIndex = computed(() => {
  const idx = props.chapters.findIndex(c =>
    String(c.id) === String(props.currentChapterId)
  )
  return idx >= 0 ? idx : 0
})

function selectChapter(idx) {
  const ch = props.chapters[idx]
  if (ch && String(ch.id) !== String(props.currentChapterId)) {
    emitChangeChapter(ch.id)
  }
  showChapterMenu.value = false
}

function emitChangeChapter(chapterId) {
  emit('change-chapter', chapterId)
}

// ===== 字号菜单 =====
const showFontMenu = ref(false)
const fontMenuRef = ref(null)
function toggleFontMenu() {
  showFontMenu.value = !showFontMenu.value
  showChapterMenu.value = false
}

function saveSettings() {
  store.saveSettings()
}

// ===== 点击外部关闭菜单 =====
function handleClickOutside(e) {
  if (chapterMenuRef.value && !chapterMenuRef.value.contains(e.target)) {
    showChapterMenu.value = false
  }
  if (fontMenuRef.value && !fontMenuRef.value.contains(e.target)) {
    showFontMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.reader-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(15, 10, 26, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(124, 58, 237, 0.15);
  flex-wrap: nowrap;
}
.reader-toolbar.dark { color: #E5E7EB; }

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.sidebar-toggle { font-size: 16px; }
/* 章节选择器 */
.chapter-selector { position: relative; }
.chapter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.chapter-btn:hover { background: rgba(124, 58, 237, 0.25); }
.chevron { font-size: 10px; opacity: 0.6; }

.chapter-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  background: rgba(30, 27, 75, 0.98);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 200;
  padding: 8px;
}
.dropdown-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #F59E0B;
  padding: 6px 10px 8px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.12);
  margin-bottom: 4px;
}
.chapter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  color: #D1D5DB;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.chapter-item:hover { background: rgba(124, 58, 237, 0.12); }
.chapter-item.active { background: rgba(124, 58, 237, 0.2); color: #C084FC; font-weight: 600; }
.chapter-item.completed .ch-done { color: #10B981; }
.ch-num { font-size: 11px; font-weight: 700; color: #6B7280; min-width: 22px; }
.ch-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ch-done { font-size: 14px; }

/* 章节导航 */
.chapter-nav { display: flex; gap: 2px; }
.nav-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: inherit;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-btn:hover:not(:disabled) { background: rgba(124, 58, 237, 0.2); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* 模式切换 */
.mode-switcher {
  display: flex;
  gap: 3px;
  background: rgba(255,255,255,0.04);
  padding: 3px;
  border-radius: 10px;
  flex-shrink: 0;
}
.mode-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}
.mode-btn:hover { color: #D1D5DB; }
.mode-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

/* 工具按钮组 */
.tool-group {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;
}
.tool-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #9CA3AF;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.tool-btn:hover { background: rgba(124, 58, 237, 0.12); color: #D1D5DB; }
.tool-btn.active { background: rgba(124, 58, 237, 0.18); color: #C084FC; }

/* 字号菜单 */
.font-menu { position: relative; }
.font-toggle { font-family: Georgia, serif; font-weight: 700; font-size: 13px; }
.font-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 220px;
  padding: 14px;
  background: rgba(30, 27, 75, 0.98);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 200;
}
.font-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  margin-bottom: 10px;
}
.font-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.font-btn {
  width: 30px;
  height: 30px;
  font-size: 14px;
  font-weight: 700;
  color: inherit;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.font-btn:hover:not(:disabled) { background: rgba(124, 58, 237, 0.22); }
.font-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.font-slider {
  flex: 1;
  accent-color: #7C3AED;
  height: 4px;
}

/* 下拉动画 */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

/* 移动端适配 */
@media (max-width: 640px) {
  .reader-toolbar { gap: 4px; padding: 8px 10px; }
  .mode-btn { padding: 5px 8px; font-size: 11px; }
  .mode-switcher { gap: 2px; padding: 2px; }
  .tool-btn { width: 30px; height: 30px; font-size: 13px; }
  .chapter-btn { font-size: 12px; padding: 5px 8px; }
}
</style>
