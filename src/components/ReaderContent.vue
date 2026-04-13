<template>
  <article
    ref="contentRef"
    class="reader-content"
    :class="[store.fontSizeClass, { 'dark-theme': store.isDark }]"
  >
    <!-- 章节标题 -->
    <header class="chapter-header" v-if="chapter">
      <h1 class="chapter-title">{{ chapter.title }}</h1>
      <div class="chapter-meta">
        <span v-if="book">{{ book.title }} · </span>
        <span>第{{ currentChapterNumber }}章</span>
        <span
          v-if="chapter.vocabList"
          class="vocab-count"
        >
          · {{ chapter.vocabList.length }} 个词汇
        </span>
      </div>
    </header>

    <!-- ===== 段落列表 ===== -->
    <div
      v-for="(para, idx) in paragraphs"
      :key="'p-' + idx"
      class="paragraph-wrapper"
    >
      <!-- 🧠 沉浸模式：仅单词高亮，点击弹出Tooltip -->
      <p
        v-if="store.mode === 'immersive'"
        class="paragraph immersive-mode"
        v-html="renderImmersive(para.raw)"
      />

      <!-- 👁️ 透视模式：单词 + (词性.中文释义) -->
      <p
        v-else-if="store.mode === 'perspective'"
        class="paragraph perspective-mode"
        v-html="renderPerspective(para.raw)"
      />

      <!-- ✏️ 挑战模式：填空 + 中文提示 + 输入框交互 -->
      <template v-else>
        <div class="paragraph challenge-mode" :data-para-idx="idx">
          <template v-for="(seg, sIdx) in getChallengeSegments(para.raw, idx)" :key="'cs-' + idx + '-' + sIdx">
            <!-- 普通文本节点 -->
            <span v-if="seg.type === 'text'" v-text="seg.text" />

            <!-- 已掌握的单词 → 直接显示原词(绿色标记) -->
            <span
              v-else-if="seg.type === 'mastered'"
              class="word-mastered"
              :data-word="seg.word"
              @click="handleWordClick($event)"
            >{{ seg.displayWord }}</span>

            <!-- 未掌握的单词 → 填空 + 提示 + 输入框 -->
            <span
              v-else-if="seg.type === 'challenge'"
              class="challenge-wrap"
              :data-word="seg.rawWord"
              :data-display-word="seg.displayWord"
            >
              <!-- 中文提示：(v. 负担得起) -->
              <span class="challenge-hint">（{{ seg.meaning || '?' }}）</span>
              <!-- 输入框 -->
              <input
                :ref="el => { if (el) challengeRefs[seg.uid] = el }"
                type="text"
                class="challenge-input"
                :class="{
                  correct: getSegState(seg.uid)?.status === 'correct',
                  wrong: getSegState(seg.uid)?.status === 'wrong',
                }"
                :placeholder="getPlaceholder(seg.displayWord)"
                :value="getSegState(seg.uid)?.inputValue ?? ''"
                :disabled="isSegAnswered(seg.uid)"
                autocomplete="off"
                spellcheck="false"
                @keydown.enter="submitChallenge(seg)"
                @input="onChallengeInput(seg.uid, $event.target.value)"
              />
              <!-- 确认按钮 (未答时显示) -->
              <button
                v-if="!isSegAnswered(seg.uid)"
                class="challenge-btn"
                @click="submitChallenge(seg)"
              >确认</button>
              <!-- 答对结果 -->
              <template v-if="getSegState(seg.uid)?.status === 'correct'">
                <span class="result-icon correct-icon">✅</span>
                <span class="mastered-label">已掌握</span>
              </template>
              <!-- 答错结果 -->
              <template v-if="getSegState(seg.uid)?.status === 'wrong'">
                <span class="result-icon wrong-icon">❌</span>
                <span class="correct-answer">{{ seg.displayWord }}</span>
                <button
                  class="challenge-retry-btn"
                  @click="retryChallenge(seg.uid)"
                >重试</button>
              </template>
            </span>
          </template>
        </div>
      </template>

    </div>

    <!-- 章节完成标记 -->
    <div v-if="allChallenged && store.mode === 'challenge'" class="chapter-complete-banner">
      🎉 本章挑战完成！
      <button class="btn-primary" @click="$emit('nextChapter')">下一章 →</button>
    </div>

    <!-- WordTooltip / BottomSheet 查词弹窗 -->
    <WordTooltip
      v-if="tooltipWord"
      :word="tooltipWord"
      :position="tooltipPosition"
      @close="closeTooltip"
      @add-to-vocab="addToVocab"
    />

    <WordBottomSheet
      v-if="sheetWord"
      :word="sheetWord"
      @close="sheetWord = null"
      @add-to-vocab="addToVocab"
    />
  </article>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useReadingStore } from '../stores/reading.js'
