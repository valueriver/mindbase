import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { getAllSettings } from '../repository/setting.js'
import { insertMessage, listMessages } from '../repository/message.js'
import { chat } from '../ai/handler.js'

// 单一全局对话。
const CONVERSATION_ID = 'main'

// 给 AI 的系统提示:工作场景 + 数据库 schema 概览。
const SYSTEM_PROMPT = `你是 MindBase 的助理。MindBase 是单机自部署的笔记应用(Cloudflare Workers + D1),没有多用户概念。

你拥有一个工具 sql_query,可以对 D1 数据库执行任意 SQL(SELECT/INSERT/UPDATE/DELETE/DDL 都行,但每次只能一条语句、不要带末尾分号)。

数据库表(SQLite 风格,均无 user_id 字段):
- notebooks(id, parent_id, name, icon, cover, sort_order, created_at, updated_at) — 笔记本树
- notes(id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at) — content 是 HTML
- memos(id, content, created_at, updated_at) — 想法/时间轴随手记,content 是纯文本,可内嵌 markdown 图片 ![](/i/...)
- messages(id, conversation_id, message, memo, usage, meta, created_at) — 你正在写入的这张表
- settings(key, value, updated_at) — KV,含 ai_base_url/ai_api_key/ai_model/home_name/home_icon/home_cover/memos_icon/memos_cover 等
- tokens(id, name, token, scope, created_at, last_used_at) — 对外 AI 授权 token,不要 SELECT 出 token 字段

约定:
- 回答用中文,简洁直接,不要长篇大论。
- 涉及 UPDATE/DELETE/DROP 等写入操作时,先用 SELECT 看一眼,再次确认后再写入。不可逆操作避免连续多步自动执行。
- 查询大表请用 LIMIT。`

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

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
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
