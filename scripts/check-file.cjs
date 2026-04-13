const fs = require('fs');
const c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

// Check bracket balance
let depth = 0;
let lineNum = 0;
for (let i = 0; i < c.length; i++) {
  if (c[i] === '\n') lineNum++;
  if (c[i] === '[') depth++;
  if (c[i] === ']') depth--;
  
  // Report if depth goes negative (unbalanced)
  if (depth < 0) {
    console.log(`Unmatched ] at line ${lineNum}, pos ${i}`);
    console.log(c.substring(Math.max(0, i - 30), Math.min(c.length, i + 30)));
    break;
  }
}
console.log(`Final depth: ${depth} at end of file (${lineNum} lines)`);

// Also check for unclosed strings
let inString = false;
let stringChar = '';
let issues = [];
lineNum = 0;
for (let i = 0; i < c.length; i++) {
  if (c[i] === '\n') lineNum++;
  if ((c[i] === "'" || c[i] === '"') && (i === 0 || c[i-1] !== '\\')) {
    if (!inString) { inString = true; stringChar = c[i]; }
    else if (c[i] === stringChar) inString = false;
  }
}
if (inString) {
  console.log(`⚠️ File ends with an open string! Line: ~${lineNum}`);
}

// Quick check: can we find the export statement?
if (c.includes('export {')) {
  const exportPos = c.indexOf('export');
  console.log('\nExport found at pos', exportPos);
  console.log(c.substring(exportPos, exportPos + 80));
} else {
  console.log('\n⚠️ No export statement found!');
}
