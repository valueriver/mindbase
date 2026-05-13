import { tools } from './tools.js'
import { runTools } from './runner.js'
import { callLlmStream } from '../llm/index.js'
import { normalizeAgentMessages, normalizeChatOptions } from './utils.js'

// Agent loop: 持续调模型,遇到 tool_calls 就跑工具回喂,直到出文本。
// 改动 vs AIOS:多了 toolContext 参数,会透传给 runner→functions(里面的 sql_query 要拿 env.DB)。
const chat = async (messages, {
  provider,
  apiUrl,
  apiKey,
  model,
  toolContext = {},
  send = (_message) => {},
  signal,
  maxRounds = 25,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12e3,
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars })
  const workMessages = normalizeAgentMessages(messages)
  let round = 0
  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const payload = { model, messages: workMessages, tools }
    const message = await callLlmStream(apiUrl, apiKey, payload, {
      provider,
      signal,
      onDelta: (delta) => {
        if (delta) send({ type: 'delta', delta })
      },
    })

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      }
      if (message.reasoning_content !== undefined) {
        assistantMsg.reasoning_content = message.reasoning_content ?? ''
      }
      workMessages.push(assistantMsg)
      send({ type: 'assistant_tool_calls', message: assistantMsg })
      for (const toolCall of message.tool_calls) {
        send({ type: 'tool_call', toolCall })
      }

      const toolMessages = await runTools(message.tool_calls, toolContext, {
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars,
      })
      for (const tm of toolMessages) {
        workMessages.push(tm)
        send({ type: 'tool_result', message: tm })
      }
      continue
    }

    const text = message.content ?? ''
    const replyMsg = { role: 'assistant', content: text }
    if (message.reasoning_content !== undefined) {
      replyMsg.reasoning_content = message.reasoning_content ?? ''
    }
    workMessages.push(replyMsg)
    send({ type: 'done', message: replyMsg })
    return text
  }
  const fallback = { role: 'assistant', content: '(达到最大轮次限制)' }
  send({ type: 'done', message: fallback })
  return fallback.content
}

export { chat }
