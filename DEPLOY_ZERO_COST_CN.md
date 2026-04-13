# DramaVocab 3.0 免费部署（中国大陆可访问优先）

更新时间：2026-04-13

## 推荐架构（0 元起）
- 代码托管：GitHub（公开仓库，可拿 Star）
- 线上访问：Cloudflare Pages（免费）
- 数据统计：GA4（免费，已接入代码）

## 为什么这样配
- GitHub：方便被看到、被 Star。
- Cloudflare Pages：静态站免费、部署快、比直接用 GitHub Pages 更适合前端路由。
- Cloudflare 新版 Workers & Pages 已自带 SPA fallback（无需额外 `_redirects` 文件）。

## 你需要准备的授权
1. GitHub 账号（必须）
2. Cloudflare 账号（必须）
3. Google Analytics 账号（必须，用于看数据）

不需要把密码发给任何人。全部在你浏览器里授权即可。

---

## A. 发布到 GitHub（用于社区曝光和 Star）
1. 在 GitHub 新建公开仓库  
仓库名建议：`dramavocab`

2. 本地执行
```bash
cd /Users/ccc/Documents/codex/DramaVocab-Migration-Package/dramavocab-v3
git init
git add .
git commit -m "feat: release DramaVocab v3.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dramavocab.git
git push -u origin main
```

---

## B. 用 Cloudflare Pages 部署线上链接（免费）
1. 打开 Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git
2. 选择你刚才的 GitHub 仓库 `dramavocab`
3. Build 配置填写：
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment Variables 增加：
   - `VITE_GA_MEASUREMENT_ID = G-XXXXXXXXXX`（你的 GA4 ID）
5. 点 Deploy

部署成功后会得到：
- `https://<project>.pages.dev`（可直接分享）

---

## C. GA4 必填配置（上线后）
1. GA4 -> 管理 -> 数据流 -> 你的 Web Stream
2. 把网站 URL 改成线上地址（`https://<project>.pages.dev` 或你的自定义域名）
3. Realtime 检查以下事件是否出现：
   - `page_view`
   - `book_click`
   - `reading_enter`
   - `import_hub_fast_click`
   - `import_save_success`

---

## D. 你让我“代操作”时，我能做什么
- 我可以在本地把发布文件、文案、README、部署配置全部准备好。
- 我不能直接替你点网页里的账号授权按钮（GitHub/Cloudflare/GA），这一步必须你本人在浏览器完成。

如果你愿意，我下一步可以继续给你一份“上线前 15 分钟检查清单（封面、埋点、移动端、路由）”。
