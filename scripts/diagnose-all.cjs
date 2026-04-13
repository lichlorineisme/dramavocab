/**
 * 通用批量VL修复脚本
 * 从小说原文提取干净词汇数据，更新到 novel-data.js
 */
const fs = require('fs');

const DATA_FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
const NOVELS_BASE = '/Users/ccc/WorkBuddy/vibecoding/novels';

// Novel chapter file mapping
const BOOK_DIRS = {
  'book1': { dir: 'book1-契约成瘾', prefix: '第', suffix: '章' },
  'book2': { dir: 'book2-NPC逆袭', prefix: '第', suffix: '章' },
  'book3': { dir: 'book3-寒光破晓', prefix: '第', suffix: '章' }
};

function findNovelFile(bookKey, chNum) {
  const info = BOOK_DIRS[bookKey];
  if (!info) return null;
  
  // Try different naming patterns
  const patterns = [
    `${info.dir}/${info.prefix}${String(chNum).padStart(2,'0')}${info.suffix}*.md`,
    `${info.dir}/*${chNum}*`
  ];
  
  // Use glob-like search
  try {
    const files = fs.readdirSync(`${NOVELS_BASE}/${info.dir}`);
    // Look for file containing chapter number
    for (const f of files) {
      if (f.includes(`${String(chNum).padStart(2, '0')}${info.suffix}`) || 
          f.match(new RegExp(`第?\\s*${chNum}\\s*章`))) {
        return `${NOVELS_BASE}/${info.dir}/${f}`;
      }
    }
    // Try looser match
    for (const f of files) {
      if (new RegExp(`[0]?${ch_num}`).test(f.replace(info.prefix, ''))) {
        return `${NOVELS_BASE}/${info.dir}/${f}`;
      }
    }
  } catch(e) {}
  return null;
}

function extractVocabFromNovel(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.log(`  ⚠️ File not found: ${filePath}`);
    return [];
  }
  
  const novel = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  const seen = new Set();
  
  // Match both formats:
  // A: <span class="word-highlight">**word**</span>（meaning）
  // B: <span class="word-highlight">**word**</span>**（phonetic/ meaning）**
  const spanRe = /<span class="word-highlight">\*\*(\w[\w\s\-']*?)\*\*<\/span>/g;
  let m;
  
  while ((m = spanRe.exec(novel)) !== null) {
    const word = m[1].trim();
    if (!word || seen.has(word)) continue;
    
    // Get text after span tag to find parenthetical
    const afterMatch = novel.substring(m.index + m[0].length);
    const parenMatch = afterMatch.match(/[^\n]*?（([^(]{5,}?）)/);
    
    if (!parenMatch) {
      console.log(`  WARN: no paren for "${word}" at pos ${m.index}`);
      continue;
    }
    
    let cleaned = parenMatch[1].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    
    let phonetic = '', meaning = cleaned;
    const phMatch = cleaned.match(/^(n\.|v\.|adj\.|adv\.|phr\.)\s*\/[^/]*\/\s*/);
    if (phMatch) {
      phonetic = phMatch[0].trim();
      meaning = cleaned.substring(phMatch[0].length).trim();
    }
    
    seen.add(word);
    
    // Extract context snippet
    const wordPos = m.index;
    const start = Math.max(0, wordPos - 25);
    const end = Math.min(novel.length, wordPos + m[0].length + parenMatch[0].length + 20);
    let ctx = novel.substring(start, end)
      .replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '')
      .replace(/'/g, "'")
      .substring(0, 55);
    
    const d = meaning.includes('phr.') ? 1 : /[a-z]{6,}/.test(meaning) ? 3 : 2;
    
    entries.push({ w: word, p: phonetic, m: meaning, x: ctx, d });
  }
  
  return entries;
}

// Read current data file
let c = fs.readFileSync(DATA_FILE, 'utf8');
const originalC = c;

// Find each book's chapters
const bookRe = /\bid:\s*'book(\d)'/g;
let bm;
const results = [];

while ((bm = bookRe.exec(c)) !== null) {
  const bookId = bm[1];
  const bookStart = bm.index;
  // Find next book or end of data
  const nextBook = c.indexOf("\n  id: 'book", bm.index + 5);
  const blockEnd = nextBook > -1 ? nextBook : c.length;
  const bookBlock = c.substring(bookStart, blockEnd);
  
  // Find chapters in this book
  const chRe = /id:\s*'ch(\d+)'[^}]*vl:\s*\[((?:[^\]]|\](?!\n\s*}))*)\]/gs;
  let cm;
  
  while ((cm = chRe.exec(bookBlock)) !== null) {
    const chNum = cm[2];
    const vlContent = cm[3].trim();
    const fullMatch = cm[0];
    
    // Check if VL has issues
    const hasIssues = 
      !vlContent || 
      vlContent === '' || 
      vlContent.includes("ex:'e.") ||
      !vlContent.includes('meaning:');
    
    // Also count entries
    const entryCount = vlContent ? vlContent.split(/,\s*(?=\{)/).filter(Boolean).length : 0;
    
    // Find corresponding novel file
    const novelFile = findNovelFile('book' + bookId, parseInt(chNum));
    
    results.push({
      book: bookId,
      ch: chNum,
      hasIssues,
      entryCount,
      novelFile: novelFile ? novelFile.split('/').pop() : null,
      novelPath: novelFile,
      vlPos_in_book: cm.index + bookStart
    });
  }
}

// Print diagnosis
console.log('=== DIAGNOSIS ===\n');
console.log(`Total chapters found: ${results.length}\n`);

const needsFix = results.filter(r => r.hasIssues || r.entryCount === 0);
console.log(`Chapters needing fix: ${needsFix.length}\n`);
needsFix.forEach(r => {
  console.log(`  Book${r.book} Ch${r.ch}: ${r.entryCount} entries, issues=${r.hasIssues}, novel=${r.novelFile}`);
});

const ok = results.filter(r => !r.hasIssues && r.entryCount > 0);
console.log(`\nAlready OK: ${ok.length}`);
ok.slice(0, 10).forEach(r => console.log(`  Book${r.book} Ch${r.ch}: ✅ ${r.entryCount} entries`));

if (ok.length > 10) console.log(`  ...and ${ok.length-10} more`);
