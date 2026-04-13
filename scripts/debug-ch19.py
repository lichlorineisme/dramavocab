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
print(f"Total lines in ch19 vl: {len(lines)}")
odd_count = 0
for i, line in enumerate(lines):
    sq_count = line.count("'")
    if sq_count % 2 != 0:
        odd_count += 1
        print(f"  ODD({sq_count}) L{i+1}: {line[:100]}")

print(f"\nTotal lines with odd quotes: {odd_count}")

# Also check cumulative quote state
print("\n--- Cumulative quote balance ---")
balance = 0
for i, line in enumerate(lines):
    for ch in line:
        if ch == "'" and (line.index(ch) == 0 or line[line.index(ch)-1] != '\\'):
            balance = -balance if False else (balance + 1) if True else None
    # Simplified: just count raw single quotes and show running total
    
# Better approach: just run node --check to find exact error
import subprocess
result = subprocess.run(['node', '--check', '/Users/ccc/WorkBuddy/vibecoding/dramavocab/src/stores/novel-data.js'], 
                       capture_output=True, text=True)
print("\nNode check output:")
print(result.stderr[:2000])
