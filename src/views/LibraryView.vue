<template>
  <div class="library-page">
    <section class="page-container library-hero">
      <div>
        <span class="section-chip">Library</span>
        <h1 class="section-title">系统书库 + 用户导入，在同一个阅读入口里共存</h1>
        <p class="section-subtitle">
          这里保留你现在已经满意的 book1 / book2，同时给 3.0 留出导入书籍的正式入口。
          系统书和用户书用同一套协议驱动，所以后面扩展不会越做越乱。
        </p>
      </div>
      <router-link to="/import" class="btn-primary">导入新书</router-link>
    </section>

    <section class="page-container filter-bar glass-panel">
      <input
        v-model.trim="searchQuery"
        type="text"
        class="filter-input"
        placeholder="搜索书名、作者、来源..."
      />
      <div class="filter-pills">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="filter-pill"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section class="page-container shelf-block">
      <div class="shelf-head">
        <div>
          <h2>系统书库</h2>
          <p>当前内置内容，会继续作为 DramaVocab 的演示标准与质量样板。</p>
        </div>
        <span class="shelf-count">{{ filteredBuiltinBooks.length }} 本</span>
      </div>
      <div class="book-grid">
        <router-link
          v-for="book in filteredBuiltinBooks"
          :key="book.id"
          :to="readingLink(book)"
          class="book-card glass-panel"
        >
          <div class="book-cover" :style="{ background: book.coverColor }">
            <span class="cover-emoji">{{ book.emoji }}</span>
            <span class="cover-badge">System</span>
          </div>
          <div class="book-copy">
            <h3>{{ book.title }}</h3>
            <p>{{ book.description }}</p>
            <div class="book-meta">
              <span>{{ book.author }}</span>
              <span>{{ book.chapters.length }}章</span>
              <span>{{ totalVocabCount(book) }}词</span>
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <section class="page-container shelf-block">
      <div class="shelf-head">
        <div>
          <h2>我的导入</h2>
          <p>所有导入书籍都走 DramaVocab 3.0 协议，后续纯中文引擎也会回到这个入口。</p>
        </div>
        <span class="shelf-count">{{ filteredImportedBooks.length }} 本</span>
      </div>

      <div v-if="filteredImportedBooks.length" class="book-grid">
        <article
          v-for="book in filteredImportedBooks"
          :key="book.id"
          class="book-card glass-panel"
        >
          <router-link :to="readingLink(book)" class="book-link">
            <div class="book-cover" :style="{ background: book.coverColor }">
              <span class="cover-emoji">{{ book.emoji }}</span>
              <span class="cover-badge import">{{ sourceLabel(book.sourceType) }}</span>
            </div>
            <div class="book-copy">
              <h3>{{ book.title }}</h3>
              <p>{{ book.description || '由用户导入并转换为 DramaVocab 阅读协议。' }}</p>
              <div class="book-meta">
                <span>{{ book.author }}</span>
                <span>{{ book.chapters.length }}章</span>
                <span>{{ totalVocabCount(book) }}词</span>
              </div>
            </div>
          </router-link>
          <button type="button" class="remove-btn" @click="removeImported(book.id)">删除导入</button>
        </article>
      </div>

      <router-link v-else to="/import" class="empty-import glass-panel">
        <div class="empty-icon">📥</div>
        <div>
          <h3>还没有导入书籍</h3>
          <p>先从“已加工书籍”入口开始，最快能把用户已有内容接进 DramaVocab。</p>
        </div>
        <span class="quick-arrow">→</span>
      </router-link>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBookStore } from '@/stores/book.js'

const bookStore = useBookStore()
const searchQuery = ref('')
const activeTab = ref('all')

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'builtin', label: '系统书' },
  { id: 'imported', label: '导入书' },
]

const filteredBuiltinBooks = computed(() => applySearch(bookStore.builtinPublishedBooks))
const filteredImportedBooks = computed(() => applySearch(bookStore.importedPublishedBooks))

function applySearch(books) {
  return books.filter((book) => {
    if (activeTab.value === 'builtin' && book.sourceType !== 'builtin') return false
    if (activeTab.value === 'imported' && book.sourceType === 'builtin') return false
    if (!searchQuery.value) return true

    const keyword = searchQuery.value.toLowerCase()
    return [
      book.title,
      book.author,
      book.description,
      book.sourceType,
    ].some((value) => String(value || '').toLowerCase().includes(keyword))
  })
}

function totalVocabCount(book) {
  return (book.chapters || []).reduce((sum, chapter) => sum + (chapter.vocabList?.length || 0), 0)
}

function readingLink(book) {
  return {
    name: 'Reading',
    params: {
      bid: String(book.id),
      cid: String(book.chapters?.[0]?.id || '1'),
    },
  }
}

function removeImported(bookId) {
  bookStore.removeImportedBook(bookId)
}

function sourceLabel(sourceType) {
  if (sourceType === 'processed-text') return 'Processed'
  if (sourceType === 'plain-cn') return 'Plain CN'
  return 'Import'
}
</script>

<style scoped>
.library-page {
  padding: 36px 0 88px;
}

.library-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 28px;
  padding: 18px 20px;
  border-radius: 24px;
}

.filter-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: white;
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.filter-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 10px 14px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.66);
  font-weight: 700;
  cursor: pointer;
}

.filter-pill.active {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(251, 113, 133, 0.9));
  color: white;
}

.shelf-block {
  margin-top: 34px;
}

.shelf-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.shelf-head h2 {
  margin: 0;
  font-size: 28px;
}

.shelf-head p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.64);
  line-height: 1.8;
}

.shelf-count {
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.48);
  font-size: 13px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.book-card {
  overflow: hidden;
  border-radius: 28px;
}

.book-link {
  display: block;
  text-decoration: none;
}

.book-cover {
  position: relative;
  display: flex;
  min-height: 200px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24px;
}

.cover-emoji {
  font-size: 54px;
}

.cover-badge {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  font-size: 12px;
  font-weight: 800;
}

.cover-badge.import {
  background: rgba(255, 255, 255, 0.2);
}

.book-copy {
  padding: 22px 24px 18px;
}

.book-copy h3 {
  margin: 0;
  font-size: 22px;
}

.book-copy p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.75;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.book-meta span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.remove-btn {
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 10px 14px;
  border: 1px solid rgba(251, 113, 133, 0.22);
  border-radius: 999px;
  background: rgba(251, 113, 133, 0.06);
  color: #FECDD3;
  cursor: pointer;
}

.empty-import {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  text-decoration: none;
}

.empty-import h3 {
  margin: 0 0 8px;
}

.empty-import p {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.75;
}

.empty-icon {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 28px;
}

@media (max-width: 980px) {
  .book-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .library-page {
    padding-top: 24px;
  }

  .library-hero,
  .filter-bar,
  .shelf-head,
  .empty-import {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-bar {
    flex-direction: column;
  }

  .empty-import {
    display: flex;
  }
}
</style>
