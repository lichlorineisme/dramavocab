const fs = require('fs');
let c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

// Find ch19 vl boundaries
const ch19Idx = c.indexOf("id: 'ch19'");
const beforeVl = c.substring(0, c.indexOf('vl:', ch19Idx));
const afterVlStart = c.indexOf("'],\n  },", ch19Idx) + "'],\n  },\n".length;
const suffix = "\n  },\n" + c.substring(afterVlStart);

// Extract words from novel - handle BOTH formats:
// Format A: <span class="word-highlight">**word**</span>（meaning）
// Format B: <span class="word-highlight">**word**</span>**（phonetic/ meaning）**
const novel = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/novels/book1-契约成瘾/第19章-夜谈.md', 'utf-8');

// Step 1: find all word-highlight occurrences and extract word + context after it
const spanRe = /<span class="word-highlight">\*\*(\w[\w\s\-']*?)\*\*<\/span>/g;
let m;
const rawEntries = [];
while ((m = spanRe.exec(novel)) !== null) {
  const word = m[1].trim();
  // Get text AFTER this match up to next <span or end of line-ish
  const afterMatch = novel.substring(m.index + m[0].length);
  // Find the parenthetical with 全角（）
  const parenMatch = afterMatch.match(/[^\n]*?（([^(]{5,}?）)/);
  if (!parenMatch) {
    console.log('WARN: no paren for', word);
    continue;
  }
  
  const fullParen = parenMatch[1]; // e.g. "可采性/可采纳性" or "n./ˈkɒnflikt/ 冲突；矛盾"
  // Clean: remove leading ** if present, trim
  let cleaned = fullParen.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
  
  // Parse phonetic and meaning
  let phonetic = '', meaning = cleaned;
  const phMatch = cleaned.match(/^(n\.|v\.|adj\.|adv\.|phr\.)\s*\/[^/]*\/\s*/);
  if (phMatch) {
    phonetic = phMatch[0].trim();
    meaning = cleaned.substring(phMatch[0].length).trim();
  }
  
  // Skip duplicates
  if (rawEntries.some(e => e.w === word)) continue;
  
  rawEntries.push({ w: word, p: phonetic, m: meaning });
}

console.log(`Found ${rawEntries.length} unique words for ch19`);

// Build context snippets around each word
const entries = rawEntries.map(e => {
  // Find position in novel to extract context
  const wordPos = novel.indexOf(`**${e.w}**`);
  const start = Math.max(0, wordPos - 30);
  const end = Math.min(novel.length, wordPos + e.w.length + 80);
  let ctx = novel.substring(start, end).replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '').replace(/'/g, "'");
  ctx = ctx.substring(0, 60);
  
  // Determine difficulty
  const d = e.m.includes('phr.') ? 1 : /[a-z]{6,}/.test(e.m) ? 3 : 2;
  
  return { ...e, x: ctx, d };
});

console.log(entries.map(e => e.w).join(', '));

// Build clean VL string - properly escaped
const vlLines = entries.map(e => {
  // Escape single quotes in meaning and context
  const escM = e.m.replace(/'/g, "\\'");
  const escX = e.x.replace(/'/g, "\\'");
  return `      {word:'${e.w}',phonetic:'${e.p}',meaning:'${escM}',ex:'${escX}',diff:${e.d},syn:''}`;
});
const vl = '[\n' + vlLines.join(',\n') + '\n]';
const newC = beforeVl + "vl:\n" + vl + suffix;

fs.writeFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', newC);
console.log('\nDone! Ch19 now has', entries.length, 'clean entries.');

// Verify syntax by checking basic structure
try {
  const checkStr = '[' + entries.map(e => JSON.stringify({word:e.w,phonetic:e.p,meaning:e.m,ex:e.x,diff:e.d})).join(',') + ']';
  JSON.parse(checkStr);
  console.log('VERIFIED OK!');
} catch(e) {
  console.error('VERIFY FAILED:', e.message);
}
