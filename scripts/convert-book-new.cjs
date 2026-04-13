/**
 * convert-book-new.cjs - 从 book-new.js 完整提取数据 → novel-data.js
 * 
 * 确保不截断任何内容！
 */
const fs = require('fs');
const path = require('path');

console.log('=== Complete Data Conversion ===\n');

// Step 1: Read book-new.js (the full data source)
const srcPath = path.join(__dirname, '../src/stores/book-new.js');
console.log(`  Looking for: ${srcPath}`);
if (!fs.existsSync(srcPath)) {
    console.error('ERROR: book-new.js not found at:', srcPath);
    process.exit(1);
}
let src = fs.readFileSync(srcPath, 'utf-8');
console.log(`[1/4] Read book-new.js: ${src.length} chars, ${(src.match(/\n/g)||[]).length} lines`);

// Step 2: Extract the books array
// The store has: const BD = [ { ... }, { ... }, { ... } ]
// Then: const books = ref(BD)
let arrayStr;
const bdMatch = src.match(/^(?:export\s+)?const\s+BD\s*=\s*\[/m);
if (bdMatch) {
    console.log('[2/4] Found "const BD = [" pattern');
    
    const startIdx = src.indexOf('BD=[') + 3;
    let depth = 0;
    let endIdx = startIdx;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIdx; i < src.length; i++) {
        const c = src[i];
        const prev = i > 0 ? src[i-1] : '';
        
        if ((c === "'" || c === '"' || c === '`') && prev !== '\\') {
            if (!inString) { inString = true; stringChar = c; }
            else if (c === stringChar) { inString = false; }
        }
        
        if (inString) continue;
        if (c === '[') depth++;
        if (c === ']') {
            depth--;
            if (depth === 0) { endIdx = i + 1; break; }
        }
    }
    arrayStr = src.substring(startIdx, endIdx);
} else if (src.match(/ref\(\s*\[/)) {
    // Fallback for ref([...]) format
    console.log('[2/4] Found "ref([" pattern');
    const startIdx = src.indexOf('ref([') + 4;
    let depth = 0;
    let endIdx = startIdx;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIdx; i < src.length; i++) {
        const c = src[i];
        const prev = i > 0 ? src[i-1] : '';
        if ((c === "'" || c === '"') && prev !== '\\') {
            if (!inString) { inString = true; stringChar = c; }
            else if (c === stringChar) { inString = false; }
        }
        if (inString) continue;
        if (c === '[') depth++;
        if (c === ']') {
            depth--;
            if (depth === 0) { endIdx = i + 1; break; }
        }
    }
    arrayStr = src.substring(startIdx, endIdx);
} else {
    console.error('ERROR: Cannot find BD or books array pattern!');
    console.error('First 200 chars:', src.substring(0, 200));
    process.exit(1);
}

console.log(`[2/4] Extracted array: ${arrayStr.length} chars`);

// Step 3: Parse the array
let BD;
try {
    BD = eval(arrayStr);
    console.log(`[3/4] Parsed: ${BD.length} books`);
    for (let bi = 0; bi < BD.length; bi++) {
        const b = BD[bi];
        console.log(`  Book${bi+1}: "${b.title}" — ${b.ch?.length || 0} chapters`);
    }
} catch(e) {
    console.error(`[3/4] PARSE ERROR: ${e.message}`);
    
    // Try alternative: just use Function constructor
    try {
        const fn = new Function('ref', src.replace(/^.*?const\s+books\s*=\s*ref\(/s, 'return (').replace(/\}\)\}\);$/s, ''));
        BD = fn(() => {});
        console.log(`[3/4] Parsed via Function: ${BD.length} books`);
    } catch(e2) {
        console.error(`  Alt parse also failed: ${e2.message}`);
        
        // Last resort: manually find each book's ch array
        console.log('\n  Trying manual extraction...');
        
        // Find all chapter arrays by looking for patterns like ch:[{cid:
        const chBlocks = [];
        let idx = 0;
        while (true) {
            const found = src.indexOf('{cid:', idx);
            if (found === -1) break;
            
            // Find the enclosing object
            let d = 0, objStart = found - 1;
            while (objStart >= 0 && src[objStart] !== '{' && src[objStart] !== ',') objStart--;
            if (src[objStart] === '{') {
                // Find matching close
                let dd = 0, str = false, sc = '', oi = objStart;
                for (; oi < src.length; oi++) {
                    const cc = src[oi];
                    if ((cc === '"' || cc === "'") && src[oi-1] !== '\\') {
                        if (!str) { str = true; sc = cc; } else if (cc === sc) { str = false; }
                    }
                    if (str) continue;
                    if (cc === '{') dd++;
                    if (cc === '}') { dd--; if (dd === 0) break; }
                }
                chBlocks.push(src.substring(objStart, oi + 1));
            }
            idx = found + 5;
        }
        console.log(`  Found ${chBlocks.length} chapter objects`);
        process.exit(1);
    }
}