import { useVocabStore } from '../stores/vocab.js'
import WordTooltip from './WordTooltip.vue'
import WordBottomSheet from './WordBottomSheet.vue'
import { trackEvent, EVENT } from '../utils/analytics.js'

const props = defineProps({
  /** 当前章节 */
  chapter: { type: Object, default: null },
  /** 所属书籍 */
  book: { type: Object, default: null },
  /** 所有章节列表 */
  chapters: { type: Array, default: () => [] }
})

const emit = defineEmits(['nextChapter', 'prevChapter', 'complete'])

const store = useReadingStore()
const vocabStore = useVocabStore()
const contentRef = ref(null)

// ===== 段落数据 =====
const paragraphs = computed(() => props.chapter?.paragraphs || [])
const currentChapterNumber = computed(() => {
  const idx = props.chapters.findIndex(c =>
    String(c.id) === String(props.chapter?.id)
  )
  return idx >= 0 ? idx + 1 : 1
})

// ================================================================
//  🔍 核心引擎零：纯文本词汇扫描器（v2 — 从 raw 纯文本中识别英文单词）
// ================================================================

/**
 * 构建本章词汇的正则表达式（按词长降序排列，优先匹配长词组如 "credit card"）
 * 缓存结果：仅在章节切换时重新构建
 */
const vocabRegexCache = computed(() => {
  const words = (props.chapter?.vocabList || [])
    .map(v => v.word)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // 长词优先

  if (words.length === 0) return null

  const escaped = words.map(w =>
    w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  return new RegExp(`(${escaped.join('|')})`, 'gi')
})

/** 词汇快速查找 Map { lowercaseWord → vocabItem } */
const vocabMapCache = computed(() => {
  const map = new Map()
  for (const item of (props.chapter?.vocabList || [])) {
    if (item.word) map.set(item.word.toLowerCase(), item)
  }
  return map
})

/**
 * 扫描一段纯文本，返回 token 数组
 * 每个 token 要么是普通文本，要么是匹配到的英文单词
 *
 * @param {string} raw - 原始纯文本段落
 * @returns {Array<{type:'text',value}|{type:'word',word:string,displayText:string,info:Object}>}
 */
function scanRawText(raw) {
  try {
    const regex = vocabRegexCache.value
    const vmap = vocabMapCache.value

    if (!regex || !vmap || !raw) {
      return [{ type: 'text', value: raw || '' }]
    }

    const tokens = []
    let lastIndex = 0
    let match

    // 重置正则的 lastIndex
    regex.lastIndex = 0

    while ((match = regex.exec(raw)) !== null) {
      const matchedText = match[0]           // 原始匹配文本（保持大小写）
      const start = match.index
      const end = start + matchedText.length
      const prevChar = start > 0 ? raw[start - 1] : ''
      const nextChar = end < raw.length ? raw[end] : ''

      // 词边界保护：避免把 "in" 匹配到 "beginning" 里
      const isWordChar = (ch) => /[A-Za-z0-9']/u.test(ch)
      if (isWordChar(prevChar) || isWordChar(nextChar)) continue

      const lookupKey = matchedText.toLowerCase().trim()
      const info = vmap.get(lookupKey)

      // 匹配到但词汇表中没有的情况（理论上不应该发生）
      if (!info) continue

      // 前面的普通文本
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: raw.slice(lastIndex, match.index) })
      }

      tokens.push({
        type: 'word',
        word: lookupKey,          // 标准化小写 key（用于状态管理/查词）
        displayText: matchedText,  // 原始显示文本（保留原文大小写）
        info                       // 完整词汇信息 { word, phonetic, meaning, ... }
      })

      lastIndex = regex.lastIndex
    }

    // 尾部剩余文本
    if (lastIndex < raw.length) {
      tokens.push({ type: 'text', value: raw.slice(lastIndex) })
    }

    return tokens
  } catch (e) {
    console.warn('[scanRawText error]', e)
    return [{ type: 'text', value: raw || '' }]
  }
}

