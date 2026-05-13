import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { getAllSettings } from '../repository/setting.js'
import { insertMessage, listMessages } from '../repository/message.js'
import { chat } from '../ai/handler.js'
import { DEFAULT_SYSTEM_PROMPT } from '../ai/system-prompt.js'

// 单一全局对话。
const CONVERSATION_ID = 'main'

const safeParse = (s, fallback = null) => {
  if (s == null) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

const serialize = (row) => ({
  id:              row.id,
  conversation_id: row.conversation_id,
  message:         safeParse(row.message, { role: 'assistant', content: row.message }),
  memo:            row.memo || '',
  usage:           safeParse(row.usage, null),
  meta:            safeParse(row.meta,  null),
  created_at:      row.created_at,
})

export const listMessagesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listMessages(env.DB, CONVERSATION_ID)
  return ok({ messages: (r?.results || []).map(serialize) })
}

export const sendChatAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return new Response('unauthorized', { status: 401 })

  const body = await readJsonBody(request)
  const content = String(body?.content || '').trim()
  if (!content) return new Response('content_required', { status: 400 })

  const settings = await getAllSettings(env.DB)
  const apiUrl = settings.ai_base_url
  const apiKey = settings.ai_api_key
  const model  = settings.ai_model
  if (!apiUrl || !apiKey || !model) {
    return new Response(
      JSON.stringify({ success: false, message: 'ai_not_configured' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 拉历史(LLM 格式),按 ai_context_rounds 截断
  const rounds = [30, 100, 500].includes(Number(settings.ai_context_rounds))
    ? Number(settings.ai_context_rounds) : 100
  const histR = await listMessages(env.DB, CONVERSATION_ID)
  const allRows = (histR?.results || [])
    .map(row => safeParse(row.message, null))
    .filter(Boolean)

  // 保留最近 (rounds - 1) 个 user 回合,留出当前 user 的名额
  const targetUserCount = Math.max(0, rounds - 1)
  let sliceFrom = 0
  if (targetUserCount === 0) {
    sliceFrom = allRows.length
  } else {
    let seen = 0
    for (let i = allRows.length - 1; i >= 0; i--) {
      if (allRows[i].role === 'user') {
        seen++
        if (seen >= targetUserCount) { sliceFrom = i; break }
      }
    }
  }
  const history = allRows.slice(sliceFrom)

  const userMsg = { role: 'user', content }
  await insertMessage(env.DB, { conversationId: CONVERSATION_ID, message: userMsg })

  const systemPrompt = String(settings.ai_system_prompt || '').trim() || DEFAULT_SYSTEM_PROMPT
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    userMsg,
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sse = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      const close = () => {
        try { controller.enqueue(encoder.encode(`data: [DONE]\n\n`)) } catch {}
        try { controller.close() } catch {}
      }

      // 收集所有副作用 DB 写入,close 前 awaitAll,确保 Worker 不在写完前退出
      const pending = []

      const send = (evt) => {
        sse(evt)
        // 持久化:assistant_tool_calls / tool_result / 最终 done
        if (evt.type === 'assistant_tool_calls' && evt.message) {
          pending.push(insertMessage(env.DB, {
            conversationId: CONVERSATION_ID,
            message: evt.message,
          }))
        } else if (evt.type === 'tool_result' && evt.message) {
          pending.push(insertMessage(env.DB, {
            conversationId: CONVERSATION_ID,
            message: evt.message,
          }))
        } else if (evt.type === 'done' && evt.message) {
          pending.push(insertMessage(env.DB, {
            conversationId: CONVERSATION_ID,
            message: evt.message,
            meta: { model },
          }))
        }
      }

      try {
        await chat(messages, {
          apiUrl,
          apiKey,
          model,
          toolContext: { env },
          send,
        })
      } catch (err) {
        sse({ type: 'error', message: err?.message || 'chat_failed' })
      } finally {
        const results = await Promise.allSettled(pending)
        for (const r of results) {
          if (r.status === 'rejected') console.error('insert failed', r.reason?.message || r.reason)
        }
        close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
