/**
 * 为 Book2/Book3 的纯中文小说生成带嵌入英语词汇的数据
 * 
 * 策略：读取中文原文 → 智能插入适合上下文的英语词汇 → 生成标准格式的para+vl
 */

const fs = require('fs');
const path = require('path');

// ====== VOCABULARY DATABASE ======
// 按主题分类的高级词汇库（SAT/GRE级别）
const VOCAB_DB = {
  // 职场/商务
  business: [
    {w:'negotiate',p:'/nɪˈɡoʊʃieɪt/',m:'v. 谈判',d:2},
    {w:'collaborate',p:'/kəˈlæbəreɪt/',m:'v. 合作',d:2},
    {w:'strategic',p:'/strəˈtiːdʒɪk/',m:'adj. 战略性的',d:3},
    {w:'initiative',p:'/ɪˈnɪʃətɪv/',m:'n. 主动权；倡议',d:3},
    {w:'proficient',p:'/prəˈfɪʃnt/',m:'adj. 熟练的',d:3},
    {w:'competent',p:'/kɑːmpɪtənt/',m:'adj. 能干的',d:2},
    {w:'hierarchy',p:'/haɪərɑːrki/',m:'n. 等级制度',d:3},
    {w:'delegate',p:'/delɪɡeɪt/',m:'v. 委派；授权',d:3},
    {w:'prioritize',p:'/praɪɔːrɪtaɪz/',m:'v. 优先处理',d:3},
    {w:'consensus',p:'/kənˈsensəs/',m:'n. 共识',d:3},
    {w:'leverage',p:'/levərɪdʒ/',m:'v./n. 利用；杠杆',d:3},
    {w:'merit',p:'/merɪt/',m:'n. 优点；价值',d:2},
    {w:'revenue',p:'/revənuː/',m:'n. 收入',d:2},
    {w:'stakeholder',p:'/steɪkhoʊldər/',m:'n. 利益相关者',d:3},
    {w:'milestone',p:'/maɪlstoʊn/',m:'n. 里程碑',d:2},
    {w:'scrutinize',p:'/skruːtənaɪz/',m:'v. 仔细审查',d:3},
    {w:'facilitate',p:'/fəˈsɪlɪteɪt/',m:'v. 促进；便利',d:3},
    {w:'optimize',p:'/ɑːptɪmaɪz/',m:'v. 优化',d:3},
    {w:'allocate',p:'/æləkeɪt/',m:'v. 分配',d:3},
    {w:'comprehensive',p:'/ˌkɑːmprɪhensɪv/',m:'adj. 全面的',d:3},
  ],
  // 情感/心理
  emotion: [
    {w:'ambiguous',p:'/æmˈbɪɡjuəs/',m:'adj. 模棱两可的',d:3},
    {w:'apprehensive',p:'/ˌæprɪhensɪv/',m:'adj. 忧虑的；不安的',d:3},
    {w:'resilient',p:'/rɪzɪliənt/',m:'adj. 有韧性的',d:3},
    {w:'melancholy',p:'/melənkɑːli/',m:'n./adj. 忧郁',d:3},
    {w:'exhilarating',p:'/ɪɡzɪləreɪtɪŋ/',m:'adj. 令人激动的',d:3},
    {w:'serene',p:'/sɪriːn/',m:'adj. 宁静的',d:2},
    {w:'reluctant',p:'/rɪlʌktənt/',m:'adj. 不情愿的',d:2},
    {w:'genuine',p:'/dʒenjuɪn/',m:'adj. 真诚的',d:2},
    {w:'subtle',p:'/sʌtl/',m:'adj. 微妙的',d:2},
    {w:'profound',p:'/prəfaʊnd/',m:'adj. 深刻的',d:3},
    {w:'overwhelmed',p:'/ˌoʊvərwelmd/',m:'adj. 不知所措的',d:3},
    {w:'indifferent',p:'/ɪndɪfrənt/',m:'adj. 冷漠的',d:2},
    {w:'sentimental',p:'/ˌsentɪmentl/',m:'adj. 多愁善感的',d:3},
    {w:'nostalgic',p:'/nɔːstældʒɪk/',m:'adj. 怀旧的',d:3},
    {w:'frustrated',p:'/frʌstreɪtɪd/',m:'adj. 沮丧的',d:2},
    {w:'intimidated',p:'/ɪntɪmɪdeɪtɪd/',m:'adj. 怯懦的',d:3},
    {w:'enthusiastic',p:'/ɪnθuːziæstɪk/',m:'adj. 热情的',d:3},
    {w:'skeptical',p:'/skeptɪkl/',m:'adj. 怀疑的',d:3},
    {w:'empathy',p:'/empəθi/',m:'n. 共情',d:2},
    {w:'resentment',p:'/rizentmənt/',m:'n. 愤慨；怨恨',d:3},
  ],
  // 动作/行为
  action: [
    {w:'hesitate',p:'/hezɪteɪt/',m:'v. 犹豫',d:2},
    {w:'ponder',p:'/pɑːndər/',m:'v. 深思',d:2},
    {w:'linger',p:'/lɪŋɡər/',m:'v. 徘徊；逗留',d:2},
    {w:'recoil',p:'/rɪkɔɪl/',m:'v. 畏缩；退缩',d:3},
    {w:'fluctuate',p:'/flʌktʃueɪt/',m:'v. 波动',d:3},
    {w:'maneuver',p:'/mənuːvər/',m:'v. 操纵； maneuvering',d:3},
    {w:'persevere',p:'/ˌpɜːrsɪvɪr/',m:'v. 坚持不懈',d:3},
    {w:'acknowledge',p:'/əknɑːlɪdʒ/',m:'v. 承认',d:2},
    {w:'anticipate',p:'/ænˈtɪsɪpeɪt/',m:'v. 预期；预料',d:3},
    {w:'compromise',p:'/kɑːmprəmaɪz/',m:'v./n. 妥协',d:2},
    {w:'encounter',p:'/ɪnkaʊntər/',m:'v./n. 遭遇',d:2},
    {w:'demonstrate',p:'/demənstreɪt/',m:'v. 展示；证明',d:2},
    {w:'accumulate',p:'/əkjuːmjəleɪt/',m:'v. 积累',d:3},
    {w:'transform',p:'/trænsfɔːrm/',m:'v. 转变',d:2},
    {w:'cultivate',p:'/kʌltɪveɪt/',m:'v. 培养',d:3},
    {w:'articulate',p:'/ɑːrtɪkjuleɪt/',m:'v. 清晰表达',d:3},
    {w:'navigate',p:'/nævɪɡeɪt/',m:'v. 导航；应对',d:2},
    {w:'accommodate',p:'/əkɑːmədeɪt/',m:'v. 容纳；适应',d:3},
    {w:'stimulate',p:'/stɪmjuleɪt/',m:'v. 刺激',d:3},
    {w:'eliminate',p:'/ɪlɪmɪneɪt/',m:'v. 消除',d:2},
  ],
  // 描述/状态
  description: [
    {w:'meticulous',p:'/məˈtɪkjələs/',m:'adj. 一丝不苟的',d:3},
    {w:'extravagant',p:'/ɪkstrævəɡənt/',m:'adj. 奢侈的',d:3},
    {w:'intricate',p:'/ɪntrɪkət/',m:'adj. 复杂精细的',d:3},
    {w:'impeccable',p:'/ɪmpekəbl/',m:'adj. 无可挑剔的',d:3},
    {w:'coherent',p:'/koʊhɪrənt/',m:'adj. 连贯的',d:3},
    {w:'spontaneous',p:'/spɑːnteɪniəs/',m:'adj. 自发的',d:3},
    {w:'inevitable',p:'/ɪnevɪtəbl/',m:'adj. 不可避免的',d:3},
    {w:'precarious',p:'/prɪkeriəs/',m:'adj. 不稳固的',d:3},
    {w:'abundant',p:'/əbʌndənt/',m:'adj. 丰富的',d:2},
    {w:'distinctive',p:'/dɪstɪŋktɪv/',m:'adj. 独特的',d:3},
    {w:'versatile',p:'/vɜːrsətl/',m:'adj. 多才多艺的',d:3},
    {w:'exceptional',p:'/ɪksepʃənl/',m:'adj. 卓越的',d:3},
    {w:'adequate',p:'/ædɪkwət/',m:'adj. 充分的',d:2},
    {w:'temporary',p:'/tempreri/',m:'adj. 临时的',d:2},
    {w:'crucial',p:'/kruːʃl/',m:'adj. 关键的',d:2},
    {w:'prominent',p:'/prɑːmɪnənt/',m:'adj. 显著的',d:3},
    {w:'notorious',p:'/noʊtɔːriəs/',m:'adj. 臭名昭著的',d:3},
    {w:'mundane',p:'/mʌndeɪn/',m:'adj. 平凡的',d:3},
    {w:'spectacular',p:'/spektækjələr/',m:'adj. 壮观的',d:3},
    {w:'deteriorate',p:'/dɪtɪriəreɪt/',m:'v. 恶化',d:3},
  ],
  // 人际关系
  relationship: [
    {w:'rapport',p:'/ræpɔːr/',m:'n. 融洽关系',d:3},
    {w:'affection',p:'/əfekʃn/',m:'n. 喜爱；感情',d:2},
    {w:'loyalty',p:'/lɔɪəlti/',m:'n. 忠诚',d:2},
    {w:'intimacy',p:'/ɪntɪməsi/',m:'n. 亲密',d:2},
    {w:'betrayal',p:'/bɪtreɪəl/',m:'n. 背叛',d:2},
    {w:'reconcile',p:'/rekənsaɪl/',m:'v. 和解',d:3},
    {w:'sympathetic',p:'/ˌsɪmpəθetɪk/',m:'adj. 同情的',d:3},
    {w:'condescending',p:'/ˌkɑːndɪsendɪŋ/',m:'adj. 居高临下的',d:3},
    {w:'amicable',p:'/æmɪkəbl/',m:'adj. 友好的',d:3},
    {w:'hostile',p:'/hɑːstaɪl/',m:'adj. 敌对的',d:2},
    {w:'gracious',p:'/greɪʃəs/',m:'adj. 优雅的；亲切的',d:3},
    {w:'courteous',p:'/kɜːrtiəs/',m:'adj. 有礼貌的',d:3},
    {w:'aloof',p:'/luːf/',m:'adj. 冷漠疏远的',d:3},
    {w:'transparent',p:'/trænspærənt/',m:'adj. 坦诚的；透明的',d:2},
    {w:'mutual',p:'/mjuːtʃuəl/',m:'adj. 相互的',d:2},
    {w:'confide',p:'/kənfaid/',m:'v. 吐露(秘密)',d:3},
    {w:'dominate',p:'/dɑːmɪneɪt/',m:'v. 支配',d:2},
    {w:'influence',p:'/ɪnfluəns/',m:'v./n. 影响',d:2},
    {w:'persuade',p:'/pərsweɪd/',m:'v. 说服',d:2},
    {w:'alienation',p:'/ˌeɪliəneɪʃn/',m:'n. 疏远',d:3},
  ],
};

