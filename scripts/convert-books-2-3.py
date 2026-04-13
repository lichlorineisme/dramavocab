#!/usr/bin/env python3
"""
将 Book 2 / Book 3 的 Markdown 源文件转换为 book.js 格式
输出: books-2-3.js (可直接合并进 book.js)
"""

import os
import re
import glob

BASE = '/Users/ccc/WorkBuddy/vibecoding/novels'

BOOKS_CONFIG = {
    'book2': {
        'dir': 'book2-NPC的逆袭',
        'id': '2',
        'title': 'NPC逆袭：我在霸总世界刷存在感',
        'subtitle': '从背景板NPC到C位女主，她只用了一杯咖啡的时间',
        'author': '布吉岛',
        'emoji': '\U0001f3ae',  # 🎮
        'description': '姜离，26岁，社畜加班狗。凌晨两点在公司楼下买了杯关东煮后穿越了——穿进了《霸道总裁的契约新娘》小说世界里。身份？行政部三级助理，存在感3/100的纯种NPC。但她有一个别人没有的东西：一个叫"逆袭"的系统。',
        'coverColor': 'linear-gradient(145deg, #059669, #10B981)',
    },
    'book3': {
        'dir': 'book3-女王归来',
        'id': '3',
        'title': '寒光破晓：女王归来',
        'subtitle': '三年狱火，她从地狱爬回来亲手夺回一切',
        'author': '布吉岛',
        'emoji': '\U0001f451',  # 👑
        'description': "沈清舟，27岁，前首富之女。家族企业被吞并、父亲被逼自杀、被未婚夫和闺蜜联手背叛送进监狱。狱中三年，她从天堂跌到地狱。出狱第一天，她站在曾经属于她家的集团大楼对面——\"我回来了。这一次，我会拿回属于我的一切。\"",
        'coverColor': 'linear-gradient(145deg, #DC2626, #F59E0B)',
    },
}


def extract_phonetic_meaning(text):
    """从 span 标签中分离 raw 和 translation 格式"""
    pattern = r'(<span\s+class="word-highlight"\s+data-word="([^"]+)">([^<]+)</span>)（([^）]+)）'
    
    raw_parts = []
    trans_parts = []
    last_end = 0
    
    for m in re.finditer(pattern, text):
        raw_parts.append(text[last_end:m.start()])
        trans_parts.append(text[last_end:m.start()])
        
        full_span = m.group(1)
        display = m.group(3)
        pm_text = m.group(4).strip()
        
        raw_parts.append(full_span)
        trans_parts.append('<span class="word-highlight">%s</span>（%s）' % (display, pm_text))
        
        last_end = m.end()
    
    raw_parts.append(text[last_end:])
    trans_parts.append(text[last_end:])
    
    return ''.join(raw_parts), ''.join(trans_parts)


