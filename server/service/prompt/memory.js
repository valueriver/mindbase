import { listMemoriesForPrompt } from '../../repository/memory.js'

const trim = (value, max) => String(value || '').trim().slice(0, max)

// 按 visibility 三档注入「记忆」:
//   count   (已存)只露条目存在,默认看不到任何字段
//   summary (摘要)露标题 + 描述,默认看不到正文
//   full    (必读)全部注入(标题 + 描述 + 内容)
// 这三档控制的是"默认进入 system prompt 的多少",不是绝对访问权限 ——
// 助理始终有 sql_query 工具,需要时可以 SELECT memories 表读更多。
// 但你能看到它写的 SQL,主动查询是可观测的。
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
    sections.push(`### 摘要(${summary.length} 条,只看得到题目和简述;需要正文时 SELECT memories WHERE id=...)\n${lines.join('\n')}`)
  }

  const hidden = total - full.length - summary.length
  if (hidden > 0) {
    sections.push(`### 已存\n用户另有 ${hidden} 条记忆默认不对你展开,你只知道它们存在。需要相关信息时,先问用户;用户同意后可以 SELECT memories WHERE visibility='count' 查清单和内容(注意这是敏感信息,不要主动猜)。`)
  }

  return `\n\n## 用户记忆\n用户写给你的长期上下文,按可见性分档展示:\n\n${sections.join('\n\n')}`
}