/** HTML 转义（防止 XSS） */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ================================================================
//  🧠 核心引擎一：沉浸模式渲染（纯文本 → 高亮 span）
// ================================================================
function renderImmersive(raw) {
  try {
    const tokens = scanRawText(raw)
    return tokens.map(t => {
      if (t.type === 'text') return escapeHtml(t.value)
      return `<span class="word-highlight" data-word="${t.word}">${escapeHtml(t.displayText)}</span>`
    }).join('')
  } catch (e) {
    console.warn('[renderImmersive error]', e)
    return escapeHtml(raw || '')
  }
}

// ================================================================
//  👁️ 核心引擎二：透视模式渲染（单词 + 释义括号）
// ================================================================
function renderPerspective(raw) {
  try {
    const tokens = scanRawText(raw)
    return tokens.map(t => {
      if (t.type === 'text') return escapeHtml(t.value)
      const meaning = t.info?.meaning || ''
      return `<span class="word-highlight" data-word="${t.word}">${escapeHtml(t.displayText)}</span><span class="xr-meaning">${meaning ? `（${meaning}）` : ''}</span>`
    }).join('')
  } catch (e) {
    console.warn('[renderPerspective error]', e)
    return escapeHtml(raw || '')
  }
}

// ================================================================
//  ✏️ 核心引擎三：挑战模式分段解析（纯文本扫描版）
// ================================================================

/** 挑战模式的状态存储 { uid: { status:'idle'|'correct'|'wrong', inputValue:'', answerTime } } */
const challengeState = ref({})
/** input 元素引用 { uid: HTMLInputElement } */
const challengeRefs = ref({})
/** 当前章的已掌握词汇表缓存 */
const masteredCache = ref(new Set())

/**
 * 解析 raw 纯文本为挑战模式的段落数组
 * 使用新的 scanRawText 引擎替代旧的 HTML 正则匹配
 */
function getChallengeSegments(raw, paraIdx) {
  try {
    const tokens = scanRawText(raw)
    const segments = []
    let segIdx = 0

    for (const t of tokens) {
      if (t.type === 'text') {
        if (t.value) {
          segments.push({ type: 'text', text: t.value })
        }
        continue
      }

      // t.type === 'word'
      const uid = `p${paraIdx}s${segIdx}`
      const segState = getSegState(uid)
      const keepChallengeState =
        segState?.status === 'correct' || segState?.status === 'wrong'

      // 判断是否已掌握（优先查缓存，再查 vocabStore）
      const isMastered = !keepChallengeState && (
        masteredCache.value.has(t.word) ||
        vocabStore.getChapterMastery(props.book?.id, props.chapter?.id, t.word) === true
      )

      if (isMastered) {
        segments.push({
          type: 'mastered',
          uid,
          word: t.word,
          displayWord: t.displayText,
        })
        masteredCache.value.add(t.word)
      } else {
        segments.push({
          type: 'challenge',
          uid,
          word: t.word,
          displayWord: t.displayText,
          rawWord: t.word,             // 小写标准答案
          meaning: t.info?.meaning || '',
          phonetic: t.info?.phonetic || '',
          info: {
            ...t.info,
            sourceBookId: props.book?.id,
            sourceChapterId: props.chapter?.id,
          },
        })
      }
      segIdx++
    }

    return segments.length > 0 ? segments : [{ type: 'text', text: raw }]
  } catch (e) {
    console.warn('[getChallengeSegments error]', e)
    return [{ type: 'text', text: raw || '' }]
  }
}

