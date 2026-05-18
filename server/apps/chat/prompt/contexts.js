import { listContexts } from '../../../system/contexts/repository.js'

export const buildContextsSection = async (env) => {
  try {
    const r = await listContexts(env.DB)
    const items = r?.results || []
    if (!items.length) return ''
    const lines = items.map((c) => `- ${c.content}`).join('\n')
    return `\n## 用户上下文\n\n以下是用户标记为"AI 应知晓"的关键信息:\n\n${lines}\n`
  } catch {
    return ''
  }
}
