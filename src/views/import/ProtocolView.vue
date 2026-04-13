<template>
  <div class="protocol-page">
    <section class="page-container protocol-hero">
      <div>
        <span class="section-chip">Protocol</span>
        <h1 class="section-title">DramaVocab 标准 JSON 协议</h1>
        <p class="section-subtitle">
          这是一份把“系统书”“用户导入”“下一步模型生成”统一到一个出口的协议。
          只要最后落到这套结构，阅读器三模式、书库、单词本就都能继续复用。
        </p>
      </div>
      <div class="version-tag">v{{ DRAMA_PROTOCOL_VERSION }}</div>
    </section>

    <section class="page-container protocol-grid">
      <article class="protocol-card glass-panel">
        <h2>Book</h2>
        <p>书籍级元数据，负责承接来源、封面、状态和章节列表。</p>
      </article>
      <article class="protocol-card glass-panel">
        <h2>Chapter</h2>
        <p>章节需要同时保留可直接阅读的段落数组，以及本章可被识别的词汇表。</p>
      </article>
      <article class="protocol-card glass-panel">
        <h2>Vocabulary</h2>
        <p>词汇项最少要包含单词与释义，词性、音标、例句、词库来源都作为增强字段保留。</p>
      </article>
    </section>

    <section class="page-container protocol-code glass-panel">
      <div class="code-head">
        <h2>协议示例</h2>
        <router-link to="/import/processed" class="btn-secondary">去试导入</router-link>
      </div>
      <pre><code>{{ exampleJson }}</code></pre>
    </section>
  </div>
</template>

<script setup>
import { DRAMA_PROTOCOL_VERSION } from '@/lib/import/dramaProtocol.js'

const exampleJson = `{
  "id": "import-1712999999999",
  "title": "夜色协议",
  "subtitle": "",
  "author": "有栖",
  "emoji": "🌃",
  "description": "由用户导入并转换为 DramaVocab 标准协议",
  "coverColor": "linear-gradient(145deg, #A855F7, #FB7185)",
  "status": "published",
  "sourceType": "processed-text",
  "schemaVersion": "${DRAMA_PROTOCOL_VERSION}",
  "importMeta": {
    "createdAt": "2026-04-13T00:00:00.000Z",
    "parser": "processed-regex-v1",
    "selectedLexicons": []
  },
  "chapters": [
    {
      "id": "1",
      "title": "第01章 雨里的邀约",
      "shortTitle": "雨里的邀约",
      "paragraphs": [
        { "raw": "B市的九月，雨总是来得很 abrupt。" }
      ],
      "vocabList": [
        {
          "word": "abrupt",
          "meaning": "突然的",
          "pos": "adj.",
          "phonetic": "",
          "example": "B市的九月，雨总是来得很 abrupt。",
          "difficulty": "intermediate",
          "lexicon": [],
          "source": "processed-text"
        }
      ]
    }
  ]
}`
</script>

<style scoped>
.protocol-page {
  padding: 36px 0 88px;
}

.protocol-hero,
.code-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}

.version-tag {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #F9A8D4;
  font-weight: 800;
}

.protocol-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.protocol-card,
.protocol-code {
  border-radius: 28px;
}

.protocol-card {
  padding: 24px;
}

.protocol-card h2,
.code-head h2 {
  margin: 0 0 12px;
}

.protocol-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.75;
}

.protocol-code {
  margin-top: 28px;
  padding: 24px;
}

pre {
  overflow: auto;
  margin: 18px 0 0;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  color: #F5EFFF;
  font-size: 13px;
  line-height: 1.75;
}

@media (max-width: 980px) {
  .protocol-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .protocol-page {
    padding-top: 24px;
  }

  .protocol-hero,
  .code-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
