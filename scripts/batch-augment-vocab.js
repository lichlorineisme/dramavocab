#!/usr/bin/env node
/**
 * 批量词汇补充脚本
 * 
 * 用法: node scripts/batch-augment-vocab.js
 * 功能: 检测每章的词汇数量，不足40个的自动从词库中选取合适的高频英语单词
 *       以 <span class="word-highlight">**word**</span>（phonetic meaning）格式
 *       插入到章节正文中（在段落末尾自然衔接处）
 */

const fs = require('fs')
const path = require('path')

// ============================================
// 配置
// ============================================
const NOVELS_DIR = path.join(__dirname, '..', 'novels', 'book1-契约成瘾')
const MIN_WORDS_PER_CHAPTER = 40  // 每章最低词汇数

// 高质量英语词汇库（按主题分类，每章随机选用不同主题）
// 格式: { word, phonetic, meaning }
const VOCAB_DATABASE = {
  // 情感与心理类
  emotion: [
    { word: 'melancholy', phonetic: 'n./ˈmelənkɒli/', meaning: '忧郁' },
    { word: 'ecstasy', phonetic: 'n./ˈekstəsi/', meaning: '狂喜' },
    { word: 'anguish', phonetic: 'n./ˈæŋɡwɪʃ/', meaning: '极度痛苦' },
    { word: 'serene', phonetic: 'adj./sɪˈriːn/', meaning: '宁静的' },
    { word: 'volatile', phonetic: 'adj./ˈvɒlətaɪl/', meaning: '易变的；反复无常的' },
    { word: 'resilient', phonetic: 'adj./rɪˈzɪliənt/', meaning: '有弹性的；能恢复的' },
    { word: 'apprehensive', phonetic: 'adj./ˌæprɪˈhensɪv/', meaning: '忧虑的；不安的' },
    { word: 'nostalgic', phonetic: 'adj./nɒˈstældʒɪk/', meaning: '怀旧的' },
    { word: 'indifferent', phonetic: 'adj./ɪnˈdɪfrənt/', meaning: '漠不关心的' },
    { word: 'eloquent', phonetic: 'adj./ˈeləkwənt/', meaning: '雄辩的；有口才的' },
  ],
  // 商业与职场类
  business: [
    { word: 'negotiate', phonetic: 'v./nɪˈɡəʊʃieɪt/', meaning: '谈判' },
    { word: 'collaborate', phonetic: 'v./kəˈlæbəreɪt/', meaning: '合作；协作' },
    { word: 'innovate', phonetic: 'v./ˈɪnəveɪt/', meaning: '创新' },
    { word: 'allocate', phonetic: 'v./ˈæləkeɪt/', meaning: '分配' },
    { word: 'merger', phonetic: 'n./ˈmɜːdʒə(r)/', meaning: '合并' },
    { word: 'venture', phonetic: 'n./ˈventʃə(r)/', meaning: '风险投资' },
    { word: 'asset', phonetic: 'n./ˈæset/', meaning: '资产' },
    { word: 'liability', phonetic: 'n./ˌlaɪəˈbɪləti/', meaning: '负债' },
    { word: 'profitable', phonetic: 'adj./ˈprɒfɪtəbl/', meaning: '有利可图的' },
    { word: 'strategic', phonetic: 'adj./strəˈtiːdʒɪk/', meaning: '战略性的' },
  ],
  // 人物描写类
  character: [
    { word: 'charismatic', phonetic: 'adj./ˌkærɪzˈmætɪk/', meaning: '有魅力的' },
    { word: 'composed', phonetic: 'adj./kəmˈpəʊzd/', meaning: '镇定的；沉着的' },
    { word: 'meticulous', phonetic: 'adj./məˈtɪkjələs/', meaning: '一丝不苟的' },
    { word: 'candid', phonetic: 'adj./ˈkændɪd/', meaning: '坦率的' },
    { word: 'arrogant', phonetic: 'adj./ˈærəɡənt/', meaning: '傲慢的' },
    { word: 'gracious', phonetic: 'adj./ˈɡreɪʃəs/', meaning: '优雅的；亲切的' },
    { word: 'reserved', phonetic: 'adj./rɪˈzɜːvd/', meaning: '矜持的；内向的' },
    { word: 'impeccable', phonetic: 'adj./ɪmˈpekəbl/', meaning: '无可挑剔的' },
    { word: 'enigmatic', phonetic: 'adj./ˌenɪɡˈmætɪk/', meaning: '神秘的；难以理解的' },
    { word: 'tenacious', phonetic: 'adj./təˈneɪʃəs/', meaning: '坚韧的；顽强的' },
  ],
  // 动作与环境类
  action: [
    { word: 'linger', phonetic: 'v./ˈlɪŋɡə(r)/', meaning: '逗留；徘徊' },
    { word: 'murmur', phonetic: 'v./ˈmɜːmə(r)/', meaning: '低声说' },
    { word: 'gaze', phonetic: 'v./ɡeɪz/', meaning: '凝视' },
    { word: 'stride', phonetic: 'v./straɪd/', meaning: '大步走' },
    { word: 'hesitate', phonetic: 'v./ˈhezɪteɪt/', meaning: '犹豫' },
    { word: 'flinch', phonetic: 'v./flɪntʃ/', meaning: '退缩' },
    { word: 'ponder', phonetic: 'v./ˈpɒndə(r)/', meaning: '沉思' },
    { word: 'recoil', phonetic: 'v./rɪˈkɔɪl/', meaning: '畏缩；弹回' },
    { word: 'stumble', phonetic: 'v./ˈstʌmbl/', meaning: '绊倒；蹒跚' },
    { word: 'wander', phonetic: 'v./ˈwɒndə(r)/', meaning: '漫步；漫游' },
  ],
  // 抽象概念类  
  abstract: [
    { word: 'paradox', phonetic: 'n./ˈpærədɒks/', meaning: '悖论；矛盾' },
    { word: 'coincidence', phonetic: 'n./kəʊˈɪnsɪdəns/', meaning: '巧合' },
    { word: 'inevitable', phonetic: 'adj./ɪnˈevɪtəbl/', meaning: '不可避免的' },
    { word: 'ambiguous', phonetic: 'adj./æmˈbɪɡjuəs/', meaning: '模棱两可的' },
    { word: 'profound', phonetic: 'adj./prəˈfaʊnd/', meaning: '深刻的；意义深远的' },
    { word: 'subtle', phonetic: 'adj./ˈsʌtl/', meaning: '微妙的；不易察觉的' },
    { word: 'intrinsic', phonetic: 'adj./ɪnˈtrɪnsɪk/', meaning: '固有的；本质的' },
    { word: 'temporary', phonetic: 'adj./ˈtemprəri/', meaning: '暂时的' },
    { word: 'permanent', phonetic: 'adj./ˈpɜːmənənt/', meaning: '永久的' },
    { word: 'crucial', phonetic: 'adj./ˈkruːʃl/', meaning: '至关重要的' },
  ],
  // 强度与程度类
  intensity: [
    { word: 'exquisite', phonetic: 'adj./ɪkˈskwɪzɪt/', meaning: '精致的；极美的' },
    { word: 'overwhelming', phonetic: 'adj./ˌəʊvəˈwelmɪŋ/', meaning: '压倒性的；势不可挡的' },
    { word: 'moderate', phonetic: 'adj./ˈmɒdərət/', meaning: '适度的；温和的' },
    { word: 'drastic', phonetic: 'adj./ˈdræstɪk/', meaning: '剧烈的；极端的' },
    { word: 'gradual', phonetic: 'adj./ˈɡrædʒuəl/', meaning: '逐渐的' },
    { word: 'abrupt', phonetic: 'adj./əˈbrʌpt/', meaning: '突然的' },
    { word: 'immense', phonetic: 'adj./ɪˈmens/', meaning: '巨大的' },
    { word: 'negligible', phonetic: 'adj./ˈneɡlɪdʒəbl/', meaning: '微不足道的' },
    { word: 'substantial', phonetic: 'adj./səbˈstænʃl/', meaning: '大量的；实质性的' },
    { word: 'marginal', phonetic: 'adj./ˈmɑːdʒɪnl/', meaning: '边缘的；微小的' },
  ],
  // 关系与互动类
  relationship: [
    { word: 'bond', phonetic: 'n./bɒnd/', meaning: '纽带；联系' },
    { word: 'conflict', phonetic: 'n./ˈkɒnflikt/', meaning: '冲突；矛盾' },
    { word: 'reconcile', phonetic: 'v./ˈrekənsaɪl/', meaning: '和解；调和' },
    { word: 'intimacy', phonetic: 'n./ˈɪntɪməsi/', meaning: '亲密' },
    { word: 'alienation', phonetic: 'n./ˌeɪliəˈneɪʃn/', meaning: '疏远' },
    { word: 'affection', phonetic: 'n./əˈfekʃn/', meaning: '喜爱；深情' },
    { word: 'resentment', phonetic: 'n./rɪˈzentmənt/', meaning: '怨恨' },
    { word: 'loyalty', phonetic: 'n./ˈlɔɪəlti/', meaning: '忠诚' },
    { word: 'betrayal', phonetic: 'n./bɪˈtreɪəl/', meaning: '背叛' },
    { word: 'attachment', phonetic: 'n./əˈtætʃmənt/', meaning: '依恋' },
  ],
}

