#!/usr/bin/env node
/* DramaVocab Converter v3.2 - Clean rewrite */
var fs=require('fs'),path=require('path')
var ND=path.join(__dirname,'..','novels')
var OF=path.join(__dirname,'..','dramavocab','src','stores','book-new.js')

var BM=[
 {id:'1',d:'book1-\u5951\u7ea6\u6210\u763e',t:'\u5951\u7ea6\u6210\u763e\uff1a\u5085\u603b\u4ed6\u84c0\u8c0b\u5df2\u4e45',
  s:'\u4e24\u5343\u4e07\u4e70\u4e09\u5e74\uff0c\u4ed6\u53784c4c\u8c0b\u4e86\u5341\u5e74',
  a:'\u5e03\u5409\u5c9b',e:'\ud83c\udf19',
  dsc:'\u6211\u53eb\u6797\u665a\uff0c25\u5c81\uff0c\u81ea\u7531\u540c\u58f0\u4f20\u8bd1\u5458\u3002',
  c:'linear-gradient(145deg,#7C3AED,#E11D48)',st:'published'},
 {id:'2',d:'book2-NPC\u7684\u9006\u88ad',
  t:'\u6211\u5728\u9738\u603b\u6587\u91cc\u5f53NPC\u7684\u90a3\u4e9b\u5e74',
  s:'\u7a7f\u4e66\u00b7\u53cd\u5957\u8def\u00b7\u9006\u88ad\u723d\u6587',
  a:'\u5e03\u5409\u5c9b',e:'\ud83c\udfae',
  dsc:'\u59dc\u79bb\u7a7f\u8fdb\u4e86\u4e00\u672c\u53eb\u300a\u9738\u9053\u603b\u88c1\u7684\u5951\u7ea6\u65b0\u5a18\u300b',
  c:'linear-gradient(145deg,#F59E0B,#10B981)',st:'published'},
 {id:'3',d:'book3-\u5973\u738b\u5f52\u6765',
  t:'\u5bd2\u5149\u7834\u6653\uff1a\u5973\u738b\u5f52\u6765',
  s:'\u5927\u5973\u4e3b\u00b7\u91cd\u751f\u590d\u4ec7\u00b7\u5546\u6218\u723d\u6587',
  a:'\u5e03\u5409\u5c9b',e:'\u2744\ufe0f',
  dsc:'\u6c88\u6e05舟\uff0c\u524d\u9996\u5bcc\u4e4b\u5973\u3002',
  c:'linear-gradient(145deg,#0EA5E9,#8B5CF6)',st:'published'}
]

function piv(t){return t.match(/^# (.+)$/m)?t.match(/^# (.+)$/m)[1]:t}
function pst(t){
 var m=t.match(/\u7B2C[\u4e00-\u4e5d\u5341\d]+\u7ae0\s*(.+)/)
 return m?m[1].trim():t
}
function bodyOf(c){
 return c.replace(/^# .+\n/,'').replace(/^>.*$/gm,'').replace(/^---\n?/gm,'').trim()
}

function parseVoc(b){
 var results=[]
 // Primary format: <span class="word-highlight">**word**</span>**（phonetic/ meaning）**
 var re=/<span[^>]*class=["']?word-highlight["']?(?:[^>]*)>\*\*(\w[\w'-]*)\*\*<\/span>\*{0,2}[\uff08(]([^\s][^\uff09)]{0,120})[\uff09)]/g
 var m
 while((m=re.exec(b))!==null){
  results.push({w:m[1],i:m[2]})
 }
 if(results.length===0){
  // Fallback: data-word attribute
  var re2=/<span[^>]*data-word="([^"]+)"[^>]*>[^<]*<\/span>[^\w]*[\uff08(]([^\uff09)]+)[\uff09)]/g
  while((m=re2.exec(b))!==null)results.push({w:m[1],i:m[2]})
 }
 if(results.length===0){
  var re3=/<span[^>]*class=["']?word-highlight["']?(?:[^>]*data-word=["']([^"]+)["'])?[^>]*>(?:\*\*)?(\w[\w'-]*)\*?\*?<\/span>/g
  while((m=re3.exec(b))!==null){var w=m[2]||m[1];if(w)results.push({w:w,i:''})}
 }
 return results
}

function pInfo(infoStr){
 if(!infoStr||infoStr.length===0)return{p:'',m:''}
 // Extract phonetic: /phonetic/ using regex for robustness
 var phMatch=infoStr.match(/(\/[^\/)]+\/)/)
 var p=phMatch?phMatch[1]:''
 // Remove phonetic part to get meaning
 var rest=infoStr.replace(/\/[^\/)]+\//,'').trim()
 // Remove type prefix like 'adj.' or 'n.' or 'v.'
 rest=rest.replace(/^\s*[a-z]+\.\s*/i,'').trim()
 if(rest&&rest.length>100)rest=rest.substring(0,100)
 return{p:p,m:rest}
}

function gDiff(w,i){
 var l=(i||'').toLowerCase(),lw=w.toLowerCase().replace(/\*/g,'')
 if(['ephemeral','ubiquitous','paradigm','meticulous'].includes(lw))return'advanced'
 if(l.indexOf('adv.')>=0&&l.length>15)return'advanced'
 if(/v\.|adj\.|n\./.test(l))return'intermediate'
 return'beginner'
}
function gEx(w,m){return'The word "'+w+'" means '+m+'.'}
function hEng(b){return/[a-zA-Z]{3,}/.test(b)}
function norm(t){
 var r=t
 // Step 1: Remove all ** markers anywhere (aggressive but safe for our use case)
 r=r.replace(/\*\*/g,'')
 // Step 2: Remove parenthetical annotations (phonetic/meaning info) 
 r=r.replace(/[\uff08(][^\uff09)]*[\uff09)]/g,'')
 return r.trim()
}

