<template>
  <div class="vocab-page" :class="{ dark: store.isDark }">
    <div class="vocab-container">
      <!-- 头部 -->
      <header class="vocab-header">
        <div class="header-row">
          <div>
            <h1 class="page-title">📖 生词本</h1>
            <p class="page-subtitle">共 {{ vocabStore.totalWords }} 个单词</p>
          </div>
          <router-link to="/" class="back-read-btn">← 返回首页</router-link>
        </div>
      </header>

      <!-- 工具栏 -->
      <div class="vocab-toolbar">
        <!-- 搜索框 -->
        <div class="search-box">
          🔍
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索单词..."
            class="search-input"
          />
        </div>

        <!-- 筛选器组 -->
        <div class="filter-group">
          <!-- 熟练度筛选 -->
          <select v-model="masteryFilter" class="filter-select">
            <option value="">全部掌握度</option>
            <option value="0-1">待学习</option>
            <option value="2-3">学习中</option>
            <option value="4-5">已掌握</option>
          </select>

          <!-- 来源筛选 -->
          <select v-model="bookFilter" class="filter-select" v-if="books.length > 0">
            <option value="">全部书籍</option>
            <option v-for="b in books" :key="b.id" :value="b.id">{{ b.title }}</option>
          </select>

          <!-- 导出按钮 -->
          <button class="action-btn export-btn" @click="exportVocab" :disabled="filteredWords.length === 0">
            📥 导出
          </button>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="stats-row">
        <div class="stat-chip" v-for="s in masteryStats" :key="s.label"
             :class="{ active: s.level === masteryFilter }" @click="masteryFilter = masteryFilter === s.level ? '' : s.level">
          {{ s.icon }} {{ s.count }} {{ s.label }}
        </div>
      </div>

      <!-- 单词列表 -->
      <TransitionGroup name="list" tag="ul" class="word-list">
        <li
          v-for="word in filteredWords"
          :key="word.word"
          class="word-card"
          :data-level="getMasteryLevel(word.masteryLevel)"
          @click="showWordDetail = word"
        >
          <div class="word-main">
            <span class="word-text">{{ word.word }}</span>
            <span class="word-phonetic" v-if="word.phonetic">/ {{ word.phonetic }} /</span>
            <span class="word-meaning">{{ word.meaning }}</span>
          </div>
          <div class="word-meta">
            <span class="mastery-badge" :class="'level-' + getMasteryLevel(word.masteryLevel)">
              {{ getMasteryLabel(word.masteryLevel) }}
            </span>
            <span class="wrong-count" v-if="word.wrongCount > 0">
              错{{ word.wrongCount }}次
            </span>
          </div>
          <button class="delete-btn" @click.stop="confirmDelete(word)">✕</button>
        </li>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="filteredWords.length === 0 && !loading" class="empty-state">
        <span class="empty-icon">📚</span>
        <p>还没有收藏任何单词</p>
        <router-link to="/" class="btn-primary">去首页选书 →</router-link>
      </div>

      <!-- 删除确认弹窗 -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
            <div class="modal-content">
              <p>确认删除「<strong>{{ deleteTarget.word }}</strong>」？</p>
              <div class="modal-actions">
                <button class="cancel-btn" @click="deleteTarget = null">取消</button>
                <button class="danger-btn" @click="doDelete">确认删除</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 详情弹窗 -->
      <Teleport to="body">
        <Transition name="slide-up">
          <div v-if="showWordDetail" class="detail-sheet-overlay" @click.self="showWordDetail = null">
            <div class="detail-sheet">
              <div class="sheet-handle"><span class="handle-bar" /></div>
              <div class="sheet-body">
                <h2 class="detail-word">{{ showWordDetail.word }}</h2>
                <p class="detail-phonetic" v-if="showWordDetail.phonetic">/ {{ showWordDetail.phonetic }} /</p>
                <p class="detail-meaning">{{ showWordDetail.meaning }}</p>
                <p class="detail-example" v-if="showWordDetail.example">
                  <span class="label">例句：</span>{{ showWordDetail.example }}
                </p>
                <div class="detail-stats">
                  <div class="stat-item">
                    <span class="stat-label">熟练度</span>
                    <span class="stat-value">{{ getMasteryLabel(showWordDetail.masteryLevel) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">错误次数</span>
                    <span class="stat-value">{{ showWordDetail.wrongCount || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">复习次数</span>
                    <span class="stat-value">{{ showWordDetail.reviewCount || 0 }}</span>
                  </div>
                </div>
                <div class="detail-actions">
                  <button class="tts-action" @click="speakWord(showWordDetail.word)">🔊 发音</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useReadingStore } from '../stores/reading.js'
import { useVocabStore } from '../stores/vocab.js'
import { useBookStore } from '../stores/book.js'

const store = useReadingStore()
const vocabStore = useVocabStore()
const bookStore = useBookStore()

// ===== 搜索 & 筛选 =====
const searchQuery = ref('')
const masteryFilter = ref('')
const bookFilter = ref('')

const loading = ref(false)

/** 过滤后的单词列表 */
const filteredWords = computed(() => {
  let list = vocabStore.words || []

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(w =>
      w.word?.toLowerCase().includes(q) ||
      w.meaning?.includes(q)
    )
  }

  // 掌握度过滤
  if (masteryFilter.value) {
    const [min, max] = masteryFilter.value.split('-').map(Number)
    list = list.filter(w => {
      const level = w.masteryLevel ?? 0
      return level >= min && level <= max
    })
  }

  // 书籍来源过滤
  if (bookFilter.value) {
    list = list.filter(w => String(w.sourceBookId) === String(bookFilter.value))
  }

  return list
})

/** 掌握度统计 */
const masteryStats = computed(() => {
  const words = vocabStore.words || []
  return [
    { label: '待学习', icon: '🔴', count: words.filter(w => (w.masteryLevel ?? 0) <= 1).length, level: '0-1' },
    { label: '学习中', icon: '🟡', count: words.filter(w => (w.masteryLevel ?? 0) >= 2 && (w.masteryLevel ?? 0) <= 3).length, level: '2-3' },
    { label: '已掌握', icon: '🟢', count: words.filter(w => (w.masteryLevel ?? 0) >= 4).length, level: '4-5' }
  ]
})

const books = computed(() => bookStore.books)

// ===== 操作 =====

function speakWord(word) {
  try {
    const utt = new SpeechSynthesisUtterance(word)
    utt.lang = 'en-US'
    utt.rate = 0.85
    // 选择年轻男声
    const voices = window.speechSynthesis.getVoices()
    const preferredVoices = ['Google US English Male', 'Microsoft Mark', 'Alex', 'Daniel', 'Tom']
    for (const preferred of preferredVoices) {
      const found = voices.find(v => v.name.includes(preferred))
      if (found) { utt.voice = found; break }
    }
    window.speechSynthesis.speak(utt)
  } catch {}
}

// 预加载声音列表
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

function exportVocab() {
  const data = filteredWords.value.map(w => ({
    word: w.word,
    phonetic: w.phonetic,
    meaning: w.meaning,
    example: w.example,
    masteryLevel: w.masteryLevel ?? 0
  }))
  // JSON下载
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dramavocab-vocab-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== 删除 =====
const deleteTarget = ref(null)
function confirmDelete(word) { deleteTarget.value = word }
async function doDelete() {
  if (!deleteTarget.value) return
  await vocabStore.removeWord(deleteTarget.value.word)
  deleteTarget.value = null
}

// ===== 详情 =====
const showWordDetail = ref(null)

// ===== 辅助函数 =====
function getMasteryLevel(level) {
  const l = level ?? 0
  if (l <= 1) return 1
  if (l <= 3) return 2
  return 3
}
function getMasteryLabel(level) {
  const l = level ?? 0
  if (l <= 1) return '待学习'
  if (l <= 3) return '学习中'
  return '已掌握'
}
</script>

<style scoped>
.vocab-page {
  min-height: 100vh;
  background: #F9FAFB;
  transition: all 0.3s;
  padding: 24px;
}
.vocab-page.dark { background: #0F0A1A; color: #E5E7EB; }
.vocab-container { max-width: 800px; margin: 0 auto; }

/* 头部 */
.vocab-header { margin-bottom: 20px; }
.header-row { display: flex; align-items: center; justify-content: space-between; }
.back-read-btn {
  font-size: 14px;
  font-weight: 600;
  color: #7C3AED;
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
}
.back-read-btn:hover { background: rgba(124,58,237,0.08); }
.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #E11D48, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-subtitle { font-size: 14px; color: #9CA3AF; margin-top: 4px; }

/* 工具栏 */
.vocab-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(156,163,175,0.25);
  border-radius: 10px;
  flex: 1;
  min-width: 200px;
}
.dark .search-box { background: rgba(30,27,75,0.8); border-color: rgba(124,58,237,0.2); color: inherit; }
.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: inherit;
}
.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.filter-select {
  padding: 8px 12px;
  border: 1px solid rgba(156,163,175,0.25);
  border-radius: 8px;
  background: rgba(255,255,255,0.8);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.dark .filter-select { background: rgba(30,27,75,0.8); border-color: rgba(124,58,237,0.2); color: inherit; }

.action-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.export-btn { background: linear-gradient(135deg, #7C3AED, #A78BFA); color: #fff; }
.export-btn:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
.export-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 统计行 */
.stats-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-chip {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(156,163,175,0.15);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.dark .stat-chip { background: rgba(30,27,75,0.6); border-color: rgba(124,58,237,0.15); }
.stat-chip.active, .stat-chip:hover {
  border-color: #7C3AED;
  background: rgba(124,58,237,0.1);
}

/* 单词列表 */
.word-list { list-style: none; padding: 0; margin: 0; }
.word-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 8px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(156,163,175,0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.dark .word-card { background: rgba(30,27,75,0.5); border-color: rgba(124,58,237,0.1); }
.word-card:hover {
  transform: translateX(4px);
  border-color: rgba(124,58,237,0.3);
  box-shadow: 0 4px 16px rgba(124,58,237,0.08);
}
.word-card[data-level="1"] { border-left: 3px solid #EF4444; }
.word-card[data-level="2"] { border-left: 3px solid #F59E0B; }
.word-card[data-level="3"] { border-left: 3px solid #10B981; }

.word-main {
  flex: 1;
  min-width: 0;
}
.word-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: #C084FC;
}
.word-phonetic {
  font-size: 0.82em;
  color: #9CA3AF;
  font-family: 'SF Mono', Monaco, monospace;
  margin-left: 6px;
}
.word-meaning {
  font-size: 0.88em;
  color: #6B7280;
  margin-left: 8px;
}
.dark .word-meaning { color: #9CA3AF; }

.word-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mastery-badge {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}
.level-1 { background: rgba(239,68,68,0.1); color: #EF4444; }
.level-2 { background: rgba(245,158,11,0.1); color: #F59E0B; }
.level-3 { background: rgba(16,185,129,0.1); color: #10B981; }
.wrong-count { font-size: 12px; color: #EF4444; }

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 6px;
  color: #9CA3AF;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}
.word-card:hover .delete-btn { opacity: 1; }
.delete-btn:hover { background: rgba(239,68,68,0.08); color: #EF4444; }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  text-align: center;
  color: #9CA3AF;
}
.empty-icon { font-size: 56px; }
.btn-primary {
  display: inline-block;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
}
.modal-content {
  padding: 32px;
  background: #fff;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  min-width: 300px;
}
.dark .modal-content { background: #1E174B; color: #E5E7EB; }
.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
.cancel-btn, .danger-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn { background: rgba(156,163,175,0.15); color: #374151; }
.danger-btn { background: #EF4444; color: #fff; }
.danger-btn:hover { transform: scale(1.04); }

/* Detail Sheet */
.detail-sheet-overlay {
  position: fixed; inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.5);
}
.detail-sheet {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  max-height: 70vh;
  background: #131128;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
}
.sheet-handle { display: flex; justify-content: center; padding: 12px 0 4px; }
.handle-bar {
  width: 36px; height: 4px;
  border-radius: 2px; background: rgba(255,255,255,0.15);
}
.sheet-body { padding: 12px 24px 36px; }
.detail-word { font-size: 1.8rem; font-weight: 800; color: #C084FC; }
.detail-phonetic { font-size: 0.92em; color: #9CA3AF; margin-top: 4px; }
.detail-meaning { font-size: 1.1rem; margin-top: 12px; color: #F3F4F6; line-height: 1.5; }
.detail-example { margin-top: 16px; padding: 14px; background: rgba(124,58,237,0.06); border-radius: 12px; line-height: 1.7; color: #D1D5DB; }
.label { color: #F59E0B; font-weight: 700; font-size: 12px; }

.detail-stats { display: flex; gap: 20px; margin-top: 20px; }
.stat-item { text-align: center; }
.stat-label { display: block; font-size: 11px; color: #6B7280; text-transform: uppercase; }
.stat-value { display: block; font-size: 1.2rem; font-weight: 700; color: #C084FC; margin-top: 2px; }

.detail-actions { display: flex; gap: 12px; margin-top: 24px; }
.tts-action, .review-action {
  flex: 1;
  padding: 14px;
  font-size: 15px; font-weight: 700;
  border: none; border-radius: 12px; cursor: pointer; text-decoration: none;
  text-align: center; transition: all 0.2s;
}
.tts-action { color: #A78BFA; background: rgba(124,58,237,0.12); }
.review-action { color: #fff; background: linear-gradient(135deg, #7C3AED, #E11D48); }

/* 动画 */
.list-enter-active { transition: all 0.3s ease; }
.list-leave-active { transition: all 0.2s ease; }
.list-enter-from { opacity: 0; transform: translateY(12px); }
.list-leave-to { opacity: 0; transform: translateX(-20px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active .detail-sheet, .slide-up-leave-active .detail-sheet { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.slide-up-enter-from .detail-sheet, .slide-up-leave-to .detail-sheet { transform: translateY(100%); }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.35s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .vocab-page { padding: 16px; }
  .vocab-toolbar { flex-direction: column; }
  .search-box { min-width: unset; }
  .filter-group { flex-wrap: wrap; }
  .word-card { padding: 12px 14px; }
}
</style>