// Flatten all vocab into one array for random selection
const ALL_VOCAB = Object.values(VOCAB_DB).flat();

// ====== SENTENCE ANALYSIS & VOCAB INSERTION ======

// Keywords that suggest which category to use
const CATEGORY_KEYWORDS = {
  business: ['工作','会议','项目','公司','合同','谈判','报告','客户','老板','同事','部门','方案','预算','业绩','升职','面试','薪资','办公室','文件','签字','审批','任务','KPI','汇报','流程'],
  emotion: ['心情','感觉','情绪','紧张','开心','难过','担心','害怕','期待','失望','愤怒','感动','心跳','脸红','眼泪','微笑','叹息','犹豫','忐忑','不安','温暖','冷漠','激动','平静','慌乱'],
  action: ['走','跑','站','坐','看','听','说','想','做','拿','放','打开','关上','转身','回头','伸手','点头','摇头','走进','离开','等待','跟随','停下','拿起','放下','拿出','收起','整理','检查','翻找'],
  description: ['漂亮','好看','丑陋','高大','瘦小','明亮','黑暗','安静','吵闹','干净','整洁','凌乱','复杂','简单','特殊','普通','重要','紧急','危险','安全','舒适','难受','奇怪','明显','隐蔽'],
  relationship: ['朋友','敌人','同事','上级','下属','恋人','夫妻','家人','陌生人','关系','感情','信任','怀疑','尊重','讨厌','喜欢','爱','恨','亲密','疏远','冷淡','热情','讨好','对抗','合作'],
};

