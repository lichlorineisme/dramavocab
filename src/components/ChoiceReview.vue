<template>
  <div class="choice-review">
    <!-- ═══ 无效题目（队列为空）═══ -->
    <div v-if="effectiveWords.length === 0" class="empty-hint">
      <span>📭</span>
      <h3>没有可练习的单词</h3>
      <p>当前复习队列中没有有效的单词。</p>
      <router-link to="/" class="btn-primary">去阅读收藏新单词 →</router-link>
      <button @click="$emit('exit')" class="exit-btn">← 返回复习中心</button>
    </div>

    <!-- ═══ 正常答题流程 ═══ -->
    <template v-else>
    <div v-if="currentIndex < effectiveWords.length" class="choice-card">
      <!-- 题干 -->
      <div class="question-word">{{ currentWord.word }}</div>
      <div class="question-phonetic" v-if="currentWord.phonetic">/{{ currentWord.phonetic }}/</div>
      <div class="question-hint">选择正确的中文释义</div>

      <!-- 选项网格（带 A/B/C/D 标签） -->
      <div class="options-grid">
        <button
          v-for="(opt, idx) in options"
          :key="idx + '_' + opt"
          class="option-btn"
          :class="optionClass(idx)"
          :disabled="answered"
          @click="selectOption(idx)"
        >
          <span class="opt-label">{{ labelFor(idx) }}</span>
          <span class="opt-text">{{ opt }}</span>
        </button>
      </div>

      <!-- 结果反馈 -->
      <Transition name="fade">
        <div v-if="answered" class="result-feedback" :class="isCorrect ? 'correct' : 'wrong'">
          <template v-if="isCorrect">✅ 答对了！</template>
          <template v-else>❌ 正确答案：<strong>{{ trimmedMeaning }}</strong></template>
        </div>
      </Transition>

      <!-- 下一题按钮（手动跳转，不自动） -->
      <button
        v-if="answered"
        class="next-btn"
        @click="nextQuestion"
      >{{ isLastQuestion ? '查看结果 →' : '下一题 →' }}</button>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
      </div>
      <span>{{ currentIndex + 1 }} / {{ effectiveWords.length }}</span>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabStore } from '../stores/vocab.js'
import { useBookStore } from '../stores/book.js'

const props = defineProps({ words: { type: Array, default: () => [] } })
const emit = defineEmits(['complete', 'exit', 'update', 'error'])

const router = useRouter()
const vocabStore = useVocabStore()
const bookStore = useBookStore()

// ====== 状态 ======
const currentIndex = ref(0)
const selectedIndex = ref(-1)
const answered = ref(false)
const isCorrect = ref(false)
const stats = ref({ correct: 0, wrong: 0 })

// ====== 核心函数：三级降级策略获取有效释义 ======
/**
 * L1: 单词自身的 meaning 字段（正常情况）
 * L2: 从 book.js 全量词汇表查找原始释义（修复挑战模式收录的占位符 meaning）
 * L3: 返回空字符串（彻底找不到时）
 *
 * 产品决策：
 * - 填错的、未掌握的、挑战模式收录的 → 全部应该能拿来练选择题
 * - 不再因为 meaning 是占位符就把整道题丢掉
 * - meaning 有问题的从 book.js 原始数据补上真实释义
 */