/** 获取某 segment 的当前状态 */
function getSegState(uid) {
  return challengeState.value[uid]
}

/** 某个 segment 是否已经答过题 */
function isSegAnswered(uid) {
  const s = challengeState.value[uid]
  return s?.status === 'correct' || s?.status === 'wrong'
}

function getPlaceholder(word) {
  return '_'.repeat(Math.min((word && word.length) || 6, 8))
}

function onChallengeInput(uid, value) {
  const state = challengeState.value[uid]
  if (state) state.inputValue = value
  else challengeState.value[uid] = { status: 'idle', inputValue: value }
}

function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// ================================================================
//  TTS 发音系统
// ================================================================
function getYoungMaleVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || []
  const preferredVoices = [
    'Google US English Male', 'Microsoft Mark', 'Alex', 'Daniel', 'Tom'
  ]
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
    const utt = new SpeechSynthesisUtterance(word)
    utt.lang = store.ttsVoice
    utt.rate = store.ttsRate
    const voice = getYoungMaleVoice()
    if (voice) utt.voice = voice
    window.speechSynthesis.speak(utt)
  } catch {}
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

/**
 * 🔑 核心交互：提交挑战答案
 * - 正确 → 绿色锁定 + masteryLevel=5 + TTS发音 + 「已掌握」标记
 * - 错误 → 红色震动 + 显示答案 + 可重试 + masteryLevel=0(待复习)
 */
async function submitChallenge(seg) {
  try {
    const state = challengeState.value[seg.uid]
    if (state?.status === 'correct') return // 已答对的不能再提交

    const input = normalizeAnswer(state?.inputValue)
    if (!input) {
      // 空输入 → 震动提示
      const el = challengeRefs.value[seg.uid]
      if (el) {
        el.style.animation = 'shake 0.4s ease'
        setTimeout(() => { el.style.animation = '' }, 400)
      }
      return
    }

    const answer = normalizeAnswer(seg.rawWord)
    const isCorrect = input === answer

    if (isCorrect) {
      // ✅ 答对
      challengeState.value[seg.uid] = {
        status: 'correct',
        inputValue: seg.displayWord,
        answerTime: Date.now()
      }

      // 持久化：标记本章该词为已掌握
      vocabStore.setChapterMastery(props.book?.id, props.chapter?.id, seg.rawWord, true)
      masteredCache.value.add(seg.rawWord)

      // 更新全局生词本状态（传完整vocab数据，避免"(挑战模式)"占位符）
      await vocabStore.recordChallengeResult(
        seg.rawWord, true,
        seg.info
      )

      // TTS发音
      speakWord(seg.rawWord)

      // 埋点
      trackEvent(EVENT.WORD_COLLECT, {
        word: seg.rawWord,
        source: 'challenge_correct',
        book_id: props.book?.id,
        chapter_id: props.chapter?.id,
      })

      nextTick(checkAllComplete)
    } else {
      // ❌ 答错
      challengeState.value[seg.uid] = {
        status: 'wrong',
        inputValue: input,
        answerTime: Date.now()
      }

      // 持久化：标记答错过（但不阻止重试）
      vocabStore.setChapterMastery(props.book?.id, props.chapter?.id, seg.rawWord, false)

      // 收入生词本（待复习）
      await vocabStore.addWord({
        word: seg.rawWord,
        phonetic: seg.phonetic,
        meaning: seg.meaning,
        difficulty: 'intermediate',
        sourceBookId: props.book?.id,
        sourceChapterId: props.chapter?.id,
      })

      // 更新生词本状态（传完整vocab数据）
      await vocabStore.recordChallengeResult(
        seg.rawWord, false,
        seg.info
      )

      // 埋点
      trackEvent(EVENT.WORD_COLLECT, {
        word: seg.rawWord,
        source: 'challenge_wrong',
        book_id: props.book?.id,
        chapter_id: props.chapter?.id,
      })

      speakWord(seg.rawWord)
    }
  } catch (e) {
    console.warn('[submitChallenge error]', e)
  }
}

