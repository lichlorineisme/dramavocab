<template>
  <div class="import-page">
    <section class="page-container import-hero">
      <h1>导入你自己的小说</h1>
      <p>最短路径：先用 AI 转化成导入格式，再来快速导入，5 分钟内就能开始阅读。</p>
    </section>

    <section class="page-container value-strip">
      <span>✅ 保留剧情节奏，不变成词表</span>
      <span>✅ 三模式自动可读</span>
      <span>✅ 失败成本低，可反复迭代</span>
    </section>

    <section class="page-container flow-card glass-panel">
      <h2>推荐流程</h2>
      <div class="flow-list">
        <article>
          <strong>01 · AI 智能转化（可选但推荐）</strong>
          <p>把你的原小说交给 GPT / 豆包 / Gemini，按标准提示词输出“可导入文本”。</p>
        </article>
        <article>
          <strong>02 · 快速导入（必做）</strong>
          <p>把生成结果复制或上传（txt / md / pdf）到 DramaVocab，预览通过后直接开读。</p>
        </article>
      </div>
    </section>

    <section class="page-container primary-cta-wrap">
      <router-link to="/import/processed" class="primary-cta-card" @click="onFastImportClick">
        <span class="entry-icon">⚡</span>
        <div class="entry-copy">
          <span class="entry-title">快速导入</span>
          <span class="entry-desc">支持粘贴与文件上传，预览通过后直接阅读</span>
        </div>
        <span class="entry-arrow">→</span>
      </router-link>
    </section>

    <section class="page-container secondary-wrap">
      <router-link to="/import/plain" class="secondary-link" @click="onAiGuideClick">
        <span class="secondary-icon">🧠</span>
        <span>AI 智能转化说明（可选）</span>
      </router-link>
    </section>

    <section class="page-container history-card glass-panel">
      <div class="history-head">
        <h2>已导入书籍</h2>
        <span class="history-count">共 {{ importedBooks.length }} 本</span>
      </div>

      <div v-if="importedBooks.length > 0" class="history-list">
        <article v-for="book in importedBooks" :key="book.id" class="history-item">
          <div class="history-main">
            <h3>{{ book.emoji || '📘' }} {{ book.title }}</h3>
            <p>{{ summaryText(book) }}</p>
            <small>导入时间：{{ formatImportTime(book.importMeta?.createdAt) }}</small>
          </div>

          <div class="history-actions">
            <router-link :to="readingLink(book)" class="btn-secondary history-btn" @click="onHistoryContinue(book)">继续阅读</router-link>
            <button type="button" class="history-delete" @click="removeImported(book)">删除记录</button>
          </div>
        </article>
      </div>

      <div v-else class="history-empty">
        <p>你还没有导入过书籍，先点上方「快速导入」试试。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBookStore } from '@/stores/book.js'
import { EVENT, trackEvent } from '@/utils/analytics.js'

const bookStore = useBookStore()
const importedBooks = computed(() => bookStore.importedPublishedBooks)

function readingLink(book) {
  return {
    name: 'Reading',
    params: {
      bid: String(book.id),
      cid: String(book.chapters?.[0]?.id || '1'),
    },
  }
}

function summaryText(book) {
  const chapterCount = book.chapters?.length || 0
  const vocabCount = (book.chapters || []).reduce((sum, chapter) => {
    return sum + (chapter.vocabList?.length || 0)
  }, 0)
  return `${chapterCount} 章 · ${vocabCount} 词`
}

function formatImportTime(value) {
  if (!value) return '未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知'
  return date.toLocaleString('zh-CN', { hour12: false })
}

function removeImported(book) {
  const confirmDelete = window.confirm(`确定删除《${book.title}》的导入记录吗？`)
  if (!confirmDelete) return
  trackEvent(EVENT.IMPORT_HISTORY_DELETE, {
    book_id: book.id,
    book_name: book.title,
  })
  bookStore.removeImportedBook(book.id)
}

function onFastImportClick() {
  trackEvent(EVENT.IMPORT_HUB_FAST_CLICK, { source: 'import_hub' })
}

function onAiGuideClick() {
  trackEvent(EVENT.IMPORT_HUB_AI_CLICK, { source: 'import_hub' })
}

function onHistoryContinue(book) {
  trackEvent(EVENT.IMPORT_HISTORY_CONTINUE, {
    book_id: book.id,
    book_name: book.title,
  })
}
</script>

<style scoped>
.import-page {
  min-height: 100%;
  padding: 34px 0 72px;
}

.import-hero {
  text-align: center;
}

.import-hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 52px);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgba(245, 239, 255, 0.98);
}

