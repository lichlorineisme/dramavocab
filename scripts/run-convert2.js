#!/usr/bin/env node
// Minimal multi-book converter v5 - uses Buffer.write to avoid encoding issues
const fs = require('fs'), p = require('path')
const ND = p.join(__dirname, '..', 'novels')
const OF = p.join(__dirname, '..', 'dramavocab', 'src', 'stores', 'book-new.js')

// Book metadata - using ASCII only for keys
var books_meta = [
  { id: "1", dir: "book1-\u5951\u7ea6\u6210", title: "\u5951\u7ea6\u6210\u75be\uff1a\u5085\u603b\u4ed6\u84c0\u8c0b\u4e45\u5df2",
    sub: "\u4e24\u5343\u4e07\u4e70\u591c\u5e74\uff0c\u4ed6\u5374\u84c0\u8c0b\u86\u5341\u5e74",
    author: "\u5e03\u5409\u5c9b", emoji: "\ud83c\udf19",
    desc: "\u6211\u53eb\u6797\u665a\uff0c25\u5c81\uff0c\u81ea\u7531\u540c\u58f0\u4f20\u8bd1\u5458\u3002\u7236\u4eb2\u5165\u72f1\u4e09\u5e74\uff0c\u6211\u6b20\u4e86\u4e00\u5c41\u503a\u3002\u66b4\u96e8\u591c\uff0c\u5085\u6c0f\u56e2\u56e2\u80fa\u957f\u5085\u53f8\u5bd2\u4e00\u5343\u4e07\u2014\u2014\u5a36\u6211\u4e09\u5e74\u3002",
    color: "linear-gradient(145deg,#7C3AED,#E11D48)" },
  { id: "2", dir: "book2-NPC\u7684\u9006\u51fb", title: "\u6211\u5728\u9738\u603b\u6587\u91cc\u5f53NPC\u7684\u90a3\u4e9b\u5e74",
    sub: "\u7a7f\u4e66\u00b7\u53cd\u5957\u8def\u00b7\u9006\u51fb\u723d\u6587",
    author: "\u5e03\u5409\u5c9b", emoji: "\ud83c\udfae",
    desc: "\u59dc\u79bb\u7a7f\u8fdb\u4e86\u4e86\u4e00\u672c\u53eb\u300a\u9738\u9053\u603b\u88c1\u7684\u5951\u65b0\u73a9\u4e66\u3002\u5979\u4e0d\u662f\u5973\u4e3b\uff0c\u662f\u7537\u516c\u53f8\u91cc\u7684NPC\u884c\u653f\u52a9\u7406\u3002\u4f46\u59dc\u79bb\u51b3\u5b9a\u2014\u2014\u65e2\u7136\u7a7f\u4e86\uff0c\u5c31\u8981\u6d3b\u51fa\u51fa\u4e2a\u6837\u6765\u6765\uff01",
    color: "linear-gradient(145deg,#F59E0B,#10B981)" },
  { id: "3", dir: "book3-\u5973\u738b\u5f52\u6765", title: "\u5bd2\u5149\u7834\u6651\uff1a\u5973\u738b\u5f52\u6765",
    sub: "\u5927\u5973\u4e3b\u00b7\u91cd\u751f\u590d\u4ec7\u00b7\u5546\u6218\u723d\u6587",
    author: "\u5e03\u5409\u5c9b", emoji: "\u2744\ufe0f",
    desc: "\u6c88\u6e05\u821f\uff0c524d\u9996\u4e4b\u5973\u3002\u5bb6\u67d0\u4f01\u4e1a\u88ab\u5e76\u5e76\u3001\u7236\u4eb2\u88ab\u903c\u81ea\u6740\u3001\u672a\u5a29\u597b\u548c\u80cc\u63d1\u8054\u80cc\u5979\u9001\u8fdb\u76d1\u72f1\u3002\u4e09\u5e74\u540c\u5979\u51fa\u72f1\u4e86\u2014\u2014\u4ee5\u5168\u65b0\u8eab\u4efd\u6253\u5165\u654c\u4eba\u5185\u90e8\uff01",
    color: "linear-gradient(145deg,#0EA5E9,#8B5CF6)" }
]

