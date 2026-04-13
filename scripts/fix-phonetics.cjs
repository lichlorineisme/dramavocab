const fs = require('fs');
let c = fs.readFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'utf8');

// Fix pattern: phonetic:'/xxx/' (extra quote at end)
let count = 0;
c = c.replace(/phonetic:'(\/[^\/]+\/)'/g, (match, p) => {
  count++;
  return `phonetic:'${p}'`;
});
console.log(`Fixed ${count} instances of trailing quote in phonetic`);

fs.writeFileSync('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', c);
