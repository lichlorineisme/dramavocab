<template>
  <div class="review-page" :class="{ dark: store.isDark }">
    <!-- 全局错误提示 -->
    <div v-if="hasError" class="error-boundary">
      <span class="error-icon">⚠️</span>
      <h2>页面出了点问题</h2>
      <p class="error-msg">{{ errorMessage }}</p>
      <button class="btn-primary" @click="retry">🔄 刷新重试</button>
      <button class="btn-secondary" @click="goBack">← 返回</button>
    </div>

    <div v-else class="review-container">
      <!-- ===== 状态1：未选择模式 → 展示模式入口 ===== -->
      <template v-if="!activeMode && !reviewFinished">
        <header class="review-header">
          <h1 class="page-title">🔄 复习中心</h1>
          <p class="page-subtitle">
            {{ singleWordMode ? '单个单词专项复习' : `今日待复习 ${pendingCount} 个单词` }}
            · 目标每次 <strong>{{ batchSize }} 词</strong>
          </p>
        </header>

        <!-- 今日进度环（非单字模式才显示） -->
        <div v-if="!singleWordMode" class="progress-ring-section">
          <svg viewBox="0 0 120 120" class="progress-svg">
            <circle cx="60" cy="60" r="52" stroke-width="8"
              fill="none" stroke="rgba(124,58,237,0.12)" />
            <circle cx="60" cy="60" r="52" stroke-width="8" fill="none"
              :stroke="progressColor"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="circumference - progressPercent * circumference"
              style="transition: stroke-dashoffset 0.6s ease;" />
            <text x="60" y="55" text-anchor="middle" fill="#C084FC"
              font-size="24" font-weight="800">{{ Math.round(progressPercent * 100) }}%</text>
            <text x="60" y="75" text-anchor="middle" fill="#9CA3AF"
              font-size="11">{{ todayReviewed }}/{{ pendingCount }}</text>
          </svg>
        </div>

        <!-- 单字模式提示 -->
        <div v-if="singleWordMode && targetWord" class="single-word-banner">
          <span class="single-word-name">{{ targetWord.word }}</span>
          <span class="single-word-meaning" v-if="targetWord.meaning">{{ targetWord.meaning }}</span>
        </div>

        <!-- 2种复习模式卡片（MVP） -->
        <div :class="['mode-grid', { 'single-mode': singleWordMode }]">
          <button
            v-for="mode in modes"
            :key="mode.id"
            class="mode-card"
            @click="startMode(mode.id)"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-name">{{ mode.name }}</span>
            <span class="mode-desc">{{ mode.desc }}</span>
            <span class="mode-count">{{ mode.count }}词</span>
          </button>
        </div>

        <!-- 无数据提示 -->
        <div v-if="pendingCount === 0 && !singleWordMode" class="empty-state">
          <span>🎉</span>
          <h3>今天没有待复习的词</h3>
          <p>你已经完成了今日的学习任务，或者生词本还是空的～</p>
          <router-link to="/" class="btn-primary">去阅读收藏新单词 →</router-link>
          <router-link to="/vocabulary" class="btn-secondary inline-btn">查看生词本</router-link>
        </div>

        <!-- 底部统计 -->
        <div v-if="!singleWordMode && pendingCount > 0" class="bottom-stats">
          <span>📊 本周已复习 <strong>{{ todayReviewed }}</strong> 词</span>
          <span>· 生词本共 <strong>{{ vocabStore.totalWords }}</strong> 词</span>
        </div>
      </template>

      <!-- ===== 状态2：复习进行中 ===== -->
      <template v-else-if="activeMode && !reviewFinished">
        <!-- 子组件错误兜底 -->
        <div v-if="componentError" class="component-error">
          <span>⚠️</span>
          <p>{{ componentErrorMsg }}</p>
          <button class="btn-primary" @click="retryMode">🔄 重试此模式</button>
          <button class="btn-secondary" @click="exitMode">← 返回选择</button>
        </div>

        <!-- 队列为空时的友好提示 -->
        <div v-else-if="safeReviewQueue.length === 0" class="empty-state">
          <span>📭</span>
          <h3>没有可复习的单词</h3>
          <p>复习队列为空，可能所有单词都已掌握。</p>
          <button class="btn-primary" @click="exitMode">← 返回选择模式</button>
        </div>

        <!-- 闪卡模式 -->
        <FlashCardReview
          v-else-if="activeMode === 'flashcard'"
          ref="reviewCompRef"
          :words="safeReviewQueue"
          @update="onReviewUpdate"
          @complete="onReviewComplete"
          @error="handleComponentError"
        />

        <!-- 选择题 -->
        <ChoiceReview
          v-else-if="activeMode === 'choice'"
          ref="reviewCompRef"
          :queue="safeReviewQueue"
          @finish="backToModes"
          @error="handleComponentError"
        />
      </template>

      <!-- ===== 状态3：完成总结 ===== -->
      <div v-if="reviewFinished" class="finish-screen">
        <div class="finish-icon">🎉</div>
        <h2>本轮复习完成！</h2>
        <div class="finish-stats">
          <div class="stat-box correct">
            <span class="stat-num">{{ reviewStats.correct }}</span>
            <span class="stat-label">✅ 巩固</span>
          </div>
          <div class="stat-box wrong">
            <span class="stat-num">{{ reviewStats.wrong }}</span>
            <span class="stat-label">❌ 待加强</span>
          </div>
        </div>
        <!-- 掌握度变化摘要 -->
        <div v-if="levelChanges.length > 0" class="level-changes">
          <p class="changes-title">掌握度变化：</p>
          <div class="change-item" v-for="c in levelChanges" :key="c.word">
            <strong>{{ c.word }}</strong>
            <span :class="c.delta > 0 ? 'up' : 'down'">
              {{ c.delta > 0 ? '⬆' : '⬇' }} {{ c.oldLv }} → {{ c.newLv }}
            </span>
          </div>
        </div>
        <button class="btn-primary" @click="backToModes">← 返回</button>
        <button class="btn-secondary" @click="againRound">🔄 再来一轮</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReadingStore } from '../stores/reading.js'
