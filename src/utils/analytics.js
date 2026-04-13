/**
 * 统一埋点封装层
 * 
 * 当前支持: Google Analytics 4 (GA4)
 * 可选补充: Microsoft Clarity（热力图/录屏）
 * 
 * 使用方式:
 *   import { trackEvent, trackPageview } from '@/utils/analytics'
 *   trackEvent('book_click', { book_id: 1, book_name: '霸总的契约娇妻' })
 */

// ===== 配置 =====
// 在 .env.local 中配置：VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
const GA_MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim()
// 可选：在 .env.local 中配置 VITE_CLARITY_PROJECT_ID（免费）
const CLARITY_PROJECT_ID = String(import.meta.env.VITE_CLARITY_PROJECT_ID || '').trim()
const VISITOR_ID_STORAGE_KEY = 'dramavocab_visitor_id'

/** 是否已初始化 */
let _initialized = false
let _visitorId = ''

function ensureVisitorId() {
  if (typeof window === 'undefined') return 'server'

  try {
    const exists = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)
    if (exists) return exists

    const generated = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `dv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, generated)
    return generated
  } catch {
    return `dv_${Date.now()}`
  }
}

function ensureGtagScript(measurementId) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !measurementId) {
      resolve(false)
      return
    }

    if (window.gtag) {
      resolve(true)
      return
    }

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    const existedScript = document.querySelector(`script[data-ga-id="${measurementId}"]`)
    if (existedScript) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    script.dataset.gaId = measurementId
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

function initClarity(projectId) {
  if (!projectId || typeof window === 'undefined' || window.clarity) return

  const existedScript = document.querySelector(`script[data-clarity-id="${projectId}"]`)
  if (existedScript) return

  // 官方嵌入片段（轻改为模块内调用）
  ;(function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () {
      ;(c[a].q = c[a].q || []).push(arguments)
    }
    t = l.createElement(r)
    t.async = 1
    t.src = `https://www.clarity.ms/tag/${i}`
    t.dataset.clarityId = i
    y = l.getElementsByTagName(r)[0]
    y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', projectId)
}

/**
 * 初始化 Analytics（在 main.js 中调用一次）
 */
export async function initAnalytics() {
  if (_initialized || typeof window === 'undefined') return
  _initialized = true

  _visitorId = ensureVisitorId()

  if (!GA_MEASUREMENT_ID && !CLARITY_PROJECT_ID) {
    console.log('[Analytics] 未配置统计ID，埋点静默不发送')
    return
  }

  if (GA_MEASUREMENT_ID) {
    const gaReady = await ensureGtagScript(GA_MEASUREMENT_ID)
    if (gaReady && window.gtag) {
      window.gtag('js', new Date())
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
      })
      window.gtag('set', 'user_properties', {
        visitor_id: _visitorId,
      })
      console.log('[Analytics] GA4 已启用:', GA_MEASUREMENT_ID)
    } else {
      console.warn('[Analytics] GA4 脚本加载失败')
    }
  }

  if (CLARITY_PROJECT_ID) {
    initClarity(CLARITY_PROJECT_ID)
    try {
      if (window.clarity) {
        window.clarity('set', 'visitor_id', _visitorId)
      }
    } catch {}
    console.log('[Analytics] Clarity 已启用:', CLARITY_PROJECT_ID)
  }
}

/**
 * 手动触发 page_view（Vue Router afterEach 钩子中调用）
 * @param {string} path - 当前路由路径，如 '/read/1/1'
 */
export function trackPageview(path) {
  try {
    if (GA_MEASUREMENT_ID && window.gtag) {
      window.gtag('event', 'page_view', {
        send_to: GA_MEASUREMENT_ID,
        page_path: path,
        page_title: document.title || 'DramaVocab',
        visitor_id: _visitorId,
      })
    }
  } catch (e) {
    console.warn('[Analytics] trackPageview 失败', e)
  }
}

/**
 * 追踪业务事件（核心 API）
 * 
 * @param {string} eventName - 事件名称（如 'book_click', 'word_collect'）
 * @param {Object} params - 事件参数对象
 * 
 * 内置参数:
 *   - timestamp: 自动添加事件时间戳
 *   - url: 自动添加当前页面路径
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (!GA_MEASUREMENT_ID || !window.gtag) return
    
    const eventData = {
      send_to: GA_MEASUREMENT_ID,
      ...params,
      // 自动附加元数据
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      visitor_id: _visitorId,
    }
    
    window.gtag('event', eventName, eventData)
    
    // 开发环境下打印日志便于调试
    if (import.meta?.dev || location.hostname === 'localhost') {
      console.log(`[Analytics] 📊 ${eventName}`, eventData)
    }
  } catch (e) {
    console.warn('[Analytics] trackEvent 失败', e)
  }
}

/**
 * 追踪用户属性（可选：登录后关联 userId）
 * @param {string} userId - 用户唯一标识
 * @param {Object} traits - 用户属性（如 plan/role 等）
 */
export function identifyUser(userId, traits = {}) {
  try {
    if (GA_MEASUREMENT_ID && window.gtag && userId) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: String(userId),
        ...traits,
      })
      
      if (import.meta?.dev) {
        console.log(`[Analytics] 👤 用户关联: ${userId}`, traits)
      }
    }
  } catch (e) {
    console.warn('[Analytics] identifyUser 失败', e)
  }
}

// ===== 预定义事件常量（保持命名一致性） =====
export const EVENT = {
  // 核心漏斗事件 (P0)
  BOOK_CLICK: 'book_click',
  READING_ENTER: 'reading_enter',
  IMPORT_FAST_ENTRY: 'import_fast_entry',
  IMPORT_HUB_FAST_CLICK: 'import_hub_fast_click',
  IMPORT_HUB_AI_CLICK: 'import_hub_ai_click',
  IMPORT_PREVIEW_SUCCESS: 'import_preview_success',
  IMPORT_PREVIEW_FAIL: 'import_preview_fail',
  IMPORT_SAVE_SUCCESS: 'import_save_success',
  IMPORT_FILE_UPLOAD_SUCCESS: 'import_file_upload_success',
  IMPORT_FILE_UPLOAD_FAIL: 'import_file_upload_fail',
  IMPORT_HISTORY_CONTINUE: 'import_history_continue',
  IMPORT_HISTORY_DELETE: 'import_history_delete',
  WORD_COLLECT: 'word_collect',
  REVIEW_START: 'review_start',
  REVIEW_COMPLETE: 'review_complete',
  
  // 行为事件 (P1)
  MODE_SWITCH: 'mode_switch',
  CHALLENGE_SUBMIT: 'challenge_submit',
  
  // 内容交互 (P2)
  TTS_PLAY: 'tts_play',
  WORD_DETAIL_VIEW: 'word_detail_view',
}
