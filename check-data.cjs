const fs = require('fs');
const code = fs.readFileSync('./src/stores/book.js', 'utf8');

// Find BOOK2 ch01
const b2Idx = code.indexOf('BOOK2_DATA');
const ch01Idx = code.indexOf("id: 'ch01'", b2Idx);

if (ch01Idx === -1) {
  console.log('ERROR: ch01 not found in BOOK2');
  process.exit(1);
}

// Extract from ch01 start to find paragraphs and vocabList
const chunk = code.substring(ch01Idx, ch01Idx + 200000);

// Count raw: occurrences (paragraphs)
const rawCount = (chunk.match(/raw:/g) || []).length;
console.log('raw (paragraph) count:', rawCount);

// Check for vocabList
const vlIdx = chunk.indexOf('vocabList');
console.log('vocabList found at offset from ch01:', vlIdx);

if (vlIdx > -1) {
  const vlSection = chunk.substring(vlIdx, vlIdx + 200);
  // Count entries
  const entryCount = (vlSection.match(/word:/g) || []).length;
  console.log('vocabList word entries (first 200 chars):', entryCount);
  
  // Check if vocabList is inside or outside paragraphs array
  const pLastClose = chunk.lastIndexOf(']');
  console.log('last ] before vocabList?', pLastClose < vlIdx ? 'YES - vocabList is OUTSIDE paragraphs' : 'NO - inside');
}

// Also check: does Book1 work?
const b1Idx = code.indexOf('BOOK_DATA'); // Note: original name
const ch1B1 = code.indexOf("id: 'ch01'", b1Idx);
if (ch1B1 > -1) {
  const b1Chunk = code.substring(ch1B1, ch1B1 + 100000);
  const b1RawCount = (b1Chunk.match(/raw:/g) || []).length;
  const b1VlIdx = b1Chunk.indexOf('vocabList');
  const b1Entries = b1VlIdx > -1 ? (b1Chunk.substring(b1VlIdx, b1VlIdx + 200).match(/word:/g) || []).length : 0;
  console.log('\n--- BOOK1 Ch01 ---');
  console.log('paragraphs:', b1RawCount);
  console.log('vocabList words:', b1Entries);
}