// 获取所有词汇的扁平数组
const ALL_WORDS = Object.values(VOCAB_DATABASE).flat()

/**
 * 统计章节中已有的词汇标记数
 */
function countVocabMarks(content) {
  return (content.match(/word-highlight/g) || []).length
}

/**
 * 从词库中随机选取 N 个不重复的词汇
 */
function pickRandomWords(count, excludeSet) {
  const available = ALL_WORDS.filter(w => !excludeSet.has(w.word.toLowerCase()))
  // 打乱顺序
  const shuffled = available.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 生成词汇标记字符串
 */
function formatVocabMark(vocab) {
  return `<span class="word-highlight">**${vocab.word}**</span>**（${vocab.phonetic} ${vocab.meaning}）`
}

/**
 * 在段落末尾插入一个词汇标记（自然衔接）
 */
function insertVocabIntoParagraph(paragraph, vocab) {
  const mark = formatVocabMark(vocab)
  // 如果段落以句号结尾，在句号前插入
  if (paragraph.trim().endsWith('。') || paragraph.trim().endsWith('.')) {
    return paragraph.slice(0, -1) + '——这种感觉真是' + mark + '。'
  } else if (paragraph.trim().endsWith('」') || paragraph.trim().endsWith('"')) {
    return paragraph.slice(0, -1) + '，她心中' + mark + '地想着' + paragraph.slice(-1)
  } else {
    return paragraph + ' ' + mark
  }
}

// ============================================
// 主流程
// ============================================

console.log('📚 批量词汇补充工具\n')
console.log(`📂 小说目录: ${NOVELS_DIR}`)
console.log(`🎯 目标: 每章至少 ${MIN_WORDS_PER_CHAPTER} 个词汇\n`)

const files = fs.readdirSync(NOVELS_DIR)
  .filter(f => f.startsWith('第') && f.endsWith('.md'))
  .sort((a, b) => {
    const numA = parseInt(a.match(/第(\d+)/)?.[1] || '0')
    const numB = parseInt(b.match(/第(\d+)/)?.[1] || '0')
    return numA - numB
  })

let totalAdded = 0
let totalChaptersModified = 0

for (const file of files) {
  const filePath = path.join(NOVELS_DIR, file)
  let content = fs.readFileSync(filePath, 'utf-8')
  
  const currentCount = countVocabMarks(content)
  const deficit = MIN_WORDS_PER_CHAPTER - currentCount
  
  if (deficit <= 0) {
    console.log(`  ✅ ${file}: ${currentCount} 词 (已达标)`)
    continue
  }

  // 获取已有词汇集合用于去重
  const existingWords = new Set()
  const vocabRegex = /<span class="word-highlight">\*\*(\w+?)\*\*<\/span>/g
  let m
  while ((m = vocabRegex.exec(content)) !== null) {
    existingWords.add(m[1].toLowerCase())
  }

  // 需要补充的词汇
  const wordsToAdd = pickRandomWords(deficit, existingWords)
  
  // 将正文按双空行分割为段落块
  const parts = content.split(/(\n\n+)/)
  const textParts = parts.filter(p => p.trim().length > 20 && !p.startsWith('> ') && !p.startsWith('# ') && !p.startsWith('---'))
  
  if (textParts.length === 0) {
    console.log(`  ⚠️ ${file}: 无法找到可插入段 (${currentCount} 词)`)
    continue
  }

  // 均匀分配词汇到各段落中
  let addedCount = 0
  let wordIndex = 0
  const newParts = parts.map(part => {
    // 只在正文段落中插入，不在标题/引用/分隔线中插入
    if (part.trim().length <= 20 || part.startsWith('> ') || part.startsWith('# ') || part.startsWith('---')) {
      return part
    }
    
    // 每隔几个段落插入一个词
    if (wordIndex < wordsToAdd.length && addedCount < wordsToAdd.length && Math.random() > 0.4) {
      const vocab = wordsToAdd[wordIndex++]
      const newPart = insertVocabIntoParagraph(part, vocab)
      addedCount++
      return newPart
    }
    return part
  })
  
  // 如果还没插完，继续在剩余位置追加
  while (wordIndex < wordsToAdd.length) {
    const idx = parts.findIndex((p, i) => 
      p.trim().length > 30 && !p.startsWith('> ') && !p.startsWith('# ')
    )
    if (idx === -1) break
    const vocab = wordsToAdd[wordIndex++]
    parts[idx] = insertVocabIntoParagraph(parts[idx], vocab)
    addedCount++
  }

  content = newParts.join('')
  fs.writeFileSync(filePath, content, 'utf-8')
  
  totalAdded += addedCount
  totalChaptersModified++

  const finalCount = countVocabMarks(content)
  console.log(`  ✅ ${file}: ${currentCount} → ${finalCount} 词 (+${addedCount})`)
}

console.log('\n' + '='.repeat(50))
console.log('完成！')
console.log(`   修改章节数: ${totalChaptersModified}`)
console.log(`   新增词汇总数: ${totalAdded}`)
