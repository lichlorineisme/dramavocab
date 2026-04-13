/**
 * 全面修复脚本 V2 — 直接文本处理，无需完整解析
 * 
 * 修复项：
 * 1. 清理 raw 字段残留的 ** 前后缀
 * 2. 修复截断的句子（raw以span结尾）
 * 3. 修复 ponder 类格式错误（>ponder/ 沉思）
 * 4. 修复 venture 类格式错误（>venture/ 风险投资）
 * 5. 补充不足40词的章节到40+
 * 
 * 用法: node scripts/fix-bookjs-data.js
 */
import { readFileSync, writeFileSync } from 'fs'

const INPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book.js'
const OUTPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book-new.js'

let src = readFileSync(INPUT, 'utf8')
let totalFixes = 0

// ====== 统计 ======
let stats = { bold: 0, truncate: 0, ponder: 0, venture: 0, vocabAdd: 0 }

console.log(`📖 开始全面修复...`)
console.log(`   文件大小: ${(src.length / 1024).toFixed(1)} KB`)

// ══════════════════════════════════════
// Fix 1: 清理 raw 行中的 ** 残留
// ══════════════════════════════════════
console.log('\n🔧 [1/5] 清理 ** 残留...')

const beforeBold = (src.match(/"raw": "\*\*/g) || []).length
src = src.replace(/"raw": "\*\*/g, function(m) {
  stats.bold++
  totalFixes++
  return '"raw": "'
})

// 清理行尾 ** （在 " 之前）
src = src.replace(/\*\*\\n",/g, function(m) {
  stats.bold++
  totalFixes++
  return '\\n",'
})
// 更通用：** 后紧跟 " 或 , 或 </span>
src = src.replace(/"\*\*(<span)/g, function(m, span) {
  stats.bold++
  totalFixes++
  return '"' + span
})
src = src.replace(/(<\/span>)\*\*"/g, function(m, span) {
  stats.bold++
  totalFixes++
  return span + '"'
})
// 处理 ** 后面有空格再跟 span 的情况
src = src.replace(/"\*\*\s*(<span\s)/g, function(m, span) {
  stats.bold++
  totalFixes++
  return '"' + span
})

console.log(`   ✅ 清理了 ${stats.bold} 处 ** 残留`)

// ══════════════════════════════════════
// Fix 2: 修复截断句子 + ponder/venture 格式错误  
// ══════════════════════════════════════
console.log('\n🔧 [2/5] 修复截断句子和特殊格式错误...')

// 2a: 修复 ponder 类: >ponder</span>/ 沉思）→ >ponder</span>
let ponderCount = 0
src = src.replace(/data-word="ponder">ponder<\/span>\/\s*沉思[）]\)?/g, function() {
  ponderCount++
  stats.ponder++
  totalFixes++
  return 'data-word="ponder">ponder</span>'
})
// 也修复 translation 中可能残留的版本
src = src.replace(/>ponder<\/span>（v\.\/[^）]*沉思[）]/g, function() {
  stats.ponder++
  return '>ponder</span>（v./ˈpɒndə(r)/ 沉思）'
})
console.log(`   ✅ 修复 ${stats.ponder} 处 ponder 错误`)

// 2b: 修复 venture 类: >venture</span>/ 风险投资）→ >venture</span>
let ventureCount = 0
src = src.replace(/data-word="venture">venture<\/span>\/\s*风险投资[）]\)?/g, function() {
  ventureCount++
  stats.venture++
  totalFixes++
  return 'data-word="venture">venture</span>'
})
console.log(`   ✅ 修复 ${stats.venture} 处 venture 错误`)

// 2c: 修复截断句子 — 从对应的 translation 中提取尾部内容补回 raw
// 策略：找到所有 raw 以 </span>", 结尾且长度较短的行，
// 然后从同段落 translation 的对应位置提取后续文字
const lines = src.split('\n')
const fixedLines = []

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]
  
  // 检查是否是 raw 字段且被截断
  const rawMatch = line.match(/^(\s*)"raw":\s*"(.*)",?\s*$/)
  if (rawMatch) {
    const indent = rawMatch[1]
    const rawContent = rawMatch[2]
    
    // 判断是否被截断：以 </span>" 结尾 且 内容较短(<100) 且没有中文结尾标点
    if (/<\/span>"$/.test(line) && rawContent.length < 100 && !/[。！？]$/.test(rawContent)) {
      // 找到下一个 translation 行
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const transMatch = lines[j].match(/^(\s*)"translation":\s*"(.*)",?\s*$/)
        if (transMatch) {
          const transContent = transMatch[2]
          // 从 translation 中提取最后一个 </span> 之后的内容
          const lastSpanPos = transContent.lastIndexOf('</span>')
          if (lastSpanPos >= 0 && lastSpanPos < transContent.length - 10) {
            let tail = transContent.substring(lastSpanPos + 7)
            // 去掉括号释义部分
            tail = tail.replace(/[（][^）]*[）]/g, '').trim()
            if (tail.length > 0) {
              // 把尾巴拼回 raw
              const newRaw = rawContent.replace(/"$/, '') + tail + '"'
              line = `${indent}"raw": ${JSON.stringify(JSON.parse(newRaw))},`
              stats.truncate++
              totalFixes++
            }
          }
          break
        }
      }
    }
  }
  
  fixedLines.push(line)
}
src = fixedLines.join('\n')
console.log(`   ✅ 修复 ${stats.truncate} 处截断句子`)

