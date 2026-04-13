#!/usr/bin/env node
/**
 * DramaVocab 全量词汇覆盖审计工具
 * 对比每章小说原文的英文词 vs vocabList，找出遗漏
 */
const fs = require('fs')
const path = require('path')

// ===== 配置 =====
const BASE_DIR = '/Users/ccc/WorkBuddy/vibecoding'
const NOVELS_DIR = `${BASE_DIR}/novels`
const DATA_FILE = `${BASE_DIR}/dramavocab/src/stores/novel-data.js`

// ===== 常见停用词（不需要收录的简单词）=====
const STOP_WORDS = new Set([
  // 代词
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that',
  'these', 'those', 'who', 'whom', 'whose', 'what', 'which', 'whatever',
  // 冠词/介词/连词
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'than',
  'too', 'very', 'just', 'also', 'even', 'still', 'only', 'more',
  'most', 'some', 'any', 'no', 'not', 'yes', 'nor', 'so', 'because',
  'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on',
  'onto', 'out', 'over', 'to', 'up', 'with', 'about', 'after', 'against',
  'along', 'among', 'around', 'before', 'behind', 'below', 'beneath',
  'beside', 'besides', 'between', 'beyond', 'during', 'except', 'inside',
  // 动词（过于基础）
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'get', 'got', 'go', 'went', 'gone', 'come', 'came', 'see', 'saw',
  'seen', 'know', 'knew', 'known', 'think', 'thought', 'take', 'took',
  'taken', 'make', 'made', 'say', 'said', 'tell', 'told', 'find', 'found',
  'give', 'gave', 'given', 'want', 'wanted', 'feel', 'felt', 'try',
  'tried', 'leave', 'left', 'call', 'called', 'keep', 'kept', 'put',
  'let', 'show', 'showed', 'shown', 'look', 'looked', 'ask', 'asked',
  'seem', 'seemed', 'help', 'helped', 'start', 'started', 'turn', 'turned',
  'hear', 'heard', 'play', 'played', 'run', 'ran', 'move', 'moved',
  'live', 'lived', 'believe', 'believed', 'bring', 'brought', 'happen',
  'happened', 'write', 'wrote', 'written', 'sit', 'sat', 'stand', 'stood',
  'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included',
  'continue', 'continued', 'set', 'learn', 'learned', 'change', 'changed',
  'lead', 'led', 'understand', 'understood', 'watch', 'watched', 'follow',
  'followed', 'stop', 'stopped', 'create', 'created', 'speak', 'spoke',
  'spoken', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent',
  'grow', 'grew', 'grown', 'open', 'opened', 'walk', 'walked', 'win',
  'won', 'offer', 'offered', 'remember', 'remembered', 'love', 'loved',
  'consider', 'considered', 'appear', 'appeared', 'buy', 'bought', 'wait',
  'waited', 'serve', 'served', 'die', 'died', 'send', 'sent', 'expect',
  'expected', 'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'fallen',
  'cut', 'reach', 'reached', 'kill', 'killed', 'remain', 'remained',
  'suggest', 'suggested', 'raise', 'raised', 'pass', 'passed',
  // 形容词（基础）
  'good', 'bad', 'new', 'old', 'first', 'last', 'long', 'great', 'little',
  'own', 'other', 'right', 'big', 'high', 'different', 'small', 'large',
  'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same',
  'able', 'sure', 'free', 'clear', 'full', 'special', 'real', 'best',
  'better', 'true', 'whole', 'certain', 'late', 'strong', 'possible',
  'easy', 'hard', 'major', 'local', 'short', 'fine', 'alone', 'wrong',
  'nice', 'normal', 'ready', 'actual', 'low', 'main', 'red', 'black',
  'white', 'dark', 'light', 'hot', 'cold', 'warm', 'deep', 'far',
  // 名词（基础）
  'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child',
  'world', 'life', 'hand', 'part', 'place', 'case', 'week', 'company',
  'system', 'program', 'question', 'work', 'government', 'number',
  'night', 'point', 'home', 'water', 'room', 'mother', 'area', 'money',
  'story', 'fact', 'month', 'lot', 'study', 'book', 'eye', 'job',
  'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member',
  'law', 'car', 'city', 'community', 'name', 'president', 'team',
  'minute', 'idea', 'kid', 'body', 'information', 'back', 'parent',
  'face', 'others', 'level', 'office', 'door', 'health', 'person',
  'art', 'war', 'history', 'party', 'result', 'change', 'morning',
  'reason', 'research', 'girl', 'guy', 'moment', 'air', 'teacher',
  'force', 'education', 'center', 'family', 'role', 'table', 'phone',
  // 副词（基础）
  'there', 'here', 'now', 'how', 'when', 'where', 'why', 'again',
  'once', 'away', 'well', 'never', 'always', 'really', 'often',
  'together', 'already', 'perhaps', 'quite', 'almost', 'suddenly',
  'finally', 'quickly', 'slowly', 'soon', 'however', 'instead',
  // 其他常见
  'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sr', 'jr', 'etc', 'vs',
  'ok', 'okay', 'yeah', 'hey', 'hi', 'hello', 'oh', 'ah', 'um', 'uh',
  'wow', 'god', 'damn', 'shit', 'fuck', 'hell', 'like', 'thing',
  'things', 'something', 'anything', 'nothing', 'everything', 'someone',
  'anyone', 'everyone', 'nobody', 'somewhere', 'anywhere', 'everywhere',
  'much', 'many', 'such', 'enough', 'both', 'all', 'each', 'every',
  'another', 'either', 'neither', 'own', 'per', 'via', 'plus', 'minus',
  'dear', 'sorry', 'thanks', 'please', 'welcome', 'congratulations',
])

