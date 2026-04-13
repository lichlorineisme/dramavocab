#!/usr/bin/env python3
"""
DramaVocab Data Generator v4.2
==============================
从 RTF 源文件生成干净的 novel-data.js

RTF:  \f0\b word \f1\b0 (type/phonetic meaning)
→    raw: 纯文本(英文单词嵌入)
→    vl:  [{word, phonetic, meaning, diff}]
"""

import re
import os
from datetime import datetime

RTF_PATH = "/Users/ccc/Downloads/《契约成瘾：傅总他蓄谋已久》_副本.rtf"
EXTRA_CH_PATH = "/Users/ccc/Downloads/小说/《契约成瘾：傅总他蓄谋已久》17-20.md"
OUTPUT_JS = "/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js"
OUTPUT_MD_DIR = "/Users/ccc/WorkBuddy/vibecoding/novels/book1-契约成瘾"


def esc(s):
    """Escape for JS single-quoted string"""
    s = str(s).replace('\\', '\\\\').replace("'", "\\'")
    s = s.replace('\n', ' ').replace('\r', '')
    # Remove surrogate characters
    s = s.encode('utf-8', errors='surrogatepass').decode('utf-8', errors='ignore')
    # Also filter any remaining non-printable
    s = ''.join(c for c in s if ord(c) >= 32 or c in '\n\r\t')
    return s[:500] if len(s) > 500 else s


def decode_rtf(fp):
    with open(fp, 'rb') as f:
        text = f.read().decode('gbk', errors='ignore')

    # Decode unicode
    def du(m):
        try:
            c = int(m.group(1))
            if c == 32: return ' '
            if c in (10, 13): return '\n'
            if 33 <= c <= 126: return chr(c)
            return chr(c) if c > 127 else ''
        except:
            return ''
    text = re.sub(r'\\u(\d+)\s?', du, text)

    # Mark bold words: **word**
    text = re.sub(r'\\f0\\b\s*([A-Za-z][A-Za-z\'\- ]*?)\s*\\f1\\b0',
                   lambda m: '**' + m.group(1).strip() + '**', text)

    # Strip RTF control codes
    text = re.sub(r'\\[a-zA-Z]+\d*', '', text)
    text = text.replace('\\', '').replace('{', '').replace('}', '')

    # Normalize whitespace
    text = re.sub(r'\r\n?', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)

    return text


def parse_annotation(s):
    """Parse "(adj. /əˈbrʌpt/ 突然的)" → {ph, mean, diff}"""
    ph = ''
    mean = s.strip()
    diff = 1

    pm = re.search(r'/([^/]{2,})/', s)
    if pm:
        ph = '/' + pm.group(1) + '/'
        after = s[pm.end():].strip()
        before = s[:pm.start()].strip()
        tp = re.match(r'(adj|v|n|adv|prep|conj|pron|art|det)\.? ?', before)
        type_s = (tp.group() + (' ' + before[tp.end():].strip()) if tp and before[tp.end():].strip() else (tp.group() if tp else ''))
        parts = [x for x in [type_s, after] if x]
        mean = ' '.join(parts) or s.strip()

        vc = len(re.findall(r'[əɔɪæʌeiuɑɛ]', ph))
        if vc >= 4 or len(ph) > 12:
            diff = 3
        elif vc >= 3 or len(ph) > 8:
            diff = 2
        else:
            diff = 1

    return {'phonetic': ph, 'meaning': mean, 'diff': diff}


