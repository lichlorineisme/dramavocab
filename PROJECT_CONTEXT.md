# DramaVocab (抓马英语) V3.0 — AI 接手指南

> **给 Trae / Cursor / any AI coding agent 的完整项目上下文**
> 复制此文件到项目根目录，AI 读取后即可快速接手开发。

---

## 📌 一句话定位

**沉浸式英语词汇学习平台** — 通过阅读狗血霸总小说来背单词。
> Slogan：「看最狗血的文，背最高级的词」

---

## 🏗️ 技术栈

| 技术 | 版本 | 用途 |
|------|:---:|------|
| Vue 3 | ^3.4 | 核心框架 (Composition API + `<script setup>`) |
| Vite | ^5.x | 构建工具 |
| Vue Router 4 | ^4.x | 路由管理 |
| Pinia | ^2.x | 状态管理 |
| TailwindCSS v4 | latest | 原子化 CSS |
| Web Speech API | 浏览器原生 | TTS 单词发音 |

**开发命令：**
```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (http://localhost:3003)
npm run build      # 生产构建
npm run preview    # 预览生产构建
```

---

## 📂 关键目录结构

```
dramavocab/
├── src/
│   ├── main.js                 # 入口文件
│   ├── App.vue                 # 根组件（含全局错误边界）
│   ├── router/index.js         # 路由配置
│   ├── style.css               # 全局样式 + Tailwind
│   │
│   ├── views/                  # 页面组件（路由级）
│   │   ├── HomeView.vue        # 首页（书架）
│   │   ├── ReadView.vue        # 阅读页（含Tab切换+模式栏）
│   │   ├── ReviewView.vue      # 复习中心
│   │   ├── DashboardView.vue   # 学习数据面板
│   │   ├── LoginView.vue       # 登录页
│   │   └── VocabularyView.vue  # 独立单词本（备用）
│   │
│   ├── components/             # 业务组件
│   │   ├── ReaderContent.vue    # ⭐ 核心渲染引擎（沉浸/透视/挑战三模式）
│   │   ├── ReaderToolbar.vue    # 阅读工具栏
│   │   ├── VocabularyPanel.vue  # 内嵌式单词本（ReadView的子Tab）
│   │   ├── WordTooltip.vue      # 桌面端单词闪卡弹窗
│   │   └── WordBottomSheet.vue  # 移动端单词闪卡弹窗
│   │
│   ├── components/             # 复习模式组件（5种）
│   │   ├── FlashCardReview.vue  # 🃏 闪卡复习
│   │   ├── ChoiceReview.vue     # ✅ 选择题
│   │   ├── FillBlankReview.vue  # ✏️ 填空题
│   │   ├── DictationReview.vue  # 🔊 听写题
│   │   └── ContextReview.vue    # 📝 语境填词
│   │
│   ├── stores/                 # Pinia 状态管理
│   │   ├── book.js            # 书籍+章节 Mock 数据（核心数据源！）
│   │   ├── vocab.js           # 生词本 Store（增删改查+掌握度+挑战记录）
│   │   ├── reading.js         # 阅读状态 Store（当前书/章/模式/进度）
│   │   ├── review.js          # 复习状态 Store
│   │   └── user.js            # 用户信息 Store
│   │
│   └── components/layout/     # 布局组件
│       ├── ClientLayout.vue   # C端布局
│       ├── AppHeader.vue      # 顶部导航
│       └── AppFooter.vue      # 底部
│
├── docs/
│   └── dramavocab-v3-prd.md   # 完整 PRD 文档（需求+Schema+开发计划）
├── index.html
├── vite.config.js
├── package.json
└── PROJECT_CONTEXT.md          # ← 你正在读的这个文件
```

---

## 🎯 核心业务流程

### 流程1：阅读学习（主路径）
```
首页(书架) → 点击书籍封面 → ReadView(默认沉浸模式)
  ├─ 沉浸模式：点击高亮词 → TTS发音 + 弹出闪卡(Tooltip/BottomSheet)
  ├─ 透视模式：所有高亮词下方显示中文释义
  └─ 挑战模式：高亮词变填空输入框 → 输入→提交→判对错
       ├─ 答对 → masteryLevel=5(已掌握)
       └─ 答错 → 自动收入生词本 + wrongCount++
```

### 流程2：单词管理
```
ReadView顶部Tab: [📖 阅读] [📝 单词本]
  单词本页面:
  ├─ 查看所有已收藏/挑战收录的单词
  ├─ 点击单词详情 → 开始复习(选5种模式之一)
  └─ "← 继续阅读" → 切回阅读Tab(不丢失位置)
```

### 流程3：复习巩固
```
单词本 → 选单词 → 🔄开始复习 → 选复习模式
  ├─ 🃏 FlashCard  — 翻卡记词义
  ├─ ✅ Choice     — 四选一
  ├─ ✏️ FillBlank  — 看中文拼英文
  ├─ 🔊 Dictation  — 听音拼写
  └─ 📝 Context    — 语境填词
  → 答题完成 → 更新掌握度(masteryLevel) → 循环
```

---

## 🔑 关键设计决策 & 注意事项

### ⚠️ 必须遵守的规则

1. **默认沉浸模式**
   - 进入阅读页 → 强制 `mode = 'immersive'`
   - 切换章节 → 重置为 `mode = 'immersive'`
   - 用户主动才切其他模式
   - 实现：`ReadView.vue` 的 `watch(route)` 中调用 `store.setMode('immersive')`

