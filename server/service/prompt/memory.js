import { listMemoriesForPrompt } from '../../repository/memory.js'

const trim = (value, max) => String(value || '').trim().slice(0, max)

// 按 visibility 三档注入「记忆」:
//   count   (已存)用户只让你知道"有这条",看不到任何内容
//   summary (摘要)露标题 + 描述,内容隐藏
//   full    (必读)全部注入(标题 + 描述 + 内容)
// 三档可并存。
export const memory = async (db) => {
  const { total, summary, full } = await listMemoriesForPrompt(db)
  if (!total) return ''

  const sections = []

  if (full.length) {
    const lines = full.map((m) => {
      const title = trim(m.title, 120) || `记忆 #${m.id}`
      const desc  = trim(m.description, 400)
      const body  = trim(m.content, 4000)
      return [
        `### ${title}`,
        desc ? `摘要:${desc}` : '',
        body ? `内容:\n${body}` : '',
      ].filter(Boolean).join('\n')
    })
    sections.push(`### 必读(${full.length} 条,你必须把它们当成事实背景)\n${lines.join('\n\n')}`)
  }

  if (summary.length) {
    const lines = summary.map((m) => {
      const title = trim(m.title, 120) || `记忆 #${m.id}`
      const desc  = trim(m.description, 400)
      return desc ? `- **${title}** —— ${desc}` : `- **${title}**`
    })
    sections.push(`### 摘要(${summary.length} 条,只看得到题目和简述)\n${lines.join('\n')}`)
  }

  const hidden = total - full.length - summary.length
  if (hidden > 0) {
    sections.push(`### 已存\n用户另有 ${hidden} 条记忆未对你开放,你只知道它们存在。需要相关信息时,先问用户。`)
  }

  return `\n\n## 用户记忆\n用户写给你的长期上下文,按可见性分档展示:\n\n${sections.join('\n\n')}`
}
