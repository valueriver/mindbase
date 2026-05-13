import * as functions from './functions.js'
import { truncateToolResult } from './utils.js'

// 把 AIOS 的 runTools 抄过来,加一个 context 参数(里面有 env,工具需要拿 D1)。
const runTools = async (toolCalls, context = {}, { enableToolResultTruncate = true, toolResultMaxChars = 12e3 } = {}) => {
  const results = await Promise.all(toolCalls.map(async (tc) => {
    const name = tc.function.name
    let args = {}
    try { args = JSON.parse(tc.function.arguments || '{}') } catch {}
    let content
    try {
      const fn = functions[name]
      if (!fn) throw new Error(`未知工具: ${name}`)
      content = await fn(args, context)
    } catch (e) {
      content = `tool error: ${e?.message || e}`
    }
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    const trimmed = truncateToolResult(text, {
      enabled: enableToolResultTruncate,
      maxChars: toolResultMaxChars,
    })
    return {
      role: 'tool',
      tool_call_id: tc.id,
      content: trimmed.content,
    }
  }))
  return results
}

export { runTools }
