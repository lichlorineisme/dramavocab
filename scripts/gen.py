#!/usr/bin/env python3
import json, os, re

ND = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'novels')
OF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dramavocab', 'src', 'stores', 'book-new.py')

BM = [
  {'id':'1','d':'book1-\u5951\u7ea6\u6210','t':'\u5951\u7ea6\u6210\u75be\uff1a\u5085\u603b\u4ed6\u84c0\u8c0b\u4e45\u5df2',
   's':'\u4e24\u5343\u4e07\u70ac\u591c\u5e74\uff0c\u4ed6\u5374\u84c0\u8c0b\u86\u5341\u5e74',
   'a':'\u5e03\u5409\u5c9b','e':'\ud83c\udf19',
   'dsc':'\u6211\u53eb\u6797\u665a\uff0c25\u5c81\uff0c\u81ea\u7531\u540c\u58f0\u4f20\u8bd1\u5458\u3002\u7236\u4eb2\u5165\u72f1\u4e09\u5e74\uff0c\u6211\u6b20\u4e86\u4e00\u5c41\u503a\u3002\u66b4\u96e8\u591c\uff0c\u5085\u6c0f\u56e2\u56e2\u80fa\u957f\u5085\u53f8\u5bd2\u4e00\u5343\u4e07\u2014\u2014\u5a36\u6211\u4e09\u5e74\u3002',
   'c':'linear-gradient(145deg,#7C3AED,#E11D48)','st':'published'},
  {'id':'2','d':'book2-NPC\u7684\u9006\u51fb','t':'\u6211\u5728\u9738\u603b\u6587\u91cc\u5f53NPC\u7684\u90a3\u4e9b\u5e74',
   's':'\u7a7f\u4e66\u00b7\u53cd\u5957\u8def\u00b7\u9006\u51fb\u723d\u6587',
   'a':'\u5e03\u5409\u5c9b','e':'\ud83c\udfae',
   'dsc':'\u59dc\u79bb\u7a7f\u8fdb\u4e86\u4e86\u4e00\u672c\u53eb\u300a\u9738\u9053\u603b\u88c1\u7684\u5951\u65b0\u73a9\u4e66\u3002\u5979\u4e0d\u662f\u5973\u4e3b\uff0c\u662f\u7537\u516c\u53f8\u91cc\u7684NPC\u884c\u653f\u52a9\u7406\u3002\u4f46\u59dc\u79bb\u51b3\u5b9a\u2014\u2014\u65e2\u7136\u7a7f\u4e86\uff0c\u5c31\u8981\u6d3b\u51fa\u51fa\u4e2a\u6837\u6765\u6765\uff01',
   'c':'linear-gradient(145deg,#F59E0B,#10B981)','st':'published'},
  {'id':'3','d':'book3-\u5973\u738b\u5f52\u6765','t':'\u5bd2\u5149\u7834\u6651\uff1a\u5973\u738b\u5f52\u6765',
   's':'\u5927\u5973\u4e3b\u00b7\u91cd\u751f\u590d\u4ec7\u00b7\u5546\u6218\u723d\u6587',
   'a':'\u5e03\u5409\u5c9b','e':'\u2744\ufe0f',
   'dsc':'\u6c88\u6e05\u821f\uff0c\u524d\u9996\u4e4b\u5973\u3002\u5bb6\u67d0\u4f01\u4e1a\u88ab\u5e76\u5e76\u3001\u7236\u4eb2\u88ab\u903c\u81ea\u6740\u3001\u672a\u5a29\u597b\u548c\u80cc\u63d1\u8054\u80cc\u5979\u9001\u8fdb\u76d1\u72f1\u3002\u4e09\u5e74\u540c\u5979\u51fa\u72f1\u4e86\u2014\u2014\u4ee5\u5168\u65b0\u8eab\u4efd\u6253\u5165\u654c\u4eba\u5185\u90e8\uff01',
   'c':'linear-gradient(145deg,#0EA5E9,#8B5CF6)','st':'published'}
]

def parseVoc(t):
    r=[];[r.append({'w':m[2],'i':m[3]}) for m in re.finditer(r'<span[^>]*data-word="([^"]+)"[^>]*>([^<]*)</span>[^\w]*[\uff08]\uff09]([^)]+)[)\uff09]',t)]
    if not r:
        [r.append({'w':m[2] or m[1],'i':''}) for m in re.finditer(r"<span[^>]*class=['\"]?word-highlight['\"]?(?:[^>]*data-word=['\"]([^'\"]+)['\"])?[^>]*>([^<]*)</span>",t) if (m[1] or m[2])]
    return r

