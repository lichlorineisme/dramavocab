<template>
  <div class="dashboard" :class="{ dark: store.isDark }">
    <div class="dash-container">
      <!-- 头部 -->
      <header class="dash-header">
        <h1 class="page-title">📊 学习数据</h1>
        <p class="greeting">{{ greeting }}，{{ userName || '同学' }}</p>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card vocab-stat">
          <span class="stat-icon">📖</span>
          <div class="stat-info">
            <span class="stat-num">{{ totalVocab }}</span>
            <span class="stat-label">生词本</span>
          </div>
        </div>
        <div class="stat-card mastered-stat">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-num">{{ masteredCount }}</span>
            <span class="stat-label">已掌握</span>
          </div>
        </div>
        <div class="stat-card review-stat">
          <span class="stat-icon">🔄</span>
          <div class="stat-info">
            <span class="stat-num">{{ dueReviewCount }}</span>
            <span class="stat-label">待复习</span>
          </div>
        </div>
        <div class="stat-card chapter-stat">
          <span class="stat-icon">📚</span>
          <div class="stat-info">
            <span class="stat-num">{{ completedChapters }}</span>
            <span class="stat-label">完成章节</span>
          </div>
        </div>
      </div>

      <!-- 热力图 -->
      <section class="heatmap-section">
        <div class="section-header">
          <h2>连续学习记录</h2>
          <span class="streak-badge">🔥 {{ streakDays }} 天</span>
        </div>
        <p class="heatmap-rule">
          当天有收藏单词、复习单词、或阅读记录即记为活跃（颜色越深=当天学习次数越多）
        </p>
        <div class="heatmap-scroll">
          <div class="heatmap-grid">
            <!-- 12周 × 7天 = 84格 -->
            <div
              v-for="(day, idx) in heatmapData"
              :key="'d-' + idx"
              class="heat-cell"
              :class="'level-' + day.level"
              :title="day.date + (day.count > 0 ? ` · ${day.count}次学习` : '')"
            />
          </div>
        </div>
        <div class="heatmap-legend">
          <span>少</span>
          <div class="legend-cells">
            <div class="level-0" /><div class="level-1" /><div class="level-2" /><div class="level-3" /><div class="level-4" />
          </div>
          <span>多</span>
        </div>
      </section>

      <!-- 快捷操作 -->
      <section class="quick-actions">
        <router-link to="/read/1/1" class="action-card">
          📚 去阅读
          <span class="action-sub">开始阅读学习</span>
        </router-link>
        <router-link to="/review" class="action-card">
          🔄 复习
          <span class="action-sub">{{ dueReviewCount }}个词待复习</span>
        </router-link>
        <router-link to="/vocabulary" class="action-card">
          📖 生词本
          <span class="action-sub">{{ totalVocab }}个收藏词汇</span>
        </router-link>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useReadingStore } from '../stores/reading.js'
import { useVocabStore } from '../stores/vocab.js'
import { useUserStore } from '../stores/user.js'

const store = useReadingStore()
const vocabStore = useVocabStore()
const userStore = useUserStore()

const userName = computed(() => {
  return userStore.name || userStore.username || localStorage.getItem('drama_user_name') || '同学'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// ===== 统计数据 =====
const totalVocab = computed(() => vocabStore.totalWords)
const masteredCount = computed(() =>
  (vocabStore.words || []).filter(w => (w.masteryLevel ?? 0) >= 4).length
)
const dueReviewCount = computed(() =>
  (vocabStore.words || []).filter(w => {
    if (!w.nextReview) return true
    return new Date(w.nextReview) <= new Date()
  }).length
)
const completedChapters = computed(() => store.completedChapters.size)

// ===== 热力图数据 =====
/** 生成过去84天的热力图数据 */
const heatmapData = computed(() => {
  const data = []
  const today = new Date()
  
  // 从 localStorage 获取真实活动记录
  const activityLog = getActivityLog()
  
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDate(date)

    const count = activityLog[dateStr] || 0
    
    data.push({
      date: dateStr,
      count: count,
      level: getHeatLevel(count)
    })
  }
  return data
})

/** 连续打卡天数 */
const streakDays = computed(() => {
  const today = new Date()
  const activityLog = getActivityLog()
  let streak = 0
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)
    if (activityLog[dateStr] && activityLog[dateStr] > 0) {
      streak++
    } else if (i > 0) { // 允许今天还没学习
      break
    }
  }
  return streak
})

// ===== 辅助函数 =====

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getActivityLog() {
  try {
    const log = localStorage.getItem('drama_activity_log')
    if (log) {
      return JSON.parse(log)
    }
  } catch {}
  return {}
}

