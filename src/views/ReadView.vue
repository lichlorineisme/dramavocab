<template>
  <div class="read-page" :class="{ dark: store.isDark, mobile: isMobile }">
    <!-- 顶部首页入口 -->
    <div class="page-top-bar" :class="{ dark: store.isDark }">
      <router-link to="/" class="back-home-link">← 返回首页</router-link>
      <div v-if="book" class="page-top-book">
        {{ book.title }}
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <ReaderToolbar
      :chapters="chapters"
      :current-chapter-id="currentChapterId"
      @prev-chapter="goPrevChapter"
      @next-chapter="goNextChapter"
      @change-chapter="goChapter"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- Tab 切换栏：阅读 / 单词本 -->
    <div class="tab-bar" :class="{ dark: store.isDark }">
      <div class="tab-switcher">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'reading' }"
          @click="activeTab = 'reading'"
        >
          📖 阅读
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'vocab' }"
          @click="activeTab = 'vocab'"
        >
          📝 单词本
        </button>
      </div>
    </div>

    <!-- ========== 阅读Tab ========== -->
    <template v-if="activeTab === 'reading'">
      <!-- 模式切换栏 -->
      <div class="mode-bar" :class="{ dark: store.isDark }">
        <div class="mode-switcher-large">
          <button
            v-for="m in modes"
            :key="m.id"
            class="mode-btn-large"
            :class="{ active: store.mode === m.id }"
            @click="switchReadingMode(m.id)"
          >
            {{ m.icon }} {{ m.label }}
          </button>
        </div>
        <div class="mode-hint">
          {{ store.mode === 'immersive' ? '点击高亮词查看释义' : store.mode === 'perspective' ? '单词自动显示释义' : '填空检验记忆' }}
        </div>
      </div>

      <!-- 主体：侧边栏 + 阅读区 -->
      <div class="read-layout">
        <!-- 章节目录侧边栏 -->
        <Transition name="sidebar">
          <aside v-if="showSidebar" class="chapter-sidebar" :class="{ 'dark': store.isDark }">
            <div class="sidebar-header">
              <h3>📑 目录</h3>
              <button class="sidebar-close" @click="showSidebar = false">✕</button>
            </div>
            <div class="sidebar-book-info">
              <span v-if="book">{{ book.emoji || '📖' }}</span> {{ book?.title }}
            </div>
            <nav class="chapter-nav-list">
              <a
                v-for="(ch, idx) in chapters"
                :key="ch.id || idx"
                href="javascript:void(0)"
                class="sidebar-ch-item"
                :class="{ active: String(ch.id) === String(currentChapterId), completed: store.completedChapters.has(ch.id) }"
                @click="goChapter(ch.id)"
              >
                <span class="s-ch-num">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span class="s-ch-title">{{ ch.title }}</span>
                <span class="s-ch-meta">
                  <span v-if="ch.vocabList" class="s-vocab-count">{{ ch.vocabList.length }}词</span>
                  <span v-if="store.completedChapters.has(ch.id)" class="s-done">✓</span>
                </span>
              </a>
            </nav>
            <div class="sidebar-footer">
              <router-link to="/" class="back-home-btn">🏠 返回首页</router-link>
            </div>
          </aside>
        </Transition>

        <!-- 侧边遮罩（移动端） -->
        <div v-if="showSidebar && isMobile" class="sidebar-overlay" @click="showSidebar = false" />

        <!-- 阅读内容区 -->
        <main class="reader-main" ref="readerMainRef" @scroll="handleScroll">
          <ReaderContent
            v-if="currentChapter && currentChapter.paragraphs && currentChapter.paragraphs.length > 0"
            :chapter="currentChapter"
            :book="book"
            :chapters="chapters"
            @next-chapter="goNextChapter"
            @prev-chapter="goPrevChapter"
            @complete="onChapterComplete"
          />
          <!-- 加载中 -->
          <div v-else-if="loading || bookStore.books.length === 0" class="loading-state">
            <div class="spinner" /> 正在加载章节...
          </div>
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <span class="empty-icon">📖</span>
            <p>请选择一个章节开始阅读</p>
            <p v-if="!book" class="empty-hint">未找到书籍 (ID: {{ route.params.bid }})</p>
            <p v-else-if="chapters.length === 0" class="empty-hint">该书籍暂无章节内容</p>
            <p v-else-if="currentChapter && (!currentChapter.paragraphs || currentChapter.paragraphs.length === 0)" class="empty-hint">
              章节「{{ currentChapter.title }}」暂无段落内容
            </p>
            <router-link to="/" class="btn-link">返回首页 →</router-link>
          </div>
        </main>
      </div>

      <!-- 底部导航栏 -->
      <nav class="bottom-nav">
        <button class="bottom-nav-btn" @click="toggleSidebar">☰ 目录</button>
        <button class="bottom-nav-btn" :disabled="!hasPrev" @click="goPrevChapter">← 上一章</button>
        <button class="bottom-nav-btn" :disabled="!hasNext" @click="goNextChapter">下一章 →</button>
      </nav>
    </template>

    <!-- ========== 单词本Tab ========== -->
    <template v-else>
      <VocabularyPanel @close="activeTab = 'reading'" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReadingStore } from '../stores/reading.js'