/** 重试某个填空（清空错误状态，重新允许输入） */
function retryChallenge(uid) {
  const prev = challengeState.value[uid]
  if (prev) {
    challengeState.value[uid] = {
      status: 'idle',
      inputValue: '',
    }
  }
  // 聚焦到对应输入框
  nextTick(() => {
    const el = challengeRefs.value[uid]
    if (el) el.focus()
  })
}

// ================================================================
//  完成检测
// ================================================================
const allChallenged = ref(false)
function checkAllComplete() {
  if (allChallenged.value) return
  let allAnswered = true
  for (let pi = 0; pi < paragraphs.value.length; pi++) {
    const segs = getChallengeSegments(paragraphs.value[pi].raw, pi)
    for (const seg of segs) {
      if (seg.type === 'challenge' && getSegState(seg.uid)?.status !== 'correct') {
        allAnswered = false
        break
      }
    }
    if (!allAnswered) break
  }
  if (allAnswered) {
    allChallenged.value = true
    store.markChapterComplete(props.chapter?.id)
    emit('complete')
  }
}

// ================================================================
//  Tooltip / BottomSheet 查词（沉浸/透视模式用）
// ================================================================
const tooltipWord = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const sheetWord = ref(null)

/** 点击高亮词 → 弹出查词面板 */
function handleWordClick(e) {
  try {
    if (store.mode === 'challenge') return // 挑战模式不弹卡片

    // 支持两种触发方式：直接事件或手动传入 event
    const target = e?.target?.closest?.('[data-word]') || e?.closest?.('[data-word]')
    if (!target) return

    const word = target.dataset.word
    if (!word) return

    // 发音
    speakWord(word)

    const vmap = vocabMapCache.value
    const info = vmap.get(word.toLowerCase()) || {
      word: target.textContent?.trim() || word,
      phonetic: '', meaning: '', example: ''
    }

    const safeInfo = {
      word: String(info.word || '').trim() || word,
      phonetic: String(info.phonetic || ''),
      meaning: String(info.meaning || ''),
      example: String(info.example || '')
    }

    // 移动端→BottomSheet，桌面端→Tooltip
    if (window.innerWidth < 768) {
      sheetWord.value = safeInfo
    } else {
      tooltipWord.value = safeInfo
      const rect = target.getBoundingClientRect()
      tooltipPosition.value = { x: rect.left + rect.width / 2, y: rect.top - 8 }
    }
  } catch (e) {
    console.warn('[handleWordClick error]', e)
  }
}

function closeTooltip() {
  tooltipWord.value = null
  sheetWord.value = null
}

async function addToVocab(wordInfo) {
  await vocabStore.addWord({
    word: wordInfo.word,
    phonetic: wordInfo.phonetic,
    meaning: wordInfo.meaning,
    example: wordInfo.example,
    sourceBookId: props.book?.id,
    sourceChapterId: props.chapter?.id,
  })
  trackEvent(EVENT.WORD_COLLECT, {
    word: wordInfo.word,
    source: 'reader_click',
    book_id: props.book?.id,
    chapter_id: props.chapter?.id,
  })
  closeTooltip()
}

// ================================================================
//  生命周期 & 事件监听
// ================================================================
onMounted(() => {
  const el = contentRef.value
  if (el) el.addEventListener('click', handleWordClick)
  document.addEventListener('click', handleGlobalClick)
})

onBeforeUnmount(() => {
  const el = contentRef.value
  if (el) el.removeEventListener('click', handleWordClick)
  document.removeEventListener('click', handleGlobalClick)
})

function handleGlobalClick(e) {
  const target = e?.target
  if (!(target instanceof Element)) return
  if (!target.closest('[data-word]') &&
      !target.closest('.word-tooltip') &&
      !target.closest('.sheet-panel')) {
    closeTooltip()
  }
}

// 切换模式/章节时重置挑战状态
watch(() => [props.chapter?.id, store.mode], async () => {
  allChallenged.value = false
  challengeState.value = {}
  challengeRefs.value = {}
  masteredCache.value = new Set()
}, { immediate: false })
</script>