.import-hero p {
  margin: 10px auto 0;
  color: rgba(245, 239, 255, 0.66);
  font-size: 15px;
  line-height: 1.75;
}

.value-strip {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.value-strip span {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(245, 239, 255, 0.84);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.flow-card {
  margin-top: 18px;
  border-radius: 22px;
  padding: 18px 20px;
}

.flow-card h2 {
  margin: 0;
  font-size: 18px;
}

.flow-list {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.flow-list article {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.flow-list strong {
  font-size: 14px;
}

.flow-list p {
  margin: 8px 0 0;
  color: rgba(245, 239, 255, 0.68);
  line-height: 1.72;
  font-size: 13px;
}

.primary-cta-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

.primary-cta-card {
  width: min(760px, 100%);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  min-height: 120px;
  padding: 22px 24px;
  border-radius: 24px;
  border: 1px solid rgba(251, 113, 133, 0.44);
  background: linear-gradient(130deg, rgba(124, 58, 237, 0.9), rgba(225, 29, 72, 0.82));
  backdrop-filter: blur(14px);
  text-decoration: none;
  box-shadow: 0 18px 48px rgba(41, 12, 72, 0.4);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.primary-cta-card:hover {
  transform: translateY(-4px);
  border-color: rgba(252, 231, 243, 0.9);
  box-shadow: 0 22px 52px rgba(86, 17, 87, 0.48);
}

.entry-icon {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 24px;
}

.entry-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entry-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: rgba(255, 248, 252, 0.98);
}

.entry-desc {
  color: rgba(255, 244, 253, 0.85);
  font-size: 14px;
}

.entry-arrow {
  color: rgba(255, 245, 252, 0.82);
  font-size: 20px;
  font-weight: 700;
}

.secondary-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.secondary-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(245, 239, 255, 0.62);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  transition: all 0.2s ease;
}

.secondary-link:hover {
  color: rgba(245, 239, 255, 0.82);
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.07);
}

.secondary-icon {
  opacity: 0.75;
}

.history-card {
  margin-top: 20px;
  border-radius: 22px;
  padding: 18px 20px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-head h2 {
  margin: 0;
  font-size: 18px;
}

.history-count {
  font-size: 12px;
  color: rgba(245, 239, 255, 0.6);
}

.history-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.history-main h3 {
  margin: 0;
  font-size: 15px;
  color: rgba(245, 239, 255, 0.96);
}

.history-main p {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(245, 239, 255, 0.68);
}

.history-main small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(245, 239, 255, 0.52);
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-btn {
  white-space: nowrap;
}

.history-delete {
  border: 1px solid rgba(251, 113, 133, 0.38);
  background: rgba(251, 113, 133, 0.1);
  color: #fecdd3;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.history-delete:hover {
  border-color: rgba(251, 113, 133, 0.6);
  background: rgba(251, 113, 133, 0.2);
}

.history-empty {
  margin-top: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.history-empty p {
  margin: 0;
  font-size: 13px;
  color: rgba(245, 239, 255, 0.66);
}

@media (max-width: 980px) {
  .flow-list {
    grid-template-columns: 1fr;
  }

  .entry-title {
    font-size: 22px;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .import-page {
    padding: 24px 0 58px;
  }

  .import-hero h1 {
    font-size: clamp(28px, 9vw, 34px);
  }

  .import-hero p {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.64;
  }

  .value-strip {
    margin-top: 14px;
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .value-strip::-webkit-scrollbar {
    display: none;
  }

  .value-strip span {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .flow-card,
  .history-card {
    border-radius: 18px;
    padding: 15px 14px;
  }

  .flow-list article {
    border-radius: 14px;
    padding: 12px;
  }

  .flow-list strong {
    line-height: 1.4;
    display: block;
  }

  .primary-cta-card {
    grid-template-columns: auto 1fr;
    gap: 10px;
    min-height: 0;
    padding: 16px 14px;
    border-radius: 18px;
  }

  .entry-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 20px;
  }

  .entry-copy {
    gap: 3px;
  }

  .entry-title {
    font-size: 21px;
  }

  .entry-desc {
    font-size: 12px;
    line-height: 1.55;
  }

  .entry-arrow {
    display: none;
  }

  .secondary-wrap {
    margin-top: 10px;
  }

  .secondary-link {
    width: 100%;
    justify-content: center;
    padding: 10px 14px;
    font-size: 12px;
    border-radius: 12px;
  }

  .history-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .history-main h3 {
    line-height: 1.4;
  }

  .history-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .history-btn,
  .history-delete {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
