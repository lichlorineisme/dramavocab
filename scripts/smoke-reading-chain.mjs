#!/usr/bin/env node

import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'
import { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2 } from '../src/stores/novel-data.js'

const HOST = process.env.SMOKE_HOST || '127.0.0.1'
const PORT = Number(process.env.SMOKE_PORT || 3003)
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`
const HEADLESS = process.env.SMOKE_HEADFUL === '1' ? false : true
const AUTO_START_DEV = !process.env.BASE_URL
const TARGET_BOOK_ID = String(process.env.SMOKE_BOOK_ID || '1')
const RUN_FULL_BOOK = process.env.SMOKE_FULL_BOOK === '1'

const BOOK_DATA_MAP = {
  '1': NOVEL_DATA_BOOK1,
  '2': NOVEL_DATA_BOOK2,
}

function log(message) {
  console.log(`[smoke] ${message}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeWord(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function unique(items) {
  return [...new Set(items.filter(Boolean).map(item => String(item)))]
}

function getBookChapterIds(bookId) {
  const chapters = BOOK_DATA_MAP[bookId]
  if (!Array.isArray(chapters) || chapters.length === 0) {
    throw new Error(`未找到可测试的书籍数据: bookId=${bookId}`)
  }

  const chapterIds = unique(chapters.map(ch => ch?.id))
  if (chapterIds.length === 0) {
    throw new Error(`书籍没有可用章节: bookId=${bookId}`)
  }

  return chapterIds
}

function buildSampleChapterIds(chapterIds) {
  if (chapterIds.length <= 4) return [...chapterIds]
  const first = chapterIds[0]
  const second = chapterIds[1]
  const middle = chapterIds[Math.floor((chapterIds.length - 1) / 2)]
  const last = chapterIds[chapterIds.length - 1]
  return unique([first, second, middle, last])
}

function resolveTargetChapterIds(allChapterIds) {
  const requested = unique(
    String(process.env.SMOKE_CHAPTERS || '')
      .split(',')
      .map(item => item.trim())
  )

  if (requested.length > 0) {
    const available = new Set(allChapterIds)
    const invalid = requested.filter(id => !available.has(id))
    if (invalid.length > 0) {
      throw new Error(
        `SMOKE_CHAPTERS 包含无效章节: ${invalid.join(', ')}；可用章节: ${allChapterIds.join(', ')}`
      )
    }
    return requested
  }

  if (RUN_FULL_BOOK) return [...allChapterIds]
  return buildSampleChapterIds(allChapterIds)
}

async function waitForServer(url, timeoutMs = 45000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await sleep(500)
  }
  throw new Error(`等待服务超时: ${url}`)
}

async function isServerReachable(url, timeoutMs = 1500) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {}
    await sleep(120)
  }
  return false
}

function startDevServer() {
  log(`启动开发服务器: npm run dev -- --host ${HOST} --port ${PORT} --strictPort`)
  const child = spawn(
    'npm',
    ['run', 'dev', '--', '--host', HOST, '--port', String(PORT), '--strictPort'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    }
  )

  child.stdout.on('data', chunk => process.stdout.write(`[dev] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[dev] ${chunk}`))

  return child
}

async function stopDevServer(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  await sleep(1200)
  if (!child.killed) {
    child.kill('SIGKILL')
  }
}

async function launchBrowser() {
  const preferred = process.env.BROWSER_CHANNEL
    ? [process.env.BROWSER_CHANNEL]
    : ['chrome', 'msedge', null]

  let lastError = null
  for (const channel of preferred) {
    try {
      log(`尝试启动浏览器: ${channel || 'playwright-chromium'}`)
      const browser = await chromium.launch({
        headless: HEADLESS,
        channel: channel || undefined,
      })
      return { browser, channel: channel || 'playwright-chromium' }
    } catch (error) {
      lastError = error
      log(`浏览器启动失败: ${channel || 'playwright-chromium'}`)
    }
  }
  throw lastError || new Error('浏览器启动失败')
}

