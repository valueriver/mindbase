import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import { getAllSettings } from '../repository/setting.js'
import {
  insertMessage,
  listMessages,
  listConversations,
  deleteConversation,
} from '../repository/message.js'

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

const randomConvId = () => {
  const b = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
}

const previewOfMessage = (raw) => {
  const m = safeParse(raw, null)
  if (!m) return ''
  if (typeof m.content === 'string') return m.content.slice(0, 80)
  return ''
}

export const listConversationsAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)
  const r = await listConversations(env.DB)
  return ok({
    conversations: (r?.results || []).map(c => ({
      id:        c.conversation_id,
      msg_count: c.msg_count,
      first_at:  c.first_at,
      last_at:   c.last_at,
      preview:   previewOfMessage(c.last_message),
    })),
  })
}

export const listMessagesAction = async (request, env, conversationId) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)
  const r = await listMessages(env.DB, conversationId)
  return ok({
    conversation_id: conversationId,
    messages: (r?.results || []).map(serialize),
  })
}

export const deleteConversationAction = async (request, env, conversationId) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)
  await deleteConversation(env.DB, conversationId)
  return ok({})
}

// POST /api/chat/send  { conversation_id?, content }
// 返回 SSE 流:
//   data: {"type":"start","conversation_id":"..."}
//   data: {"type":"delta","text":"..."}
//   data: {"type":"done","usage":{...}}
//   data: {"type":"error","message":"..."}
//   data: [DONE]
export const sendChatAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return new Response('unauthorized', { status: 401 })

  const body = await readJsonBody(request)
  const content = String(body?.content || '').trim()
  if (!content) return new Response('content_required', { status: 400 })

  const settings = await getAllSettings(env.DB)
  const baseUrl = settings.ai_base_url
  const apiKey  = settings.ai_api_key
  const model   = settings.ai_model
  if (!baseUrl || !apiKey || !model) {
    return new Response(
      JSON.stringify({ success: false, message: 'ai_not_configured' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const conversationId = String(body?.conversation_id || '') || randomConvId()
  const isNew = !body?.conversation_id

  // 拉历史(若是已有对话)
  let history = []
  if (!isNew) {
    const r = await listMessages(env.DB, conversationId)
    history = (r?.results || [])
      .map(row => safeParse(row.message, null))
      .filter(Boolean)
  }

  // 写入用户消息
  const userMsg = { role: 'user', content }
  await insertMessage(env.DB, { conversationId, message: userMsg })

  // 构造发往大模型的消息列表
  const messagesForLLM = [...history, userMsg]
    .map(m => ({ role: m.role, content: m.content }))
    .filter(m => m.role && typeof m.content === 'string')

  // 发起上游流式请求(OpenAI 兼容 /chat/completions)
  const endpoint = baseUrl.replace(/\/+$/, '') + '/chat/completions'
  let upstream
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messagesForLLM,
        stream: true,
      }),
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: `upstream_fetch_failed: ${err?.message || 'unknown'}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    return new Response(
      JSON.stringify({ success: false, message: `upstream_${upstream.status}: ${errText.slice(0, 200)}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      const close = () => {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      }

      send({ type: 'start', conversation_id: conversationId })

      let buf = ''
      let fullText = ''
      let lastUsage = null
      const reader = upstream.body.getReader()
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          let idx
          while ((idx = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, idx).trim()
            buf = buf.slice(idx + 1)
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (payload === '[DONE]') continue
            let evt
            try { evt = JSON.parse(payload) } catch { continue }
            const delta = evt?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              fullText += delta
              send({ type: 'delta', text: delta })
            }
            if (evt?.usage) lastUsage = evt.usage
          }
        }
      } catch (err) {
        send({ type: 'error', message: err?.message || 'stream_error' })
        close()
        return
      }

      // 写入助手消息
      const assistantMsg = { role: 'assistant', content: fullText }
      await insertMessage(env.DB, {
        conversationId,
        message: assistantMsg,
        usage: lastUsage,
        meta: { model },
      })

      send({ type: 'done', usage: lastUsage })
      close()
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
