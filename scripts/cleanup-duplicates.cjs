const fs = require('fs');
const FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
let c = fs.readFileSync(FILE, 'utf8');

// Find all three BOOK1 positions
const b1 = c.indexOf('const NOVEL_DATA_BOOK1');
const b2 = c.indexOf('const NOVEL_DATA_BOOK1', b1 + 10);
const b3 = c.indexOf('const NOVEL_DATA_BOOK1', b2 + 10);

// Header: everything before first BOOK1
const header = c.substring(0, b1).trim();

// B3 content: from b3 to just before '\n\nif(typeof'
const afterB3 = c.substring(b3);
const ifPos = afterB3.indexOf('\n\nif(typeof');
const book1Data = afterB3.substring(0, ifPos).trim();

// Everything after B3's closing
const suffix = afterB3.substring(ifPos).trim();

console.log(`Header: ${header.length} chars`);
console.log(`Book1 data: ${book1Data.length} chars`);
console.log(`Suffix starts: ${suffix.substring(0, 60)}`);

// Rebuild
const newC = header + '\n\n' + book1Data + '\n\n' + suffix + '\n';
fs.writeFileSync(FILE, newC);

// Verify
const v = fs.readFileSync(FILE, 'utf8');
const consts = (v.match(/const NOVEL_DATA_/g) || []);
console.log(`\n✅ Done! File size: ${v.length} bytes`);
console.log(`Const declarations: ${consts.join(', ')}`);
console.log(`Chapters: ${(v.match(/id:\s*'ch\d+'/g) || []).length}`);
