#!/usr/bin/env python3
"""检查 novel-data.js 中是否有中文弯引号"""
with open('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'r') as f:
    content = f.read()

# 找 ch19 vl 块
idx = content.find("id: 'ch19'")
if idx == -1:
    print("ch19 not found!")
    exit()

vl_start = content.find('vl:', idx)
bracket = content.find('[', vl_start)
chunk = content[bracket:bracket+60000]
end_bracket = chunk.find(']\n  },')
vl_text = chunk[:end_bracket+1]

# 检查所有非ASCII字符，特别是smart quotes
smart_quotes = set(['\u2018', '\u2019', '\u201c', '\u201d'])  # '' ""
found_any = False

for i, ch in enumerate(vl_text):
    code = ord(ch)
    if code in smart_quotes:
        line_num = vl_text[:i].count('\n') + 1
        col = i - vl_text.rfind('\n', 0, i)
        context = vl_text[max(0,i-15):i+15].replace('\n', '\\n')
        print(f"Line ~{line_num}, col {col}: SMART QUOTE U+{code:04X}")
        print(f"  Context: ...{context}...")
        found_any = True

if not found_any:
    print("No smart quotes in ch19 vl block.")
    
# Also check for the specific issue - count single quotes per line
print("\n--- Lines with odd single-quote counts ---")
lines = vl_text.split('\n')
for i, line in enumerate(lines):
    # Count unescaped single quotes
    sq_count = 0
    j = 0
    while j < len(line):
        if line[j] == "'" and (j == 0 or line[j-1] != '\\'):
            sq_count += 1
        j += 1
    
    # Each valid entry should have even number of single quotes
    # word:'xxx' has 2, meaning:'xxx' has 2, ex:'xxx' has 2 -> total should be multiple of 2
    # syn:'' has 2 -> total should be even
    if sq_count % 2 != 0:
        print(f"  Line ~{i+1}: {sq_count} quotes (ODD) -> {line[:90]}")
