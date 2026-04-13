# DramaVocab 3.0 能力清单 + 数据查看教程

更新时间：2026-04-13

## 一、产品能力清单（当前版本）

### 1) 阅读主链路
- 三模式阅读：沉浸 / 透视 / 挑战
- 点词弹层：词义、音标、发音、收藏
- 挑战判题：输入判定、正确/错误反馈
- 单词本：收藏与复习联动

### 2) 内容能力
- 内置系统书籍（book1 / book2）
- 首页书架支持真实封面展示
- 导入中心（用户自助）
  - 快速导入：粘贴文本或上传 `txt/md/pdf`
  - AI 智能转化说明：内置提示词和步骤引导
  - 导入预览：章节/段落/词汇可视校验
  - 导入历史管理：继续阅读、删除记录

### 3) 统计能力（无登录）
- GA4 免费接入
- 页面浏览与关键行为事件统计
- 访客匿名标识（`visitor_id`）

---

## 二、你最关心的数据怎么查

### 1) 看“有多少人用过”
GA4 -> Reports -> Acquisition / Overview  
看指标：
- Users（用户数）
- New users（新用户）

### 2) 看“大家在用什么功能”
GA4 -> Reports -> Engagement -> Events  
重点事件：
- `book_click`
- `reading_enter`
- `import_hub_fast_click`
- `import_fast_entry`
- `import_save_success`

### 3) 看“现在有没有人在用”
GA4 -> Reports -> Realtime

---

## 三、建议固定观察的 4 个核心数（每周一次）
1. 用户数（Users）
2. 新用户（New users）
3. 阅读进入次数（`reading_enter`）
4. 导入转化（`import_hub_fast_click` -> `import_save_success`）

---

## 四、上线后 GA4 需要改什么
1. Web Stream 的网站 URL 改成你的线上域名
2. 确认 `VITE_GA_MEASUREMENT_ID` 已在线上环境变量配置
3. 首次上线后打开页面实测，在 Realtime 验证事件是否到达