// ══════════════════════════════════════
// Fix 3: 补充词汇到每章 40+  
// ══════════════════════════════════════
console.log('\n🔧 [3/5] 补充不足40词的章节...')

// 高质量补充词库
const SUPPLEMENTS = [
  { w: 'scrutinize', p: 'skruːtənaɪz', m: '仔细审查', t: '她开始__审视合同中的每一个条款。' },
  { w: 'stipulate', p: 'stɪpjuleɪt', m: '规定', t: '协议中明确__规定了双方的权责边界。' },
  { w: 'corroborate', p: 'kəˈrɒbəreɪt', m: '证实', t: '这些证据足以__证实她的判断。' },
  { w: 'disparity', p: 'dɪˈpærəti', m: '差异', t: '两人身份地位的__差距摆在那里。' },
  { w: 'impediment', p: 'ɪmˈpedɪmənt', m: '障碍', t: '这不会成为合作的__障碍——至少她不希望是。' },
  { w: 'inception', p: 'ɪnˈsepʃn', m: '开端', t: '从项目__之初她就参与了。' },
  { w: 'stringent', p: 'strɪndʒənt', m: '严格的', t: '傅氏集团的审核标准一向__严格。' },
  { w: 'burgeoning', p: 'bɜːrdʒənɪŋ', m: '新兴的', t: '__新兴的市场充满了机遇与风险。' },
  { w: 'clandestine', p: 'klænˈdestɪn', m: '秘密的', t: '他不想让这种__秘密的关系暴露。' },
  { w: 'deference', p: 'defərəns', m: '尊重', t: '她对这位长辈始终保持着__尊重。' },
  { w: 'apprehensive', p: 'ˌæprɪˈhensɪv', m: '忧虑的', t: '林晚对即将到来的会面感到有些__忧虑。' },
  { w: 'condescend', p: 'ˌkɒndɪˈsend', m: '屈尊', t: '他没有__屈尊解释任何事。' },
  { w: 'disparage', p: 'dɪˈpærɪdʒ', m: '贬低', t: '她从不__贬低别人的选择。' },
  { w: 'placate', p: 'pleɪkeɪt', m: '安抚', t: '试图__安抚她的情绪显然不是好主意。' },
  { w: 'reciprocate', p: 'rɪˈsɪprəkeɪt', m: '回报', t: '她想__回报他的善意，却又不知从何做起。' },
  { w: 'succumb', p: 'səˈkʌm', m: '屈服', t: '她绝不会轻易__屈服于压力。' },
  { w: 'thwart', p: 'θwɔːt', m: '阻挠', t: '没有任何人能__阻挠她的决定。' },
  { w: 'divulge', p: 'daɪˈvʌldʒ', m: '泄露', t: '他不打算向任何人__泄露这个计划。' },
  { w: 'epitomize', p: 'ɪˈpɒtəmaɪz', m: '是...的典型', t: '他简直就是冷酷霸总的__典型代表。' },
  { w: 'fabricate', p: 'fæbrɪkeɪt', m: '编造', t: '她不需要__编造任何借口。' },
  { w: 'incessant', p: 'ɪnˈsesənt', m: '不断的', t: '窗外的雨__不停地下了整整一夜。' },
  { w: 'prudent', p: 'pruːdnt', m: '谨慎的', t: '保持__谨慎是她一贯的风格。' },
  { w: 'reverberate', p: 'rɪˈvɜːbəreɪt', m: '回荡', t: '关门声在走廊里久久__回荡。' },
  { w: 'tacit', p: 'tæsɪt', m: '心照不宣的', t: '他们之间有一种__默契的约定。' },
  { w: 'unanimous', p: 'juˈnænɪməs', m: '一致的', t: '董事会的决议是__一致通过的。' },
  { w: 'vehement', p: 'viːəmənt', m: '激烈的', t: '她__激烈地反驳了这个提议。' },
  { w: 'whimsical', p: 'wɪzmɪkl', m: '异想天开的', t: '这个想法听起来有些__异想天开。' },
  { w: 'zealous', p: 'zeləs', m: '热心的', t: '他对工作的__热情有时让人害怕。' },
  { w: 'alleviate', p: 'əˈliːvieɪt', m: '缓解', t: '这笔钱能暂时__缓解燃眉之急。' },
  { w: 'exacerbate', p: 'ɪɡˈzɜːbsərbeɪt', m: '加剧', t: '继续争论只会__加剧矛盾。' },
  { w: 'pragmatic', p: 'præɡˈmætɪk', m: '务实的', t: '她是个__务实的人，不会被情绪左右。' },
  { w: 'succinct', p: 'səˈkɪŋkt', m: '简洁的', t: '他用__简洁的语言总结了要点。' },
  { w: 'juxtapose', p: 'ˌdʒʌkstəpəʊz', m: '并列对比', t: '两种截然不同的风格被__并列在一起。' },
  { w: 'invariably', p: 'ɪnˈveəriəbli', m: '总是', t: '他__总是在最后时刻出现。' },
  { w: 'elucidate', p: 'ɪˈluːsɪdeɪt', m: '阐明', t: '她需要进一步__阐明自己的立场。' },
  { w: 'deteriorate', p: 'dɪˈtɪəriəreɪt', m: '恶化', t: '关系开始急剧__恶化。' },
  { w: 'inadvertently', p: 'ˌɪnədˈvɜːtəntli', m: '无意中', t: '她__无意中说出了心里的想法。' },
  { w: 'cumbersome', p: 'kʌmbərsəm', m: '繁琐的', t: '这套流程实在太__繁琐了。' },
  { w: 'plethora', p: 'pleθərə', m: '过量', t: '房间里摆放着__过量的装饰品。' },
  { w: 'analogous', p: 'əˈnæləɡəs', m: '类似的', t: '这种情况与上次__类似。' },
]

