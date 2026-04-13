const fs = require('fs');
const c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

console.log('=== FINAL VERIFICATION ===');
console.log('File size:', (c.length / 1024).toFixed(1), 'KB');

// Count chapters
const chMatches = c.match(/id:\s*'ch\d+'/g) || [];
console.log('Total chapters:', chMatches.length);

// Count by book
const b1Start = c.indexOf('NOVEL_DATA_BOOK1');
const b2Start = c.indexOf('NOVEL_DATA_BOOK2');
const b3Start = c.indexOf('NOVEL_DATA_BOOK3');

if (b2Start > -1 && b3Start > -1) {
  const b1Ch = (c.substring(b1Start, b2Start).match(/id:\s*'ch\d+/g) || []).length;
  const b2Ch = (c.substring(b2Start, b3Start).match(/id:\s*'ch\d+/g) || []).length;
  const b3Ch = (c.substring(b3Start).match(/id:\s*'ch\d+/g) || []).length;
  console.log('\nBook 1:', b1Ch, 'chapters');
  console.log('Book 2:', b2Ch, 'chapters');
  console.log('Book 3:', b3Ch, 'chapters');
}

// Check for syntax issues
const openBrackets = (c.match(/\[/g) || []).length;
const closeBrackets = (c.match(/\]/g) || []).length;
const openCurly = (c.match(/\{/g) || []).length;
const closeCurly = (c.match(/\}/g) || []).length;

console.log('\nBracket balance:');
console.log('  [ ]:', openBrackets, 'vs', closeBrackets, openBrackets === closeBrackets ? '✅' : '⚠️ MISMATCH');
console.log('  { }:', openCurly, 'vs', closeCurly, openCurly === closeCurly ? '✅' : '⚠️ MISMATCH');

// Check for e. pattern bugs
const eDotBugs = (c.match(/ex:'?e\./g) || []).length;
if (eDotBugs > 0) {
  console.log('\n⚠️ Found', eDotBugs, '"e." pattern bugs remaining!');
} else {
  console.log('\n✅ No "e." pattern bugs found');
}

// Try to parse as JS
try {
  new Function(c);
  console.log('✅ Basic JS syntax OK');
} catch(e) {
  console.error('⚠️ Syntax error:', e.message.substring(0, 100));
}