import { useBookStore } from '../stores/book.js'
import ReaderContent from '../components/ReaderContent.vue'
import ReaderToolbar from '../components/ReaderToolbar.vue'
import VocabularyPanel from '../components/VocabularyPanel.vue'
import { trackEvent, EVENT } from '../utils/analytics.js'

const route = useRoute()
const router = useRouter()
const store = useReadingStore()
const bookStore = useBookStore()

const readerMainRef = ref(null)
const loading = ref(false)
const hintDismissed = ref(false)
const isMobile = ref(false)

// ===== Tab 切换 =====
const activeTab = ref('reading')

// ===== 侧边栏状态 =====
const showSidebar = ref(false)
function toggleSidebar() { showSidebar.value = !showSidebar.value }

function handleViewportChange() {
  const mobile = window.innerWidth < 768
  isMobile.value = mobile
  showSidebar.value = !mobile
}

/** 切换阅读模式 + 埋点 */
function switchReadingMode(modeId) {
  const prevMode = store.mode
  store.setMode(modeId)
  if (prevMode !== modeId) {
    trackEvent(EVENT.MODE_SWITCH, {
      from_mode: prevMode,
      to_mode: modeId,
      book_id: route.params.bid,
    })
  }
}

// ===== 三档模式数据 =====
const modes = [
  { id: 'immersive', icon: '🧠', label: '沉浸' },
  { id: 'perspective', icon: '👁️', label: '透视' },
  { id: 'challenge', icon: '✏️', label: '挑战' }
]

// ===== 数据获取 =====

/** 当前书籍 */
const book = computed(() => {
  const bid = route.params.bid
  if (!bid) return null
  return bookStore.books.find(b => String(b.id) === String(bid)) || null
})

/** 所有章节 */
const chapters = computed(() => {
  const b = book.value
  if (!b) return []
  return Array.isArray(b.chapters) ? b.chapters : []
})

/** 当前章节ID（规范化） */
const currentChapterId = computed(() => {
  const cid = route.params.cid
  if (!cid) return ''

  const normalizedCid = String(cid)
  // 优先当作真实章节ID匹配，避免把 "1" 误当成数组下标
  const byId = chapters.value.find(c => String(c.id) === normalizedCid)
  if (byId) return normalizedCid

  // 如果确实传的是数组索引（0-based），再做兜底转换
  const numIdx = Number(normalizedCid)
  if (!Number.isNaN(numIdx) && numIdx >= 0 && numIdx < chapters.value.length) {
    const ch = chapters.value[numIdx]
    return ch?.id != null ? String(ch.id) : normalizedCid
  }
  return normalizedCid
})