def parse_markdown_to_chapters(filepath):
    """将单个 Markdown 文件转换为 chapter 对象"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # 提取标题
    title = ''
    short_title = ''
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            m = re.match(r'第\d+[章\-—(.]*\s*(.+)', title)
            short_title = m.group(1).strip() if m else title
            break
    
    if not title:
        title = os.path.basename(filepath).replace('.md', '')
        short_title = title

    # 找 body 起始位置 (第一个 --- 之后就是正文)
    body_start = 0
    for i, line in enumerate(lines):
        if line.strip() == '---':
            body_start = i + 1
            break

    # 收集段落
    paragraphs = []
    buf = []

    for i in range(body_start, len(lines)):
        s = lines[i].strip()

        if not s or s == '---' or re.match(r'^>\s*\*\*【', s):
            if buf:
                para_text = ''.join(buf).strip()
                if para_text and ('word-highlight' in para_text or len(para_text) > 10):
                    raw, trans = extract_phonetic_meaning(para_text)
                    if raw.strip():
                        paragraphs.append({'raw': raw, 'translation': trans})
                buf = []
            continue
        
        buf.append(lines[i])

    # 最后一段
    if buf:
        para_text = ''.join(buf).strip()
        if para_text:
            raw, trans = extract_phonetic_meaning(para_text)
            if raw.strip():
                paragraphs.append({'raw': raw, 'translation': trans})

    ch_id_match = re.search(r'第(\d+)章', title)
    ch_id = 'ch%s' % ch_id_match.group(1) if ch_id_match else 'ch1'

    return {
        'id': ch_id,
        'title': title,
        'shortTitle': short_title,
        'paragraphs': paragraphs,
    }


def escape_js(s):
    """转义 JS 模板字符串中的特殊字符"""
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('${', '\\${')
    return s


def process_book(config):
    dir_path = os.path.join(BASE, config['dir'])
    chapter_files = sorted(glob.glob(os.path.join(dir_path, '*.md')))
    # 过滤掉大纲文件
    chapter_files = [f for f in chapter_files if not f.endswith('00-大纲.md')]

    print("\n" + "=" * 60)
    print("处理: %s" % config['title'])
    print("目录: %s" % config['dir'])
    print("找到 %d 个章节文件" % len(chapter_files))

    chapters = []
    all_words = set()
    total_spans = 0

    for cf in chapter_files:
        ch = parse_markdown_to_chapters(cf)

        ch_words = set()
        for p in ch['paragraphs']:
            spans = re.findall(r'data-word="([^"]+)"', p['raw'])
            ch_words.update(spans)
            total_spans += len(spans)

        all_words.update(ch_words)
        print("  OK %s: %d段, %d词" % (ch['title'], len(ch['paragraphs']), len(ch_words)))
        chapters.append(ch)

    book_data = {
        'config': config,
        'totalWords': len(all_words),
        'chapters': chapters,
        'stats': {'spans': total_spans, 'words': len(all_words)},
    }

    print("\n  TOTAL: %d chapters, %d spans, %d unique words" % (len(chapters), total_spans, len(all_words)))
    return book_data


def generate_js(book_data):
    """生成 JS 对象字面量"""
    cfg = book_data['config']
    out = []
    out.append('  {')
    out.append("    id: '%s'," % cfg['id'])
    out.append("    title: `%s`," % cfg['title'])
    out.append("    subtitle: `%s`," % cfg['subtitle'])
    out.append("    author: '%s'," % cfg['author'])
    out.append("    emoji: '%s'," % cfg['emoji'])
    out.append("    description: `%s`," % cfg['description'])
    out.append("    coverColor: '%s'," % cfg['coverColor'])
    out.append("    status: 'published',")
    out.append("    totalWords: %d," % book_data['totalWords'])
    out.append('    chapters: [')

    for ch in book_data['chapters']:
        out.append('    {')
        out.append('      id: "%s",' % ch['id'])
        out.append('      title: `%s`,' % ch['title'])
        out.append('      shortTitle: `%s`,' % ch['shortTitle'])
        out.append('      paragraphs: [')

        for p in ch['paragraphs']:
            out.append('        {')
            out.append('          raw: `%s`,' % escape_js(p['raw']))
            out.append('          translation: `%s`,' % escape_js(p['translation']))
            out.append('        },')

        out.append('      ],')
        out.append('    },')

    out.append('  ],')
    out.append('},')
    return '\n'.join(out)


if __name__ == '__main__':
    results = []
    for key in ['book2', 'book3']:
        bd = process_book(BOOKS_CONFIG[key])
        results.append(bd)

    output_path = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/books-2-3-temp.js'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('// Book 2 & Book 3 auto-generated data\n\n')
        f.write('const BOOK2_DATA = {\n')
        f.write(generate_js(results[0]))
        f.write('\n}\n\n')
        f.write('const BOOK3_DATA = {\n')
        f.write(generate_js(results[1]))
        f.write('\n}\n\n')
        f.write('export { BOOK2_DATA, BOOK3_DATA }\n')

    print("\nDONE: %s (%d bytes)" % (output_path, os.path.getsize(output_path)))