import { useVocabStore } from '../stores/vocab.js'
import { trackEvent, EVENT } from '../utils/analytics.js'
import FlashCardReview from '../components/FlashCardReview.vue'
import ChoiceReview from '../components/ChoiceReview.vue'

const router = useRouter()
const route = useRoute()
const store = useReadingStore()
const vocabStore = useVocabStore()

// ===== 错误边界 =====
const hasError = ref(false)
const errorMessage = ref('')
const componentError = ref(false)
const componentErrorMsg = ref('')

onErrorCaptured((err) => {
  console.error('[ReviewView Error]', err)
  if (activeMode.value) {
    componentError.value = true
    componentErrorMsg.value = err?.message || String(err)
  } else {
    hasError.value = true
    errorMessage.value = err?.message || String(err)
  }
  return false
})

// ===== 路由参数解析 =====
/** 是否为单字复习模式 */
const singleWordMode = computed(() => !!route.query.word)
/** 单字复习的目标单词 */
const targetWord = computed(() => {
  if (!singleWordMode.value) return null
  return vocabStore.getWordByName(route.query.word)
})

// ===== 复习队列（核心修复：使用 Store 的 getReviewQueue） =====
const batchSize = ref(10) // 默认每批10词，最多20

/** 当前批次的复习队列 */
const safeReviewQueue = computed(() => {
  try {
    // 单字模式：只返回这一个词
    if (singleWordMode.value && targetWord.value) {
      return [targetWord.value]
    }
    // 批量模式：从 Store 获取截断后的队列
    const queue = vocabStore.getReviewQueue(batchSize.value)
    return Array.isArray(queue) ? queue : []
  } catch (e) {
    console.error('[safeReviewQueue] error', e)
    return []
  }
})

/** 今日待复习总数（不受 batchSize 影响） */
const pendingCount = computed(() => {
  if (singleWordMode.value) return 1
  // 使用 Store 的 pendingWords + 到期学习中词的总数
  const fullQueue = vocabStore.getReviewQueue(0) // 0 = 不截断，取全部
  return Array.isArray(fullQueue) ? fullQueue.length : 0
})

// ===== 进度统计 =====
const todayReviewed = ref(0)
const circumference = 2 * Math.PI * 52
const progressPercent = computed(() =>
  pendingCount.value > 0 ? Math.min(todayReviewed.value / Math.max(pendingCount.value, 1), 1) : 0
)
const progressColor = computed(() => {
  if (progressPercent.value >= 1) return '#10B981'
  if (progressPercent.value >= 0.6) return '#F59E0B'
  return '#7C3AED'
})

