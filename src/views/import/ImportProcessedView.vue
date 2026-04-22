<template>
  <div class="import-page">
    <section class="page-container back-row">
      <button type="button" class="btn-secondary back-btn" @click="goBack">← 返回上一层</button>
    </section>

    <section class="page-container editor-grid">
      <div class="editor-panel glass-panel">
        <div class="panel-head">
          <span class="section-chip">Fast Import</span>
          <h1>快速导入</h1>
          <p>
            把大模型或你手动整理好的 <code>word(释义)</code> 文本贴进来，预览没问题就能立即开读。
          </p>
        </div>

        <div class="form-grid">
          <label>
            书名
            <input v-model.trim="form.title" type="text" placeholder="例如：夜色协议" />
          </label>
          <label>
            作者
            <input v-model.trim="form.author" type="text" placeholder="例如：有栖" />
          </label>
          <label>
            Emoji
            <input v-model.trim="form.emoji" type="text" maxlength="2" placeholder="📘" />
          </label>
          <label>
            简介
            <input v-model.trim="form.description" type="text" placeholder="一句话说明这本书的气质" />
          </label>
        </div>

        <div class="content-entry-grid">
          <label class="textarea-group">
            <div class="entry-head">
              <span>正文文本</span>
              <small>示例已内置，可直接覆盖</small>
            </div>
            <textarea
              v-model="form.sourceText"
              rows="16"
              :placeholder="samplePlaceholder"
            />
          </label>

          <section class="upload-group">
            <div class="entry-head">
              <span>上传文件</span>
              <small>和正文同级，可二选一</small>
            </div>

            <label class="upload-dropzone" :class="{ loading: isReadingFile }">
              <input type="file" accept=".txt,.md,.pdf" @change="handleFileChange" />
              <strong>{{ isReadingFile ? '正在解析文件...' : '选择文件上传' }}</strong>
              <p>支持 .txt / .md / .pdf</p>
            </label>

            <p class="file-tip">{{ fileTip }}</p>
          </section>
        </div>

        <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

        <div class="action-row action-row-center">
          <button type="button" class="btn-primary" @click="buildPreview">生成预览</button>
        </div>
      </div>

      <div class="preview-panel glass-panel">
        <div class="panel-head">
          <span class="section-chip">Preview</span>
          <h2>导入预览</h2>
          <p>先看章节、段落和词汇抽取效果，再决定是否保存。</p>
        </div>

        <template v-if="previewBook">
          <div class="summary-grid">
            <article class="summary-card">
              <strong>{{ previewSummary.chapterCount }}</strong>
              <span>章节</span>
            </article>
            <article class="summary-card">
              <strong>{{ previewSummary.paragraphCount }}</strong>
              <span>段落</span>
            </article>
            <article class="summary-card">
              <strong>{{ previewSummary.vocabCount }}</strong>
              <span>词汇</span>
            </article>
          </div>

          <div class="preview-block">
            <h3>词汇预览</h3>
            <div class="token-grid">
              <span v-for="item in previewTokens" :key="item.word" class="token">
                {{ item.word }}<small>{{ item.meaning }}</small>
              </span>
            </div>
          </div>

          <div class="preview-block">
            <h3>首章首段</h3>
            <p class="preview-copy">{{ previewParagraph }}</p>
          </div>

          <div class="action-row">
            <button type="button" class="btn-primary" @click="saveAndRead">保存并阅读</button>
            <router-link to="/" class="btn-secondary">返回首页</router-link>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>右侧会显示解析后的章节、词汇与正文预览。</p>
          <p>预览通过后可直接进入阅读器。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseProcessedNovel } from '@/lib/import/processedParser.js'
import { summarizeBook } from '@/lib/import/dramaProtocol.js'
import { readImportFile } from '@/lib/import/fileImportReader.js'
import { useBookStore } from '@/stores/book.js'
import { EVENT, trackEvent } from '@/utils/analytics.js'

