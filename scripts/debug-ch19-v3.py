#!/usr/bin/env python3
with open('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'r') as f:
    content = f.read()
idx = content.find("id: 'ch19'")
vl_start = content.find('vl:', idx)
bracket = content.find('[', vl_start)
chunk = content[bracket:bracket+60000]
end_bracket = chunk.find(']\n  },')
vl_text = chunk[:end_bracket+1]

lines = vl_text.split('\n')

# Show ALL lines from 28 to 34 with string state
in_string = False
string_char = None
for line_num, line in enumerate(lines):
    i = 0
    while i < len(line):
        ch = line[i]
        if in_string:
            if ch == '\\':
                i += 2
                continue
            elif ch == string_char:
                in_string = False
        else:
            if ch == "'" or ch == '"':
                in_string = True
                string_char = ch
        i += 1
    
    status = "🔴 IN_STRING" if in_string else "✅ OK"
    if 28 <= line_num <= 35:
        print(f"{status} L{line_num+1:3d} ({len(line):3d}ch) | {line[:120]}")