function parseVoc(text) {
  var r = [], re = /<span[^>]*data-word="([^"]+)"[^>]*>([^<]*)<\/span>[^\w]*[\uff08\uff09]\uff08([^)]+)[)\uff09]/g
  var m
  while ((m = re.exec(text)) !== null) r.push({ w: m[2], i: m[3] })
  if (r.length === 0) {
    var r2 = /<span[^>]*class=["']?word-highlight["']?(?:[^>]*data-word=["']([^"]+)["'])?[^>]*>([^<]*)<\/span>/g
    while ((m = r2.exec(text)) !== null) { if (m[1] || m[2]) r.push({ w: m[2] || m[1], i: "" }) }
  }
  return r
}
function normSpans(t) {
  var r = t
  r = r.replace(/\*\*<span/g, "<span")
  r = r.replace(/<\/span>\*\*/g, "</span>")
  r = r.replace(/>\*\*([^<]+)\*\*</g, ">$1</")
  r = r.replace(/[\uff08\uff09][^)\uff09]+[)\uff09]/g, "")
  return r
}

console.log("DramaVocab Multi-Book Converter v5\n")

var AB = [], gCh = 0, gV = new Set()
for (var bi = 0; bi < books_meta.length; bi++) {
  var M = books_meta[bi]
  var bd = p.join(ND, M.dir)
  if (!fs.existsSync(bd)) { console.log("SKIP: " + M.dir); continue }
  console.log("[" + M.id + "] " + M.title)
  
  var files = fs.readdirSync(bd).filter(function (f) { return f.charCodeAt(0) === 0x7b02 && f.endsWith(".md") })
    .sort(function (a, b) {
      var an = parseInt(a.match(/\u7b02(\d+)/)[1] || "0"), bn = parseInt(b.match(/\u7b02(\d+)/)[1] || "0")
      return an - bn
    })
  
  var chs = [], aw = new Set()
  for (var i = 0; i < files.length; i++) {
    var fp = p.join(bd, files[i])
    if (!fs.existsSync(fp)) continue
    var content = fs.readFileSync(fp, "utf-8")
    var title = content.match(/^# (.+)$/m) ? content.match(/^# (.+)$/m)[1] : files[i]
    var stitle = title.match(/\u7b02\d+\u7ae0\s*(.+)/) ? title.match(/\u7b02\d+\u7ae0\s*(.+)/)[1].trim() : title
    
    var body = content.replace(/^# .+\n/, "").replace(/^>.*$/gm, "").replace(/^---\n+/, "").replace(/\n\*.*$/, "").replace(/\n---\s*$/, "").trim()
    
    var iv = parseVoc(body), vm = new Map()
    for (var vi = 0; vi < iv.length; vi++) {
      var v = iv[vi]
      var k = v.w.toLowerCase()
      var phMatch = v.i ? v.i.match(/\/[^\/]+/) : null
      var ph = phMatch ? phMatch[0] : ""
      var mn = v.i ? v.i.replace(/\/[^\/]+\//g, "").replace(/^\s*[a-z]+\.\s*/i, "").trim() : ""
      if (mn.length > 100) mn = mn.substring(0, 100)
      if (!vm.has(k)) {
        vm.set(k, { word: v.w, phonetic: ph, meaning: mn, example: "The word \"" + v.w + "\" means " + mn + ".", difficulty: "intermediate", synonyms: [] })
      } else if (mn && !vm.get(k).meaning) {
        vm.get(k).meaning = mn
        vm.get(k).example = "The word \"" + vm.get(k).word + "\" means " + mn + "."
      }
    }
    
    var rb = body.split(/\n\n+/).map(function (x) { return x.trim() }).filter(function (x) { return x.length > 5 && x !== "---" })
    var ps = rb.filter(function (bl) { return /[a-zA-Z]{3,}/.test(bl) }).map(function (bl) {
      return {
        raw: normSpans(bl).replace(/\n/g, "<br/>"),
        tr: bl.replace(/<span[^>]*data-word="[^"]*"[^>]*>[^<]*<\/span>/g, "[__]").replace(/\*/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim()
      }
    })
    
    chs.push({ id: "ch" + (i + 1), title: title, shortTitle: stitle, paragraphs: ps, vocabList: Array.from(vm.values()) })
    
    var us = new Set(Array.from(vm.values()).map(function (v) { return v.word.toLowerCase() }))
    us.forEach(function (w) { aw.add(w) })
    us.forEach(function (w) { gV.add(w) })
    console.log("   OK " + title + ": " + ps.length + "p, " + vm.size + "w")
  }
  AB.push({ id: M.id, title: M.title, subtitle: M.sub, author: M.author, emoji: M.emoji,
    description: M.desc, coverColor: M.color, status: "published", totalWords: aw.size, chapters: chs })
  gCh += chs.length
  console.log("   [" + M.id + "] done: " + chs.length + "ch\n")
}

// Build output
var lines = []
lines.push("/**")
lines.push(" * DramaVocab Multi-Book Store (" + AB.length + " books)")
lines.push(" * Generated: " + new Date().toISOString().split("T")[0])
lines.push(" */")
lines.push("")
lines.push("import { defineStore } from 'pinia'")
lines.push("import { ref, computed } from 'vue'")
lines.push("")
lines.push("const BOOKS_DATA = " + JSON.stringify(AB, null, 2))
lines.push("")
lines.push("export const useBookStore = defineStore('book', () => {")
lines.push("  const books = ref(BOOKS_DATA)")
lines.push("  const currentBookId = ref(null)")
lines.push("  const currentChapterId = ref(null)")
lines.push("  const currentBook = computed(() => books.value.find(b => b.id === currentBookId.value) || null)")
lines.push("  const currentChapter = computed(() => currentBook.value?.chapters.find(c => c.id === currentChapterId.value) || null)")
lines.push("  function openBook(id) { currentBookId.value = id; currentChapterId.value = null }")
lines.push("  function openChapter(id) { currentChapterId.value = id }")
lines.push("  function closeReading() { currentBookId.value = null; currentChapterId.value = null }")
lines.push("  function getBookById(id) { return books.value.find(b => b.id === id) || null }")
lines.push("  function getChapterByIndex(bookId, index) { var b = getBookById(bookId); return b?.chapters[index] || null }")
lines.push("  function getAllBookVocabulary(bookId) {")
lines.push("    var b = getBookById(bookId); if (!b) return []")
lines.push("    var a = [], seen = new Set()")
lines.push("    for (var ci = 0; ci < b.chapters.length; ci++) for (var vi = 0; vi < b.chapters[ci].vocabList.length; vi++) {")
lines.push("      var v = b.chapters[ci].vocabList[vi]; var k = (v.word || '').toLowerCase(); if (k && !seen.has(k)) { seen.add(k); a.push({ word: v.word, phonetic: v.phonetic || '', meaning: v.meaning || '' }) } }")
lines.push("    }")
lines.push("    return a")
lines.push("  }")
lines.push("  return { books, currentBookId, currentChapterId, currentBook, currentChapter,")
lines.push("    openBook, openChapter, closeReading, getBookById, getChapterByIndex, getAllBookVocabulary }")
lines.push("})")

fs.writeFileSync(OF, lines.join("\n"), "utf-8")

console.log("\n===========")
console.log("DONE! " + AB.length + " books | " + gCh + " chapters | " + gV.size + " vocab")
for (var bi = 0; bi < AB.length; bi++) console.log("  [" + AB[bi].id + "] " + AB[bi].emoji + ": " + AB[bi].ch.length + "ch, " + AB[bi].totalWords + "w")
console.log("\nOutput: " + OF)