/** 当前章节数据（带fallback） */
const currentChapter = computed(() => {
  const cid = currentChapterId.value
  // 优先按ID匹配
  const byId = chapters.value.find(c => String(c.id) === cid)
  if (byId) return byId
  // fallback：取第一章
  if (chapters.value.length > 0 && !cid) return chapters.value[0]
  return null
})

const hasPrev = computed(() => chapterIndex.value > 0)
const hasNext = computed(() => {
  const idx = chapterIndex.value
  return idx >= 0 && idx < chapters.value.length - 1
})

const chapterIndex = computed(() => {
  const cid = currentChapterId.value
  if (!cid || chapters.value.length === 0) return -1
  const byId = chapters.value.findIndex(c => String(c.id) === String(cid))
  if (byId >= 0) return byId
  // fallback: 如果cid是数字索引
  const numIdx = Number(cid)
  if (!isNaN(numIdx) && numIdx >= 0 && numIdx < chapters.value.length) return numIdx
  return -1
})

// ===== 导航操作 =====

function goNextChapter() {
  if (!hasNext.value) return
  saveScroll()
  const nextCh = chapters.value[chapterIndex.value + 1]
  if (nextCh) {
    router.push({
      name: 'Reading',
      params: {
        bid: String(route.params.bid),
        cid: String(nextCh.id ?? chapterIndex.value + 1),
      }
    })
  }
}

function goPrevChapter() {
  if (!hasPrev.value) return
  saveScroll()
  const prevCh = chapters.value[chapterIndex.value - 1]
  if (prevCh) {
    router.push({
      name: 'Reading',
      params: {
        bid: String(route.params.bid),
        cid: String(prevCh.id ?? chapterIndex.value - 1),
      }
    })
  }
}

function goChapter(chapterId) {
  saveScroll()
  router.push({
    name: 'Reading',
    params: {
      bid: String(route.params.bid),
      cid: String(chapterId),
    }
  })
  if (window.innerWidth < 768) showSidebar.value = false
}

function onChapterComplete() {
  console.log('✅ 章节挑战完成！')
}

// ===== 滚动 & 进度保存 =====

let scrollTimer = null
function handleScroll() {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => { saveScroll() }, 500)
}

function saveScroll() {
  const el = readerMainRef.value
  if (el) store.saveScrollPosition(el.scrollTop)
}

function restoreScroll() {
  const pos = store.loadScrollPosition(route.params.bid, route.params.cid)
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = readerMainRef.value
      if (el) el.scrollTop = pos > 0 ? pos : 0
    })
  })
}

// ===== 生命周期 =====

onMounted(async () => {
  handleViewportChange()
  window.addEventListener('resize', handleViewportChange)

  // 书籍数据已在 store 中静态初始化（books = ref([BOOK_DATA, BOOK2_DATA, BOOK3_DATA]）
  // 无需异步 fetch，防御性检查已足够
  // if (bookStore.books.length === 0) { await bookStore.fetchBooks() }
  // 如果没有cid参数，自动跳转到第一章
  if (!route.params.cid && chapters.value.length > 0) {
    const firstCh = chapters.value[0]
    if (firstCh?.id) {
      router.replace({
        name: 'Reading',
        params: {
          bid: String(route.params.bid),
          cid: String(firstCh.id),
        }
      })
    }
  }
  if (route.params.bid) store.setCurrentBook(String(route.params.bid))
  if (route.params.cid) store.setCurrentChapter(String(route.params.cid))
  // 进入阅读页默认回到沉浸模式，保持主链路一致
  store.setMode('immersive')
  restoreScroll()
  // 桌面端默认展开侧边栏，移动端默认收起
  showSidebar.value = window.innerWidth >= 768

  // ===== Analytics: 漏斗第3步 — 进入阅读页 =====
  trackEvent(EVENT.READING_ENTER, {
    book_id: route.params.bid,
    book_name: book.value?.title || 'unknown',
    chapter_id: route.params.cid,
    chapter_index: chapters.value.findIndex(ch => String(ch.id) === String(route.params.cid)) + 1,
    total_chapters: chapters.value.length,
  })
})

