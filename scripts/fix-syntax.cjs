/**
 * 直接修复 novel-data.js 的所有语法问题
 * 不重建，只修复：phonetic格式、多行字符串、括号平衡
 */
const fs = require('fs');
const FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
let c = fs.readFileSync(FILE, 'utf8');

console.log('Original size:', c.length, 'bytes');

// Fix 1: phonetic:'/xxx/' -> phonetic:'xxx' (remove / wrappers)
let fixes = 0;
c = c.replace(/phonetic:'(\/[^\/]+\/)'/g, () => { fixes++; return `phonetic:'${arguments[1]}'`; });
console.log('Fix 1 (phonetic wrapper):', fixes);

// Fix 2: phonetic:/xxx/ -> phonetic:'xxx'
fixes = 0;
c = c.replace(/phonetic:(\/[^\/]+\/)/g, () => { fixes++; return `phonetic:'${arguments[1]}'`; });
console.log('Fix 2 (regex literal):', fixes);

// Fix 3: trailing quote in phonetic like '/xxx/'' 
fixes = 0;
c = c.replace(/phonetic:'([^']*\/)''/g, () => { fixes++; return `phonetic:'${arguments[1]}'`; });
console.log('Fix 3 (trailing quote):', fixes);

// Fix 4: leading single quote before slash in phonetic
fixes = 0;
c = c.replace(/phonetic:'\//g, () => { fixes++; return "phonetic:'/"; });
console.log('Fix 4 (leading quote):', fixes);

// Fix 5: multi-line raw/tr strings - find and truncate
const lines = c.split('\n');
const result = [];
let skipUntilNextEntry = false;
let multilineFixed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Detect start of broken multi-line string
  if ((line.startsWith("{raw:'") || line.startsWith("{tr:'")) && !line.includes("'}") && !line.includes("',")) {
    // Check if string is unclosed
    const quotes = (line.match(/'/g) || []).length;
    if (quotes % 2 !== 0) {
      // Truncate this line at a safe point
      let fixed = line;
      if (!fixed.endsWith("}") && !fixed.endsWith(",")) {
        // Find last Chinese period or add closing
        fixed += "',";
      }
      result.push(lines[i].substring(0, lines[i].indexOf(line)) + fixed);
      skipUntilNextEntry = true;
      multilineFixed++;
      continue;
    }
  }
  
  if (skipUntilNextEntry) {
    // Check if we've reached the next valid entry
    if (line.match(/^\s*\{(?:raw|tr|word|phonetic|id|title|vl|para):/) ||
        line === '],' || line === "}" || line === '],') {
      skipUntilNextEntry = false;
      result.push(lines[i]);
    } else {
      continue; // Skip lines that are part of broken string
    }
  } else {
    result.push(lines[i]);
  }
}
if (multilineFixed > 0) { c = result.join('\n'); console.log('Fix 5 (multiline strings):', multilineFixed); }

// Fix 6: remove orphaned characters between array close and new declaration
c = c.replace(/\}\s*;\s*\n{2,}/g, '}\n];\n\n');

fs.writeFileSync(FILE, c);
console.log('\nFinal size:', c.length, 'bytes');