async function resetStorage(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

async function assertChallengePersisted(page, storageKey, expectedWord, expectedValue) {
  const stored = await page.evaluate(key => {
    return JSON.parse(localStorage.getItem(key) || '{}')
  }, storageKey)
  if (stored[expectedWord] !== expectedValue) {
    throw new Error(`挑战结果未持久化: ${expectedWord} !== ${expectedValue}`)
  }
}

async function runFlow(page, baseUrl, options) {
  const { bookId, chapterId, allChapterIds } = options
  const currentChapterIndex = allChapterIds.findIndex(id => String(id) === String(chapterId))
  const chapterLabel = `书${bookId} 第${chapterId}章`
  const challengeStorageKey = `drama_challenge_mastery_${bookId}_${chapterId}`

  await resetStorage(page, baseUrl)

  log(`开始章节检查: ${chapterLabel}`)
  log(`步骤1/6: 打开阅读页 /read/${bookId}/${chapterId}`)
  await page.goto(`${baseUrl}/read/${bookId}/${chapterId}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.reader-content .chapter-title', { timeout: 15000 })
  const overlay = page.locator('.sidebar-overlay')
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click()
  }

  log('步骤2/6: 切换透视模式并验证点词弹层')
  await page.locator('.mode-btn-large', { hasText: '透视' }).click()
  await page.waitForSelector('.perspective-mode .word-highlight', { timeout: 15000 })
  await page.locator('.perspective-mode .word-highlight').first().click()
  await Promise.race([
    page.waitForSelector('.word-tooltip', { timeout: 5000 }),
    page.waitForSelector('.sheet-panel', { timeout: 5000 }),
  ])

  log('步骤3/6: 切换挑战模式并提交一次答案')
  await page.locator('.mode-btn-large', { hasText: '挑战' }).click()
  await page.waitForSelector('.challenge-wrap .challenge-input', { timeout: 15000 })
  const firstWrap = page.locator('.challenge-wrap').first()
  const firstCorrectWord = normalizeWord(await firstWrap.getAttribute('data-word'))
  await firstWrap.locator('.challenge-input').fill(firstCorrectWord)
  await firstWrap.locator('.challenge-btn').click()
  await page.waitForSelector('.challenge-wrap .correct-icon', {
    timeout: 15000,
  })
  await assertChallengePersisted(page, challengeStorageKey, firstCorrectWord, true)

  const secondWrap = page.locator('.challenge-wrap').filter({ has: page.locator('.challenge-btn') }).first()
  await secondWrap.locator('.challenge-input').fill('__wrong__')
  await secondWrap.locator('.challenge-btn').click()
  await page.waitForSelector('.challenge-wrap .wrong-icon', { timeout: 15000 })

  const vocabWords = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('drama_vocab_words') || '[]')
  })
  if (!Array.isArray(vocabWords) || vocabWords.length === 0) {
    throw new Error('答错后未写入生词本')
  }

  log('步骤4/6: 进入单词本 Tab')
  await page.locator('.tab-btn', { hasText: '单词本' }).click()
  await page.waitForSelector('.vocab-panel .page-title', { timeout: 15000 })
  await page.waitForSelector('.word-list .word-card', { timeout: 15000 })

  const downloadPromise = page.waitForEvent('download')
  await page.locator('.export-btn').click()
  const download = await downloadPromise
  if (!download.suggestedFilename().endsWith('.json')) {
    throw new Error('导出文件名不正确')
  }

  await page.locator('.word-list .word-card').first().click()
  await page.waitForSelector('.detail-sheet .detail-word', { timeout: 10000 })
  await page.locator('.detail-sheet-overlay').click({ position: { x: 20, y: 20 } })

  log('步骤5/6: 从单词本返回阅读')
  await page.locator('.continue-read-btn').click()
  await page.waitForSelector('.reader-content .chapter-title', { timeout: 15000 })

  const currentTitle = await page.locator('.chapter-title').textContent()
  await page.locator('.mode-btn-large', { hasText: '挑战' }).click()

  const canGoNext = currentChapterIndex >= 0 && currentChapterIndex < allChapterIds.length - 1
  const canGoPrev = currentChapterIndex > 0
  if (canGoNext || canGoPrev) {
    const targetChapterId = canGoNext
      ? allChapterIds[currentChapterIndex + 1]
      : allChapterIds[currentChapterIndex - 1]
    const navLabel = canGoNext ? '下一章' : '上一章'
    await page.locator('.bottom-nav-btn', { hasText: navLabel }).click()
    await page.waitForFunction(
      expectedPath => window.location.pathname === expectedPath,
      `/read/${bookId}/${targetChapterId}`,
      { timeout: 10000 }
    )
    await page.waitForTimeout(800)

    const nextTitle = await page.locator('.chapter-title').textContent()
    if (normalizeWord(currentTitle) === normalizeWord(nextTitle)) {
      throw new Error(`${chapterLabel} 切章后标题未变化`)
    }

    const activeMode = await page.locator('.mode-btn-large.active').textContent()
    if (!String(activeMode || '').includes('沉浸')) {
      throw new Error(`${chapterLabel} 切章后没有重置为沉浸模式`)
    }
  }

  log('步骤6/6: 校验主链路页面元素')
  await page.waitForSelector('.mode-btn-large', { timeout: 10000 })
  await page.waitForSelector('.tab-btn', { timeout: 10000 })
  log(`章节检查完成: ${chapterLabel}`)
}

async function runMobileFlow(browser, baseUrl, options) {
  const { bookId, chapterId } = options
  log(`附加检查: 移动端点词弹出 BottomSheet（书${bookId} 第${chapterId}章）`)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    acceptDownloads: true,
  })
  const page = await context.newPage()
  try {
    await resetStorage(page, baseUrl)
    await page.goto(`${baseUrl}/read/${bookId}/${chapterId}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.immersive-mode .word-highlight', { timeout: 15000 })
    await page.locator('.immersive-mode .word-highlight').first().click()
    await page.waitForSelector('.sheet-panel', { timeout: 5000 })
  } finally {
    await context.close()
  }
}

let devServer = null
let browser = null

try {
  let baseUrl = BASE_URL
  const allChapterIds = getBookChapterIds(TARGET_BOOK_ID)
  const targetChapterIds = resolveTargetChapterIds(allChapterIds)

  if (AUTO_START_DEV) {
    const reuseExisting = await isServerReachable(baseUrl)
    if (reuseExisting) {
      log(`检测到已有服务，直接复用: ${baseUrl}`)
    } else {
      devServer = startDevServer()
    }
  } else {
    log(`使用现有服务: ${baseUrl}`)
  }

  await waitForServer(baseUrl)
  log(`服务可访问: ${baseUrl}`)

  const launched = await launchBrowser()
  browser = launched.browser
  log(`浏览器已启动: ${launched.channel}`)
  log(`目标书籍: ${TARGET_BOOK_ID}`)
  log(`测试章节: ${targetChapterIds.join(', ')}`)

  for (const chapterId of targetChapterIds) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    })
    const page = await context.newPage()
    try {
      await runFlow(page, baseUrl, {
        bookId: TARGET_BOOK_ID,
        chapterId,
        allChapterIds,
      })
    } finally {
      await context.close()
    }
  }

  const mobileChapterId = targetChapterIds[targetChapterIds.length - 1]
  await runMobileFlow(browser, baseUrl, {
    bookId: TARGET_BOOK_ID,
    chapterId: mobileChapterId,
  })

  log('✅ 主链路冒烟通过')
  process.exitCode = 0
} catch (error) {
  log(`❌ 主链路冒烟失败: ${error?.message || String(error)}`)
  process.exitCode = 1
} finally {
  if (browser) {
    await browser.close().catch(() => {})
  }
  if (devServer) {
    await stopDevServer(devServer)
  }
}