def normSpans(t):
    t=re.sub(r'\*\*<span','<span',t);t=re.sub(r'</span>\*\*','</span>',t)
    t=re.sub(r'>\*\*([^<]+)\*\*</g','>\1<',t);t=re.sub(r'[\uff08][^)]+[)\uff09]','',t);return t

print('Converting...')
AB=[]
gCh=0;gV=set()
for M in BM:
    bd=os.path.join(ND,M['d'])
    if not os.path.exists(bd):print('SKIP',M['d']);continue
    print('[',M['id'],']',M['title'])
    fs0=[f for f in os.listdir(bd) if f.startswith('\u7b02') and f.endswith('.md')]
    fs0.sort(key=lambda f:int(re.search('\u7b02(\d+)',f).group(1) if re.search('\u7b02(\d+)',f) else 0))
    chs=[];aw=set()
    for i,fn in enumerate(fs0):
        fp=os.path.join(bd,fn)
        if not os.path.exists(fp):continue
        c=open(fp,'r',encoding='utf-8').read()
        title=re.match('^# (.+)$',c,re.M).group(1) or fn
        stitle=re.search(r'\u7b02\d+\u7ae0\s*(.+)',title).group(1).strip() or title
        body=re.sub(r'^# .+\n','',c);body=re.sub(r'^>.*$','',body,flags=re.M);body=re.sub(r'^---\n+','',body);body=re.sub(r'\n\*.*$','',body);body=re.sub(r'\n---\s*$','',body).strip()
        iv=parseVoc(body);vm={}
        for v in iv:
            k=v.w.lower();pi=v.i or '';ph=re.search(r'/[^/]+/',pi);p=ph.group(0) if ph else ''
            mn=re.sub(r'/[^\/]+\//','',pi).strip();mn=re.sub(r'^\s*[a-z]+\.\s*','',mn,flags=re.I).strip()
            if len(mn)>100:mn=mn[:100]
            if k not in vm:vm[k]={w:v['w'],p:p,m:mn,ex:f'The word "{v['w']}" means {mn}.'}
            elif mn and not vm[k].get('m'):vm[k]['m']=mn;vm[k]['ex']=f'The word "{vm[k][\'w']}" means {mn}.'
        rb=[b.strip() for b in body.split('\n\n') if len(b.strip())>5 and b.strip()!='---']
        ps=[{'raw':normSpans(bl).replace('\n','<br/>'),'tr':re.sub(r'<span[^>]*data-word="[^"]*"[^>]*>[^<]*<\/span>','[__]',bl).replace('*',' ').replace('\n',' ').replace('\\s+',' ').trim()} for bl in rb if re.search('[a-zA-Z]{3,}',bl)]
        chs.append({'id':f'ch{i+1}','title':title,'shortTitle':stitle,'para':ps,'vl':list(vm.values())})
        us={v['w'].lower()for v in vm.values()}
        aw.update(us);gV.update(us)
        print(' OK',title,':len(ps),'p',len(vm),'w')
    AB.append({**M,'tw':len(aw),'ch':chs})
    gCh+=chs.length

out='/**\n * DramaVocab Multi-Book Store ('+str(len(AB))+' books)\n */\nimport{defineStore}from"pinia";import{ref,computed}from"vue"\n\nconst BD='+json.dumps(AB,ensure_ascii=False)+';\nexport const useBookStore=defineStore("book",()=>{const books=ref(BD),cbid=ref(null),ccid=ref(null),cb=computed(()=>books.value.find(b=>b.id===cbid.value)||null),cc=computed(()=>cb.value?.ch.find(c=>c.id===ccid.value)||null);function openBook(id){cbid.value=id;ccid.value=null}function openChapter(id){ccid.value=id}function closeReading(){cbid.value=null;ccid.value=null}function getBookById(id){return books.value.find(b=>b.id===id)||null}function getChapterByIndex(bid,idx){return getBookById(bid)?.ch[idx]||null}function getAllBookVocabulary(bid){const b=getBookById(bid);if(!b)return[];const a=[],s=new Set();for(const ch of b.ch)for(const v of ch.vl||[]){const k=(v.word||'').toLowerCase();if(k&&!s.has(k)){s.add(k);a.push({word:v.word,p:v.p||'',m:v.m||''})}}return a}});'
with open(OF,'w',encoding='utf-8') as f:f.write(out)

print(f"\n{'='*50}")
print(f"DONE! {len(AB)} | {gCh}ch | {len(gV)}w")
for b in AB:print(f"[{b['id']}] {b.get('e','?')}: {b['ch_len'] if isinstance(b.get('ch'),len(b['ch']))else 0}ch, {b['tw']}w")
print(f"\n->{OF}")
