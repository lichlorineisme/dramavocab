#!/usr/bin/env python3
"""
fix-book23-stars-v2.py — 彻底清理所有 ** 标记（v2 修复版）
"""
import re

INPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book-fixed.js'
OUTPUT = '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/book-fixed2.py'

with open(INPUT, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
fixed_lines = []
total_fixed = 0

for line in lines:
    if '**' in line and ('raw:' in line or 'translation:' in line):
        original = line
        new_line = line
        
        # 反复应用直到没有 ** 残留
        for _ in range(5):
            before = new_line
            
            # 标准 **text** → text
            new_line = re.sub(r'\*\*([^*]+(?:\*[^*]+)*?)\*\*', r'\1', new_line)
            
            # 行尾 **` 或 **" 或 **, 或 **后接标点空格
            new_line = re.sub(r'\*\*(["\'`,.，、：：！！?？\s])', r'\1', new_line)
            
            # `**文本 或 "**文本 (引号后的**)
            new_line = re.sub(r'(["\'`])\*\*', r'\1', new_line)
            
            # 中文后跟 ** 如 "文本**——"
            new_line = re.sub(r'([\u4e00-\u9fff\w])\*\*([—\-–—\u4e00-\u9fff])', r'\1\2', new_line)
            
            # 单独 ** 后接中文（行首或空格后）
            new_line = re.sub(r'(\s)\*\*([\u4e00-\u9fff])', r'\1\2', new_line)
            
            if new_line == before:
                break
        
        if new_line != original:
            total_fixed += 1
        fixed_lines.append(new_line)
    else:
        fixed_lines.append(line)

result = '\n'.join(fixed_lines)

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(result)

# 验证
remaining_lines = []
for i, l in enumerate(fixed_lines, 1):
    if '**' in l and ('raw:' in l or 'translation:' in l):
        remaining_lines.append((i, l.rstrip()))

print(f"Total lines modified: {total_fixed}")
print(f"Remaining ** in raw/translation: {len(remaining_lines)}")
for ln, ll in remaining_lines[:10]:
    print(f"  L{ln}: {ll[:120]}")
print(f"Output: {OUTPUT}")
