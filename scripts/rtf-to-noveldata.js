/**
 * rtf-to-noveldata.js v3 — 基于 textutil 纯文本输出
 * 
 * 输入: _book1_raw.txt (textutil 转换的纯文本)
 * 输出: novel-data.js (结构化JS数据)
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 读取纯文本
// ============================================================
const rawPath = '/Users/ccc/WorkBuddy/vibecoding/scripts/_book1_raw.txt';
let text = fs.readFileSync(rawPath, 'utf-8');
// 统一换行
text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

console.log(`文件大小: ${text.length} 字符, ${(text.match(/\n/g) || []).length} 行`);
console.log(`vocabList 出现: ${(text.match(/本章\s*vocabList/g) || []).length} 次`);
console.log(`章节标题: ${(text.match(/第\s*\d+\s*章/g) || []).length} 个`);

// ============================================================
// 2. 按"本章 vocabList"分割章节
// ============================================================
const chapterParts = text.split(/本章\s*vocabList[\s\S]*?\n/);
console.log(`\n分割为 ${chapterParts.length} 块`);

// ============================================================
// 3. 逐章处理
// ============================================================

let allChapters = [];
let totalVocab = 0;

for (let i = 0; i < chapterParts.length - 1; i++) {
    const part = chapterParts[i].trim();
    if (!part) continue;
    
    // 提取标题: 第 XX 章：标题
    const titleMatch = part.match(/第\s*(\d+)\s*章[：:]\s*(.+?)(?:\n|$)/);
    if (!titleMatch) {
        console.log(`\n⚠️ 块 ${i}: 无标题`);
        console.log('前100字:', JSON.stringify(part.substring(0, 100)));
        continue;
    }
    
    const chNum = parseInt(titleMatch[1]);
    let chTitle = titleMatch[2].trim();
    
    console.log(`\n━━━ 第${chNum}章: ${chTitle} ━━━`);
    
    // 提取正文（标题之后到本块结束）
    const bodyStartIdx = part.indexOf(titleMatch[0]) + titleMatch[0].length;
    const bodyText = part.substring(bodyStartIdx).trim();
    
    // textutil 输出格式：每行=一个段落（句子）
    // 用单换行分割，每行是一个独立段落
    const rawParas = bodyText.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 10 && /[\u4e00-\u9fff]/.test(p) && !/^JavaScript$/i.test(p));
    
    console.log(`  原始段落数: ${rawParas.length}`);
    
    // ==========================================================
    // 从每个段落中提取词汇标注，构建 raw/tr
    // 格式: word(type. 释义)
    // 例: abrupt(adj. 突然的) | credit card(n. 信用卡) | think about it(phrase. 考虑一下)
    // ==========================================================
    
    let paragraphs = [];
    
    for (let pi = 0; pi < rawParas.length; pi++) {
        const paraText = rawParas[pi];
        
        // 跳过非正文内容
        if (/^JavaScript$|^\[\s*$/.test(paraText)) continue;
        if (paraText.length < 15) continue;
        
        // 匹配词汇标注
        // 模式: 英文词/短语 (类型. 中文释义)
        const VocabRegex = /([A-Za-z][A-Za-z'\s-]{1,35})\(([a-zA-Z\u4e00-\u9fff\s\.]+?)\)/g;
        
        let vocabInPara = [];
        let match;
        while ((match = VocabRegex.exec(paraText)) !== null) {
            let word = match[1].trim();
            let meaningFull = match[2].trim();
            
            // 验证有效性
            if (word.length < 2 || word.length > 40) continue;
            if (!/^[A-Za-z]/.test(word)) continue;
            // meaning 必须含类型标记或中文
            if (!meaningFull.match(/[nva]\.|adj\.|adv\.|phrase/)) continue;
            
            vocabInPara.push({
                word: word,
                fullMatch: match[0],
                meaningRaw: meaningFull
            });
        }
        
        if (vocabInPara.length === 0) continue;
        
        // 按 word 长度降序排列，避免短词误替换长词的一部分
        vocabInPara.sort((a, b) => b.word.length - a.word.length);
        
        // 构建 raw（去掉括号释义）和 tr（用 [__] 替换）
        let raw = paraText;
        let tr = paraText;
        
        for (const v of vocabInPara) {
            raw = raw.replace(v.fullMatch, v.word);
            tr = tr.replace(v.fullMatch, '[__]');
        }
        
        paragraphs.push({ raw, tr, _vc: vocabInPara.length });
    }
    
    // ==========================================================
    // 提取官方 vocabList JSON
    // JSON 在下一块的开头部分
    // ==========================================================
    
    const nextPart = (chapterParts[i + 1] || '').trim();
    
    // 从 [ 开始找到匹配的 ] 结尾（处理嵌套引号）
    let jsonStart = nextPart.indexOf('[\n');
    if (jsonStart < 0) jsonStart = nextPart.indexOf('[');
    
    let officialVocab = [];
    if (jsonStart >= 0) {
        // 找到对应的 ]
        let depth = 0;
        let jsonEnd = -1;
        for (let j = jsonStart; j < nextPart.length; j++) {
            if (nextPart[j] === '[') depth++;
            else if (nextPart[j] === ']') {
                depth--;
                if (depth === 0) { jsonEnd = j; break; }
            }
        }
        
        if (jsonEnd > jsonStart + 5) {
            let jsonStr = nextPart.substring(jsonStart, jsonEnd + 1).trim();
            try {
                officialVocab = JSON.parse(jsonStr);
                console.log(`  ✅ vocabList: ${officialVocab.length} 词`);
            } catch(e) {
                console.log(`  ⚠️ JSON解析失败: ${e.message}`);
                console.log(`  片段(前200字): ${jsonStr.substring(0,200)}`);
            }
        } else {
            console.log(`  ⚠️ JSON数组不完整`);
        }
    } else {
        console.log(`  ⚠️ 未找到JSON数组`);
    }
    
    totalVocab += officialVocab.length;
    
    // ==========================================================
    // 构建章节数据对象
    // ==========================================================
    
    allChapters.push({
        id: `ch${String(chNum).padStart(2, '0')}`,
        title: chTitle,
        stitle: `Ch${chNum} ${chTitle}`,
        para: paragraphs,
        vl: officialVocab.map(v => ({
            word: v.word,
            phonetic: v.phonetic || '',
            meaning: v.meaning || '',
            difficulty: v.difficulty || 'intermediate',
            diff: v.difficulty === 'beginner' ? 1 : v.difficulty === 'intermediate' ? 2 : v.difficulty === 'advanced' ? 3 : 2,
            syn: ''
        })),
        stats: {
            paragraphCount: paragraphs.length,
            vocabCount: officialVocab.length,
            totalWords: paragraphs.reduce((s, p) => s + p._vc, 0)
        }
    });
    
    const chData = allChapters[allChapters.length - 1];
    console.log(`  📊 有效段落:${paragraphs.length} | 标注总数:${chData.stats.totalWords}`);
}

// ============================================================
// 4. 输出 novel-data.js
// ============================================================

function esc(s) {
    return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}
function escQ(s) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

const out = [];

out.push('/**');
out.push(' * novel-data.js — 《契约成瘾：傅总他蓄谋已久》16章完整数据');
out.push(' * ');
out.push(` * 生成时间: ${new Date().toISOString().slice(0,19)}`);
out.push(` * 数据源: 内容团队 RTF → textutil → 自动转换`);
out.push(` * 统计: ${allChapters.length}章 / ${totalVocab}词`);
out.push(' * ');
out.push(' * 数据格式:');
out.push(' *   para[].raw   = 纯英文自然替换版（无HTML）');
out.push(' *   para[].tr    = 填空练习版（单词→[__]）');
out.push(' *   vl[]          = 官方词汇表 {word, phonetic, meaning, diff}');
out.push(' * ');
out.push(' * 三种阅读模式由前端 JS 动态渲染:');
out.push(' *   immersive   = <span class="word-hl" data-word="x">x</span>');
out.push(' *   perspective = x<span class="text-gray-400">(type.释义)</span>');
out.push(' *   challenge   = <span>(type.释义)</span><input data-word="x">');
out.push(' */');
out.push('');
out.push('const NOVEL_DATA_BOOK1 = [');

