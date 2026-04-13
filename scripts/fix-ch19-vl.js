#!/usr/bin/env node
const fs = require('fs');
let c = fs.readFileSync('src/stores/novel-data.js', 'utf8');

// Find exact boundaries of ch19 vl array
const ch19Id = c.indexOf("id: 'ch19'");
const beforeVl = c.substring(0, c.indexOf('vl:', ch19Id));
const afterMarker = "'],\n  },";
const afterVlStart = c.indexOf(afterMarker, ch19Id) + afterMarker.length;

const prefix = beforeVl + "vl:\n[";
const suffix = "\n  },\n" + c.substring(afterVlStart);

// Build clean ch19 vl from novel source
const novelPath = '/Users/ccc/WorkBuddy/vibecoding/novels/book1-契约成瘾/第19章-夜谈.md';
const novel = fs.readFileSync(novelPath, 'utf-8');

const wordRegex = /<span class="word-highlight">\*\*(\w[\w'\s-]*\*)\*<\/span>\*（([^）]+)）/g;
let match;
const words = [];
while ((match = wordRegex.exec(novel)) !== null) {
  const w = match[1].trim();
  const pm = match[2].split('/');
  const phonetic = pm[0] || '';
  const meaningPart = pm.slice(1).trim();
  
  if (words.some(x => x.word === w)) continue;
  
  const startIdx = Math.max(0, match.index - 40);
  const endIdx = Math.min(novel.length, match.index + match[0].length + 60);
  const ctx = novel.substring(startIdx, endIdx).replace(/\n/g, ' ').replace(/\r/g, '').replace(/'/g, "\\'");
  
  const diff = meaningPart.includes('phr.') ? 1 : meaningPart.match(/[a-z]{6,}/i) ? 3 : 2;
  
  words.push({ word: w, phonetic: phonetic.replace(/^\/|\/$/g, ''), meaning: meaningPart, ex: ctx.replace(/\s+/g, ' ').substring(0, 50), diff: diff, syn: '' });
}

console.log('Extracted', words.length, 'words from ch19 novel');

const vlLines = words.map((w, i) => 
  `      {word:'${w.word}',phonetic:'${w.phonetic}',meaning:'${w.meaning}',ex:'${w.ex}',diff:${w.diff},syn:''}`
).join(',\n');

const newContent = prefix + '\n' + vlLines + '\n]' + suffix;
fs.writeFileSync('src/stores/novel-data.js', newContent);
console.log('Written', words.length, 'entries to ch19 vl');

// Verify parse
const testFn = new Function('return (' + 
  '[' + words.map(w => `{word:"${w.word}",phonetic:"${w.phonetic}",meaning:"${w.meaning}",ex:"${w.ex}",diff:${w.diff},syn:""}`).join(',')) + ']'
);
testFn();
console.log('OK - ch19 vl has', words.length, 'clean entries');
