/**
 * 批量补全 BOOK2 (NPC逆袭) 缺失章节 Ch03-20
 * 从小说原文提取词汇数据，生成标准格式的 para + vl
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
const NOVEL_DIR = '/Users/ccc/WorkBuddy/vibecoding/novels/book2-NPC的逆袭';

// ====== VOCAB EXTRACTION ======
function extractVocab(novelText) {
  const entries = [];
  const seen = new Set();
  
  const spanRe = /<span class="word-highlight">\*\*(\w[\w\s\-']*?)\*\*<\/span>/g;
  let m;
  
  while ((m = spanRe.exec(novelText)) !== null) {
    const word = m[1].trim();
    if (!word || word.length > 40 || seen.has(word)) continue;
    
    // Find parenthetical after span tag
    const afterMatch = novelText.substring(m.index + m[0].length);
    const parenMatch = afterMatch.match(/[^\n]*?（([^(]{5,}?）)/);
    
    if (!parenMatch) continue;
    
    let cleaned = parenMatch[1].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    
    let phonetic = '', meaning = cleaned;
    const phMatch = cleaned.match(/^(n\.|v\.|adj\.|adv\.|phr\.)\s*\/[^/]*\/\s*/);
    if (phMatch) {
      phonetic = phMatch[0].trim();
      meaning = cleaned.substring(phMatch[0].length).trim();
    }
    
    if (!meaning || meaning.length < 2) continue;
    
    seen.add(word);
    
    // Context snippet
    const start = Math.max(0, m.index - 25);
    const end = Math.min(novelText.length, m.index + m[0].length + parenMatch[0].length + 20);
    let ctx = novelText.substring(start, end)
      .replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '')
      .replace(/'/g, "'")
      .substring(0, 55);
    
    const d = meaning.includes('phr.') ? 1 : /[a-z]{6,}/.test(meaning) ? 3 : 2;
    
    entries.push({ w: word, p: phonetic, m: meaning, x: ctx, d });
  }
  
  return entries;
}

