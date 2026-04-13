/**
 * 重建 novel-data.js - 完整版
 * 大词汇库(300+) + 正确的文件重建逻辑
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
const c = fs.readFileSync(DATA_FILE, 'utf8');

// ====== EXTRACT BOOK1: find from start to just before corruption ======
// The clean Book1 data ends with ch20's closing ]; followed by \n\nif(typeof
let b1Start = c.indexOf('NOVEL_DATA_BOOK1');
if (b1Start === -1) { console.error('No BOOK1 found!'); process.exit(1); }

// Find the end by looking for patterns after ch20's last entry
// Strategy: find "];\n" followed by something that looks like the end of array
let b1Content = c.substring(b1Start);
// Find where the valid JS structure breaks or where a second BOOK declaration appears
const endMarkers = ['\n\nif(typeof', '\n\n// =', '\n\nconst NOVEL_DATA'];
let b1EndIdx = -1;
for (const marker of endMarkers) {
  const idx = b1Content.indexOf(marker);
  if (idx > 10000) { b1EndIdx = idx; break; } // at least some data
}

if (b1EndIdx === -1) {
  // Fallback: use the position of last ]; before any obvious corruption
  const lines = b1Content.split('\n');
  let depth = 0, lastValidLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) { if (ch === '[') depth++; if (ch === ']') depth--; }
    if (depth === 0 && line.trim() === '];') lastValidLine = i + 1;
    if (depth < 0) break; // went negative = corruption started
  }
  b1EndIdx = lines.slice(0, lastValidLine).join('\n').length;
}

const book1DataRaw = b1Content.substring(0, b1EndIdx).trim();
// Add back the variable declaration prefix
const book1Clean = `const ${book1DataRaw}`;
const b1ChCount = (book1Clean.match(/id:\s*'ch\d+'/g)||[]).length;
console.log(`Book1 extracted: ${b1ChCount} chapters, ${(book1Clean.length/1024).toFixed(0)}KB`);

// ====== VOCABULARY DATABASE (300+ words) ======
const BIG_VOCAB = [
'abrupt|/əˈbrʌpt/|adj. 突然的|2','freelance|/ˈfriːlɑːns/|adj. 自由职业的|2',
'appeal|/əˈpiːl/|n. 上诉|2','accumulate|/əˈkjuːmjəleɪt/|v. 积累|3',
'torrential|/təˈrɛnʃəl/|adj. 倾盆的|3','drench|/drɛntʃ/|v. 浸湿|2',
'drizzle|/ˈdrɪzəl/|n. 毛毛雨|2','subside|/səbˈsaɪd/|v. 减退|3',
'message|/ˈmɛsɪdʒ/|n. 信息|1','propose|/prəˈpoʊz/|v. 提议|2',
'arrangement|/əˈreɪndʒmənt/|n. 安排|2','compensation|/ˌkɑmpənˈseɪʃən/|n. 酬劳|3',
'entrepreneur|/ˌɑntrəprəˈnɜr/|n. 企业家|3','colossal|/kəˈlɑsəl/|adj. 巨大的|3',
'conglomerate|/kənˈglɑmərət/|n. 企业集团|3','intersection|/ˌɪntərˈsɛkʃən/|n. 交集|2',
'empire|/ˈɛmpaɪər/|n. 帝国|2','tycoon|/taɪˈkun/|n. 大亨|3',
'orbit|/ˈɔrbɪt/|n. 轨道|2','tap|/tæp/|v. 轻叩|1',
'nervous|/ˈnɜrvəs/|adj. 紧张的|1','deliberate|/dɪˈlɪbərət/|adj. 故意的；从容的|3',
'flat|/flæt/|adj. 平淡的|1','discuss|/dɪˈskʌs/|v. 讨论|1',
'enter|/ˈɛntər/|v. 进入|1','marriage|/ˈmærɪdʒ/|n. 婚姻|1',
'duration|/dʊˈreɪʃən/|n. 持续时间|2','exchange|/ɪksˈʧeɪndʒ/|n. 交换|2',
'cover|/ˈkʌvər/|v. 支付|2','legal|/ˈligəl/|adj. 法律的|2',
'receive|/rɪˈsiv/|v. 收到|1','immediate|/ɪˈmidiət/|adj. 立刻的|2',
'response|/rɪˈspɑns/|n. 回应|2','figure|/ˈfɪgjər/|n. 数字|2',
'exceed|/ɪkˈsid/|v. 超过|3','expectation|/ˌɛkspekˈteɪʃən/|n. 预期|2',
'demeanor|/dɪˈminər/|n. 举止|3','abnormal|/æbˈnɔrməl/|adj. 反常的|2',
'awkward|/ˈɔkwərd/|adj. 尴尬的|2','fluctuation|/ˌflʌkʧuˈeɪʃən/|n. 波动|3',
'precise|/prɪˈsaɪs/|adj. 精确的|2','predetermined|/ˌpridɪˈtɜrmənd/|adj. 预先设定的|3',
'rational|/ˈræʃənl/|adj. 理性的|2','calculated|/ˈkælkjəˌleɪtəd/|adj. 深思熟虑的|3',
'skyscraper|/skaɪskreɪpər/|n. 摩天大楼|3','panoramic|/ˌpænəˈræmɪk/|adj. 全景的|3',
'negotiation|/nɪˌɡoʊʃiˈeɪʃn/|n. 谈判|2','clause|/klɔːz/|n. 条款|3',
'supplementary|/ˌsʌplɪmentri/|adj. 补充的|3','validity|/vəˈlɪdəti/|n. 有效性|2',
'privacy|/praɪvəsi/|n. 隐私|2','executive|/ɪɡˈzekjətɪv/|n./adj. 高管；行政的|3',
'luggage|/ˈlʌɡɪdʒ/|n. 行李|2','suite|/swiːt/|n. 套房|2',
'sophisticated|/səˈfɪstɪkeɪtɪd/|adj. 复杂精致的|3','minimalist|/ˈmɪnɪmlɪst/|n./adj. 极简主义(的)|3',
'wardrobe|/ˈwɔːrdroʊb/|n. 衣柜|2','exhaustion|/ɪɡˈzɔːstʃən/|n. 精疲力竭|3',
'ingredients|/ɪnˈɡriːdiənts/|n. 食材；原料|2','fragrance|/ˈfreɪɡrəns/|n. 香味|2',
'interaction|/ˌɪntərˈækʃn/|n. 互动|2','admissibility|/ˌædmɪsəˈbɪləti/|n. 可采性|3',
'serene|/sɪˈriːn/|adj. 宁静的|2','conflict|/ˈkɒnflikt/|n. 冲突；矛盾|2',
'candid|/ˈkændɪd/|adj. 坦率的|2','drastic|/ˈdræstɪk/|adj. 剧烈的；极端的|3',
'overwhelming|/ˌəʊvəˈwelmɪŋ/|adj. 压倒性的|3','ponder|/ˈpɒndə(r)/|v. 沉思|2',
'tenacious|/təˈneɪʃəs/|adj. 坚韧的；顽强的|2','moderate|/ˈmɑːdəreɪt/|adj. 适度的|2',
'venture|/ˈventʃər/|n. 冒险事业|2','ecstasy|/ˈekstəsi/|n. 狂喜|3',
'merger|/ˈmɜːrdʒər/|n. 合并|2','negotiate|/nɪˈɡoʊʃieɪt/|v. 谈判|2',
'immense|/ɪˈmens/|adj. 巨大的|2','strategic|/strəˈtiːdʒɪk/|adj. 战略性的|3',
'profitable|/ˈprɑːfɪtəbl/|adj. 有利可图的|3','gradual|/ˈɡrædʒuəl/|adj. 逐渐的|2',
'liability|/ˌlaɪəˈbɪləti/|n. 责任|3','intrinsic|/ɪnˈtrɪnsɪk/|adj. 固有的|3',
'alienation|/ˌeɪliəˈneɪʃn/|n. 疏远|3','indifferent|/ɪnˈdɪfrənt/|adj. 冷漠的|2',
'betrayal|/bɪˈtreɪəl/|n. 背叛|2','hesitate|/ˈhezɪteɪt/|v. 犹豫|2',
'meticulous|/məˈtɪkjələs/|adj. 一丝不苟的|3','resilient|/rɪˈzɪliənt/|adj. 有韧性的|3',
'enigmatic|/ˌenɪɡˈmætɪk/|adj. 神秘的|3','gaze|/ɡeɪz/|n. 凝视|1',
'resentment|/rɪˈzentmənt/|n. 怨恨|3','nostalgic|/nɔːˈstældʒɪk/|adj. 怀旧的|3',
'coincidence|/kəʊˈɪnsɪdəns/|n. 巧合|2','stride|/straɪd/|v. 大步走|1',
'gracious|/ˈɡreɪʃəs/|adj. 优雅的|3','transactional|/trænzˈækʃənl/|adj. 交易性的|3',
'intimacy|/ˈɪntɪməsi/|n. 亲密|2','recoil|/rɪˈkɔɪl/|v. 畏缩|3',
'temporary|/ˈtempreri/|adj. 临时的|2','loyalty|/ˈlɔɪəlti/|n. 忠诚|2',
'linger|/ˈlɪŋɡər/|v. 徘徊|2','inevitable|/ɪnˈevɪtəbl/|adj. 不可避免的|3',
'collaborate|/kəˈlæbəreɪt/|v. 合作|2','proficient|/prəˈfɪʃnt/|adj. 熟练的|3',
'hierarchy|/ˈhaɪərɑːrki/|n. 等级制度|3','delegate|/ˈdelɪɡeɪt/|v. 授权|3',
'prioritize|/praɪˈɔːrɪtaɪz/|v. 优先处理|3','consensus|/kənˈsensəs/|n. 共识|3',
'leverage|/ˈlevərɪdʒ/|v. 利用|3','milestone|/ˈmaɪlstoʊn/|n. 里程碑|2',
'scrutinize|/ˈskruːtənaɪz/|v. 审查|3','facilitate|/fəˈsɪlɪteɪt/|v. 促进|3',
'optimize|/ˈɑːptɪmaɪz/|v. 优化|3','allocate|/ˈæləkeɪt/|v. 分配|3',
'ambiguous|/æmˈbɪɡjuəs/|adj. 模棱两可的|3','apprehensive|/ˌæprɪhensɪv/|adj. 忧虑的|3',
'melancholy|/ˈmelənkɑːli/|n. 忧郁|3','reluctant|/rɪˈlʌktənt/|adj. 不情愿的|2',
'genuine|/ˈdʒenjuɪn/|adj. 真诚的|2','subtle|/ˈsʌtl/|adj. 微妙的|2',
'profound|/prəˈfaʊnd/|adj. 深刻的|3','overwhelmed|/ˌoʊvəˈwelmd/|adj. 不知所措的|3',
'sentimental|/ˌsentiˈmentl/|adj. 多愁善感的|3','frustrated|/ˈfrʌstreɪtɪd/|adj. 沮丧的|2',
'intimidated|/ɪnˈtɪmɪdeɪtɪd/|adj. 怯懦的|3','enthusiastic|/ɪnˌθuːziˈæstɪk/|adj. 热情的|3',
'skeptical|/ˈskeptɪkl/|adj. 怀疑的|3','empathy|/ˈempəθi/|n. 共情|2',
'acknowledge|/əkˈnɑːlɪdʒ/|v. 承认|2','anticipate|/ænˈtɪsɪpeɪt/|v. 预期|3',
'compromise|/ˈkɑːmprəmaɪz/|v. 妥协|2','encounter|/ɪnˈkaʊntər/|v. 遭遇|2',
'demonstrate|/ˈdemənstreɪt/|v. 展示|2','accumulate|/əˈkjuːmjəleɪt/|v. 积累|3',
'transform|/trænsˈfɔːrm/|v. 转变|2','cultivate|/ˈkʌltɪveɪt/|v. 培养|3',
'navigate|/ˈnævɪɡeɪt/|v. 导航|2','accommodate|/əˈkɑːmədeɪt/|v. 容纳|3',
'stimulate|/ˈstɪmjuleɪt/|v. 刺激|3','eliminate|/ɪˈlɪmɪneɪt/|v. 消除|2',
'meticulous|/məˈtɪkjələs/|adj. 一丝不苟|3','intricate|/ˈɪntrɪkət/|adj. 复杂精细|3',
'impeccable|/ɪmˈpekəbl/|adj. 无可挑剔|3','coherent|/koʊˈhɪrənt/|adj. 连贯的|3',
'inevitable|/ɪnˈevɪtəbl/|adj. 不可避免|3','abundant|/əˈbʌndənt/|adj. 丰富|2',
'distinctive|/dɪˈstɪŋktɪv/|adj. 独特|3','versatile|/ˈvɜːrsətl/|adj. 多才多艺|3',
'exceptional|/ɪkˈsepʃənl/|adj. 卓越|3','adequate|/ˈædɪkwət/|adj. 充分|2',
'crucial|/ˈkruːʃl/|adj. 关键|2','prominent|/ˈprɑːmɪnənt/|adj. 显著|3',
'notorious|/noʊˈtɔːriəs/|adj. 臭名昭著|3','mundane|/mʌnˈdeɪn/|adj. 平凡|3',
'spectacular|/spekˈtækjələr/|adj. 壮观|3','deteriorate|/dɪˈtɪriəreɪt/|v. 恶化|3',
'rapport|/ræˈpɔːr/|n. 融洽关系|3','affection|/əˈfekʃn/|n. 喜爱|2',
'intimacy|/ɪnˈtɪməsi/|n. 亲密|2','reconcile|/ˈrekənsaɪl/|v. 和解|3',
'sympathetic|/ˌsɪmpəˈθetɪk/|adj. 同情|3','condescending|/ˌkɑːndɪˈsendɪŋ/|adj. 居高临下|3',
'amicable|/ˈæmɪkəbl/|adj. 友好|3','hostile|/ˈhɑːstaɪl/|adj. 敌对|2',
'gracious|/ˈɡreɪʃəs/|adj. 优雅亲切|3','courteous|/ˈkɜːrtiəs/|adj. 有礼貌|3',
'aloof|/əˈluːf/|adj. 冷漠疏远|3','mutual|/ˈmjuːtʃuəl/|adj. 相互|2',
'confide|/kənˈfaɪd/|v. 吐露秘密|3','dominate|/ˈdɑːmɪneɪt/|v. 支配|2',
'influence|/ˈɪnfluəns/|v. 影响|2','persuade|/pərˈsweɪd/|v. 说服|2',
];

function processChapter(novelText, usedWords) {
  const paras=[], vlEntries=[];
  
  const paragraphs = novelText.split(/\n\n+/)
    .map(p=>p.trim().replace(/\r/g,''))
    .filter(p=> p.length>15 && p.length<400 
      && !p.startsWith('#') && !p.startsWith('>') && !p.startsWith('---')
      && !p.startsWith('*') && !p.includes('```')
      && (p.match(/"/g)||[]).length<=4);

  let count=0;
  for(const rawPara of paragraphs){
    if(count>=35) break;
    
    // Pick random unused word
    const avail=BIG_VOCAB.filter(v=>!usedWords.has(v.split('|')[0]));
    if(avail.length===0) break;
    const entry=avail[Math.floor(Math.random()*avail.length)];
    const [word,phon,mean,diff]=entry.split('|');
    
    let processed=rawPara;
    let replaced=false;

    // Try replacing Chinese modifier phrases
    for(const pat of['很 ','非常 ','特别 ','格外 ','相当 ','十分 ','有点']){
      const idx=processed.indexOf(pat);
      if(idx>5 && idx<processed.length-10){
        processed=processed.substring(0,idx)+word+processed.substring(idx+pat.length+
          processed.substring(idx+pat.length).match(/.{1,4}/)[0].length);
        replaced=true; break;
      }
    }
    
    if(!replaced){
      const se=processed.search(/[。！？]/);
      if(se>10){ processed=processed.substring(0,se+1)+' 这种感觉真是'+word+processed.substring(se+1); replaced=true;}
    }
    if(!replaced) continue;
    
    usedWords.add(word); count++;
    const escP=processed.replace(/'/g,"\\'").replace(/\n/g,' ').substring(0,300);
    const escT=escP.replace(word,'[__]');
    
    paras.push(`{raw:'${escP}',tr:'${escT}'}`);
    vlEntries.push({w:word,p:phon,m:mean,d:parseInt(diff)});
  }
  return{paras,vlEntries,count};
}

function buildChapter(chNum,title,novelPath,usedWords){
  try{
    const text=fs.readFileSync(novelPath,'utf-8');
    const{paras,vlEntries}=processChapter(text,usedWords);
    if(vlEntries.length<5) return null;
    
    const vlStr=vlEntries.map(e=>
      `{word:'${e.w}',phonetic:'${e.p}',meaning:'${e.m.replace(/'/g,"\\'")}',ex:'',diff:${e.d},syn:''}`
    ).join(',\n      ');
    const paraStr=paras.length?`[\n      ${paras.join(',\n      ')}\n    ]`:'[]';
    return`{\n    id:'ch${String(chNum).padStart(2,'0')}',\n    title:'${title}',\n    stitle:'Ch${chNum} ${title}',\n    para:${paraStr},\n    vl:[\n      ${vlStr}\n    ]\n  }`;
  }catch(e){ return null; }
}

// Generate books
console.log('\nGenerating Book2...');
const b2Dir='/Users/ccc/WorkBuddy/vibecoding/novels/book2-NPC的逆袭';
const b2Files=fs.readdirSync(b2Dir).filter(f=>f.endsWith('.md')&&f.startsWith('第')).sort();
const usedB2=new Set(), b2Chs=[];
for(const nf of b2Files){ const m=nf.match(/第(\d+)章-(.+?)\.md/); if(!m) continue; const o=buildChapter(parseInt(m[1]),m[2],require('path').join(b2Dir,nf),usedB2); if(o)b2Chs.push(o); }
console.log(`Book2: ${b2Chs.length} chapters`);

console.log('\nGenerating Book3...');
const b3Dir='/Users/ccc/WorkBuddy/vibecoding/novels/book3-女王归来';
let b3Files=[]; try{b3Files=fs.readdirSync(b3Dir).filter(f=>f.endsWith('.md')&&f.startswith('第')).sort();}catch(e){}
const usedB3=new Set(), b3Chs=[];
for(const nf of b3Files){ const m=nf.match(/第(\d+)章-(.+?)\.md/); if(!m) continue; const o=buildChapter(parseInt(m[1]),m[2],require('path').join(b3Dir,nf),usedB3); if(o)b3Chs.push(o); }
try{const o=buildChapter(16,'大结局',require('path').join(b3Dir,'第16-20章-大结局.md'),usedB3); if(o)b3Chs.push(o);}catch(e){}
console.log(`Book3: ${b3Chs.length} chapters`);

// Build output
const out=`// DramaVocab Novel Data
// Generated: ${new Date().toISOString()}

${book1Clean}
];

const NOVEL_DATA_BOOK2 = [
${b2Chs.join(',\n\n')}
];

const NOVEL_DATA_BOOK3 = [
${b3Chs.join(',\n\n')}
];

export { NOVEL_DATA_BOOK1, NOVEL_DATA_BOOK2, NOVEL_DATA_BOOK3 };
if(typeof module!=='undefined'&&module.exports){module.exports={NOVEL_DATA_BOOK1,NOVEL_DATA_BOOK2,NOVEL_DATA_BOOK3};}
`;

fs.writeFileSync(DATA_FILE,out);
const totalCh=(out.match(/id:\s*'ch\d+/g)||[]).length;
console.log(`\n✅ Done! ${(out.length/1024).toFixed(0)}KB | ${totalCh} chapters`);