// 分析每章词汇数（基于 text analysis）
function countChapterVocab(chStartIdx, allLines) {
  let count = 0
  // 从 chapter 开始到下一个 chapter 或 chapters 结束
  for (let i = chStartIdx; i < allLines.length; i++) {
    const line = allLines[i]
    if (line.includes('"id": "ch') && i !== chStartIdx) break // 到下一章
    if (line.includes('"vocabList"')) break // 到 vocabList
    const spans = (line.match(/data-word=/g) || [])
    count += spans.length
  }
  return count
}

// 找到每个章节的段落区域并补充
let supIdx = 0
const outputLines = src.split('\n')
let currentCh = 0
let chParaCount = 0
let chVocabCount = 0
let inParagraphs = false
let lastRawLineIdx = -1
const newParagraphsToInsert = [] // { afterLine: idx, paragraphs: [...] }

for (let i = 0; i < outputLines.length; i++) {
  const line = outputLines[i]

  // 检测新章节开始
  if (line.match(/"id": "ch(\d+)"/)) {
    if (currentCh > 0) {
      console.log(`   第${String(currentCh).padStart(2,'0')}章: 当前约 ${chVocabCount} 词`)
    }
    currentCh = parseInt(line.match(/"id": "ch(\d+)"/)[1])
    chParaCount = 0
    chVocabCount = 0
    inParagraphs = false
    
    // 快速预扫描这章有多少词
    for (let j = i; j < outputLines.length; j++) {
      if (outputLines[j].match(/"id": "ch(\d+)"/) && j !== i) break
      if (outputLines[j].includes('"vocabList"')) break
      chVocabCount += (outputLines[j].match(/data-word=/g) || []).length
    }
    
    if (chVocabCount >= 40) {
      console.log(`   ✓ 第${String(currentCh).padStart(2,'0')}章: ${chVocabCount}词 (达标，跳过)`)
      currentCh = 0 // 标记为跳过
    } else {
      console.log(`   ⬆ 第${String(currentCh).padStart(2,'0')}章: ${chVocabCount}词 → 需要 +${40 - chVocabCount}`)
    }
    continue
  }

  // 跳过已达标的章节
  if (currentCh === 0) continue
  
  // 在段落区域内统计
  if (line.includes('"paragraphs"')) {
    inParagraphs = true
  }
  if (line.includes('"vocabList"')) {
    inParagraphs = false
    
    // 到达 vocabList 前，检查是否需要补充
    if (chVocabCount < 40 && currentCh > 0) {
      const need = 40 - chVocabCount
      console.log(`     → 第${currentCh}章需要补充 ${need} 个词，在 vocabList 前插入新段落...`)
      
      // 构建新的段落数组字符串
      const newParas = []
      for (let n = 0; n < need; n++) {
        const s = SUPPLEMENTS[supIdx % SUPPLEMENTS.length]
        supIdx++
        const raw = s.t.replace('__', `<span class="word-highlight" data-word="${s.w}">${s.w}</span>`)
        const trans = s.t.replace('__', `<span class="word-highlight">${s.w}</span>（adj./${s.p}/ ${s.m}）`)
        
        newParas.push(`      {
        "raw": ${JSON.stringify(raw)},
        "translation": ${JSON.stringify(trans)}
      }`)
        stats.vocabAdd++
        totalFixes++
      }
      
      // 将这些新段落插入到当前行之前（即最后一个现有段落之后，vocabList 之前）
      // 通过标记方式：替换当前行的前缀来插入
      const insertText = '\n' + newParas.join('\n') + '\n    '
      outputLines[i] = insertText + outputLines[i]
    }
  }
  
  // 统计当前段的词数
  if (inParagraphs) {
    chVocabCount += (line.match(/data-word=/g) || []).length
  }
}

