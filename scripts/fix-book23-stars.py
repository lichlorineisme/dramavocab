#!/usr/bin/env python3
"""
fix-book23-stars.py — 清理 Book2/Book3 中残留的 Markdown ** 加粗标记
只处理 raw 和 translation 字段中的内容，保留 JS 注释和代码结构
"""
import re

INPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book.js'
OUTPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book-fixed.js'

with open(INPUT, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
fixed_lines = []
count = 0

# 匹配 raw: `...` 或 translation: `...` 行中的 **...** 标记
star_pattern = re.compile(r'\*\*([^*]+(?:\*[^*]+)*?)\*\*')

for line in lines:
    # 只处理包含 `**` 且是 raw/translation 字段的行
    if '**' in line and ('raw:' in line or 'translation:' in line):
        original = line
        # 替换 **text** → text （去掉星号，保留内部文本）
        new_line = star_pattern.sub(r'\1', line)
        if new_line != original:
            count += 1
        fixed_lines.append(new_line)
    else:
        fixed_lines.append(line)

result = '\n'.join(fixed_lines)

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(result)

print(f"✅ Fixed {count} lines with ** residues")
print(f"Output: {OUTPUT}")
