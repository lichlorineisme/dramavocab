<script setup>
import { ref, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'

const hasError = ref(null)
onErrorCaptured((err) => {
  console.error('[DramaVocab Error]', err)
  // 🔑 关键修复：设置 hasError 让错误页显示出来，而不是黑屏
  hasError.value = String(err?.message || err || '未知错误')
  // 阻止错误继续冒泡
  return false
})
</script>

<template>
  <!-- 全局错误兜底：即使子组件出错也不黑屏 -->
  <div v-if="hasError" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0F0A1A;color:#E11D48;padding:40px;text-align:center;font-family:system-ui">
    <div>
      <p style="font-size:48px;margin-bottom:16px">💥</p>
      <h2>页面出了点小问题</h2>
      <p style="color:#9CA3AF;margin:8px 0 24px">刷新页面试试？如果持续出现请联系开发者</p>
      <button @click="hasError = null; location.reload()" style="padding:10px 28px;font-size:15px;font-weight:700;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#7C3AED,#E11D48);color:#fff">🔄 刷新页面</button>
    </div>
  </div>
  <RouterView v-else v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>
</template>
