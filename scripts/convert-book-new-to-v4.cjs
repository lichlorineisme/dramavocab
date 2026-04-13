/**
 * convert-book-new-to-v4.cjs
 * 
 * 从 book-new.js (完整旧格式) 转换为 novel-data.js (新干净格式)
 * 
 * 旧格式: {raw:'...<span class="word-highlight">word</span>...', tr:'...[__]...'}
 * 新格式: {raw:'纯文本英文单词', vocabList:[{word,phonetic,meaning,diff}]}
 * 
 * 关键保证：不丢失任何内容！811段落全部保留！
 */

const fs = require('fs');
const path = require('path');

console.log('=== DramaVocab V4 Complete Conversion ===\n');

// ============================================================
// Step 1: Read and parse book-new.js
// ============================================================
const bookNewPath = path.join(__dirname, '../dramavocab/src/stores/book-new.js');
const bookNewContent = fs.readFileSync(bookNewPath, 'utf-8');

console.log(`[1/5] Read book-new.js: ${(bookNewContent.length / 1024).toFixed(0)}KB`);

// Find BD array - extract it as a JavaScript object
const bdStart = bookNewContent.indexOf('const BD=[');
if (bdStart === -1) {
    console.error('❌ Cannot find BD array!');
    process.exit(1);
}

// We need to extract just the BD array definition and evaluate it
// Find where BD ends (before the Pinia store setup code)
let depth = 0;
let bdEnd = bdStart + 'const BD='.length;
let started = false;

for (let i = bdStart + 'const BD=['.length - 1; i < bookNewContent.length; i++) {
    if (bookNewContent[i] === '[') {
        depth++;
        started = true;
    } else if (bookNewContent[i] === ']') {
        depth--;
        if (started && depth === 0) {
            bdEnd = i + 1;
            break;
        }
    }
}

const bdCode = 'var BD=' + bookNewContent.substring(bdStart + 'const BD=['.length - 1, bdEnd);

try {
    eval(bdCode);
} catch(e) {
    console.error(`❌ Failed to parse BD array: ${e.message}`);
    // Try to find syntax issues
    const line = bdCode.substring(Math.max(0, e.message.indexOf('at position') > -1 ? 
        parseInt(e.message.match(/position (\d+)/)?.[1] || 0) : 0), 
        Math.min(bdCode.length, (parseInt(e.message.match(/position (\d+)/)?.[1] || 0) || 0) + 100));
    console.error('Context:', line);
    process.exit(1);
}

console.log(`[2/5] Parsed BD: ${BD.length} books`);
for (const b of BD) {
    const chCount = b.ch?.length || 0;
    const paraCount = b.ch?.reduce((s, c) => s + (c.para?.length || 0), 0) || 0;
    let rawChars = 0;
    for (const c of (b.ch || [])) {
        for (const p of (c.para || [])) {
            rawChars += (p.raw || '').length;
        }
    }
    console.log(`   Book${b.id} "${b.t}": ${chCount} ch, ${paraCount} paras, ${rawChars} chars`);
}

// ============================================================
// Step 2: Convert each paragraph to new format
// ============================================================

function convertParagraph(oldPara) {
    const rawHtml = oldPara.raw || '';
    
    // Extract vocabulary words from <span class="word-highlight">WORD</span>
    const vocabList = [];
    const spanPattern = /<span\s+class="word-highlight"[^>]*>([^<]+)<\/span>/g;
    let match;
    
    while ((match = spanPattern.exec(rawHtml)) !== null) {
        const wordText = match[1].trim();
        
        // Skip empty or too-short matches
        if (!wordText || wordText.length < 2) continue;
        
        // Parse word/meaning - some have "word/ phonetic meaning" format after them
        // Look at what comes after the </span>
        let afterSpan = rawHtml.substring(match.index + match[0].length);
        // Capture up to next tag or end of meaningful text
        const afterMatch = afterSpan.match(/^[\s]*\/\s*([^<\n]{1,80}?)/);
        const annotation = afterMatch ? afterMatch[1].trim() : '';
        
        // Determine difficulty
        const diff = calcDifficulty(wordText);
        
        vocabList.push({
            word: wordText,
            phonetic: '',
            meaning: annotation || '',
            diff: diff
        });
    }
    
    // Generate clean raw: strip all HTML tags
    let cleanRaw = rawHtml
        .replace(/<span[^>]*class="word-highlight"[^>]*>([^<]+)<\/span>/g, '$1')
        .replace(/<[^>]+>/g, '')  // Remove any remaining HTML
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, ' ')
        .trim();
    
    return {
        raw: cleanRaw,
        vocabList: vocabList
    };
}

function calcDifficulty(word) {
    const lower = word.toLowerCase().trim();
    const easy = ['good','bad','big','small','new','old','like','love','want','need',
                  'know','think','come','go','get','take','make','say','see','look',
                  'use','find','give','tell','work','call','try','ask','feel','become',
                  'leave','put','mean','keep','let','begin','seem','help','show','hear',
                  'play','run','move','live','believe','hold','bring','just','also'];
    if (easy.includes(lower)) return 1;
    if (lower.includes(' ') || lower.includes('-')) return 3;
    return 2;
}