// ===== 模式定义（2种复习模式 MVP） =====
const modes = computed(() => [
  {
    id: 'flashcard',
    icon: '🃏',
    name: '闪卡模式',
    desc: '看英文回忆中文释义，点击翻转查看答案',
    count: safeReviewQueue.value.length,
  },
  {
    id: 'choice',
    icon: '✅',
    name: '选择题',
    desc: '四选一选出正确释义，快速检验记忆',
    count: safeReviewQueue.value.length,
  },
])

// ===== 状态管理 =====
const activeMode = ref(null)
const reviewFinished = ref(false)
const reviewStats = ref({ correct: 0, wrong: 0 })
const reviewCompRef = ref(null)
/** 记录每道题的掌握度变化 */
const levelChanges = ref([])

function startMode(modeId) {
  activeMode.value = modeId
  reviewFinished.value = false
  reviewStats.value = { correct: 0, wrong: 0 }
  componentError.value = false
  componentErrorMsg.value = ''
  levelChanges.value = []

  // Analytics: 漏斗第5步 — 开始复习
  trackEvent(EVENT.REVIEW_START, {
    mode: modeId,
    word_count: safeReviewQueue.value.length,
    is_single_word: singleWordMode.value,
    target_word: singleWordMode.value ? route.query.word : undefined,
  })
}

function exitMode() {
  activeMode.value = null
  componentError.value = false
}

function retryMode() {
  componentError.value = false
  const currentMode = activeMode.value
  activeMode.value = null
  setTimeout(() => { activeMode.value = currentMode }, 50)
}

function backToModes() {
  activeMode.value = null
  reviewFinished.value = false
  resetReview()
}

function againRound() {
  resetReview()
  reviewFinished.value = false
  // 保持当前模式不变即可，组件会自动使用新的 queue
}

function handleComponentError(msg) {
  componentError.value = true
  componentErrorMsg.value = msg || '组件加载异常'
}

function onReviewComplete(stats) {
  reviewStats.value = stats || { correct: 0, wrong: 0 }
  reviewFinished.value = true
  todayReviewed.value += (stats?.correct || 0)

  // Analytics: 复习完成（漏斗终点）
  trackEvent(EVENT.REVIEW_COMPLETE, {
    mode: activeMode.value,
    correct_count: stats?.correct || 0,
    wrong_count: stats?.wrong || 0,
    total_words: safeReviewQueue.value.length,
    accuracy: (stats?.correct || 0) / Math.max((stats?.correct || 0) + (stats?.wrong || 0), 1),
  })
}

/** 复习过程中每道题的实时结果 -> 更新单词掌握度 + 记录变化 */
function onReviewUpdate({ word, remembered }) {
  try {
    if (!word || !word.word) return
    // 记录变化前的等级
    const oldLevel = word.masteryLevel ?? 0
    // 更新掌握度
    vocabStore.updateWordReview(word.word, !!remembered)
    // 重新读取更新后的单词来获取新等级
    const updated = vocabStore.getWordByName(word.word)
    const newLevel = updated ? (updated.masteryLevel ?? 0) : oldLevel
    // 记录变化（去重）
    const existingIdx = levelChanges.value.findIndex(c => c.word === word.word)
    const changeEntry = { word: word.word, oldLv: oldLevel, newLv: newLevel, delta: newLevel - oldLevel }
    if (existingIdx >= 0) {
      levelChanges.value[existingIdx] = changeEntry
    } else {
      levelChanges.value.push(changeEntry)
    }
  } catch (e) {
    console.error('[onReviewUpdate] 更新失败', e)
  }
}

function resetReview() {
  reviewFinished.value = false
  reviewStats.value = { correct: 0, wrong: 0 }
  levelChanges.value = []
}