function resolveMeaning(w) {
  if (!w || !w.word) return ''

  // ── L1: 自身 meaning（正常阅读器收录的词走这里）──
  var raw = (w.meaning || '').trim()
  if (raw && raw.length >= 2 && raw.length <= 30) {
    var placeholders = ['(挑战模式)', '(无)', 'undefined', 'null', '(无释义)', 'N/A']
    var isPlaceholder = false
    for (var p = 0; p < placeholders.length; p++) {
      if (raw === placeholders[p] || raw.indexOf(placeholders[p]) >= 0) {
        isPlaceholder = true
        break
      }
    }
    if (!isPlaceholder) return raw
  }

  // ── L2: 从 book.js 全量词汇表查找原始释义 ──
  // 挑战模式收录的词(meaning="(挑战模式)") 走到这里
  try {
    var books = bookStore.books || []
    for (var bi = 0; bi < books.length; bi++) {
      var chapters = books[bi].chapters || []
      for (var ci = 0; ci < chapters.length; ci++) {
        var vlist = chapters[ci].vocabList || []
        for (var vi = 0; vi < vlist.length; vi++) {
          var entry = vlist[vi]
          if (!entry || !entry.word) continue
          if (entry.word.toLowerCase() === w.word.toLowerCase()) {
            var bookMeaning = (entry.meaning || '').trim()
            if (bookMeaning && bookMeaning.length >= 2 && bookMeaning.length <= 30) {
              return bookMeaning
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[resolveMeaning] book.js lookup failed', e)
  }

  // ── L3: 彻底找不到（极端情况：单词不在任何书的词汇表里）──
  return ''
}

// ====== 有效题目队列 ======
/**
 * 只要有 word 字段就是合法单词 → 保留
 * 不再因 meaning 问题过滤掉任何词
 */
const effectiveWords = computed(function() {
  return props.words.filter(function(w) {
    return w && typeof w.word === 'string' && w.word.length > 0
  })
})

/** 当前题目单词 */
const currentWord = computed(function() {
  return effectiveWords.value[currentIndex.value] || {}
})

/** 当前题目的正确答案（经过三级解析的有效释义） */
const trimmedMeaning = computed(function() {
  return resolveMeaning(currentWord.value)
})

// ====== 进度 ======
const progressPercent = computed(function() {
  var total = Math.max(effectiveWords.value.length, 1)
  var done = currentIndex.value + (answered.value ? 1 : 0)
  return Math.round((done / total) * 100)
})

const isLastQuestion = computed(function() {
  return currentIndex.value >= effectiveWords.value.length - 1
})

// ====== 选项生成 ======
/**
 * 预置干扰项词表（按常见词义分类）
 * 当生词本词量不足时补充使用 — 全部是真实的中文释义
 */
var FALLBACK_DISTRACTORS = [
  // 形容词类
  '短暂的', '永恒的', '常见的', '罕见的', '模糊的', '清晰的',
  '复杂的', '简单的', '急切的', '缓慢的', '微小的', '巨大的',
  '脆弱的', '坚固的', '荒谬的', '合理的', '冷漠的', '热情的',
  // 动词类
  '拒绝', '接受', '否认', '承认', '挣扎', '屈服',
  '威胁', '保护', '背叛', '支持', '消失', '出现',
  // 名词类
  '合同', '协议', '证据', '秘密', '债务', '财富',
  '机会', '风险', '真相', '谎言', '命运', '选择',
  // 副词/其他
  '悄悄地', '突然地', '渐渐地', '彻底地', '仅仅', '几乎'
]

/**
 * 策略：
 * P0: 从生词本全量词库选真实 meaning 作为干扰项
 * P1: 从预置词表补充不足的部分
 * 输出：4个不同选项，只有1个正确答案
 */
const options = computed(function() {
  var w = currentWord.value
  var correct = trimmedMeaning.value

  // 极端保护：连正确答案都找不到 → 返回空（显示跳过提示）
  if (!correct) return []

  // ── P0：从 Store 全量词库中选干扰候选 ──
  var candidates = []
  var allWords = vocabStore.words
  for (var i = 0; i < allWords.length; i++) {
    var cw = allWords[i]
    if (cw.word === w.word) continue
    var cm = resolveMeaning(cw)
    if (!cm) continue
    if (cm === correct) continue
    candidates.push(cm)
  }

  // 去重
  var pool = []
  var seen = {}
  for (var j = 0; j < candidates.length; j++) {
    if (!seen[candidates[j]]) {
      seen[candidates[j]] = true
      pool.push(candidates[j])
    }
  }

  // 打乱
  for (var k = pool.length - 1; k > 0; k--) {
    var rand = Math.floor(Math.random() * (k + 1))
    var temp = pool[k]
    pool[k] = pool[rand]
    pool[rand] = temp
  }

  // 取最多3个干扰项
  var distractors = pool.slice(0, 3)

  // ── P1：不足时从预置词表补充 ──
  if (distractors.length < 3) {
    var shuffled = FALLBACK_DISTRACTORS.slice()
    for (var fi = shuffled.length - 1; fi > 0; fi--) {
      var ri = Math.floor(Math.random() * (fi + 1))
      var tmp2 = shuffled[fi]
      shuffled[fi] = shuffled[ri]
      shuffled[ri] = tmp2
    }
    for (var f = 0; f < shuffled.length && distractors.length < 3; f++) {
      var fb = shuffled[f]
      if (fb !== correct && distractors.indexOf(fb) < 0) {
        distractors.push(fb)
      }
    }
  }

  // 混合正确答案 + 干扰项，再打乱顺序
  var all = [correct].concat(distractors)

  // Fisher-Yates 洗牌
  for (var n = all.length - 1; n > 0; n--) {
    var r = Math.floor(Math.random() * (n + 1))
    var tmp3 = all[n]
    all[n] = all[r]
    all[r] = tmp3
  }

  return all
})

/**
 * 正确答案在 options 数组中的索引
 * 用 resolveMeaning 后的值做比较，确保一致性
 */
const correctIndex = computed(function() {
  var target = trimmedMeaning.value
  for (var i = 0; i < options.value.length; i++) {
    if (options.value[i] === target) return i
  }
  return -1
})

// ====== A/B/C/D 标签 ======
function labelFor(idx) {
  return String.fromCharCode(65 + idx)
}

// ====== 选项样式计算 ======
function optionClass(idx) {
  var classes = []
  if (selectedIndex.value === idx) classes.push('selected')
  if (answered.value) {
    if (idx === correctIndex.value) {
      classes.push('correct')
    } else if (selectedIndex.value === idx) {
      classes.push('wrong')
    }
  }
  return classes.join(' ')
}

// ====== 交互方法 ======
function selectOption(idx) {
  if (answered.value) return
  selectedIndex.value = idx
  answered.value = true

  isCorrect.value = (idx === correctIndex.value)

  if (isCorrect.value) {
    stats.value.correct++
  } else {
    stats.value.wrong++
  }

  emit('update', { word: currentWord.value, remembered: isCorrect.value })
}

function nextQuestion() {
  if (isLastQuestion.value) {
    emit('complete', stats.value)
    return
  }
  currentIndex.value++
  selectedIndex.value = -1
  answered.value = false
  isCorrect.value = false
}
</script>

<style scoped>
.choice-review { max-width: 520px; margin: 0 auto; padding: 32px 0; }

/* ── 词数不足提示 ── */
.empty-hint {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 20px; text-align: center; color: #9CA3AF;
}
.empty-hint span { font-size: 48px; }
.empty-hint h3 { font-size: 1.25rem; color: #C084FC; }
.empty-hint p { font-size: 14px; max-width: 360px; line-height: 1.6; }
.sub-text { font-size: 13px; color: #9CA3AF; }
.btn-primary {
  display: inline-block; margin-top: 8px; padding: 10px 28px;
  font-size: 14px; font-weight: 700; text-decoration: none;
  background: linear-gradient(135deg, #7C3AED, #E11D48); color: #fff;
  border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
.exit-btn {
  margin-top: 8px; padding: 8px 24px; font-size: 14px; font-weight: 600;
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 10px; color: #A78BFA; cursor: pointer;
}
.exit-btn:hover { background: rgba(124,58,237,0.15); }

/* ── 题干区域 ── */
.choice-card { text-align: center; }
.question-word {
  font-size: 2rem; font-weight: 800; color: #C084FC; letter-spacing: 0.5px;
}
.question-phonetic {
  font-size: 0.95em; color: #9CA3AF; font-family: 'SF Mono', monospace; margin-top: 6px;
}
.question-hint {
  font-size: 13px; color: #9CA3AF; margin-top: 8px;
}

/* ── 选项网格（2×2）── */
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 28px;
}
.option-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 16px;
  font-size: 15px;
  text-align: left; background: rgba(255,255,255,0.6);
  border: 2px solid rgba(156,163,175,0.15);
  border-radius: 14px; cursor: pointer; transition: all 0.2s; color: inherit;
}
.dark .option-btn { background: rgba(30,27,75,0.6); }
.option-btn:hover:not(:disabled) {
  border-color: #7C3AED; transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124,58,237,0.12);
}
.option-btn:disabled { cursor: default; }

/* A/B/C/D 标签 */
.opt-label {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  font-size: 13px; font-weight: 800; background: rgba(124,58,237,0.1); color: #A78BFA;
}
.option-btn.selected .opt-label { background: #7C3AED; color: #fff; }
.option-btn.correct .opt-label { background: #10B981; color: #fff; }
.option-btn.wrong .opt-label { background: #EF4444; color: #fff; }

/* 选项文字 */
.opt-text { line-height: 1.4; }

/* 选中状态 */
.option-btn.selected { border-color: #7C3AED; background: rgba(124,58,237,0.06); }
.option-btn.correct { border-color: #10B981; background: rgba(16,185,129,0.06); }
.option-btn.correct .opt-text { color: #10B981; font-weight: 600; }
.option-btn.wrong { border-color: #EF4444; background: rgba(239,68,68,0.06); }
.option-btn.wrong .opt-text { color: #EF4444; }

/* ── 反馈区 ── */
.result-feedback {
  margin-top: 24px; padding: 14px 20px; border-radius: 12px;
  font-weight: 700; font-size: 15px;
}
.result-feedback.correct { background: rgba(16,185,129,0.08); color: #10B981; }
.result-feedback.wrong { background: rgba(239,68,68,0.08); color: #EF4448; }
.result-feedback strong { color: #10B981; }

/* ── 下一题按钮 ── */
.next-btn {
  display: block; margin: 24px auto 0;
  padding: 12px 36px; font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #7C3AED, #E11D48);
  color: #fff; border: none; border-radius: 12px; cursor: pointer; transition: all 0.25s;
}
.next-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }

/* ── 进度条 ── */
.progress-bar { display: flex; align-items: center; gap: 12px; margin-top: 28px; }
.progress-track { flex: 1; height: 6px; background: rgba(156,163,175,0.15); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7C3AED, #A78BFA); transition: width 0.35s ease; }
.progress-bar span { font-size: 13px; color: #9CA3AF; min-width: 48px; text-align: right; font-variant-numeric: tabular-nums; }

/* ── 动画 ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── 响应式 ── */
@media (max-width: 480px) {
  .question-word { font-size: 1.6rem; }
  .options-grid { gap: 10px; }
  .option-btn { padding: 14px 12px; font-size: 14px; }
  .opt-label { width: 24px; height: 24px; font-size: 12px; }
}
</style>
