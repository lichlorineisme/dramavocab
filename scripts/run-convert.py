#!/usr/bin/env python3
# DramaVocab Multi-Book Converter (Python version)
import json, os, re

novels_dir = os.path.join(os.path.dirname(__file__), '..', 'novels')
out_file = os.path.join(os.path.dirname(__file__), '..', 'dramavocab', 'src', 'stores', 'book-new.py')

books = [
    {'id':'1','dir':'book1-\u5951\u7ea6\u6210','title':'\u5951\u7ea6\u6210\u75be\uff1a\u5085\u603b\u4ed6\u84c0\u8c0b\u4e45\u5df2',
     'sub':'\u4e24\u5343\u4e07\u70ac\u591c\u5e74\uff0c\u4ed6\u5374\u84c0\u8c0b\u86\u5341\u5e74',
     'author':'\u5e03\u5409\u5c9b','emoji':'\ud83c\udf19',
     'desc':'\u6211\u53eb\u6797\u665a\uff0c25\u5c81\uff0c\u81ea\u7531\u540c\u58f0\u4f20\u8bd1\u5458\u3002\u7236\u4eb2\u5165\u72f1\u4e09\u5e74\uff0c\u6211\u6b20\u4e86\u4e00\u5c41\u503a\u3002\u66b4\u96e8\u591c\uff0c\u5085\u6c0f\u56e2\u56e2\u80fa\u957f\u5085\u53f8\u5bd2\u4e00\u5343\u4e07——\u5a36\u6211\u4e09\u5e74\u3002',
     'color':'linear-gradient(145deg,#7C3AED,#E11D48)','status':'published'},
    {'id':'2','dir':'book2-NPC\u7684\u9006\u51fb','title':'\u6211\u5728\u9738\u603b\u6587\u91cc\u5f53NPC\u7684\u90a3\u4e9b\u5e74',
     'sub':'\u7a7f\u4e66\u00b7\u53cd\u5957\u8def\u00b7\u9006\u51fb\u723d\u6587',
     'author':'\u5e03\u5409\u5c9b','emoji':'\ud83c\udfae',
     'desc':'\u59dc\u79bb\u7a7f\u8fdb\u4e86\u4e86\u4e00\u672c\u53eb\u300a\u9738\u9053\u603b\u88c1\u7684\u5951\u65b0\u73a9\u4e66\u3002\u5979\u4e0d\u662f\u5973\u4e3b\uff0c\u662f\u7537\u516c\u53f8\u91cc\u7684NPC\u884c\u653f\u52a9\u7406\u3002\u4f46\u59dc\u79bb\u51b3\u5b9a——\u65e2\u7136\u7a7f\u4e86\uff0c\u5c31\u8981\u6d3b\u51fa\u51fa\u4e2a\u6837\u6765\u6765\uff01',
     'color':'linear-gradient(145deg,#F59E0B,#10B981)','status':'published'},
    {'id':'3','dir':'book3-\u5973\u738b\u5f52\u6765','title':'\u5bd2\u5149\u7834\u6651\uff1a\u5973\u738b\u5f52\u6765',
     'sub':'\u5927\u5973\u4e3b\u00b7\u91cd\u751f\u590d\u4ec7\u00b7\u5546\u6218\u723d\u6587',
     'author':'\u5e03\u5409\u5c9b','emoji':'\u2744\ufe0f',
     'desc':'\u6c88\u6e05\u821f\uff0c\u524d\u9996\u4e4b\u5973\u3002\u5bb6\u67d0\u4f01\u4e1a\u88ab\u5e76\u5e76\u3001\u7236\u4eb2\u88ab\u903c\u81ea\u6740\u3001\u672a\u5a29\u597b\u548c\u80cc\u63d1\u8054\u80cc\u5979\u9001\u8fdb\u76d1\u72f1\u3002\u4e09\u5e74\u540c\u5979\u51fa\u72f1\u4e86——\u4ee5\u5168\u65b0\u8eab\u4efd\u6253\u5165\u654c\u4eba\u5185\u90e8\uff01',
     'color':'linear-gradient(145deg,#0EA5E9,#8B5CF6)','status':'published'}
]

def parse_vocab(text):
    results = []
    # <span class="word-highlight" data-word="w">w</span>（m）
    for m in re.finditer(r'<span[^>]*data-word="([^"]+)"[^>]*>([^<]*)</span>[^\w]*[（(]([^)]+)[）)]', text):
        results.append({'w': m.group(2), 'i': m.group(3)})
    if not results:
        for m in re.finditer(r'<span[^>]*class=["\'"]?word-highlight["\']?(?:[^>]*data-word=["\']([^"]+)["'])?[^>]*>([^<]*)</span>', text):
            if m.group(1) or m.group(2): results.append({'w': m.group(2) or m.group(1), 'i': ''})
    return results

def norm_spans(text):
    r = text
    r = re.sub(r'\*\*<span', '<span', r)
    r = re.sub(r'</span>\*\*', '</span>', r)
    r = re.sub(r'>\*\*([^<]+)\*\*</g>', r'>\1</', r)
    r = re.sub(r'[\uff08\uff09][^)]+[)\uff09]', '', r)
    return r

print('DramaVocab Multi-Book Converter (Python)')
all_books = []
total_ch = 0
all_vocab = set()