function retry() {
  hasError.value = false
  errorMessage.value = ''
  componentError.value = false
  activeMode.value = null
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background: #F9FAFB;
  padding: 24px;
  transition: all 0.3s;
}
.review-page.dark { background: #0F0A1A; color: #E5E7EB; }
.review-container { max-width: 700px; margin: 0 auto; }

/* ===== 错误边界 ===== */
.error-boundary, .component-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; padding: 80px 24px; text-align: center; min-height: 60vh;
}
.error-icon { font-size: 48px; }
.error-boundary h2 { font-size: 1.4rem; color: #EF4444; }
.error-msg {
  max-width: 400px; font-size: 14px; color: #9CA3AF;
  background: rgba(239,68,68,0.06); padding: 12px 16px; border-radius: 10px;
  font-family: monospace; word-break: break-all;
}
.component-error p { font-size: 14px; color: #F59E0B; max-width: 400px; }

/* 头部 */
.review-header { margin-bottom: 24px; text-align: center; }
.page-title {
  font-size: 1.6rem; font-weight: 800;
  background: linear-gradient(135deg, #E11D48, #7C3AED);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.page-subtitle { font-size: 14px; color: #9CA3AF; margin-top: 4px; }

/* 进度环 */
.progress-ring-section { width: 120px; height: 120px; margin: 0 auto 28px; }
.progress-svg { width: 100%; height: 100%; }

/* 单字模式横幅 */
.single-word-banner {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px; margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(225,29,72,0.04));
  border: 1px solid rgba(124,58,237,0.15); border-radius: 16px;
}
.single-word-name { font-size: 1.6rem; font-weight: 800; color: #C084FC; }
.single-word-meaning { font-size: 14px; color: #9CA3AF; }

/* 模式网格 */
.mode-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.mode-grid.single-mode { max-width: 480px; margin: 0 auto; }
.mode-card {
  position: relative; display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 32px 16px;
  background: rgba(255,255,255,0.7); border: 1px solid rgba(156,163,175,0.12);
  border-radius: 16px; cursor: pointer; transition: all 0.25s;
  border: none; color: inherit;
}
.dark .mode-card { background: rgba(30,27,75,0.5); border-color: rgba(124,58,237,0.15); }
.mode-card:hover {
  transform: translateY(-4px); box-shadow: 0 8px 32px rgba(124,58,237,0.14);
  border-color: rgba(124,58,237,0.35);
}
.mode-icon { font-size: 40px; }
.mode-name { font-size: 17px; font-weight: 700; }
.mode-desc { font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.5; }
.mode-count {
  position: absolute; top: 12px; right: 12px;
  font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 10px;
  background: rgba(124,58,237,0.1); color: #A78BFA;
}

/* 空状态 & 完成页 */
.empty-state, .finish-screen {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 64px 20px; text-align: center;
}
.empty-state span:first-child { font-size: 48px; }
.empty-state h3 { font-size: 1.25rem; color: #C084FC; }
.empty-state p { font-size: 14px; color: #9CA3AF; max-width: 360px; }

.finish-icon { font-size: 56px; }
.finish-stats { display: flex; gap: 24px; }
.stat-box { text-align: center; }
.stat-num { display: block; font-size: 2rem; font-weight: 800; }
.stat-box.correct .stat-num { color: #10B981; }
.stat-box.wrong .stat-num { color: #EF4444; }
.stat-label { font-size: 13px; color: #9CA3AF; }

/* 掌握度变化 */
.level-changes {
  width: 100%; max-width: 400px; margin-top: 12px;
  padding: 16px; background: rgba(124,58,237,0.04);
  border-radius: 12px;
}
.changes-title { font-size: 13px; font-weight: 600; color: #9CA3AF; margin-bottom: 8px; }
.change-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0; font-size: 14px;
}
.change-item strong { color: #C084FC; }
.change-item .up { color: #10B981; font-weight: 600; }
.change-item .down { color: #EF4444; font-weight: 600; }

/* 底部统计 */
.bottom-stats {
  margin-top: 32px; text-align: center; font-size: 13px; color: #9CA3AF;
}

/* 按钮 */
.btn-primary, .btn-secondary {
  padding: 10px 28px; font-size: 14px; font-weight: 700; border-radius: 10px;
  cursor: pointer; transition: all 0.2s; border: none; margin-top: 8px;
  text-decoration: none; display: inline-block;
}
.btn-primary { background: linear-gradient(135deg, #7C3AED, #E11D48); color: #fff; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
.btn-secondary { background: rgba(156,163,175,0.1); color: #374151; }
.dark .btn-secondary { color: #D1D5DB; }
.btn-secondary:hover { background: rgba(156,163,175,0.18); }
.inline-btn { margin-left: 12px; font-size: 13px; padding: 8px 20px; }

@media (max-width: 640px) {
  .review-page { padding: 16px; }
  .mode-grid { grid-template-columns: 1fr; }
  .mode-card { padding: 24px 12px; }
  .mode-icon { font-size: 32px; }
}
</style>
