<template>
  <div class="guide-page">
    <section class="page-container guide-hero">
      <h1>AI 智能转化说明</h1>
      <p>把提示词喂给 GPT / 豆包 / Gemini，拿到结果后回「快速导入」即可，不需要复杂配置。</p>
    </section>

    <section class="page-container guide-card glass-panel">
      <h2>三步完成导入</h2>

      <ol class="step-list">
        <li class="step-item">
          <div class="step-head">
            <strong>第 1 步：复制提示词并发给大模型</strong>
            <button type="button" class="btn-secondary" @click="copyPrompt">
              {{ copied ? '已复制' : '复制提示词' }}
            </button>
          </div>
          <p>把下面整段提示词原样复制到你常用的模型平台。</p>
          <textarea class="prompt-box" :value="promptText" readonly />
        </li>

        <li class="step-item">
          <strong>第 2 步：上传原小说并生成结果</strong>
          <p>让模型按 <code>word(词性.释义)</code> 格式输出，并按章节组织内容。</p>
        </li>

        <li class="step-item">
          <strong>第 3 步：回快速导入开读</strong>
          <p>复制模型生成文本，或上传 txt / md / pdf 文件到快速导入。</p>
          <div class="jump-row">
            <router-link to="/import/processed" class="btn-primary">去快速导入</router-link>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const copied = ref(false)
const promptText = `你是 DramaVocab 的小说加工助手。请将我提供的小说文本处理成可导入格式，严格按以下要求输出：

1) 保留原剧情，不要总结，不要缩写。
2) 按章节输出，章节标题格式：第01章 标题 / 第02章 标题...
3) 在每段里插入适量英语词汇，统一写成：word(词性.中文释义)。
4) 单词分布要自然均匀，不要集中在段尾，不要刷重复词。
5) 每章建议 12-22 个词，难度以 CET4/6 + IELTS 为主。
6) 只输出最终文本，不要解释，不要加 Markdown 代码块。

现在请开始处理我上传的小说。`

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(promptText)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {}
}
</script>

<style scoped>
.guide-page {
  min-height: 100%;
  padding: 36px 0 88px;
}

.guide-hero {
  text-align: center;
}

.guide-hero h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 900;
}

.guide-hero p {
  margin: 12px auto 0;
  max-width: 900px;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.8;
}

.guide-card {
  margin-top: 24px;
  border-radius: 28px;
  padding: 22px;
}

.guide-card h2 {
  margin: 0 0 14px;
}

.step-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-item {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.step-item strong {
  font-size: 16px;
}

.step-item p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.72;
}

.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prompt-box {
  margin-top: 10px;
  width: 100%;
  min-height: 260px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.86);
  padding: 14px 16px;
  line-height: 1.72;
  resize: vertical;
}

.jump-row {
  margin-top: 12px;
}

@media (max-width: 760px) {
  .guide-page {
    padding: 24px 0 56px;
  }

  .guide-hero h1 {
    font-size: clamp(27px, 8.5vw, 34px);
  }

  .guide-hero p {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.62;
  }

  .guide-card {
    margin-top: 14px;
    padding: 14px;
    border-radius: 18px;
  }

  .guide-card h2 {
    margin-bottom: 10px;
    font-size: 19px;
  }

  .step-item {
    border-radius: 14px;
    padding: 12px;
  }

  .step-item strong {
    font-size: 15px;
    line-height: 1.45;
    display: block;
  }

  .step-item p {
    font-size: 13px;
    line-height: 1.62;
  }

  .step-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .step-head .btn-secondary {
    width: 100%;
    justify-content: center;
    border-radius: 12px;
    padding: 10px 14px;
  }

  .prompt-box {
    min-height: 210px;
    margin-top: 8px;
    border-radius: 12px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.58;
  }

  .jump-row .btn-primary {
    width: 100%;
    justify-content: center;
    border-radius: 12px;
  }
}
</style>