function getHeatLevel(count) {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 2) return 2
  if (count <= 4) return 3
  return 4
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #F9FAFB;
  padding: 24px;
  transition: all 0.3s;
}
.dashboard.dark { background: #0F0A1A; color: #E5E7EB; }
.dash-container { max-width: 800px; margin: 0 auto; }

/* 头部 */
.dash-header { margin-bottom: 28px; }
.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #E11D48, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.greeting { font-size: 14px; color: #9CA3AF; margin-top: 4px; }

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(156,163,175,0.1);
  border-radius: 16px;
  transition: all 0.25s;
}
.dark .stat-card { background: rgba(30,27,75,0.5); border-color: rgba(124,58,237,0.1); }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(124,58,237,0.08); }
.stat-icon { font-size: 28px; }
.stat-num { display: block; font-size: 1.8rem; font-weight: 800; color: #C084FC; line-height: 1; }
.stat-label { font-size: 13px; color: #9CA3AF; margin-top: 4px; }

/* 热力图 */
.heatmap-section {
  background: rgba(255,255,255,0.65);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 28px;
}
.dark .heatmap-section { background: rgba(30,27,75,0.45); border: 1px solid rgba(124,58,237,0.1); }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.section-header h2 {
  font-size: 15px; font-weight: 700;
}
.streak-badge {
  font-size: 13px; font-weight: 700; color: #F59E0B;
  background: rgba(245,158,11,0.1); padding: 4px 12px; border-radius: 10px;
}
.heatmap-rule {
  font-size: 11px; color: #9CA3AF; margin-bottom: 16px; line-height: 1.5;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr); /* 12周 */
  grid-auto-flow: dense;
  gap: 3px;
}

.heatmap-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.heatmap-scroll::-webkit-scrollbar {
  height: 6px;
}

.heatmap-scroll::-webkit-scrollbar-thumb {
  background: rgba(124, 58, 237, 0.28);
  border-radius: 99px;
}

.heat-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgba(156,163,175,0.08);
  transition: transform 0.15s, background-color 0.2s;
  cursor: default;
}
.heat-cell:hover { transform: scale(1.35); z-index: 1; }
.level-0 { background: rgba(156,163,175,0.07); }
.level-1 { background: rgba(124,58,237,0.22); }
.level-2 { background: rgba(124,58,237,0.42); }
.level-3 { background: rgba(167,139,250,0.62); }
.level-4 { background: linear-gradient(145deg, #E11D48, #7C3AED); }

.heatmap-legend {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; font-size: 11px; color: #9CA3AF;
  justify-content: flex-end;
}
.legend-cells { display: flex; gap: 2px; }
.legend-cells div {
  width: 12px; height: 12px; border-radius: 2px;
}
.legend-cells .level-0 { background: rgba(156,163,175,0.07); }
.legend-cells .level-1 { background: rgba(124,58,237,0.22); }
.legend-cells .level-2 { background: rgba(124,58,237,0.42); }
.legend-cells .level-3 { background: rgba(167,139,250,0.62); }
.legend-cells .level-4 { background: linear-gradient(145deg, #E11D48, #7C3AED); }

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px;
  background: linear-gradient(145deg, rgba(124,58,237,0.06), rgba(225,29,72,0.04));
  border: 1px solid rgba(124,58,237,0.12);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.25s;
}
.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(124,58,237,0.14);
  border-color: rgba(124,58,237,0.3);
}
.action-sub {
  font-size: 12px; font-weight: 400; color: #9CA3AF;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px 14px 24px;
  }

  .dash-header {
    margin-bottom: 18px;
  }

  .page-title {
    font-size: 1.55rem;
  }

  .greeting {
    font-size: 13px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .stat-card {
    padding: 14px 12px;
    border-radius: 14px;
    gap: 10px;
  }

  .stat-icon {
    font-size: 22px;
  }

  .stat-num {
    font-size: 1.45rem;
  }

  .stat-label {
    font-size: 12px;
  }

  .heatmap-section {
    padding: 16px 14px;
    border-radius: 16px;
    margin-bottom: 20px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .section-header h2 {
    font-size: 14px;
  }

  .heatmap-rule {
    font-size: 11px;
    margin-bottom: 12px;
  }

  .heatmap-grid {
    min-width: 210px;
  }

  .heatmap-legend {
    justify-content: flex-start;
  }

  .quick-actions {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .action-card {
    padding: 16px 12px;
    border-radius: 14px;
    gap: 4px;
  }
}
</style>
