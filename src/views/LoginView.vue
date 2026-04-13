<template>
  <div class="login-page" :class="{ dark: store.isDark }">
    <div class="login-container">
      <!-- Logo & Brand -->
      <div class="brand-area">
        <div class="brand-logo">🌹</div>
        <h1 class="brand-name">DramaVocab</h1>
        <p class="brand-slogan">抓马英语</p>
        <p class="brand-tagline">看最狗血的文，背最高级的词。</p>
      </div>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin" v-if="!isRegistering">
        <div class="input-group">
          <label>邮箱 / 手机号</label>
          <input
            v-model="loginForm.account"
            type="text"
            placeholder="请输入邮箱或手机号"
            autocomplete="username"
          />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '登录中...' : '🚀 立即登录' }}
        </button>

        <p class="switch-mode">
          还没有账号？
          <a href="#" @click.prevent="isRegistering = true">立即注册 →</a>
        </p>
      </form>

      <!-- 注册表单 -->
      <form class="login-form" @submit.prevent="handleRegister" v-else>
        <div class="input-group">
          <label>用户名</label>
          <input
            v-model="registerForm.username"
            type="text"
            placeholder="给自己取个名字"
            required
          />
        </div>
        <div class="input-group">
          <label>邮箱 / 手机号</label>
          <input
            v-model="registerForm.account"
            type="text"
            placeholder="用于登录和找回密码"
            required
          />
        </div>
        <div class="input-group">
          <label>设置密码</label>
          <input
            v-model="registerForm.password"
            type="password"
            placeholder="至少6位字符"
            minlength="6"
            required
          />
        </div>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? '注册中...' : '✨ 创建账号' }}
        </button>

        <p class="switch-mode">
          已有账号？
          <a href="#" @click.prevent="isRegistering = false">去登录 ←</a>
        </p>
      </form>

      <!-- 错误提示 -->
      <Transition name="fade">
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </Transition>

      <!-- 底部品牌 -->
      <footer class="login-footer">
        Made with ❤️ by 有栖 · DramaVocab © 2026
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { useReadingStore } from '../stores/reading.js'

const router = useRouter()
const userStore = useUserStore()
const store = useReadingStore()

const isRegistering = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const loginForm = ref({ account: '', password: '' })
const registerForm = ref({ username: '', account: '', password: '' })

async function handleLogin() {
  if (!loginForm.value.account || !loginForm.value.password) {
    errorMsg.value = '请输入账号和密码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    // TODO: 实际对接 Supabase Auth
    await new Promise(r => setTimeout(r, 800))
    router.push('/')
  } catch (e) {
    errorMsg.value = e.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.value.account || !registerForm.value.password || !registerForm.value.username) {
    errorMsg.value = '请填写完整信息'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    // TODO: 对接 Supabase 注册
    await new Promise(r => setTimeout(r, 800))
    isRegistering.value = false
    errorMsg.value = '' // 可以显示成功提示
  } catch (e) {
    errorMsg.value = e.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #0F0A1A 0%, #1a1035 50%, #2D1B4E 100%);
  padding: 24px;
}
.login-page.dark { color: #E5E7EB; }

.login-container {
  width: 100%; max-width: 400px;
  text-align: center;
}

/* 品牌 */
.brand-area { margin-bottom: 36px; }
.brand-logo {
  font-size: 56px;
  display: inline-block;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}
}
.brand-name {
  font-size: 2rem; font-weight: 900;
  background: linear-gradient(135deg, #E11D48, #C084FC, #7C3AED);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-top: 8px;
}
.brand-slogan { font-size: 16px; color: #F59E0B; font-weight: 700; letter-spacing: 3px; margin-top: 2px; }
.brand-tagline { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 6px; }

/* 表单 */
.login-form {
  text-align: left;
}
.input-group { margin-bottom: 18px; }
.input-group label {
  display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
}
.input-group input {
  width: 100%; height: 48px; padding: 0 16px;
  font-size: 15px;
  background: rgba(124,58,237,0.06);
  border: 1.5px solid rgba(124,58,237,0.18);
  border-radius: 12px;
  outline: none; transition: all 0.25s; color: inherit;
}
.input-group input:focus { border-color: #A78BFA; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
.input-group input::placeholder { color: rgba(255,255,255,0.2); }

.btn-login, .btn-register {
  width: 100%; height: 50px;
  font-size: 16px; font-weight: 700;
  border: none; border-radius: 14px;
  cursor: pointer; transition: all 0.25s;
  margin-top: 6px;
}
.btn-login {
  background: linear-gradient(135deg, #7C3AED, #E11D48); color: #fff;
}
.btn-register {
  background: linear-gradient(135deg, #C084FC, #A78BFA); color: #fff;
}
.btn-login:hover:not(:disabled), .btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(124,58,237,0.4);
}
.btn-login:disabled, .btn-register:disabled { opacity: 0.55; cursor: not-allowed; }

.switch-mode {
  text-align: center; margin-top: 18px; font-size: 13px; color: rgba(255,255,255,0.35);
}
.switch-mode a { color: #C084FC; text-decoration: none; font-weight: 600; }
.switch-mode a:hover { text-decoration: underline; }

.error-msg {
  margin-top: 16px; padding: 10px 16px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  color: #FCA5A5; font-size: 13px; text-align: center;
}

.login-footer {
  margin-top: 40px; font-size: 11px; color: rgba(255,255,255,0.18);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
