import lexiconManifest from '@/data/lexicons/manifest.json'

const loaders = {
  cet4: () => import('@/data/lexicons/cet4.json'),
  cet6: () => import('@/data/lexicons/cet6.json'),
  ielts: () => import('@/data/lexicons/ielts.json'),
  toefl: () => import('@/data/lexicons/toefl.json'),
}

export const lexiconCatalog = lexiconManifest

export async function loadLexicon(id) {
  const loader = loaders[id]
  if (!loader) throw new Error(`未找到词库：${id}`)
  const module = await loader()
  return module.default || []
}

export async function loadSelectedLexicons(ids = []) {
  const loaded = await Promise.all(ids.map(async (id) => [id, await loadLexicon(id)]))
  return Object.fromEntries(loaded)
}
