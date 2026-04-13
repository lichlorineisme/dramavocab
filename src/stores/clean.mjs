import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('book.js', 'utf8');
let s = src;
let b = 0, t = 0, p2 = 0;

// Pass 1: 清理 raw 中的 ** 标记
s = s.replace(/"raw":\s*"((?:[^"\\]|\\.)*)"/g, (match, content) => {
  if (content.includes('**')) {
    const cleaned = content.replace(/\*\*/g, '');
    b++;
    return `"raw": "${cleaned}"`;
  }
  return match;
});
console.log(`Pass1 ** removed: ${b}`);

// Pass 2: 修复 </span> 后面的 / xxx）尾巴
const tailRegex = new RegExp('<\\/span>\\/' + '([^<"]{0,30}' + '\uff09)', 'g');
s = s.replace(tailRegex, () => { t++; return '</span>'; });
console.log(`Pass2 tail fixed: ${t}`);

// Pass 3: 双重标点修正
const before = s.length;
s = s.replace(/久仰。，/g, '久仰。');
p2 += before - s.length > 0 ? 1 : 0;
console.log(`Pass3 punct fixed: ${p2}`);

// 验证
const remainBold = (s.match(/\*\*/g) || []).length;
const remainTail = (s.match(/<\/span>\/[^<]{0,20}）/g) || []).length;
console.log(`\n验证: 剩余**=${remainBold}, 剩余尾巴=${remainTail}`);

writeFileSync('book-new.js', s, 'utf8');
console.log('\n✅ Done! → book-new.js');