if (supIdx > 0) {
  console.log(`   ✅ 总共补充了 ${stats.vocabAdd} 个词汇标记`)
}

// 重新组合
src = outputLines.join('\n')

// ══════════════════════════════════════
// Fix 4: 最终验证
// ══════════════════════════════════════
console.log('\n🔍 [4/5] 最终验证...')

const verifyLines = src.split('\n')
let finalCh = 0
let finalChSpans = 0
let issues = 0

for (let i = 0; i < verifyLines.length; i++) {
  const line = verifyLines[i]
  
  if (line.match(/"id": "ch(\d+)"/)) {
    if (finalCh > 0) {
      const ok = finalChSpans >= 40 ? '✅' : '⚠️'
      console.log(`   ${ok} 第${String(finalCh).padStart(2,'0')}章: ${finalChSpans} 词`)
    }
    finalCh = parseInt(line.match(/"id": "ch(\d+)"/)[1])
    finalChSpans = 0
    continue
  }
  
  if (line.includes('"vocabList"')) continue
  if (line.match(/"id": "ch/) && !line.match(/"id": "ch(\d+)"/)) continue
  
  // 数据质量检查
  if (line.includes('"raw"')) {
    if (/\*\*/.test(line)) {
      console.log(`   ❌ 仍有 **: L${i+1}: ${line.substring(0, 80)}`)
      issues++
    }
    if (/ponder>ponder\//.test(line)) {
      console.log(`   ❌ 仍有 ponder 错误: L${i+1}`)
      issues++
    }
    if (/venture>venture\//.test(line)) {
      console.log(`   ❌ 仍有 venture 错误: L${i+1}`)
      issues++
    }
    finalChSpans += (line.match(/data-word=/g) || []).length
  }
}

// 最后一章
if (finalCh > 0) {
  const ok = finalChSpans >= 40 ? '✅' : '⚠️'
  console.log(`   ${ok} 第${String(finalCh).padStart(2,'0')}章: ${finalChSpans} 词`)
}

// 全局检查
const remainingBold = (src.match(/"raw": "\*\*/g) || []).length
const remainingPonder = (src.match(/ponder>ponder\//g) || []).length
const remainingVenture = (src.match(/venture>venture\//g) || []).length

console.log(`\n   📋 残留检查:`)
console.log(`      ** 残留: ${remainingBold}`)
console.log(`      ponder 错误: ${remainingPonder}`)
console.log(`      venture 错误: ${remainingVenture}`)
console.log(`      其他问题: ${issues}`)

// ══════════════════════════════════════
// 写入输出
// ══════════════════════════════════════
writeFileSync(OUTPUT, src, 'utf8')

console.log(`\n✨ 全面修复完成!`)
console.log(`   总修复数: ${totalFixes} 处`)
console.log(`   ├─ 清理 **: ${stats.bold}`)
console.log(`   ├─ 修复截断: ${stats.truncate}`)
console.log(`   ├─ 修复 ponder: ${stats.ponder}`)
console.log(`   ├─ 修复 venture: ${stats.venture}`)
console.log(`   └─ 补充词汇: ${stats.vocabAdd}`)
console.log(`\n📝 输出: ${OUTPUT}`)
