import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initAnalytics, trackPageview } from './utils/analytics.js'
import './assets/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// ===== 全局 Analytics 埋点 =====
// 初始化（确保 gtag 全局函数就绪）
initAnalytics()

// 每次路由变化 → 自动发送 page_view
router.afterEach((to) => {
  trackPageview(to.fullPath)
})

app.mount('#app')