2. **响应式数据陷阱（血泪教训！）**
   - ❌ 不要在 computed 里返回普通 JS 对象数组然后修改属性
   - ✅ 用 `ref()` 或 `reactive()` 包裹状态
   - ❌ 不要用 `defineEmits()` 但不解构返回值
   - ✅ 必须 `const emit = defineEmits([...])`

3. **事件监听器生命周期**
   - `onMounted` 添加的事件监听器，必须在 `onBeforeUnmount` 清理
   - 否则路由切换时监听器堆积 → click 事件冲突

4. **Teleport 目标安全**
   - `WordTooltip` 和 `WordBottomSheet` 使用 `<Teleport to="body">`
   - 传入的 props 数据必须完整（word/translation/phonetic/example 不能为 null）

5. **错误边界**
   - `App.vue` 有全局 `onErrorCaptured` → 显示友好错误页
   - `ReviewView.vue` 有局部错误捕获 → 子组件崩溃不影响整体
   - 所有渲染函数有 try-catch 防御

---

## 🐛 已知问题 & 待修复清单

### 🔴 P0 致命（必须先修）

| # | 问题 | 定位 | 说明 |
|---|------|------|------|
| - | （本次打包前黑屏问题已全部修复） | | |

### 🟠 P1 功能完善

| # | 问题 | 建议 |
|---|------|------|
| 1 | **Book2/Book3 词汇量不足** | Book2仅18词, Book3仅16词, 需扩充至每本100+词 |
| 2 | **挑战模式输入体验** | 回车键提交需确认是否正常工作 |
| 3 | **TTS 发音质量** | 当前用 Web Speech API, 可能需换成更高质量方案 |

### 🟡 P2 体验优化

| # | 建议 | 说明 |
|---|------|------|
| 1 | 移动端适配优化 | BottomSheet 在小屏幕上的交互 |
| 2 | 学习数据统计增强 | Dashboard 热力图数据真实性 |
| 3 | 暗色主题一致性 | 确保所有页面统一暗夜紫风格 |

### 📋 配色体系

```css
--primary: #7C3AED;    /* 暗夜紫 */
--accent: #E11D48;     /* 玫瑰红 */
--gold: #F59E0B;       /* 学术金 */
--bg-dark: #0F0A1F;    /* 深色背景 */
--bg-card: #1a1230;    /* 卡片背景 */
```

---

## 📦 核心 Store API 速查

### vocabStore（生词本）— `stores/vocab.js`
```js
vocabStore.addWord({ word, translation, phonetic, chapterId, example })  // 添加生词
vocabStore.removeWord(word)              // 删除
vocabStore.toggleFavorite(word)          // 收藏/取消收藏
vocabStore.updateMastery(word, level)    // 更新掌握度(1-5)
vocabStore.recordChallengeResult(word, isCorrect)  // 记录挑战结果
vocabStore.getWordsByChapter(chapterId)  // 按章节筛选
vocabStore.getDueWords()                 // 获取待复习单词
// 关键 state: words[], favoriteWords[]
```

### readingStore（阅读状态）— `stores/reading.js`
```js
readingStore.setCurrentBook(book)        // 设置当前书籍
readingStore.setCurrentChapter(chapter)  // 设置当前章节
readingStore.setMode('immersive'|'perspective'|'challenge') // 切换模式
readingStore.markProgress(position)      // 记录阅读进度
readingStore.recordChallengeAnswer(word, isCorrect) // 记录挑战答案
// 关键 state: currentBook, currentChapter, mode
```

### bookStore（书籍数据）— `stores/book.js`
```js
bookStore.books                    // 所有书籍数组
bookStore.getBook(bid)             // 按 ID 获取
bookStore.getChapter(bid, cid)     // 获取指定章节
// ⚠️ 这是 Mock 数据源！正式版本替换这里
```

---

## 🧪 自测检查清单

每次修改后请确认以下流程：

- [ ] 首页加载正常，显示书架
- [ ] 点击书籍封面 → 进入阅读页（默认**沉浸模式**）
- [ ] 点击高亮词 → TTS播放 + 弹出闪卡（桌面端Tooltip / 移动端BottomSheet）
- [ ] 切换👁️透视模式 → 高亮词下显示中文释义
- [ ] 切换✏️挑战模式 → 高亮词变输入框 → 输入→回车→判对错
- [ ] 切换📝单词本Tab → 显示已收录单词 → "继续阅读"回到原位
- [ ] 点单词详情 → 🔄开始复习 → 选模式 → **答题流程跑通**
- [ ] 答题完成后掌握度更新
- [ ] 切换章节 → 重置为沉浸模式
- [ ] **任何操作不会黑屏**（错误边界兜住）

---

## 📄 补充文档

- 完整 PRD：`docs/dramavocab-v3-prd.md`（含数据库 Schema 设计）
- 此文件最后更新：2026-04-12

---

> 💡 **提示给 AI Coding Agent**：这是一个 Vue 3 + Vite 的 MVP 项目，核心是 `ReaderContent.vue`（三模式渲染引擎）和 `vocabStore`（生词本状态管理）。最大的技术坑在于 **Vue 响应式数据**和**事件监听器生命周期清理**，修 bug 时优先检查这两点。
