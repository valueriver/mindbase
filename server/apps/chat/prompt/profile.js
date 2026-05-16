import { listBlocks } from '../../profile/repository.js'

export const buildProfileSection = async (env) => {
  const blocks = await listBlocks(env.DB)
  if (!blocks || blocks.length === 0) return ''
  const parts = ['\n\n## 用户档案\n用户分块写给你看的长期上下文:']
  for (const b of blocks) {
    const title = (b.title || '').trim() || '(无标题)'
    const content = (b.content || '').trim()
    parts.push(`\n\n### ${title}\n${content}`)
  }
  return parts.join('')
}
