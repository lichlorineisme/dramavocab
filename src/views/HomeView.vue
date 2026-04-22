<template>
  <div class="home dark">
    <section class="hero">
      <div class="hero-bg-effects">
        <div class="glow glow-1" />
        <div class="glow glow-2" />
      </div>

      <div class="hero-content">
        <div class="brand-badge">🌹 DramaVocab</div>
        <h1 class="hero-title">看最狗血的文<br />背最高级的词</h1>
        <p class="hero-subtitle">三分讥笑，三分薄凉，四分漫不经心地搞定四/六级、雅思单词</p>

        <div class="hero-cta">
          <router-link
            v-for="(book, index) in featuredBooks"
            :key="book.id"
            :to="readingLink(book)"
            class="btn-primary btn-lg btn-book"
            @click="onBookClick(book, 'hero_cta')"
          >
            <span class="book-cta-meta">系统书 · {{ String(index + 1).padStart(2, '0') }}</span>
            <span class="book-cta-title">{{ book?.emoji || '📖' }} 读《{{ book.title }}》→</span>
          </router-link>
          <router-link to="/import" class="btn-tool-entry">
            <span class="tool-label" aria-hidden="true">
              <span>工具</span>
              <span>入口</span>
            </span>
            <span class="tool-copy">✨ 导入私藏小说，开启 Drama 化 →</span>
          </router-link>
        </div>

        <p class="hero-maker">Made with ❤️ by 有栖</p>
        <p class="hero-contact">
          联系作者：
          <a href="mailto:zwenccc@163.com">zwenccc@163.com</a>
        </p>
      </div>

      <div class="hero-visual">
        <div class="mock-reader">
          <div class="mock-toolbar">
            <span>📖 第1章 · 初遇</span>
            <div class="demo-mode-switcher">
              <button
                v-for="mode in modes"
                :key="mode.id"
                type="button"
                class="demo-mode-btn"
                :class="{ active: demoMode === mode.id }"
                @click="switchDemo(mode.id)"
              >
                {{ mode.icon }}{{ mode.label }}
              </button>
            </div>
          </div>

          <div v-if="demoMode === 'immersive'" class="demo-content">
            <p class="mock-text immersive-demo">
              我叫林晚，是A大英语系的<span class="hl">senior</span>。为了<span class="hl">afford</span>高昂的<span class="hl">tuition</span>，我不得不在星耀中心找了份<span class="hl">part-time</span>工作。
            </p>
            <div class="demo-tip">💡 点击高亮单词查看释义 →</div>
          </div>

          <div v-else-if="demoMode === 'perspective'" class="demo-content">
            <p class="mock-text perspective-demo">
              我叫林晚，是A大英语系的<span class="hl">senior<span class="xr-meaning">(n.大四学生)</span></span>。为了<span class="hl">afford<span class="xr-meaning">(v.负担得起)</span></span>高昂的<span class="hl">tuition<span class="xr-meaning">(n.学费)</span></span>，我不得不在星耀中心找了份<span class="hl">part-time<span class="xr-meaning">(adj.兼职的)</span></span>工作。
            </p>
            <div class="demo-tip">💡 单词后自动显示中文释义 →</div>
          </div>

          <div v-else class="demo-content">
            <p class="mock-text challenge-demo">
              我叫林晚，是A大英语系的<span class="ch-hint">(n.大四学生)</span><input class="ch-input correct" value="senior" readonly />。为了<span class="ch-hint">(v.负担得起)</span><input class="ch-input wrong" value="affort" readonly /><span class="ch-correct">afford</span>高昂的...
            </p>
            <div class="demo-tip">✏️ 根据中文提示填空，答错自动收录生词本 →</div>
          </div>

          <div class="mock-actions">
            <span class="mock-chip">119个核心词汇</span>
            <span class="mock-chip">3种阅读模式</span>
            <span class="mock-chip">5种复习方式</span>
          </div>
        </div>

        <div class="feature-preview">
          <span class="fp-item"><span class="fp-icon">🧠</span><strong>沉浸模式</strong> 英文无缝嵌入中文</span>
          <span class="fp-divider">·</span>
          <span class="fp-item"><span class="fp-icon">👁️</span><strong>透视模式</strong> 一键显示释义</span>
          <span class="fp-divider">·</span>
          <span class="fp-item"><span class="fp-icon">✏️</span><strong>挑战模式</strong> 填空检验记忆</span>
        </div>
      </div>
    </section>

    <section class="bookshelf-section">
      <h2 class="section-title">📚 开始阅读</h2>
      <div class="bookshelf-grid">
        <router-link
          v-for="book in allBooks"
          :key="book.id"
          :to="readingLink(book)"
          class="shelf-card"
          @click="onBookClick(book, 'shelf')"
        >
          <div class="shelf-cover" :class="{ 'has-image': !!book.coverImage }" :style="shelfCoverStyle(book)">
            <span v-if="!book.coverImage" class="shelf-emoji">{{ book.emoji || '📖' }}</span>
            <span class="shelf-chapters">{{ book.chapters?.length || 0 }}章 · {{ vocabCount(book) }}词</span>
          </div>
          <div class="shelf-info">
            <h3>{{ book.title }}</h3>
            <p class="shelf-author">{{ book.author || '匿名' }}</p>
            <span class="shelf-go">立即阅读 →</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="features-section">
      <h2 class="section-title">为什么选择 DramaVocab？</h2>
      <p class="features-subtitle">把背单词这件事，变成你每天都想追更的剧情体验。</p>
      <div class="features-grid">
        <div class="feature-card">
          <span class="fc-icon">🎭</span>
          <h3>先上头，再记住</h3>
          <p>先让你愿意读下去，再把词自然记进脑子里，不靠硬背。</p>
        </div>
        <div class="feature-card">
          <span class="fc-icon">🎯</span>
          <h3>一段剧情，三种学习强度</h3>
          <p>沉浸读故事，透视看释义，挑战做填空，同一段内容反复吃透。</p>
        </div>
        <div class="feature-card">
          <span class="fc-icon">⚡</span>
          <h3>点词即查，不打断阅读</h3>
          <p>不用跳页面，点一下就能看词义，阅读不断流，理解更连贯。</p>
        </div>
        <div class="feature-card">
          <span class="fc-icon">🔄</span>
          <h3>错词自动进复习</h3>
          <p>做错的词会自动沉淀下来，复习有重点，不再盲目刷。</p>
        </div>
        <div class="feature-card">
          <span class="fc-icon">📚</span>
          <h3>支持私藏小说导入</h3>
          <p>把你喜欢的小说导进来，边看你爱看的，边学真正会用的词。</p>
        </div>
        <div class="feature-card">
          <span class="fc-icon">⏱️</span>
          <h3>5 分钟上手，今天就能开始</h3>
          <p>不用复杂设置，打开就能读，马上进入状态。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBookStore } from '@/stores/book.js'