const samplePlaceholder = `示例（浅灰提示）：
第01章 雨里的邀约

B市的九月，雨总是来得很 abrupt(adj. 突然的)。

我叫林晚，25岁，是一名 freelance(adj. 自由职业的) 同声传译员。`

const router = useRouter()
const bookStore = useBookStore()

const form = reactive({
  title: '',
  author: '有栖',
  emoji: '📘',
  description: '',
  sourceText: '',
})

const isReadingFile = ref(false)
const errorMessage = ref('')
const fileTip = ref('尚未上传文件')
const previewBook = ref(null)

const previewSummary = computed(() => summarizeBook(previewBook.value))
const previewTokens = computed(() => previewBook.value?.chapters?.[0]?.vocabList?.slice(0, 10) || [])
const previewParagraph = computed(() => previewBook.value?.chapters?.[0]?.paragraphs?.[0]?.raw || '暂无预览')

onMounted(() => {
  trackEvent(EVENT.IMPORT_FAST_ENTRY, { source: 'import_processed' })
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/import')
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  errorMessage.value = ''
  isReadingFile.value = true

  try {
    const { text, meta } = await readImportFile(file)
    form.sourceText = text
    trackEvent(EVENT.IMPORT_FILE_UPLOAD_SUCCESS, {
      file_type: meta?.type || 'text',
      file_size_kb: Math.round(file.size / 1024),
      file_name: file.name,
    })
    if (meta?.type === 'pdf') {
      fileTip.value = `已载入 PDF：${file.name}（${meta.pages} 页）`
    } else {
      fileTip.value = `已载入：${file.name}`
    }
  } catch (error) {
    trackEvent(EVENT.IMPORT_FILE_UPLOAD_FAIL, {
      error_message: error?.message || '文件解析失败',
    })
    errorMessage.value = error.message || '文件解析失败'
  } finally {
    isReadingFile.value = false
    event.target.value = ''
  }
}

function buildPreview() {
  try {
    const parsed = parseProcessedNovel({
      title: form.title,
      author: form.author,
      description: form.description,
      emoji: form.emoji || '📘',
      sourceText: form.sourceText,
    })
    previewBook.value = parsed
    trackEvent(EVENT.IMPORT_PREVIEW_SUCCESS, {
      chapter_count: parsed?.chapters?.length || 0,
      vocab_count: (parsed?.chapters || []).reduce((sum, chapter) => sum + (chapter.vocabList?.length || 0), 0),
    })
    errorMessage.value = ''
  } catch (error) {
    trackEvent(EVENT.IMPORT_PREVIEW_FAIL, {
      error_message: error?.message || '导入预览生成失败',
    })
    previewBook.value = null
    errorMessage.value = error.message || '导入预览生成失败'
  }
}

function saveAndRead() {
  if (!previewBook.value) return
  const savedBook = bookStore.addImportedBook(previewBook.value)
  trackEvent(EVENT.IMPORT_SAVE_SUCCESS, {
    book_id: savedBook.id,
    book_name: savedBook.title,
    chapter_count: savedBook?.chapters?.length || 0,
  })
  router.push({
    name: 'Reading',
    params: {
      bid: String(savedBook.id),
      cid: String(savedBook.chapters?.[0]?.id || '1'),
    },
  })
}
</script>

<style scoped>
.import-page {
  padding: 36px 0 88px;
}

.back-row {
  margin-bottom: 12px;
}

.back-btn {
  padding-inline: 14px;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: 22px;
}

.editor-panel,
.preview-panel {
  padding: 24px;
  border-radius: 28px;
}

.panel-head h1,
.panel-head h2,
.preview-block h3 {
  margin: 12px 0 10px;
}

.panel-head p,
.preview-copy,
.empty-state p {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.8;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  font-weight: 600;
}

input,
textarea {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: white;
  padding: 14px 16px;
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 320px;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.32);
}

.content-entry-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.textarea-group {
  margin: 0;
  height: 100%;
}

.entry-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.entry-head span {
  white-space: nowrap;
  flex: 0 0 auto;
}