def process_para(text):
    vocab = {}
    seen = set()

    # Pattern 1: **word**(annotation) — from RTF
    # Pattern 2: word(annotation) — from markdown source (17-20.md)
    def extract(m):
        word = m.group(1).strip()
        ann = m.group(2).strip() if len(m.groups()) > 1 and m.group(2) else ''
        info = parse_annotation(ann)
        wl = word.lower()
        if wl not in seen:
            seen.add(wl)
            vocab[word] = info
        return word

    # Try pattern 1 first (bold markers), then pattern 2 (plain)
    raw = re.sub(r'\*\*([A-Za-z][A-Za-z\'\- ]*?)\*\*(\s*[（(][^)）]*[）)])?', extract, text)
    
    # If no bold markers found, try plain word(annotation) pattern
    if '**' not in text:
        raw = re.sub(r'([A-Za-z][A-Za-z\'\-]{2,})\(([^)]{3,}?)\)', extract, raw)
    
    raw = re.sub(r'\s+', ' ', raw).strip()

    return raw, vocab


def parse_chapters(text):
    """Parse RTF-decoded text (ch1-16)"""
    chapters = []
    parts = re.split(r'\n\s*(?=第\s*\d+\s*章)', text)

    for part in parts:
        cm = re.match(r'(?:📖\s*)?第\s*(\d{1,2})\s*章[：:\s]*(.+?)(?:\n|$)', part)
        if not cm:
            continue

        num = int(cm.group(1))
        title = cm.group(2).strip()
        content = part[cm.end():]

        blocks = re.split(r'\n\n+', content.strip())
        paras = []
        all_v = {}

        for b in blocks:
            b = b.strip()
            if len(b) < 15 or b.startswith(('📝', '剧情摘要')):
                continue

            rt, pv = process_para(b)
            if len(rt) > 20:
                paras.append({'raw': rt})
                for w, info in pv.items():
                    if w.lower() not in {x.lower() for x in all_v}:
                        all_v[w] = info

        if paras and len(all_v) >= 3:
            vl = [{'word': w, **info} for w, info in all_v.items()]
            chapters.append({
                'id': 'ch%02d' % num,
                'title': title,
                'stitle': 'Ch%d %s' % (num, title),
                'paras': paras,
                'vl': vl,
            })

    return chapters


