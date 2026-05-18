// 读个人档(profile 包提供的 profile_blocks 表)拼进 system prompt。
// 用户没装 profile 包就跳过,不报错。

export const buildProfileSection = async (env) => {
  let blocks = []
  try {
    const r = await env.DB.prepare(
      `SELECT id, title, content, sort_order FROM profile_blocks
        ORDER BY sort_order ASC, created_at ASC`
    ).all()
    blocks = r?.results || []
  } catch {
    // profile 包未安装 → 表不存在 → 没有用户档案要注入
    return ''
  }
  if (!blocks.length) return ''
  const parts = ['\n\n## 用户档案\n用户分块写给你看的长期上下文:']
  for (const b of blocks) {
    const title = (b.title || '').trim() || '(无标题)'
    const content = (b.content || '').trim()
    parts.push(`\n\n### ${title}\n${content}`)
  }
  return parts.join('')
}