for (let ci = 0; ci < allChapters.length; ci++) {
    const ch = allChapters[ci];
    out.push(`  {`);
    out.push(`    id: '${ch.id}',`);
    out.push(`    title: '${escQ(ch.title)}',`);
    out.push(`    stitle: '${escQ(ch.stitle)}',`);
    out.push(`    para: [`);
    
    for (let pi = 0; pi < ch.para.length; pi++) {
        const p = ch.para[pi];
        out.push(`      { raw: \`${esc(p.raw)}\`, tr: \`${esc(p.tr)}\` }${pi < ch.para.length - 1 ? ',' : ''}`);
    }
    
    out.push(`    ],`);
    out.push(`    vl: [`);
    for (let vi = 0; vi < ch.vl.length; vi++) {
        const v = ch.vl[vi];
        out.push(`      { word: "${v.word}", phonetic: "${v.phonetic}", meaning: "${v.meaning}", difficulty: "${v.difficulty}", diff: ${v.diff}, syn: "" }${vi < ch.vl.length - 1 ? ',' : ''}`);
    }
    out.push(`    ],`);
    out.push(`    stats: ${JSON.stringify(ch.stats)}`);
    out.push(`  }${ci < allChapters.length - 1 ? ',' : ''}`);
}

out.push('];');
out.push('');
out.push('if (typeof module !== "undefined" && module.exports) {');
out.push('  module.exports = NOVEL_DATA_BOOK1;');
out.push('}');

const outputPath = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js';
fs.writeFileSync(outputPath, out.join('\n'), 'utf-8');

console.log('\n' + '='.repeat(60));
console.log(`✅ novel-data.js 已生成!`);
console.log(`📁 ${outputPath}`);
console.log(`📊 总计: ${allChapters.length}章 / ${totalVocab}词 / ${allChapters.reduce((s,ch)=>s+ch.para.length,0)}段\n`);

for (const ch of allChapters) {
    console.log(`  ${String(allChapters.indexOf(ch)+1).padStart(2,'')}. ${ch.id.padEnd(5)} ${ch.title.padEnd(18)} ${String(ch.stats.paragraphCount).padStart(3)}段 ${String(ch.stats.vocabCount).padStart(3)}词 ${String(ch.stats.totalWords).padStart(4)}标注`);
}