watch(() => [route.params.bid, route.params.cid], (newVal, oldVal) => {
  hintDismissed.value = false
  activeTab.value = 'reading'
  if (newVal[0]) store.setCurrentBook(String(newVal[0]))
  if (newVal[1]) store.setCurrentChapter(String(newVal[1]))
  // 切书/切章时回到沉浸模式，避免延续上一章挑战态
  if (!oldVal || newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
    store.setMode('immersive')
  }
  nextTick(restoreScroll)
  // 切章节时也追踪（同本书的不同章）
  if (oldVal && newVal[1] !== oldVal[1]) {
    trackEvent(EVENT.READING_ENTER, {
      book_id: newVal[0],
      book_name: book.value?.title || 'unknown',
      chapter_id: newVal[1],
      chapter_index: chapters.value.findIndex(ch => String(ch.id) === String(newVal[1])) + 1,
      total_chapters: chapters.value.length,
      source: 'chapter_switch',
    })
  }
})

onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  window.removeEventListener('resize', handleViewportChange)
})
</script>

<style scoped>
.read-page {
  min-height: 100vh;
  display: flex; flex-direction: column;
  --reader-bg: #F9FAFB;
  --reader-surface: rgba(255, 255, 255, 0.94);
  --reader-surface-strong: rgba(255, 255, 255, 0.98);
  --reader-text: #1F2937;
  --reader-muted: #6B7280;
  --reader-soft: #9CA3AF;
  --reader-border: rgba(124, 58, 237, 0.10);
  --reader-border-strong: rgba(124, 58, 237, 0.16);
  --reader-panel: #FFFFFF;
  --reader-toolbar-top: 52px;
  --reader-tabbar-top: 104px;
  --reader-modebar-top: 156px;
  background: var(--reader-bg);
  color: var(--reader-text);
  transition: background-color 0.3s;
}
.read-page.dark {
  --reader-bg: #0F0A1A;
  --reader-surface: rgba(15, 10, 26, 0.96);
  --reader-surface-strong: rgba(15, 10, 26, 0.99);
  --reader-text: #E5E7EB;
  --reader-muted: #9CA3AF;
  --reader-soft: #C4B5FD;
  --reader-border: rgba(124, 58, 237, 0.14);
  --reader-border-strong: rgba(124, 58, 237, 0.22);
  --reader-panel: #1E174B;
}

/* ===== 首页入口 ===== */
.page-top-bar {
  position: sticky;
  top: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
  background: var(--reader-surface);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--reader-border);
}
.page-top-book {
  font-size: 13px;
  font-weight: 700;
  color: var(--reader-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Tab 切换栏 ===== */
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  background: var(--reader-surface-strong);
  border-bottom: 1px solid var(--reader-border);
  backdrop-filter: blur(8px);
  position: sticky;
  top: var(--reader-tabbar-top);
  z-index: 50;
}
.tab-bar.dark {
  background: var(--reader-surface-strong);
  border-bottom-color: var(--reader-border);
}
.back-home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--reader-text);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s;
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid var(--reader-border);
}
.back-home-link:hover {
  background: rgba(124, 58, 237, 0.14);
  color: #A855F7;
}

.tab-switcher {
  display: flex;
  gap: 4px;
  background: rgba(124,58,237,0.06);
  padding: 3px;
  border-radius: 10px;
}
.tab-btn {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 700;
  color: var(--reader-muted);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
}
.tab-btn:hover { color: var(--reader-soft); }
.tab-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  box-shadow: 0 2px 8px rgba(124,58,237,0.25);
}

