const fs = require('fs');
const c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

// Use acorn-like approach: find the exact line with syntax issue
// Try requiring in parts
const lines = c.split('\n');

// Try progressively adding lines until it breaks
let testCode = '';
for (let i = 0; i < lines.length; i++) {
  testCode += lines[i] + '\n';
  
  // Only check after complete-looking statements or every 100 lines
  if (i % 100 === 0 || i === lines.length - 1) {
    // Wrap to avoid module-level issues
    const wrapped = `(function(){${testCode}})`;
    try {
      new Function(wrapped);
    } catch(e) {
      console.log(`Error around line ${i+1}:`, e.message);
      // Show surrounding context
      const start = Math.max(0, i - 3);
      const end = Math.min(lines.length, i + 5);
      for (let j = start; j < end; j++) {
        console.log(`  ${j+1}: ${lines[j].substring(0, 150)}`);
      }
      process.exit(0);
    }
  }
}

// If we get here, the issue is at the very end or related to export/module.exports
console.log('Checking last 20 lines...');
for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i].substring(0, 200)}`);
}