<style scoped>
.reader-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;
  line-height: 2;
  transition: background-color 0.3s, color 0.3s;
}

/* ===== 章节头部 ===== */
.chapter-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.15);
}
.chapter-title {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #E11D48, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}
.chapter-meta { font-size: 0.85rem; opacity: 0.6; }
.vocab-count { color: #F59E0B; font-weight: 600; }

/* ===== 段落 ===== */
.paragraph {
  margin-bottom: 24px;
  text-align: justify;
  text-indent: 2em;
}

/* ===== 🧠 沉浸模式 ===== */
.immersive-mode :deep(.word-highlight) {
  cursor: pointer;
  position: relative;
  color: #C084FC;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 4px;
  transition: all 0.2s;
}
.immersive-mode :deep(.word-highlight:hover) {
  background: rgba(124, 58, 237, 0.15);
  box-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
}

/* ===== 👁️ 透视模式 ===== */
.perspective-mode :deep(.word-highlight) {
  cursor: pointer;
  color: #A78BFA;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 4px;
  transition: all 0.2s;
}
.perspective-mode :deep(.word-highlight:hover) {
  background: rgba(124, 58, 237, 0.15);
}
.perspective-mode :deep(.xr-meaning) {
  font-size: 0.82em;
  color: #9CA3AF;
  font-weight: 500;
  margin-left: 1px;
}

/* ===== ✏️ 挑战模式 ===== */
.challenge-mode {
  text-indent: 0 !important;
}
.challenge-wrap {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  vertical-align: middle;
  margin: 0 1px;
}
.challenge-hint {
  font-size: 0.85em;
  color: #9CA3AF;
  white-space: nowrap;
}
.challenge-input {
  width: 72px;
  min-width: 56px;
  height: 26px;
  border: 1.5px dashed rgba(124, 58, 237, 0.35);
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  color: inherit;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: inherit;
  padding: 0 6px;
  outline: none;
  transition: all 0.25s;
}
.challenge-input:focus {
  border-color: #7C3AED;
  border-style: solid;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  background: rgba(124, 58, 237, 0.05);
}
.challenge-input.correct {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
  font-weight: 700;
}
.challenge-input.wrong {
  border-color: #EF4444;
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
}
@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-6px)}
  40%{transform:translateX(6px)}
  60%{transform:translateX(-4px)}
  80%{transform:translateX(4px)}
}
.challenge-btn {
  height: 26px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.challenge-btn:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3); }

/* 已掌握的词（挑战模式下直接显示） */
.word-mastered {
  color: #10B981;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.08);
  cursor: pointer;
  border-bottom: 2px dotted #10B981;
}

/* 结果展示 */
.result-icon { font-size: 13px; }
.correct-answer {
  font-weight: 700;
  color: #10B981;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.92em;
  padding: 1px 6px;
  background: rgba(16,185,129,0.1);
  border-radius: 4px;
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mastered-label {
  font-size: 10px;
  font-weight: 600;
  color: #10B981;
  background: rgba(16, 185, 129, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.challenge-retry-btn {
  height: 22px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: rgba(239, 68, 68, 0.8);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.challenge-retry-btn:hover { background: #EF4444; }
@keyframes pop {
  0%{opacity:0;transform:scale(0.5)}
  100%{opacity:1;transform:scale(1)}
}

/* ===== 章节完成 ===== */
.chapter-complete-banner {
  margin-top: 48px; padding: 24px; text-align: center;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(225, 29, 72, 0.08));
  border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 16px;
  font-size: 1.1em; font-weight: 600; color: #E9D5FF;
}
.btn-primary {
  display: inline-block; margin-top: 12px; padding: 10px 28px;
  font-size: 14px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  border: none; border-radius: 10px; cursor: pointer; transition: all 0.25s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35); }

/* 动画 */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; transform: translateY(-8px); }

/* 字号 */
.text-sm { font-size: 15px; }
.text-base { font-size: 17px; }
.text-lg { font-size: 19px; }
.text-xl { font-size: 21px; }

/* Dark Theme */
.dark-theme { color: #E5E7EB; background: var(--bg-reader, #0F0A1A); }
</style>