/* ===== 模式切换栏 ===== */
.mode-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 24px;
  background: var(--reader-surface);
  border-bottom: 1px solid var(--reader-border);
  backdrop-filter: blur(8px);
  position: sticky;
  top: var(--reader-modebar-top);
  z-index: 45;
}
.mode-bar.dark {
  background: var(--reader-surface);
  border-bottom-color: var(--reader-border);
}

.mode-switcher-large {
  display: flex;
  gap: 8px;
  background: rgba(124,58,237,0.04);
  padding: 4px;
  border-radius: 12px;
}

.mode-btn-large {
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 700;
  color: var(--reader-muted);
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}
.mode-btn-large:hover {
  color: var(--reader-soft);
  background: rgba(255,255,255,0.3);
}
.mode-btn-large.active {
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  box-shadow: 0 4px 12px rgba(124,58,237,0.25);
}

.mode-hint {
  font-size: 12px;
  color: var(--reader-soft);
  max-width: 180px;
  text-align: right;
}

/* ===== 布局 ===== */
.read-layout { display: flex; flex: 1; position: relative; overflow: hidden; }

/* ===== 章节目录侧边栏 ===== */
.chapter-sidebar {
  width: 280px; min-width: 280px;
  display: flex; flex-direction: column;
  background: var(--reader-surface-strong);
  border-right: 1px solid var(--reader-border);
  overflow-y: auto; z-index: 60;
  flex-shrink: 0;
}
.chapter-sidebar.dark {
  background: var(--reader-surface-strong);
  border-right-color: var(--reader-border);
}