.entry-head small {
  min-width: 0;
  flex: 1 1 auto;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
  font-weight: 500;
}

.upload-group {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.upload-dropzone {
  position: relative;
  border-radius: 14px;
  border: 1px dashed rgba(216, 180, 254, 0.5);
  min-height: 180px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 16px;
  background: rgba(168, 85, 247, 0.08);
  cursor: pointer;
}

.upload-dropzone.loading {
  opacity: 0.72;
}

.upload-dropzone input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-dropzone strong {
  font-size: 16px;
}

.upload-dropzone p {
  margin: 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
}

.file-tip {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.error-box {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.18);
  color: #fecdd3;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.action-row-center {
  justify-content: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.summary-card,
.preview-block {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
}

.summary-card strong {
  font-size: 28px;
}

.summary-card span {
  color: rgba(255, 255, 255, 0.54);
  font-size: 12px;
}

.preview-block {
  margin-top: 18px;
  padding: 18px;
}

.token-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.token {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  color: #f9e8ff;
  font-size: 13px;
  font-weight: 700;
}

.token small {
  color: rgba(255, 255, 255, 0.54);
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  margin-top: 20px;
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.12);
}

@media (max-width: 1120px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .content-entry-grid {
    grid-template-columns: 1fr;
  }

  .editor-panel,
  .preview-panel {
    padding: 20px;
    border-radius: 22px;
  }

  .entry-head small {
    white-space: normal;
    text-align: left;
    overflow: visible;
  }
}

@media (max-width: 760px) {
  .import-page {
    padding: 22px 0 58px;
  }

  .back-row {
    margin-bottom: 10px;
  }

  .back-btn {
    width: 100%;
    justify-content: center;
    border-radius: 12px;
    padding: 10px 14px;
  }

  .editor-grid {
    gap: 14px;
  }

  .editor-panel,
  .preview-panel {
    padding: 16px 14px;
    border-radius: 18px;
  }

  .panel-head h1 {
    margin: 10px 0 8px;
    font-size: clamp(28px, 8vw, 34px);
  }

  .panel-head h2 {
    margin: 10px 0 8px;
    font-size: 22px;
  }

  .panel-head p {
    font-size: 13px;
    line-height: 1.62;
  }

  .form-grid {
    margin-top: 16px;
    gap: 10px;
  }

  .form-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  input,
  textarea {
    border-radius: 14px;
    padding: 12px 13px;
  }

  textarea {
    min-height: 240px;
  }

  .content-entry-grid {
    margin-top: 14px;
    gap: 12px;
  }

  .entry-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-height: 0;
  }

  .entry-head span {
    white-space: normal;
  }

  .entry-head small {
    width: 100%;
    font-size: 11px;
    line-height: 1.45;
  }

  .upload-group {
    padding: 12px;
    border-radius: 14px;
    gap: 10px;
  }

  .upload-dropzone {
    min-height: 134px;
    border-radius: 12px;
    padding: 12px;
  }

  .upload-dropzone strong {
    font-size: 15px;
  }

  .file-tip {
    font-size: 12px;
    line-height: 1.5;
  }

  .action-row {
    margin-top: 16px;
    gap: 8px;
    flex-direction: column;
    align-items: stretch;
  }

  .action-row .btn-primary,
  .action-row .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .summary-grid {
    margin-top: 14px;
    gap: 8px;
  }

  .summary-card {
    border-radius: 14px;
    padding: 12px;
  }

  .summary-card strong {
    font-size: 24px;
  }

  .preview-block {
    margin-top: 12px;
    border-radius: 14px;
    padding: 13px;
  }

  .token-grid {
    gap: 8px;
  }

  .token {
    max-width: 100%;
    padding: 8px 10px;
    border-radius: 12px;
    font-size: 12px;
  }

  .token small {
    font-size: 11px;
  }

  .empty-state {
    margin-top: 14px;
    padding: 14px;
    border-radius: 14px;
  }
}
</style>
