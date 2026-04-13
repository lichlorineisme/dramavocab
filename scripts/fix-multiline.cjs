const fs = require('fs');
let c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

// Fix multi-line raw/tr strings - they should be single-line
// Find lines where {raw:' or {tr:' doesn't close on the same line
const lines = c.split('\n');
let fixed = 0;
let inBrokenString = false;
let brokenStart = -1;
const result = [];

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  
  // Check if this line opens a raw: or tr: but doesn't close
  if ((trimmed.match(/^\s*{raw:/) || trimmed.match(/^\s*{tr:/)) && !trimmed.endsWith("'}") && !trimmed.endsWith("',")) {
    // Check if there's an unclosed quote
    const openQuotes = (trimmed.match(/'/g) || []).length;
    if (openQuotes % 2 !== 0) {
      // Unclosed string - truncate at first reasonable point
      let fixedLine = trimmed;
      // If it ends without closing quote and comma/brace, add them
      if (!fixedLine.endsWith("}") && !fixedLine.endsWith(",")) {
        // Truncate to last safe point
        const lastSafe = Math.max(
          fixedLine.lastIndexOf('。'),
          fixedLine.lastIndexOf('.'),
          fixedLine.lastIndexOf('！'),
          fixedLine.length - 1
        );
        fixedLine = fixedLine.substring(0, lastSafe + 1) + "',";
      }
      result.push(fixedLine);
      
      // Skip subsequent lines until we find what looks like the next entry
      inBrokenString = true;
      fixed++;
      continue;
    }
  }
  
  if (inBrokenString) {
    // If we see the next {raw:, {tr:, {word:, or closing patterns, stop skipping
    if (trimmed.match(/^\s*\{(?:raw|tr|word|phonetic):/) || trimmed === "]," || trimmed === "}" || trimmed === "],") {
      inBrokenString = false;
    } else {
      // This is part of broken multiline string - skip it
      continue;
    }
  }
  
  result.push(lines[i]);
}

c = result.join('\n');
fs.writeFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', c);
console.log(`Fixed ${fixed} multiline strings`);