// ====== PARA EXTRACTION (sentences with inline English words) ======
function extractPara(novelText) {
  const paras = [];
  
  // Split by paragraphs
  const paragraphs = novelText.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('>') && !p.startsWith('---'));
  
  for (const para of paragraphs) {
    const lines = para.split('\n').map(l => l.trim()).filter(l => l && l.length > 10);
    for (const line of lines) {
      // Check if this line has English words embedded (not just word-highlight tags)
      const hasInlineEnglish = /\b[a-zA-Z]{3,}\b/.test(line.replace(/<span class="word-highlight">.*?<\/span>/g, ''));
      
      // Also check for word-highlight tags - those are our target words
      if ((line.includes('word-highlight') || hasInlineEnglish) && line.length > 15 && line.length < 600) {
        // Clean up: convert word-highlight spans to plain bold words
        let raw = line.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
        raw = raw.replace(/[（][^）]+[）]/g, ''); // remove parenthetical definitions
        
        // Create translation version with [__] placeholders for English words
        let tr = raw;
        // Find all English-looking words that should be blanked out
        const engWords = raw.match(/\b[A-Za-z]{3,}(?:\s+[A-Za-z]+)?\b/g) || [];
        // Only replace words that are clearly English vocabulary (not common words)
        const skipWords = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','its','may','new','now','old','see','way','who','boy','did','own','say','she','too','use','this','that','with','have','from','they','been','would','there','make','like','time','just','than','them','when','come','could','what','some','over','into','also','well','back','after','used','your','their','will','each','about','between','though','while','should','where','might','still','much','before','those','more','most','even','very','long','down','here','many','every','such','because','through','being','during','another','however','these','other','which','same','again','against','since','both','often','once','under','until','while','above','below','around','across','within','without','almost','always','never','really','rather','already','perhaps','actually','certainly','probably','something','anything','everything','nothing','everyone','someone','anyone','nobody','whether','either','neither','although','despite','except','unless','behind','besides','towards','toward']);
        
        // For tr: replace non-common English words with [__]
        // Simple approach: find words that look like vocabulary terms
        const vocabPattern = /\b([A-Z]?[a-z]{3,}(?:\s[-'][A-Za-z]+)?)\b/g;
        let matchResult;
        while ((matchResult = vocabPattern.exec(raw)) !== null) {
          const w = matchResult[1];
          if (!skipWords.has(w.toLowerCase()) && w.length >= 3) {
            tr = tr.replace(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'), '[__]');
          }
        }
        
        // Escape single quotes
        raw = raw.replace(/'/g, "\\'");
        tr = tr.replace(/'/g, "\\'").substring(0, 500);
        raw = raw.substring(0, 500);
        
        if (raw.length > 5) {
          paras.push(`{raw:'${raw}',tr:'${tr}'}`);
        }
      }
    }
  }
  
  return paras;
}

// ====== MAIN ======

// Read current data
let data = fs.readFileSync(DATA_FILE, 'utf8');

// Check which chapters already exist in BOOK2
const existingBook2Chapters = [];
const book2Start = data.indexOf('const NOVEL_DATA_BOOK2');
if (book2Start > -1) {
  const book2Data = data.substring(book2Start);
  let cm;
  const re = /id:\s*'ch(\d+)'/g;
  while ((cm = re.exec(book2Data)) !== null) {
    existingBook2Chapters.push(parseInt(cm[1]));
  }
}
console.log('Existing BOOK2 chapters:', existingBook2Chapters);

// Get all available novel files
const novelFiles = fs.readdirSync(NOVEL_DIR).filter(f => f.endsWith('.md') && f.startsWith('第')).sort();
console.log('Novel files found:', novelFiles.length);

// Generate chapters that don't exist yet
const newChapters = [];

for (const nf of novelFiles) {
  // Extract chapter number
  const chNumMatch = nf.match(/第(\d+)章/);
  if (!chNumMatch) continue;
  const chNum = parseInt(chNumMatch[1]);
  
  if (existingBook2Chapters.includes(chNum)) continue; // Skip existing
  
  console.log(`\nProcessing ${nf} (Ch${String(chNum).padStart(2,'0')})...`);
  
  const novelPath = path.join(NOVEL_DIR, nf);
  const novelText = fs.readFileSync(novelPath, 'utf-8');
  
  // Extract title from filename or content
  const titleMatch = nf.match(/第\d+章-(.+?)\.md/);
  const title = titleMatch ? titleMatch[1] : `Chapter ${chNum}`;
  
  // Extract vocab
  const vlEntries = extractVocab(novelText);
  console.log(`  Vocab: ${vlEntries.length} words`);
  
  // Extract paragraphs
  const paraEntries = extractPara(novelText);
  console.log(`  Paragraphs: ${paraEntries.length}`);
  
  if (vlEntries.length < 3) {
    console.log(`  ⚠️ Skipping - too few vocab entries`);
    continue;
  }
  
  // Build VL string
  const vlLines = vlEntries.map(e => {
    const escM = e.m.replace(/'/g, "\\'");
    const escX = e.x.replace(/'/g, "\\'");
    return `      {word:'${e.w}',phonetic:'${e.p}',meaning:'${escM}',ex:'${escX}',diff:${e.d},syn:''}`;
  });
  const vlStr = '[\n' + vlLines.join(',\n') + '\n    ]';
  
  // Build chapter object
  const stitle = `Ch${chNum} ${title}`;
  const paraStr = paraEntries.length > 0 
    ? '[\n      ' + paraEntries.slice(0, 25).join(',\n      ') + '\n    ]'
    : "[]";
  
  const chObj = `  {
    id: 'ch${String(chNum).padStart(2,'0')}',
    title: '${title}',
    stitle: '${stitle}',
    para: ${paraStr},
    vl: ${vlStr}
  }`;
  
  newChapters.push({ num: chNum, obj: chObj, vlCount: vlEntries.length });
}

console.log(`\n\n=== SUMMARY ===`);
console.log(`New chapters to add: ${newChapters.length}`);
newChapters.forEach(c => console.log(`  Ch${String(c.num).padStart(2,'0')}: ${c.vlCount} vocab entries`));

if (newChapters.length === 0) {
  console.log('\nNothing to do!');
  process.exit(0);
}

// Sort by chapter number
newChapters.sort((a, b) => a.num - b.num);

// Insert into BOOK2 array
// Find position: before the closing ]; of BOOK2
const book2ArrayEnd = data.lastIndexOf('];\n\nexport {');
if (book2ArrayEnd === -1) {
  console.error('Could not find BOOK2 array end!');
  process.exit(1);
}

const beforeInsert = data.substring(0, book2ArrayEnd);

// Build new content: insert chapters before the closing ]
const newContent = beforeInsert + ',\n\n' + newChapters.map(c => c.obj).join(',\n\n') + '\n  ]';

// Add back the export section
const suffix = data.substring(data.indexOf('\n\nexport { NOVEL_DATA_BOOK2'));

fs.writeFileSync(DATA_FILE, newContent + suffix);
console.log(`\n✅ Done! File updated.`);

// Verify
const verify = fs.readFileSync(DATA_FILE, 'utf8');
const totalCh = (verify.match(/id:\s*'ch\d+'/g) || []).length;
console.log(`Total chapters now: ${totalCh}`);

try {
  require(DATA_FILE);
  console.log('✅ Syntax verified OK!');
} catch(e) {
  console.error('⚠️ Syntax error:', e.message.substring(0, 200));
}