// Step 4: Convert to new format
const outputBooks = [];

for (let bi = 0; bi < BD.length; bi++) {
    const b = BD[bi];
    if (!b.ch || !b.ch.length) {
        outputBooks.push([]);
        console.log(`  Book${bi+1}: EMPTY (${b.t || b.title || 'no title'})`);
        continue;
    }
    
    const chapters = [];
    let totalParas = 0;
    let totalVocab = 0;
    
    for (const ch of b.ch) {
        const paras = [];
        
        // Paragraphs are in "para" field (not "paragraphs")
        const paraList = ch.para || ch.paragraphs || [];
        
        for (const p of paraList) {
            // Convert raw text - strip HTML but keep English words
            let raw = p.raw || p.t || '';
            
            // Extract vocabulary from <span class="word-highlight">word</span>
            const vocabFromHTML = [];
            const spanRegex = /<span[^>]*class=["']?word-highlight["']?[^>]*>([^<]+)<\/span>/gi;
            let spanMatch;
            while ((spanMatch = spanRegex.exec(raw)) !== null) {
                const word = spanMatch[1].trim();
                if (word && /^[a-zA-Z][\w'\s\-]*$/.test(word)) {
                    vocabFromHTML.push({
                        word: word,
                        phonetic: '',  // Will be filled later if available
                        meaning: '',
                        diff: 2
                    });
                }
            }
            
            // Strip all HTML tags but preserve text content (keep English words!)
            raw = raw
                .replace(/<span[^>]*class="word-highlight"[^>]*>([^<]*)<\/span>/gi, '$1')
                .replace(/<span[^>]*class="xr-meaning"[^>]*>[^<]*<\/span>/gi, '')
                .replace(/<span[^>]*>([^<]*)<\/span>/gi, '$1')
                .replace(/<input[^>]*\/?>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\s{2,}/g, ' ')
                .trim();
            
            // Build vocabList: prefer explicit vl field, fall back to HTML extraction
            let vl;
            if (p.vl && p.vl.length > 0) {
                vl = (p.vl).map(v => ({
                    word: v.w || v.word || '',
                    phonetic: v.p || v.phonetic || '',
                    meaning: v.m || v.meaning || '',
                    diff: typeof v.diff === 'number' ? v.diff : 
                          v.diff === 'beginner' ? 1 : 
                          v.diff === 'intermediate' ? 2 : 
                          v.diff === 'advanced' ? 3 : 2
                })).filter(v => v.word);
            } else if (vocabFromHTML.length > 0) {
                vl = vocabFromHTML;
            } else {
                vl = [];
            }
            
            if (raw.length > 5) {
                paras.push({ raw, vocabList: vl });
                totalParas++;
                totalVocab += vl.length;
            }
        }
        
        chapters.push({
            cid: ch.cid || String(chapters.length + 1),
            title: ch.title || ch.t || '',
            stitle: ch.stitle || ch.s || '',
            paragraphs: paras
        });
    }
    
    console.log(`  Book${bi+1} "${b.t || b.title}": ${chapters.length} ch, ${totalParas} paras, ${totalVocab} vocab`);
    outputBooks.push(chapters);
}

// Step 5: Write output file
const outPath = path.join(__dirname, '../src/stores/novel-data.js');

let jsContent = '/**\n * NOVEL DATA - Complete Edition\n';
jsContent += ` * Generated: ${new Date().toISOString()}\n`;
jsContent += ` * Source: converted from book-new.js (full data)\n */\n\n`;

jsContent += `export const NOVEL_DATA_BOOK1 = ${JSON.stringify(outputBooks[0] || [], null, 2)};\n\n`;
jsContent += `export const NOVEL_DATA_BOOK2 = ${JSON.stringify(outputBooks[1] || [], null, 2)};\n\n`;
jsContent += `export const NOVEL_DATA_BOOK3 = ${JSON.stringify(outputBooks[2] || [], null, 2)};\n`;

fs.writeFileSync(outPath, jsContent, 'utf-8');

console.log(`\n[4/4] Written: ${outPath}`);
console.log(`      Size: ${(Buffer.byteLength(jsContent, 'utf-8') / 1024).toFixed(1)} KB, ${(jsContent.match(/\n/g)||[]).length} lines`);

// Verify
let verifyDepth = 0;
for (const c of jsContent) {
    if (c === '[') verifyDepth++;
    if (c === ']') verifyDepth--;
}
console.log(`\n✅ Brackets balanced: ${verifyDepth === 0 ? 'YES' : 'NO (' + verifyDepth + ')'}`);

if (verifyDepth !== 0) {
    console.error('❌ UNBALANCED! File may be broken.');
    process.exit(1);
}

// Quick content check
const lineCount = jsContent.split('\n').length;
const charCount = jsContent.length;
console.log(`✅ File stats: ${lineCount} lines, ${(charCount/1024).toFixed(1)} KB`);
console.log('\n=== DONE! Open http://localhost:3003 to verify ===');
