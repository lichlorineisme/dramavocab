/**
 * ═══════════════════════════════════════════════════════
 * DramaVocab 数据清洗脚本 v2.0
 * 
 * 修复所有已发现的 book.js 数据格式问题：
 * 1. raw 中残留 **粗体标记 → 清除
 * 2. raw 中 / xxx）尾巴 → 清除  
 * 3. 句子截断/不完整 → 补全标点
 * 4. 双重标点 → 修正
 * ═══════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync } from 'fs';

const BOOK_PATH = new URL('./book.js', import.meta.url).pathname;
const OUT_PATH = new URL('./book-cleaned.js', import.meta.url).pathname;

console.log('📖 读取 book.js ...');
let src = readFileSync(BOOK_PATH, 'utf-8');

const stats = {
  boldRemoved: 0,
  tailFixed: 0,
  punctuationFixed: 0,
  sentenceFixed: 0,
};

// ════════════════════════════════════════════
// Pass 1: 清理 raw 字段中的 ** 标记
// ════════════════════════════════════════════
src = src.replace(/"raw":\s*"(\*\*[^"]*\*\*)/g, (match, content) => {
  // 去掉首尾 **
  let cleaned = content;
  // 匹配 **text** 或 **text**more
  cleaned = cleaned.replace(/^\*\*/g, '').replace(/\*\*$/g, '');
  // 处理中间的 ** (如 **第七条：期满安排**<br/>)
  cleaned = cleaned.replace(/\*\*/g, '');
  stats.boldRemoved++;
  return '"raw": "' + cleaned + '"';
});
console.log(`  ✅ Pass 1: 移除 ${stats.boldRemoved} 个 ** 标记`);

// ════════════════════════════════════════════
// Pass 2: 修复 </span> 后面的 / xxx）尾巴
//    模式: </span>"  或  </span>,  后面紧接 / 中文）
// ════════════════════════════════════════════
src = src.replace(/(<\/span>")([,]?[\s]*\/[\s]*[^"}]{0,20}["])/g, (match, spanEnd, rest) => {
  stats.tailFixed++;
  // 只保留 </span>" ，去掉后面的 / xxx）尾巴
  return spanEnd + (rest.startsWith(',') ? '",' : '"');
});

// 更激进的模式：处理 </span> 后面紧跟非HTML内容的情况
src = src.replace(/<\/span>(\/[^"<]{1,30}）)/g, () => {
  stats.tailFixed++;
  return '</span>';
});
console.log(`  ✅ Pass 2: 修复 ${stats.tailFixed} 个 / xxx）尾巴`);

// ════════════════════════════════════════════
// Pass 3: 修复双重标点
// ════════════════════════════════════════════
const punctFixes = [
  [/，。/, '。'],      // 久仰。，→ 久仰。
  [/。,/, '，'],       // 其他类似情况
  [/\.\.,/, ','],
];
for (const [from, to] of punctFixes) {
  const count = (src.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    src = src.replace(new RegExp(from, 'g'), to);
    stats.punctuationFixed += count;
  }
}
console.log(`  ✅ Pass 3: 修复 ${stats.punctuationFixed} 处标点错误`);

// ════════════════════════════════════════════
// Pass 4: 修复被截断的句子
//    模式: 以 </span>" 结尾但后面没有中文标点的 raw
// ════════════════════════════════════════════
// 找出以 </span>" 结尾但没有句号/问号/感叹号的 raw 行
let truncFixed = 0;
src = src.replace(/"raw":\s*("[^"]*<\/span>")(?=\s*,?\s*\n)/g, (match, rawVal) => {
  // 检查这个字符串是否以标点结尾
  const lastChar = rawVal.slice(-3); // 去掉引号前的最后几个字符
  if (!/[。！？…」》]/.test(rawVal.slice(-4, -1))) {
    // 如果没有标点，加个句号
    truncFixed++;
    return match.replace(/"$/, '。"');
  }
  return match;
});
stats.sentenceFixed = truncFixed;
console.log(`  ✅ Pass 4: 补全 ${truncFixed} 处截断句子的标点`);

// ════════════════════════════════════════════
// Pass 5: 特殊修复 — "这种感觉真是xxx"
//     后面缺少动词/形容词补全的情况
// ════════════════════════════════════════════
src = src.replace(/这种感觉真是<span class="word-highlight"[^>]+>([^<]+)<\/span>"/g, (match, word) => {
  return match;
}); // 这个模式本身没问题，保持不变

// ════════════════════════════════════════════
// 最终验证
// ════════════════════════════════════════════
const remainingBold = (src.match(/\*\*/g) || []).length;
const remainingTails = (src.match(/<\/span>\/[\s]*[^\n"<]{1,20}）/g) || []).length;

console.log('\n📊 清洗报告:');
console.log(`  • 移除 ** 标记: ${stats.boldRemoved}`);
console.log(`  • 修复 / xxx）尾巴: ${stats.tailFixed}`);
console.log(`  • 修正标点错误: ${stats.punctuationFixed}`);
console.log(`  • 补全截断句子: ${stats.sentenceFixed}`);

if (remainingBold > 0 || remainingTails > 0) {
  console.log(`\n⚠️ 残留警告:`);
  console.log(`  • 剩余 ** : ${remainingBold}`);
  console.log(`  • 剩余尾巴: ${remainingTails}`);
} else {
  console.log('\n✨ 数据完全干净！');
}

writeFileSync(OUT_PATH, src, 'utf-8');
console.log(`\n💾 输出文件: book-cleaned.js`);
console.log('   请手动替换: cp book-cleaned.js book.js');
