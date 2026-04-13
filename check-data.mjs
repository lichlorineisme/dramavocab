import fs from 'fs';
const code = fs.readFileSync('./src/stores/book.js', 'utf8');

function findChapter(code, bookLabel, chId) {
  const bIdx = code.indexOf(bookLabel);
  const chIdx = code.indexOf(`id: '${chId}'`, bIdx);
  if (chIdx === -1) return null;
  
  // Extract from id: 'ch01' to the end of this chapter object
  // Find the opening { of this chapter object
  const objStart = code.lastIndexOf('{', code.indexOf('paragraphs:', chIdx));
  
  // Track braces to find matching close
  let depth = 0;
  let started = false;
  let endPos = objStart;
  for (let i = objStart; i < code.length; i++) {
    if (code[i] === '{') { depth++; started = true; }
    if (code[i] === '}') { 
      depth--; 
      if (started && depth === 0) { endPos = i + 1; break; } 
    }
  }
  
  return {
    raw: code.substring(objStart, endPos),
    start: objStart,
    end: endPos
  };
}

// Check Book2 Ch01
const ch = findChapter(code, 'BOOK2_DATA', 'ch01');
if (!ch) { console.log('Ch01 not found'); process.exit(1); }

console.log('=== BOOK2 Ch01 Structure Analysis ===');
console.log('Total length:', ch.raw.length);

// Find paragraphs: [ position
const pArrayStart = ch.raw.indexOf('paragraphs:');
const pBracketStart = ch.raw.indexOf('[', pArrayStart);
console.log('\nparagraphs[ starts at offset:', pArrayStart);

// Find vocabList position  
const vlPos = ch.raw.indexOf('vocabList');
console.log('vocabList at offset:', vlPos);

// Now track bracket depth from paragraphs[ to understand structure
let depth = 0;
let inTpl = false;
let tplChar = '';
for (let i = pBracketStart; i < ch.raw.length; i++) {
  const c = ch.raw[i];
  
  // Template literal tracking
  if (inTpl) {
    if (c === tplChar && ch.raw[i-1] !== '\\') inTpl = false;
    continue;
  }
  if (c === '`') { inTpl = true; tplChar = c; continue; }
  
  if (c === '[') depth++;
  if (c === ']') {
    depth--;
    if (depth === 0) {
      console.log('paragraphs[] CLOSES at offset from p[:', i - pBracketStart);
      console.log('vocabList is AFTER paragraphs close?', vlPos > i);
      
      // What's between paragraphs close and vocabList?
      const between = ch.raw.substring(i, Math.min(i + 100, vlPos > 0 ? vlPos : i + 100));
      console.log('Between ] and vocabList:', JSON.stringify(between.substring(0, 80)));
      break;
    }
  }
}

// Also count actual paragraph objects vs vocabList entries
const rawMatches = ch.raw.match(/raw:\s*`/g);
console.log('\nParagraph objects (raw: `...`):', rawMatches?.length || 0);

const wordInVl = ch.raw.match(/"word":\s*"/g);
console.log('Word entries in vocabList:', wordInVl?.length || 0);

// Check for SYNTAX ERROR: unescaped backtick in template string
// Look for raw fields that contain backticks inside them
const rawRegex = /raw:\s*`([\s\S]*?)`/g;
let m;
let rawNum = 0;
while ((m = rawRegex.exec(ch.raw)) !== null) {
  rawNum++;
  const content = m[1];
  if (content.includes('`')) {
    console.log(`\n⚠️ RAW #${rawNum} contains inner backtick!`);
    console.log('First 80 chars:', content.substring(0, 80));
  }
}
console.log('\nTotal raw fields checked:', rawNum);