def parse_extra_chapters(filepath):
    """Parse 17-20.md format (markdown with word annotations)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    chapters = []
    # Split by 📖 第 XX 章
    parts = re.split(r'(?=📖\s*第\s*\d+\s*章)', text)

    for part in parts:
        cm = re.match(r'📖\s*第\s*(\d+)\s*章[：:]\s*(.+?)(?:\n|$)', part)
        if not cm:
            continue

        num = int(cm.group(1))
        title = cm.group(2).strip()
        content = part[cm.end():]

        # Split into paragraphs (separated by blank lines)
        # Stop at 📝 vocab list
        body_end = content.find('📝')
        if body_end > 0:
            body = content[:body_end]
        else:
            body = content

        blocks = re.split(r'\n\n+', body.strip())
        paras = []
        all_v = {}

        for b in blocks:
            b = b.strip()
            if len(b) < 15 or b.startswith('剧情摘要'):
                continue

            rt, pv = process_para(b)
            if len(rt) > 20:
                paras.append({'raw': rt})
                for w, info in pv.items():
                    if w.lower() not in {x.lower() for x in all_v}:
                        all_v[w] = info

        # Also extract vocab from JSON section
        vl_section = re.search(r'vocabList\s*\n?\s*\[(.+?)\]', content, re.DOTALL)
        if vl_section:
            try:
                import json as _json
                extra_vl = _json.loads('[' + vl_section.group(1) + ']')
                for v in extra_vl:
                    wl = v['word'].lower()
                    if wl not in {x.lower() for x in all_v}:
                        diff_map = {'beginner':1, 'intermediate':2, 'advanced':3}
                        all_v[v['word']] = {
                            'phonetic': v.get('phonetic',''),
                            'meaning': v.get('meaning',''),
                            'diff': diff_map.get(v.get('difficulty','intermediate'), 2),
                        }
            except Exception:
                pass

        if paras and len(all_v) >= 3:
            vl = [{'word': w, **info} for w, info in all_v.items()]
            chapters.append({
                'id': 'ch%02d' % num,
                'title': title,
                'stitle': 'Ch%d %s' % (num, title),
                'paras': paras,
                'vl': vl,
            })

    return chapters


def gen_js(chapters):
    now = datetime.now().isoformat()

    lines = [
        "// DramaVocab Novel Data",
        "// Generated: " + now,
        "// Source: 《契约成瘾：傅总他蓄谋已久》(完整20章 RTF)",
        "// Format: raw=纯文本(英文单词嵌入), vl=vocabulary list",
        "// Engine: Frontend scanRawText() renders per reading mode",
        "",
        "const NOVEL_DATA_BOOK1 = [",
    ]

    for ci, ch in enumerate(chapters):
        if ci > 0:
            lines.append(',')

        lines.append("  {")
        lines.append("    id: '%s'," % esc(ch['id']))
        lines.append("    title: '%s'," % esc(ch['title']))
        lines.append("    stitle: '%s'," % esc(ch['stitle']))
        lines.append("    para: [")

        for p in ch['paras']:
            lines.append("      {raw:'%s'}," % esc(p['raw']))

        lines.append("    ],")
        lines.append("    vl: [")

        for v in ch['vl']:
            lines.append(
                "      {word:'%s',phonetic:'%s',meaning:'%s',ex:'',diff:%d,syn:''}," %
                (esc(v['word']), esc(v['phonetic']), esc(v['meaning']), v['diff'])
            )

        lines.append("    ]")
        lines.append("  }")

    lines.append("];")
    lines.append("")
    lines.append("export { NOVEL_DATA_BOOK1 };")

    return '\n'.join(lines)


def main():
    print("=" * 60)
    print("DramaVocab Data Generator v4.2")
    print("=" * 60)

    print("\n[1/4] Decoding RTF...")
    text = decode_rtf(RTF_PATH)
    print("  Text length: %d chars" % len(text))

    idx = text.find("**")
    if idx >= 0:
        end = min(len(text), idx + 250)
        print("\n  Sample:")
        print("  " + text[idx:end])

    print("\n[2/4] Parsing chapters...")
    chapters = parse_chapters(text)
    
    # Also parse 17-20 from markdown source
    if os.path.exists(EXTRA_CH_PATH):
        print("  + Parsing 17-20.md...")
        extra_chs = parse_extra_chapters(EXTRA_CH_PATH)
        print(f"  Found {len(extra_chs)} additional chapters (17-20)")
        chapters.extend(extra_chs)
    
    # Sort by chapter number
    chapters.sort(key=lambda c: int(c['id'][2:]))
    
    print("  Total: %d chapters" % len(chapters))

    tw = sum(len(c['vl']) for c in chapters)
    tp = sum(len(c['paras']) for c in chapters)
    for c in chapters:
        print("    %s: %s (%dp, %dw)" % (c['id'], c['title'], len(c['paras']), len(c['vl'])))

    print("\n[3/4] Saving .md files...")
    os.makedirs(OUTPUT_MD_DIR, exist_ok=True)
    for c in chapters:
        safe = re.sub(r'[^\w\u4e00-\u9fff]', '_', c['title'])
        fp = os.path.join(OUTPUT_MD_DIR, "第%s-%s.md" % (int(c['id'][2:]), safe))
        body = "\n\n".join(p['raw'] for p in c['paras'])
        # Clean surrogate characters
        body = body.encode('utf-8', errors='surrogatepass').decode('utf-8', errors='ignore')
        with open(fp, 'w', encoding='utf-8') as f:
            f.write("# " + c['title'] + "\n\n" + body + "\n")
        print("    OK %s" % os.path.basename(fp))

    print("\n[4/4] Generating novel-data.js...")
    js = gen_js(chapters)
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js)

    print("\n" + "=" * 60)
    print("SUCCESS!")
    print("  Chapters : %d" % len(chapters))
    print("  Paragraphs: %d" % tp)
    print("  Vocab words: %d" % tw)
    print("  File size : %.0f KB" % (len(js) / 1024))
    print("  Output: %s" % OUTPUT_JS)
    print("=" * 60)


if __name__ == '__main__':
    main()