for M in books:
    bd = os.path.join(novels_dir, M['dir'])
    if not os.path.exists(bd): print('SKIP:', M['dir']); continue
    print(f"[{M['id']}] {M['title']}")
    
    files = [f for f in os.listdir(bd) if f.startswith('\u7b02') and f.endswith('.md')]
    files.sort(key=lambda f: int(re.search(r'\u7b02(\d+)', f)[1] if re.search(r'\u7b02(\d+)', f) else 0))
    
    chs = []
    aw = set()
    for i, fn in enumerate(files):
        fp = os.path.join(bd, fn)
        if not os.path.exists(fp): continue
        content = open(fp, 'r', encoding='utf-8').read()
        
        title = re.match(r'^# (.+)$', content, re.M).group(1) or fn
        stitle = re.search(r'\u7b02\d+\u7ae0\s*(.+)', title).group(1).strip() or title
        
        body = re.sub(r'^# .+\n','',content)
        body = re.sub(r'^>.*$','',body,flags=re.M)
        body = re.sub(r'^---\n+','',body)
        body = re.sub(r'\n\*.*$','',body)
        body = re.sub(r'\n---\s*$','',body).strip()
        
        iv = parse_vocab(body)
        vm = {}
        for v in iv:
            k = v['w'].lower()
            pi = v['i'] or ''
            ph_m = re.search(r'/([^/]+)/', pi)
            ph = ph_m.group(1) if ph_m else ''
            mn = re.sub(r'/[^\/]+\//','',pi).strip()
            mn = re.sub(r'^\s*[a-z]+\.\s*','',mn,flags=re.I).strip()
            if len(mn)>100: mn=mn[:100]
            if k not in vm:
                vm[k]={'word':v['w'],'phonetic':ph,'meaning':mn,'ex':f"The word \"{v['w']}\" means {mn}.",'diff':'intermediate','syn':[]'}
            elif mn and not vm[k].get('meaning'):
                vm[k]['meaning']=mn;vm[k]['ex']=f"The word \"{vm[k]['word']}\" means {mn}."
        
        blocks = [b.strip() for b in body.split('\n\n') if len(b.strip())>5 and b.strip()!='---']
        ps = []
        for bl in blocks:
            if not re.search(r'[a-zA-Z]{3,}',bl): continue
            raw = norm_spans(bl).replace('\n','<br/>')
            tr = re.sub(r'<span[^>]*data-word="[^"]*"[^>]*>[^<]*</span>','[__]',raw).replace('*',' ').replace('\n',' ').replace('\\s+',' ').strip()
            ps.append({'raw':raw,'tr':tr})
        
        chs.append({'id':f'ch{i+1}','title':title,'shortTitle':stitle,'paragraphs':ps,'vocabList':list(vm.values())})
        us = {v['w'].lower() for v in vm.values()}
        aw.update(us); all_vocab.update(us)
        print(f"   OK {title}: {len(ps)}p, {len(vm)}w")
    
    all_books.append({**M,'totalWords':len(aw),'chapters':chs})
    total_ch+=len(chs)
    print(f"   [{M['id']}] done: {len(chs)}ch\n")

# Build JS module
lines=[]
lines.append('/**')
lines.append(' * DramaVocab Multi-Book Store (' + str(len(all_books)) + ' books)')
lines.append(' * Generated by convert script | '+ __import__('datetime').date.today().isoformat())
lines.append(' */')
lines.append('')
lines.append("import { defineStore } from 'pinia';")
lines.append("import { ref, computed } from 'vue';")
lines.append('')
lines.append("const BOOKS_DATA = " + json.dumps(all_books, ensure_ascii=False, indent=2) + ";")
lines.append('')
lines.append("export const useBookStore = defineStore('book', () => {")
lines.append("  const books = ref(BOOKS_DATA);")
lines.append("  const currentBookId = ref(null), currentChapterId = ref(null);")
lines.append("  const currentBook = computed(() => books.value.find(b=>b.id===currentBookId.value)||null);")
lines.append("  const currentChapter = computed(()=>currentBook.value?.chapters.find(c=>c.id===currentChapterId.value)||null);")
lines.append("  function openBook(id){currentBookId.value=id;currentChapterId.value=null;}")
lines.append("  function openChapter(id){currentChapterId.value=id;}")
lines.append("  function closeReading(){currentBookId.value=null;currentChapterId.value=null;}")
lines.append("  function getBookById(id){return books.value.find(b=>b.id===id)||null;}")
lines.append("  function getChapterByIndex(bookId,idx){const b=getBookById(bookId);return b?.chapters[idx]||null;}")
lines.append("  function getAllBookVocabulary(bookId){")
lines.append("    var b=getBookById(bookID);if(!b)return[];var a=[],s=new Set();")
lines.append("    for(var ci=0;ci<b.ch.length;ci++)for(var vi=0;vi<b.ch[ci].vocabList.length;vi++){var v=b.ch[ci].vocabList[vi];var k=(v.word||'').toLowerCase();if(k&&!s.has(k)){s.add(k);a.push({word:v.word,phonetic:v.phonetic||'',meaning:v.meaning||''})}}")
lines.push("    return a;")
lines.push("  }")
lines.append("  return{books,currentBookId,currentChapterId,currentBook,currentChapter,openBook,openChapter,closeReading,getBookById,getChapterByIndex,getAllBookVocabulary};")
lines.append("});")

with open(out_file,'w',encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"\n{'='*50}")
print(f"DONE! {len(all_books)} books | {total_ch} chapters | {len(all_vocab)} vocab")
for b in all_books:
    print(f"  [{b['id']}] {b.get('emoji','?')}: {b['ch_len'] if isinstance(b.get('ch'),len(b['ch'])) else 0}ch, {b['totalWords']}w")
print(f"\n-> {out_file}")