function detectCategory(text) {
  let scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter(k => text.includes(k)).length;
  }
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  return sorted[0][0] === 'action' && sorted[0][1] < 2 ? 'emotion' : sorted[0][0];
}

function pickVocab(category, usedWords, count=1) {
  const pool = VOCAB_DB[category] || ALL_VOCAB;
  const available = pool.filter(v => !usedWords.has(v.w));
  if (available.length < count) return [];
  
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ====== PARAGRAPH PROCESSING ======
function processChapter(novelText, chNum, title) {
  const usedWords = new Set();
  const paras = [];
  const vlEntries = [];
  
  // Split into paragraphs
  const paragraphs = novelText.split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => 
      p.length > 15 && 
      p.length < 500 &&
      !p.startsWith('#') && 
      !p.startsWith('>') && 
      !p.startsWith('---') &&
      !p.startsWith('*') &&
      !p.startsWith('|') &&
      !/^[\【\[]/.test(p)
    );
  
  let insertedCount = 0;
  const targetInsertions = Math.min(40, Math.floor(paragraphs.length * 0.6)); // ~60% of paragraphs get a word
  
  for (let i = 0; i < paragraphs.length && insertedCount < targetInsertions; i++) {
    const rawPara = paragraphs[i];
    
    // Skip dialogue-heavy paragraphs (too many quotes)
    const quoteCount = (rawPara.match(/"/g) || []).length;
    if (quoteCount > 4) continue;
    
    // Detect context category
    const category = detectCategory(rawPara);
    
    // Pick 1-2 vocab words for this paragraph
    const newVocab = pickVocab(category, usedWords, Math.random() > 0.7 ? 2 : 1);
    if (newVocab.length === 0) continue; // ran out of unique words
    
    // Find insertion points - replace Chinese descriptive words/phrases
    let processed = rawPara;
    const insertionPoints = [];
    
    // Strategy: find adjectives/adverbs and replace them
    const patterns = [
      /很([^\n，。！？]{1,4})/g,  // 很XXX
      /非常([^\n，。！？]{1,4})/g,  // 非常XXX  
      /特别([^\n，。！？]{1,4})/g,  // 特别XXX
      /(十分?)([^\n，。！？]{1,4})/g, // 十分XXX
      /格外([^\n，。！？]{1,4})/g,  // 格外XXX
      /相当([^\n，。！？]{1,4})/g,  // 相当XXX
      /(一?直)([^\n，。！？]{1,3})/g,
    ];
    
    let matchIdx = 0;
    for (const pat of patterns) {
      let m;
      pat.lastIndex = 0;
      while ((m = pat.exec(processed)) !== null && matchIdx < newVocab.length) {
        const v = newVocab[matchIdx++];
        const fullMatch = m[0];
        const pos = processed.indexOf(fullMatch, m.index); // find actual position
        
        if (pos > -1) {
          // Replace Chinese modifier with English word
          processed = processed.substring(0, pos) + v.w + processed.substring(pos + fullMatch.length);
          
          // Record for tr version
          insertionPoints.push({
            engWord: v.w,
            origText: fullMatch,
            pos: pos
          });
          
          // Add to VL
          usedWords.add(v.w);
          vlEntries.push({
            w: v.w,
            p: v.p,
            m: v.m,
            x: processed.substring(Math.max(0,pos-10), Math.min(processed.length, pos+v.w.length+10)).replace(/\n/g,' ').substring(0,40),
            d: v.d
          });
          break; // only one replacement per pattern per paragraph
        }
      }
      
      if (matchIdx >= newVocab.length) break;
    }
    
    // If no insertion found via patterns, try direct insertion after punctuation
    if (insertionPoints.length === 0 && newVocab.length > 0) {
      const v = newVocab[0];
      // Find first sentence end and append
      const sentEnd = processed.match(/[。！？]/);
      if (sentEnd) {
        const insertPos = sentEnd.index + 1;
        processed = processed.substring(0, insertPos) + ` 这种感觉真是${v.w}` + processed.substring(insertPos);
        
        usedWords.add(v.w);
        vlEntries.push({
          w: v.w, p: v.p, m: v.m,
          x: processed.substring(Math.max(0,insertPos-5), Math.min(processed.length, insertPos+v.w.length+8)).replace(/\n/g,' ').substring(0,45),
          d: v.d
        });
        insertionPoints.push({engWord: v.w});
      }
    }
    
    if (insertionPoints.length > 0) {
      insertedCount += insertionPoints.length;
      
      // Build tr version: replace eng words with [__]
      let tr = processed;
      for (const ip of insertionPoints) {
        tr = tr.replace(ip.engWord, '[__]');
      }
      
      // Escape single quotes
      const escRaw = processed.replace(/'/g, "\\'").substring(0, 400);
      const escTr = tr.replace(/'/g, "\\'").substring(0, 400);
      
      paras.push(`{raw:'${escRaw}',tr:'${escTr}'}`);
    }
  }
  
  console.log(`  Inserted ${insertedCount} vocab into ${paragraphs.length} paragraphs`);
  return { paras, vlEntries };
}

// ====== CHAPTER BUILDER ======
function buildChapter(chNum, title, novelPath) {
  const novelText = fs.readFileSync(novelPath, 'utf-8');
  
  console.log(`\n📖 Ch${String(chNum).padStart(2,'0')} ${title}`);
  const { paras, vlEntries } = processChapter(novelText, chNum, title);
  
  if (vlEntries.length < 5) {
    console.log(`  ⚠️ Too few entries (${vlEntries.length}), skipping`);
    return null;
  }
  
  // Build VL string
  const vlLines = vlEntries.map(e => {
    const escM = e.m.replace(/'/g, "\\'");
    const escX = e.x.replace(/'/g, "\\'");
    return `      {word:'${e.w}',phonetic:'${e.p}',meaning:'${escM}',ex:'${escX}',diff:${e.d},syn:''}`;
  });
  
  // Build para string (limit to 25 entries max)
  const paraStr = paras.length > 0
    ? '[\n      ' + paras.slice(0, 25).join(',\n      ') + '\n    ]'
    : "[]";
  
  const stitle = `Ch${chNum} ${title}`;
  
  return `  {
    id: 'ch${String(chNum).padStart(2,'0')}',
    title: '${title}',
    stitle: '${stitle}',
    para: ${paraStr},
    vl: [
${vlLines.join(',\n')}
    ]
  }`;
}

// ====== MAIN ======
const DATA_FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';

console.log('=== BOOK2/BOOK3 Data Generator ===');
console.log('Processing Book2 (NPC逆袭)...\n');

// Process Book2 chapters 03-20
const book2Dir = '/Users/ccc/WorkBuddy/vibecoding/novels/book2-NPC的逆袭';
const book2Files = fs.readdirSync(book2Dir).filter(f => f.endsWith('.md') && f.startsWith('第')).sort();
const book2Chapters = [];

for (const nf of book2Files) {
  const chMatch = nf.match(/第(\d+)章-(.+?)\.md/);
  if (!chMatch) continue;
  const chNum = parseInt(chMatch[1]);
  if (chNum <= 2) continue; // Already exist
  
  const chObj = buildChapter(chNum, chMatch[2], path.join(book2Dir, nf));
  if (chObj) book2Chapters.push({ num: chNum, obj: chObj });
}

console.log(`\n\n=== Generated ${book2Chapters.length} Book2 chapters ===`);

// ========== BOOK3 PROCESSING ==========
console.log('\n\nProcessing Book3 (女王归来)...\n');

const book3Dir = '/Users/ccc/WorkBuddy/vibecoding/novels/book3-女王归来';
let book3Files;
try {
  book3Files = fs.readdirSync(book3Dir).filter(f => f.endsWith('.md') && f.startsWith('第')).sort();
} catch(e) {
  console.log('Book3 directory not found, skipping.');
  book3Files = [];
}

// Check which BOOK3 chapters already exist
const existingCh3 = [];
try {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  const b3Start = data.indexOf('NOVEL_DATA_BOOK3');
  if (b3Start > -1) {
    let cm; const re = /id:\s*'ch(\d+)'/g;
    re.lastIndex = b3Start;
    while ((cm = re.exec(data)) !== null) { existingCh3.push(parseInt(cm[1])); }
  }
} catch(e) {}
console.log(`Existing Book3 chapters: ${existingCh3}`);

const book3Chapters = [];
for (const nf of book3Files) {
  // Handle special case: "16-20章-大结局.md" contains multiple chapters
  if (nf.includes('16-20')) {
    const chObj = buildChapter(16, '大结局(上)', path.join(book3Dir, nf));
    if (chObj) { chObj.id_override = 'ch16'; book3Chapters.push({ num: 16, obj: chObj }); }
    continue;
  }
  
  const chMatch = nf.match(/第(\d+)章-(.+?)\.md/);
  if (!chMatch) continue;
  const chNum = parseInt(chMatch[1]);
  if (existingCh3.includes(chNum)) continue; // Already exists
  
  const chObj = buildChapter(chNum, chMatch[2], path.join(book3Dir, nf));
  if (chObj) book3Chapters.push({ num: chNum, obj: chObj });
}

console.log(`\n\n=== Generated ${book3Chapters.length} Book3 chapters ===`);
const allNewChapters = [...book2Chapters, ...book3Chapters];

// Write BOOK2 chapters into existing BOOK2 array
if (book2Chapters.length > 0) {
  let data = fs.readFileSync(DATA_FILE, 'utf8');
  const b2Start = data.indexOf('const NOVEL_DATA_BOOK2');
  let insertPos = -1;
  if (b2Start > -1) {
    const afterB2 = data.substring(b2Start);
    const lastBracket = afterB2.lastIndexOf('];');
    if (lastBracket > -1) { insertPos = b2Start + lastBracket + 1; }
  }
  
  if (insertPos > -1) {
    book2Chapters.sort((a,b) => a.num - b.num);
    const before = data.substring(0, insertPos);
    const suffix = data.substring(insertPos).trim();
    
    const newContent = before + ',\n\n' + book2Chapters.map(c => c.obj).join(',\n\n') + '\n  ' + suffix;
    fs.writeFileSync(DATA_FILE, newContent);
    console.log('\n✅ Book2 data written!');
  } else {
    console.error('Could not find BOOK2 array end position!');
  }
}

// Create BOOK3 data block if there are chapters
if (book3Chapters.length > 0) {
  let data = fs.readFileSync(DATA_FILE, 'utf8');
  
  // Check if NOVEL_DATA_BOOK3 already exists
  if (!data.includes('NOVEL_DATA_BOOK3')) {
    // Need to create the BOOK3 constant
    book3Chapters.sort((a,b) => a.num - b.num);
    const book3Data = `

// ====== BOOK3 DATA: 《寒光破晓：女王归来》======
const NOVEL_DATA_BOOK3 = [
${book3Chapters.map(c => c.obj).join(',\n\n')}
];

export { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2, NOVEL_DATA_BOOK3 }

if(typeof module!=="undefined"&&module.exports){
  module.exports={NOVEL_DATA_BOOK1,NOVEL_DATA_BOOK2,NOVEL_DATA_BOOK3}
}`;
    
    // Replace the old export block with the new one including BOOK3
    const oldExportStart = data.lastIndexOf('export {');
    if (oldExportStart > -1) {
      data = data.substring(0, oldExportStart) + book3Data;
      fs.writeFileSync(DATA_FILE, data);
      console.log('\n✅ Book3 data written (new block)!');
    }
  } else {
    // Insert into existing BOOK3 array (similar to BOOK2)
    const b3Start = data.indexOf('NOVEL_DATA_BOOK3');
    let insertPos = -1;
    if (b3Start > -1) {
      const afterB3 = data.substring(b3Start);
      const lastBracket = afterB3.lastIndexOf('];');
      if (lastBracket > -1) { insertPos = b3Start + lastBracket + 1; }
    }
    
    if (insertPos > -1) {
      book3Chapters.sort((a,b) => a.num - b.num);
      const before = data.substring(0, insertPos);
      const suffix = data.substring(insertPos).trim();
      
      const newContent = before + ',\n\n' + book3Chapters.map(c => c.obj).join(',\n\n') + '\n  ' + suffix;
      fs.writeFileSync(DATA_FILE, newContent);
      console.log('\n✅ Book3 data written (appended to existing)!');
    }
  }
} else {
  console.log('No new Book3 chapters to add.');
}

// Verify total
const finalData = fs.readFileSync(DATA_FILE, 'utf8');
const totalCh = (finalData.match(/id:\s*'ch\d+'/g) || []).length;
console.log(`\nTotal chapters in file now: ${totalCh}`);

try {
  // Basic syntax check
  const bracketCount = (finalData.match(/\[/g) || []).length;
  const closeBracketCount = (finalData.match(/\]/g) || []).length;
  console.log(`Brackets: [=${bracketCount} ]=${closeBracketCount} ${bracketCount===closeBracketCount?'✅':'⚠️ MISMATCH'}`);
} catch(e) {}
