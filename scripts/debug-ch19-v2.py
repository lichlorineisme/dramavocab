#!/usr/bin/env python3
"""精确诊断ch19语法错误"""
with open('/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js', 'r') as f:
    content = f.read()

# 找 ch19 vl 块
idx = content.find("id: 'ch19'")
vl_start = content.find('vl:', idx)
bracket = content.find('[', vl_start)
chunk = content[bracket:bracket+60000]
end_bracket = chunk.find(']\n  },')
vl_text = chunk[:end_bracket+1]

lines = vl_text.split('\n')

# 模拟 JS 解析器：追踪字符串状态
in_string = False
string_char = None

for line_num, line in enumerate(lines):
    i = 0
    while i < len(line):
        ch = line[i]
        
        if in_string:
            if ch == '\\':
                i += 2  # skip escape sequence
                continue
            elif ch == string_char:
                in_string = False
            # else: continue in string
        else:
            # not in string
            if ch == "'" or ch == '"':
                in_string = True
                string_char = ch
        
        i += 1
    
    status = "🔴 IN_STRING" if in_string else "✅ OK"
    if "gracious" in line or in_string:
        print(f"{status} L{line_num+1:3d} | {line[:110]}")

print("\n--- If IN_STRING persists to end of vl ---")
if in_string:
    print("ERROR: String never closed before end of ch19 vl!")
