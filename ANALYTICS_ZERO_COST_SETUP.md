# DramaVocab 零成本数据统计（无登录版）

## 目标
- 不做登录体系
- 不增加用户操作成本
- 快速看到“多少人用过 + 在用什么功能”

## 1. 开通 GA4（免费）
1. 打开 Google Analytics，创建一个 GA4 Property。
2. 新建 Web Data Stream，拿到 `Measurement ID`（格式：`G-XXXXXXXXXX`）。

## 2. 本地配置
在项目根目录创建 `.env.local`（不要提交）：

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# 可选：Microsoft Clarity（免费热力图）
VITE_CLARITY_PROJECT_ID=
```

重启前端：

```bash
npm run dev -- --host 127.0.0.1 --port 3020 --strictPort
```

## 3. 验证是否生效
1. 打开站点并点击首页「读书」或「快速导入」。
2. 在 GA4 -> Reports -> Realtime，看到实时用户与事件即接入成功。

## 4. 你最关心的数据在哪看
- 有多少人用过：`Users`（用户数）
- 新增用户趋势：`New users`
- 哪些功能最常用：`Engagement -> Events`

重点事件（已接入）：
- `book_click`
- `reading_enter`
- `import_hub_fast_click`
- `import_hub_ai_click`
- `import_fast_entry`
- `import_file_upload_success` / `import_file_upload_fail`
- `import_preview_success` / `import_preview_fail`
- `import_save_success`
- `import_history_continue`
- `import_history_delete`

## 5. 建议每周看这 4 个数
- 用户数（Users）
- 新用户（New users）
- 开始阅读次数（`reading_enter`）
- 快速导入转化（`import_hub_fast_click` -> `import_save_success`）