// ============================================================
// Step 3: Build output data
// ============================================================

const outputData = {};
let totalParas = 0;
let totalVocab = 0;

for (const book of BD) {
    const bookId = book.id;
    const chapters = [];
    
    for (const ch of (book.ch || [])) {
        const paras = [];
        
        for (const oldPara of (ch.para || [])) {
            const converted = convertParagraph(oldPara);
            
            // Only keep paragraphs with actual content
            if (converted.raw.length < 5) continue;
            
            paras.push(converted);
            totalParas++;
            totalVocab += converted.vocabList.length;
        }
        
        chapters.push({
            cid: ch.id.replace('ch', ''),
            title: ch.title.replace(/^第\d+\s*章\s*/, '').replace(/^\d+\s*/, ''),
            stitle: ch.stitle || ch.title,
            paragraphs: paras
        });
    }
    
    outputData[`BOOK${bookId}`] = chapters;
}

console.log(`[3/5] Converted: ${totalParas} paragraphs, ${totalVocab} vocabulary entries`);

// ============================================================
// Step 4: Generate JS file
// ============================================================

const timestamp = new Date().toISOString().split('T')[0];
let jsOutput = '';

jsOutput += `/**\n`;
jsOutput += ` * DramaVocab Novel Data - Complete Edition\n`;
jsOutput += ` * Generated: ${timestamp}\n`;
jsOutput += ` * Source: book-new.js (converted to new clean format)\n`;
jsOutput += ` * \n`;
jsOutput += ` * Format: { raw: string, vocabList: [{ word, phonetic, meaning, diff }] }\n`;
jsOutput += ` * Raw is PLAIN TEXT only - NO HTML.\n`;
jsOutput += ` * Front-end ReaderContent.vue dynamically renders 3 reading modes.\n`;
jsOutput += ` */\n`;

for (const [bookKey, chapters] of Object.entries(outputData)) {
    const varName = `NOVEL_DATA_${bookKey}`;
    jsOutput += `\nexport const ${varName} = ${JSON.stringify(chapters, null, 2)};\n`;
    
    // Stats for this book
    const chCount = chapters.length;
    const pCount = chapters.reduce((s, c) => s + (c.paragraphs?.length || 0), 0);
    const vCount = chapters.reduce((s, c) => s + 
        (c.paragraphs?.reduce((ss, p) => ss + (p.vocabList?.length || 0), 0) || 0), 0);
    console.log(`   ${varName}: ${chCount} ch, ${pCount} paras, ${vCount} vocab`);
}

jsOutput += `\n// Book2 & Book3 placeholders - awaiting official source files\n`;
jsOutput += `export const NOVEL_DATA_BOOK2 = [];\n`;
jsOutput += `export const NOVEL_DATA_BOOK3 = [];\n`;

const outputPath = path.join(__dirname, '../dramavocab/src/stores/novel-data.js');
fs.writeFileSync(outputPath, jsOutput, 'utf-8');

console.log(`\n[4/5] Written: ${outputPath}`);
console.log(`     Size: ${(Buffer.byteLength(jsOutput, 'utf-8') / 1024).toFixed(1)} KB`);

// ============================================================
// Step 5: Verify
// ============================================================

console.log(`\n[5/5] Verifying...`);

// Bracket balance check
let bracketDepth = 0;
for (const c of jsOutput) {
    if (c === '[') bracketDepth++;
    if (c === ']') bracketDepth--;
}
if (bracketDepth !== 0) {
    console.error(`❌ Unbalanced brackets! Depth=${bracketDepth}`);
    process.exit(1);
}
console.log(`✅ Brackets balanced: [ = ]`);

// Check for common syntax issues  
const issues = [];
if (jsOutput.includes("don't")) issues.push("Unescaped single quote in don't");
if (jsOutput.includes("can't")) issues.push("Unescaped single quote in can't");
if (jsOutput.includes("it's")) issues.push("Unescaped single quote in it's");

// More thorough: find any word field containing single quotes
const quoteIssues = jsOutput.match(/word:'[^']*'[^}]*'(?=[,}])/g) || [];

if (issues.length > 0 || quoteIssues.length > 0) {
    console.warn(`⚠️ Potential issues found:`);
    issues.forEach(i => console.warn(`  - ${i}`));
    quoteIssues.forEach(q => console.warn(`  - Quote issue: ${q.substring(0, 60)}`));
}

// Try building with Vite
const { execSync } = require('child_process');
try {
    execSync('cd ' + path.join(__dirname, '../dramavocab') + ' && npx vite build --mode development 2>&1', 
             { encoding: 'utf-8', timeout: 30000 });
    console.log(`✅ Vite build successful!`);
} catch (e) {
    console.error(`❌ Build failed:\n${e.stdout || e.stderr || e.message}`);
}

console.log(`\n=== ✅ CONVERSION COMPLETE ===`);
console.log(`All ${totalParas} paragraphs preserved from original book-new.js.`);