console.log('DramaVocab Converter v3.2\n')
var AB=[];var gCh=0;var gV=new Set()

for(var mi=0;mi<BM.length;mi++){
 var M=BM[mi]
 var bd=path.join(ND,M.d)
 if(!fs.existsSync(bd)){console.log('SKIP '+M.d);continue}
 console.log('['+M.id+'] '+M.t)

 var files=fs.readdirSync(bd).filter(function(f){
  return f.charCodeAt(0)===0x7B2C&&f.endsWith('.md')
 }).sort(function(a,b){
  var na=a.match(/\u7B2C(\d+)/),nb=b.match(/\u7B2C(\d+)/)
  return(parseInt(na?na[1]:'0')||0)-(parseInt(nb?nb[1]:'0')||0)
 })

 var chs=[],aw=new Set()
 for(var i=0;i<files.length;i++){
  var fp=path.join(bd,files[i])
  if(!fs.existsSync(fp))continue
  var ct=fs.readFileSync(fp,'utf-8')
  var ttl=piv(ct),stl=pst(ct)
  var chBody=bodyOf(ct)

  var iv=parseVoc(chBody)
  var vm=new Map()

  for(var vi=0;vi<iv.length;vi++){
   var v=iv[vi]
   var k=v.w.toLowerCase().replace(/\*/g,'')
   var pi=pInfo(v.i)
   if(!vm.has(k)){
    vm.set(k,{
     word:v.w.replace(/\*/g,''),
     phonetic:pi.p,
     meaning:pi.m,
     ex:gEx(v.w.replace(/\*/g,''),pi.m),
     diff:gDiff(v.w,v.i),
     syn:[]
    })
   }else{
    var existing=vm.get(k)
    if(pi.m&&!existing.meaning){
     existing.meaning=pi.m
     existing.ex=gEx(existing.word,pi.m)
    }
   }
  }

  var rb=chBody.split(/\n\n+/).map(function(x){return x.trim()})
   .filter(function(x){return x.length>5&&x!=='---'})
  var ps=rb.filter(hEng).map(function(bl){
   var trText=bl
    .replace(/<span[^>]*class=["']?word-highlight["']?[^>]*>\*?\*?\w[\w'-]*\*?\*?<\/span>[^\w]*[\uff08(][^\uff09)]+[\uff09)]?/g,'[__]')
    .replace(/<span[^>]*class=["']?word-highlight["']?[^>]*>(\*\*)?(\w[\w'-]*)\*?\*?<\/span>/g,'[$2]')
    .replace(/\*/g,' ').replace(/\n/g,' ').replace(/\s+/g,' ').trim()
   return{
    raw:norm(bl).replace(/\n/g,'<br/>'),
    tr:trText
   }
  })
  chs.push({id:'ch'+(i+1),title:ttl,stitle:stl,para:ps,vl:Array.from(vm.values())})
  var us=new Set()
  vm.forEach(function(val){us.add(val.word.toLowerCase())})
  us.forEach(function(w){aw.add(w)})
  us.forEach(function(w){gV.add(w)})
  console.log(' OK '+ttl+': '+ps.length+'p '+vm.size+'w')
 }
 AB.push(Object.assign({},M,{tw:aw.size,ch:chs}))
 gCh+=chs.length
}

var header="/**\n * DramaVocab Multi-Book Store ("+BM.length+" books)\n * Generated "+new Date().toISOString().split('T')[0]+"\n */\nimport {defineStore}from'pinia'\nimport{ref,computed}from'vue'\n\n"
var footer="\nexport const useBookStore=defineStore('book',()=>{\n const books=ref(BD)\n const cbid=ref(null),ccid=ref(null)\n const cb=computed(()=>books.value.find(b=>b.id===cbid.value)||null)\n const cc=computed()=>cb.value?.ch.find(c=>c.id===ccid.value)||null\n function openBook(id){cbid.value=id;ccid.value=null}\n function openChapter(id){ccid.value=id}\n function closeReading(){cbid.value=null;ccid.value=null}\n function getBookById(id){return books.value.find(b=>b.id===id)||null}\n function getChapterByIndex(bid,idx){return getBookById(bid)?.ch[idx]||null}\n function getAllBookVocabulary(bid){\n  var b=getBookById(bid);if(!b)return[]\n  var a=[];var s=new Set()\n  for(var ci=0;ci<b.ch.length;ci++){var ch=b.ch[ci];for(var vi=0;vi<(ch.vl||[]).length;vi++){var vv=ch.vl[vi];var k=(vv.word||'').toLowerCase();if(k&&!s.has(k)){s.add(k);a.push({w:vv.word,p:vv.phonetic||'',m:vv.meaning||''})}}}\n  return a\n }\n return{books,cbid,ccid,cb,cc,openBook,openChapter,closeReading,getBookById,getChapterByIndex,getAllBookVocabulary}\n})\n"

fs.writeFileSync(OF,header)
fs.appendFileSync(OF,'\nconst BD='+JSON.stringify(AB,null,2)+'\n')
fs.appendFileSync(OF,footer)

console.log('\n=======')
console.log('DONE! '+BM.length+' books | '+gCh+' ch | '+gV.size+' unique vocab')
for(var bi=0;bi<AB.length;bi++)console.log(' ['+AB[bi].id+'] '+AB[bi].e+' '+AB[bi].t+': '+AB[bi].ch.length+'ch '+AB[bi].tw+'w')
console.log('\n-> '+OF)