import { EVENT, trackEvent } from '@/utils/analytics.js'

const bookStore = useBookStore()

const demoMode = ref('immersive')
const modes = [
  { id: 'immersive', icon: '🧠', label: '沉浸' },
  { id: 'perspective', icon: '👁️', label: '透视' },
  { id: 'challenge', icon: '✏️', label: '挑战' },
]

const allBooks = computed(() => bookStore.builtinPublishedBooks.slice(0, 2))
const featuredBooks = computed(() => allBooks.value.slice(0, 2))

function switchDemo(id) {
  demoMode.value = id
}

function vocabCount(book) {
  if (!book.chapters) return 0
  return book.chapters.reduce((sum, chapter) => sum + (chapter.vocabList?.length || 0), 0)
}

function shelfCoverStyle(book) {
  if (book?.coverImage) {
    return {
      backgroundImage: `url(${book.coverImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return { background: book?.coverColor || 'var(--gradient)' }
}

function firstChapterId(book) {
  if (book.chapters?.length > 0) {
    return book.chapters[0].id ?? '1'
  }
  return '1'
}

function readingLink(book) {
  return {
    name: 'Reading',
    params: {
      bid: String(book.id),
      cid: String(firstChapterId(book)),
    },
  }
}

function onBookClick(book, source = 'shelf') {
  trackEvent(EVENT.BOOK_CLICK, {
    book_id: book.id,
    book_name: book.title,
    author: book.author || '匿名',
    source,
  })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    radial-gradient(circle at 85% 15%, rgba(225, 29, 72, 0.12), transparent 28%),
    linear-gradient(180deg, #1a0b2e 0%, #0f0a1a 100%);
  color: #e5e7eb;
  transition: all 0.3s;
}

.home.dark {
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    radial-gradient(circle at 85% 15%, rgba(225, 29, 72, 0.12), transparent 28%),
    linear-gradient(180deg, #1a0b2e 0%, #0f0a1a 100%);
  color: #e5e7eb;
}

.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  padding: 80px 40px;
  overflow: hidden;
  min-height: 85vh;
}

.hero-bg-effects {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
}

.glow-1 {
  width: 500px;
  height: 500px;
  background: #7c3aed;
  top: -10%;
  left: -5%;
}

.glow-2 {
  width: 400px;
  height: 400px;
  background: #e11d48;
  bottom: -5%;
  right: -5%;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.brand-badge {
  display: inline-block;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 20px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.25);
  color: #c084fc;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 3rem;
  line-height: 1.15;
  font-weight: 900;
  background: linear-gradient(135deg, #e11d48, #c084fc, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 15px;
  color: #9ca3af;
  line-height: 1.7;
  max-width: none;
  white-space: nowrap;
}

.dark .hero-subtitle {
  color: #9ca3af;
}

.hero-cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 32px;
}

.btn-primary {
  display: inline-block;
  padding: 14px 32px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #7c3aed, #e11d48);
  color: #fff;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.25s;
  border: none;
  cursor: pointer;
  text-align: center;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(124, 58, 237, 0.4);
}

.btn-lg {
  padding: 16px 38px;
  font-size: 17px;
}

.btn-book {
  background: linear-gradient(135deg, #7c3aed, #e11d48);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
}

.btn-book:nth-child(2) {
  background: linear-gradient(135deg, #e11d48, #f59e0b);
}

.btn-tool-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 50px;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.4);
  background: rgba(16, 24, 45, 0.64);
  color: #dbeafe;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.22s ease;
  min-width: 0;
}

.btn-tool-entry:hover {
  transform: translateY(-1px);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 12px 26px rgba(16, 185, 129, 0.16);
}

.book-cta-meta {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
}

.book-cta-title {
  font-size: inherit;
  line-height: 1.2;
  text-wrap: balance;
}

.tool-label {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 42px;
  min-height: 42px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.35);
  color: #34d399;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.05;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(16, 24, 45, 0.12);
}

.tool-copy {
  min-width: 0;
  flex: 1 1 auto;
  white-space: normal;
  line-height: 1.25;
  text-wrap: balance;
}

.hero-contact {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(229, 231, 235, 0.68);
}

.hero-maker {
  margin-top: 16px;
  margin-bottom: 2px;
  font-size: 13px;
  color: rgba(196, 181, 253, 0.88);
}

.hero-contact a {
  color: #c4b5fd;
  text-decoration: none;
}

.hero-contact a:hover {
  text-decoration: underline;
}

.feature-preview {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  padding: 12px 16px;
  width: 420px;
  background: rgba(30, 27, 75, 0.45);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  font-size: 12px;
  flex-wrap: wrap;
}

.dark .feature-preview {
  background: rgba(30, 27, 75, 0.45);
  border-color: rgba(124, 58, 237, 0.2);
}

.fp-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.fp-icon {
  font-size: 15px;
}

.fp-divider {
  color: #9ca3af;
}

.hero-visual {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.mock-reader {
  width: 420px;
  padding: 24px;
  background: rgba(30, 27, 75, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

.dark .mock-reader {
  background: rgba(30, 27, 75, 0.65);
  border-color: rgba(124, 58, 237, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.mock-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #c084fc;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.12);
  flex-wrap: wrap;
  gap: 8px;
}

.demo-mode-switcher {
  display: flex;
  gap: 3px;
  background: rgba(124, 58, 237, 0.06);
  padding: 3px;
  border-radius: 10px;
}

.demo-mode-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}

.demo-mode-btn:hover {
  color: #d1d5db;
}

.demo-mode-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.demo-content {
  transition: opacity 0.3s ease;
}

.mock-text {
  font-size: 14px;
  line-height: 2.1;
  color: #d1d5db;
  text-align: justify;
  min-height: 90px;
}

.dark .mock-text {
  color: #d1d5db;
}

.hl {
  color: #c084fc;
  font-weight: 700;
  padding: 0 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.hl:hover {
  background: rgba(124, 58, 237, 0.15);
}

.xr-meaning {
  font-size: 0.78em;
  color: #9ca3af;
  font-weight: 500;
  margin-left: 1px;
}

.challenge-demo {
  line-height: 2.4;
}

.ch-hint {
  font-size: 0.82em;
  color: #9ca3af;
}

.ch-input {
  width: 72px;
  height: 24px;
  border: 1.5px dashed rgba(124, 58, 237, 0.4);
  border-radius: 5px;
  background: rgba(30, 27, 75, 0.55);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  padding: 0 4px;
  margin: 0 2px;
  vertical-align: middle;
  text-align: center;
  outline: none;
  color: inherit;
}

.ch-input.correct {
  border-color: #10b981;
  color: #10b981;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.06);
}

.ch-input.wrong {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
  text-decoration: line-through;
}

.ch-correct {
  font-weight: 700;
  color: #10b981;
  font-size: 0.92em;
  margin-left: 2px;
}

.demo-tip {
  margin-top: 14px;
  font-size: 12px;
  color: #f59e0b;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(245, 158, 11, 0.06);
  border-left: 3px solid #f59e0b;
  border-radius: 0 8px 8px 0;
}

.mock-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.mock-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.06);
  color: #a78bfa;
  border: 1px solid rgba(124, 58, 237, 0.12);
}

.bookshelf-section {
  padding: 60px 40px;
  max-width: 1100px;
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(15, 10, 26, 0.02), rgba(15, 10, 26, 0.06));
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #e11d48, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 36px;
}

.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.shelf-card {
  display: flex;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: rgba(30, 27, 75, 0.45);
  border: 1px solid rgba(124, 58, 237, 0.1);
  border-radius: 18px;
  transition: all 0.3s;
  cursor: pointer;
}

.dark .shelf-card {
  background: rgba(30, 27, 75, 0.45);
  border-color: rgba(124, 58, 237, 0.1);
}

.shelf-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 40px rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.25);
}

.shelf-cover {
  position: relative;
  width: 120px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  --gradient: linear-gradient(145deg, #7c3aed, #e11d48);
  background: var(--gradient);
  flex-shrink: 0;
}

.shelf-cover.has-image {
  justify-content: flex-end;
  align-items: flex-start;
  padding: 10px;
}

.shelf-cover.has-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9, 9, 11, 0.04) 36%, rgba(9, 9, 11, 0.55) 100%);
}

.shelf-emoji {
  font-size: 42px;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.2));
}

.shelf-chapters {
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 6px;
}

.shelf-info {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.shelf-info h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: #c084fc;
}

.shelf-author {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.shelf-go {
  font-size: 13px;
  font-weight: 600;
  color: #a78bfa;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s;
}

.shelf-card:hover .shelf-go {
  gap: 8px;
}

.features-section {
  padding: 80px 40px;
  max-width: 1100px;
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(15, 10, 26, 0.06), rgba(15, 10, 26, 0.1));
}

.features-subtitle {
  margin: -16px auto 30px;
  max-width: 760px;
  text-align: center;
  color: rgba(229, 231, 235, 0.72);
  font-size: 15px;
  line-height: 1.75;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  padding: 32px 26px;
  background: rgba(30, 27, 75, 0.4);
  border: 1px solid rgba(124, 58, 237, 0.1);
  border-radius: 18px;
  transition: all 0.25s;
}

.dark .feature-card {
  background: rgba(30, 27, 75, 0.4);
  border-color: rgba(124, 58, 237, 0.1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.25);
}

.fc-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 14px;
}

.feature-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: inherit;
}

.feature-card p {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.6;
}

.section-title,
.features-subtitle {
  color: inherit;
}

@media (max-width: 1024px) {
  .hero {
    flex-direction: column;
    gap: 40px;
    padding: 60px 24px;
    min-height: auto;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .mock-reader {
    width: 100%;
    max-width: 420px;
  }

  .feature-preview {
    width: 100%;
    max-width: 420px;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .shelf-cover {
    width: 100px;
    min-height: 130px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 28px 14px 18px;
    gap: 18px;
  }

  .hero-content,
  .hero-visual {
    width: 100%;
    max-width: 100%;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .brand-badge {
    margin-bottom: 16px;
  }

  .hero-title {
    font-size: 1.9rem;
    line-height: 1.08;
    margin-bottom: 14px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .hero-cta {
    flex-direction: column;
    align-items: stretch;
    margin-top: 18px;
    gap: 8px;
    width: 100%;
    max-width: 430px;
  }

  .btn-book,
  .btn-tool-entry {
    width: 100%;
  }

  .btn-book {
    min-height: 62px;
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.3;
    border-radius: 14px;
    white-space: normal;
    word-break: keep-all;
  }

  .book-cta-meta {
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  .book-cta-title {
    line-height: 1.28;
  }

  .btn-tool-entry {
    min-height: 68px;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.25;
    border-radius: 14px;
    text-align: left;
    justify-content: flex-start;
    gap: 10px;
  }

  .btn-tool-entry .tool-label {
    width: 40px;
    min-height: 40px;
    font-size: 10px;
  }

  .hero-subtitle {
    display: block;
    font-size: 14px;
    line-height: 1.75;
    white-space: normal;
    text-wrap: balance;
    max-width: 22ch;
  }

  .hero-maker,
  .hero-contact {
    text-align: center;
  }

  .hero-maker {
    margin-top: 12px;
  }

  .hero-visual {
    align-items: center;
    width: 100%;
  }

  .mock-reader {
    width: 100%;
    padding: 18px 14px 16px;
    border-radius: 18px;
  }

  .mock-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .demo-mode-switcher {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .demo-mode-switcher::-webkit-scrollbar {
    display: none;
  }

  .demo-mode-btn {
    flex: 0 0 auto;
    padding: 4px 10px;
    font-size: 11px;
  }

  .mock-text {
    font-size: 13px;
    line-height: 2;
    min-height: 0;
    text-align: left;
  }

  .demo-tip {
    font-size: 11px;
    padding: 5px 10px;
  }

  .mock-actions {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .mock-chip {
    width: 100%;
    padding: 6px 10px;
    text-align: center;
  }

  .feature-preview {
    width: 100%;
    padding: 12px 14px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }

  .fp-divider {
    display: none;
  }

  .fp-item {
    white-space: normal;
    line-height: 1.5;
    justify-content: center;
    text-align: center;
  }

  .features-section {
    padding: 34px 14px 38px;
  }

  .features-subtitle {
    margin: -12px auto 20px;
    font-size: 14px;
    line-height: 1.7;
  }

  .section-title {
    font-size: 1.6rem;
  }

  .bookshelf-section {
    padding: 34px 14px 38px;
  }

  .bookshelf-grid {
    grid-template-columns: 1fr;
  }

  .shelf-card {
    flex-direction: row;
    align-items: stretch;
    border-radius: 16px;
  }

  .shelf-cover {
    width: 100px;
    min-height: 132px;
  }

  .shelf-info {
    padding: 14px 14px 14px 16px;
  }

  .shelf-info h3 {
    font-size: 0.98rem;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .shelf-author,
  .shelf-go {
    font-size: 12px;
  }

  .mock-toolbar {
    justify-content: space-between;
  }

  .demo-mode-switcher {
    margin-top: 6px;
  }

  .hero-contact {
    font-size: 12px;
  }

  .feature-card {
    padding: 24px 20px;
  }

  .feature-card h3 {
    line-height: 1.35;
  }

  .feature-card p {
    line-height: 1.7;
  }
}
</style>
