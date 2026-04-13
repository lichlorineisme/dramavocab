function normalizeLineBreaks(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim()
}

async function readPdfFile(file) {
  const [{ getDocument, GlobalWorkerOptions }, workerSrc] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.mjs?url'),
  ])

  GlobalWorkerOptions.workerSrc = workerSrc.default

  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await getDocument({ data: bytes }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const text = await page.getTextContent()
    const lines = text.items
      .map((item) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (lines) {
      pages.push(lines)
    }
  }

  return {
    text: normalizeLineBreaks(pages.join('\n\n')),
    meta: { type: 'pdf', pages: pdf.numPages },
  }
}

export async function readImportFile(file) {
  const filename = String(file?.name || '').toLowerCase()

  if (filename.endsWith('.txt') || filename.endsWith('.md')) {
    return {
      text: normalizeLineBreaks(await file.text()),
      meta: { type: 'text' },
    }
  }

  if (filename.endsWith('.pdf')) {
    return readPdfFile(file)
  }

  if (filename.endsWith('.docx')) {
    throw new Error('当前版本暂不支持 .docx 自动解析，请先另存为 .txt 或 .pdf 再上传。')
  }

  throw new Error('仅支持 .txt / .md / .pdf 文件。')
}
