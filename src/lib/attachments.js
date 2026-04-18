// File parsing utilities for journal attachments

const MAX_SIZE_MB = 5

export function validateFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword']
  if (!allowed.includes(file.type)) {
    throw new Error(`不支持的文件类型：${file.type}`)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`文件过大，请上传 ${MAX_SIZE_MB}MB 以内的文件`)
  }
}

export function getAttachmentType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'word'
}

// Returns base64 string (without data: prefix)
export function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function extractPdfText(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  // Use the bundled worker
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).href

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => item.str).join(' '))
  }
  return pages.join('\n\n')
}

export async function extractWordText(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export async function parseAttachment(file) {
  validateFile(file)
  const type = getAttachmentType(file)

  let data
  if (type === 'image') {
    data = await readAsBase64(file)
  } else if (type === 'pdf') {
    data = await extractPdfText(file)
  } else {
    data = await extractWordText(file)
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    mime: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    data, // base64 for images, extracted text for docs
  }
}