// 从原文提取英文单词
function extractEnglishWords(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')       // 移除 markdown 链接
    .replace(/`[^`]*`/g, '')                         // 移除代码块
    .replace(/[#*_~>`|]/g, '')                       // 移除 markdown 符号
    .match(/[a-zA-Z]{3,}/g) || []                    // 匹配3字母以上的英文单词
}

// 解析 novel-data.js 提取每个章节的 vocabList
function parseVocabLists(dataContent) {
  const results = {}
  
  // 按书籍分组
  const bookBlocks = dataContent.split(/(?:export\s+)?const\s+(NOVEL_DATA_BOOK\d+)/)
  
  let currentBook = ''
  for (let i = 1; i < bookBlocks.length; i += 2) {
    currentBook = bookBlocks[i]  // 变量名如 NOVEL_DATA_BOOK1
    const block = bookBlocks[i + 1]
    
    // 找到所有章节
    const chapterBlocks = block.split(/(?=id:\s*['"]ch?\w+['"])/)
    
    for (const chBlock of chapterBlocks) {
      const idMatch = chBlock.match(/id:\s*['"](ch?\w+)['"]/)
      if (!idMatch) continue
      
      const chId = idMatch[1]
      
      // 提取该章的所有 {word: 'xxx'} 
      const wordMatches = chBlock.matchAll(/\{word:\s*'([^']+)'/g)
      const words = [...wordMatches].map(m => m[1].toLowerCase())
      
      results[`${currentBook}:${chId}`] = new Set(words)
    }
  }
  
  return results
}

// 审计单个文件
function auditChapter(filePath, vocabSet, chapterKey) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const allWords = extractEnglishWords(content)
  
  const uniqueWords = [...new Set(allWords.map(w => w.toLowerCase()))]
  const meaningful = uniqueWords.filter(w => !STOP_WORDS.has(w))
  
  const missing = meaningful.filter(w => !vocabSet.has(w))
  
  return {
    totalEnglish: uniqueWords.length,
    meaningful: meaningful.length,
    vocabSize: vocabSet.size,
    missingCount: missing.length,
    missing: missing,
  }
}

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   DramaVocab 全量词汇覆盖审计 v2.0          ║')
  console.log('╚══════════════════════════════════════════════╝\n')
  
  // 读取数据文件
  const dataContent = fs.readFileSync(DATA_FILE, 'utf-8')
  const vocabMap = parseVocabLists(dataContent)
  
  console.log(`已加载 ${Object.keys(vocabMap).length} 个章节的词汇表\n`)
  
  // 定义书籍结构
  const books = [
    {
      name: 'Book1-契约成瘾',
      dir: `${NOVELS_DIR}/book1-契约成瘾`,
      prefix: 'NOVEL_DATA_BOOK1',
      pattern: /^第(\d{2})章-/,
    },
    {
      name: 'Book2-NPC逆袭',
      dir: `${NOVELS_DIR}/book2-NPC`,
      prefix: 'NOVEL_DATA_BOOK2',
      pattern: /^第(\d{2})章-/,
    },
    {
      name: 'Book3-女王归来',
      dir: `${NOVELS_DIR}/book3-女王归来`,
      prefix: 'NOVEL_DATA_BOOK3',
      pattern: /^第(\d{2})章-/,
    },
  ]
  
  const allResults = []
  
  for (const book of books) {
    if (!fs.existsSync(book.dir)) {
      console.log(`⚠️  ${book.name}: 目录不存在 (${book.dir})`)
      continue
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📖 ${book.name}`)
    console.log(''.padEnd(60, '='))
    
    const files = fs.readdirSync(book.dir).filter(f => f.endsWith('.md') && book.pattern.test(f))
    
    for (const file of files.sort()) {
      const numMatch = file.match(book.pattern)
      const chNum = numMatch ? numMatch[1].replace(/^0/, '') : '?'
      const chId = `ch${String(chNum).padStart(2, '0')}`
      const key = `${book.prefix}:${chId}`
      const filePath = path.join(book.dir, file)
      
      const vocabSet = vocabMap[key] || new Set()
      const result = auditChapter(filePath, vocabSet, key)
      
      result.book = book.name
      result.chapter = file.replace('.md', '')
      result.chId = chId
      result.key = key
      allResults.push(result)
      
      const status = result.missingCount === 0 ? '✅' : 
                     result.missingCount <= 5 ? '⚠️' : '🔴'
      
      console.log(`  ${status} ${file.padEnd(28)} 词汇:${String(result.vocabSize).padStart(3)} | 英文词:${String(result.meaningful).padStart(3)} | 缺失:${String(result.missingCount).padStart(3)}`)
      
      if (result.missingCount > 0 && result.missingCount <= 15) {
        console.log(`     缺失: ${result.missing.join(', ')}`)
      } else if (result.missingCount > 15) {
        console.log(`     缺失前15: ${result.missing.slice(0, 15).join(', ')}... (+${result.missingCount - 15})`)
      }
    }
  }
  
  // 汇总
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 汇总统计')
  console.log(''.padEnd(60, '='))
  
  const totalChapters = allResults.length
  const perfect = allResults.filter(r => r.missingCount === 0).length
  const warnings = allResults.filter(r => r.missingCount > 0 && r.missingCount <= 5).length
  const critical = allResults.filter(r => r.missingCount > 5).length
  
  console.log(`  总章节数:    ${totalChapters}`)
  console.log(`  ✅ 完整(0缺): ${perfect} (${Math.round(perfect/totalChapters*100)}%)`)
  console.log(`  ⚠️ 轻微(1-5): ${warnings} (${Math.round(warnings/totalChapters*100)}%)`)
  console.log(`  🔴 严重(6+):  ${critical} (${Math.round(critical/totalChapters*100)}%)`)
  
  // 输出需要修复的详情（供下一步使用）
  const needsFix = allResults.filter(r => r.missingCount > 0)
  if (needsFix.length > 0) {
    console.log(`\n\n${'='.repeat(60)}`)
    console.log('🔧 需要修复的章节详情（JSON格式）')
    console.log(''.padEnd(60, '='))
    console.log(JSON.stringify(needsFix.map(r => ({
      key: r.key,
      book: r.book,
      chapter: r.chapter,
      chId: r.chId,
      vocabSize: r.vocabSize,
      missingCount: r.missingCount,
      missing: r.missing,
    })), null, 2))
  }
}

main().catch(console.error)