.sidebar-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--reader-border);
}
.sidebar-header h3 { font-size: 15px; font-weight: 700; color: #C084FC; margin: 0; }
.sidebar-close {
  width: 28px; height: 28px; font-size: 16px;
  background: rgba(156,163,175,0.08); border: none; border-radius: 8px;
  cursor: pointer; color: inherit; transition: all 0.2s;
  display: none;
}
.sidebar-close:hover { background: rgba(225,29,72,0.1); color: #E11D48; }

.sidebar-book-info {
  padding: 10px 20px; font-size: 13px; font-weight: 600;
  color: var(--reader-muted); border-bottom: 1px solid rgba(156,163,175,0.06);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dark .sidebar-book-info { color: var(--reader-muted); }

.chapter-nav-list { padding: 8px 10px; flex: 1; overflow-y: auto; }
.sidebar-ch-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px;
  text-decoration: none; color: inherit;
  border-radius: 10px; transition: all 0.15s; margin-bottom: 2px;
}
.sidebar-ch-item:hover { background: rgba(124,58,237,0.06); }
.sidebar-ch-item.active { background: rgba(124,58,237,0.12); color: #C084FC; font-weight: 600; }
.s-ch-num { font-size: 11px; font-weight: 800; color: var(--reader-muted); min-width: 24px; }
.sidebar-ch-item.active .s-ch-num { color: #A78BFA; }
.s-ch-title { flex: 1; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.s-ch-meta { display: flex; align-items: center; gap: 4px; }
.s-vocab-count {
  font-size: 10px; color: #F59E0B; font-weight: 600;
  background: rgba(245,158,11,0.08); padding: 1px 6px; border-radius: 4px;
}
.s-done { font-size: 14px; color: #10B981; }

.sidebar-footer { padding: 14px 20px; border-top: 1px solid rgba(156,163,175,0.06); }
.back-home-btn {
  display: block; text-align: center; padding: 8px; font-size: 13px; font-weight: 600;
  color: var(--reader-muted); text-decoration: none;
  border: 1px dashed rgba(156,163,175,0.15); border-radius: 8px;
  transition: all 0.2s;
}
.back-home-btn:hover { color: #7C3AED; border-color: rgba(124,58,237,0.25); background: rgba(124,58,237,0.04); }

/* 遮罩 */
.sidebar-overlay { 
  position: fixed; 
  inset: var(--reader-toolbar-top, 52px) 0 0 0; 
  background: rgba(0,0,0,0.3); 
  z-index: 55;
}

/* ===== 内容区 ===== */
.reader-main {
  flex: 1; overflow-y: auto;
  -webkit-overflow-scrolling: touch; scroll-behavior: smooth;
  background: var(--reader-bg);
}

/* 加载 & 空状态 */
.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 80px 20px; font-size: 15px; color: var(--reader-muted);
}
.spinner {
  width: 22px; height: 22px;
  border: 2.5px solid rgba(124,58,237,0.2); border-top-color: #7C3AED;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 100px 20px; text-align: center;
}
.empty-icon { font-size: 48px; }
.btn-link { font-size: 14px; font-weight: 600; color: #7C3AED; text-decoration: none; transition: opacity 0.2s; }
.btn-link:hover { opacity: 0.75; }
.empty-hint { font-size: 12px; color: #F59E0B; margin-top: -8px; }

/* 底部导航 */
.bottom-nav {
  position: sticky; bottom: 0; z-index: 50;
  display: flex; justify-content: space-around; align-items: center;
  padding: 10px 16px; background: var(--reader-surface-strong); backdrop-filter: blur(10px);
  border-top: 1px solid var(--reader-border);
}
.dark .bottom-nav { background: var(--reader-surface-strong); border-top-color: var(--reader-border); }
.bottom-nav-btn {
  padding: 8px 14px; font-size: 12px; font-weight: 600; color: inherit;
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.18);
  border-radius: 8px; cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap;
}
.bottom-nav-btn:hover:not(:disabled) { background: rgba(124,58,237,0.16); }
.bottom-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* 底部导航 — 移动端 */

/* 动画 */
.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-leave-active { transition: all 0.2s ease-in; }
.slide-up-enter-from, .slide-leave-to { transform: translateX(-50%) translateY(24px); opacity: 0; }

.sidebar-enter-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.sidebar-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.sidebar-enter-from { transform: translateX(-20px); opacity: 0; }
.sidebar-leave-to { transform: translateX(-20px); opacity: 0; }

/* 移动端 */
@media (max-width: 767px) {
  .read-page {
    --reader-toolbar-top: 46px;
    --reader-tabbar-top: 92px;
    --reader-modebar-top: 138px;
  }
  .page-top-bar {
    padding: 8px 12px;
    gap: 8px;
  }
  .back-home-link {
    font-size: 12px;
    padding: 5px 10px;
    flex-shrink: 0;
  }
  .page-top-book {
    font-size: 12px;
    text-align: right;
    max-width: calc(100vw - 120px);
  }
  .tab-bar { padding: 8px 12px; }
  .tab-switcher { width: 100%; }
  .tab-btn {
    flex: 1;
    padding: 7px 10px;
    font-size: 12px;
  }
  .mode-bar {
    padding: 10px 12px;
    gap: 10px;
  }
  .mode-switcher-large {
    width: 100%;
    gap: 6px;
  }
  .mode-btn-large {
    flex: 1;
    padding: 7px 8px;
    font-size: 12px;
  }
  .mode-hint { display: none; }
  .chapter-sidebar {
    position: fixed;
    top: var(--reader-toolbar-top, 46px);
    left: 0;
    width: min(300px, 84vw);
    height: calc(100dvh - var(--reader-toolbar-top, 46px));
    z-index: 70;
    box-shadow: 4px 0 24px rgba(0,0,0,0.2);
  }
  .sidebar-close { display: flex; align-items: center; justify-content: center; }
  .sidebar-overlay { display: block; }
  .bottom-nav {
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
    gap: 6px;
  }
  .bottom-nav-btn {
    flex: 1;
    padding: 8px 6px;
    font-size: 11px;
  }
}
</style>
