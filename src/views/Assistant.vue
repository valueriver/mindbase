<template>
  <div class="flex flex-col min-h-screen">
    <!-- 未配置提示 -->
    <div
      v-if="!aiReady && !checkingSettings"
      class="mx-4 mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 md:mx-8"
    >
      助理还没接好大模型。请到
      <router-link :to="{ name: 'assistant-settings' }" class="font-medium underline">设置</router-link>
      里填上 Base URL / API Key / Model。
    </div>

    <!-- 消息列表 -->
    <div
      ref="scrollEl"
      class="flex-1 overflow-y-auto px-3 py-4 md:px-8 md:py-6"
      @scroll.passive="onScroll"
    >
      <div class="mx-auto max-w-3xl space-y-4">
        <div v-if="loadingHistory" class="py-12 text-center text-sm text-nt-soft">加载中…</div>

        <div v-else-if="!turns.length && !streaming" class="py-12 text-center">
          <div class="text-4xl mb-2">🤖</div>
          <div class="text-sm text-nt-soft mb-4">问点什么 —— 我可以查你的数据库</div>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="s in suggestions"
              :key="s"
              type="button"
              class="rounded-full border border-nt-divider px-3 py-1 text-xs text-nt-muted hover:bg-nt-hover"
              @click="ask(s)"
            >{{ s }}</button>
          </div>
        </div>

        <template v-for="(item, i) in turns" :key="i">
          <!-- 用户气泡 -->
          <div v-if="item.kind === 'user'" class="flex justify-end">
            <div class="max-w-[85%] rounded-2xl rounded-br-sm bg-nt px-3.5 py-2.5 text-[15px] leading-relaxed text-white whitespace-pre-wrap break-words">{{ item.content }}</div>
          </div>

          <!-- 工具调用块 -->
          <div v-else-if="item.kind === 'tool'" class="flex justify-start">
            <details class="max-w-[90%] flex-1 rounded-md border border-nt-divider bg-nt-hover/50 overflow-hidden" :open="item.open ?? false">
              <summary class="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-nt-muted hover:bg-nt-hover">
                <span class="font-medium text-nt">{{ item.name }}</span>
                <span v-if="item.reason" class="truncate text-nt-soft">· {{ item.reason }}</span>
                <span v-if="item.status === 'running'" class="ml-auto inline-flex items-center gap-1 text-nt-soft">
                  <svg class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  执行中
                </span>
                <span v-else-if="item.status === 'error'" class="ml-auto text-nt-danger">失败</span>
                <span v-else class="ml-auto text-nt-soft">完成</span>
              </summary>
              <div class="border-t border-nt-divider bg-white px-3 py-2 space-y-2">
                <div v-if="item.args">
                  <div class="text-[11px] text-nt-soft mb-1">参数</div>
                  <pre class="overflow-x-auto rounded bg-nt-hover px-2 py-1.5 font-mono text-[12px] leading-relaxed text-nt whitespace-pre-wrap break-words">{{ item.args }}</pre>
                </div>
                <div v-if="item.result !== undefined">
                  <div class="text-[11px] text-nt-soft mb-1">结果</div>
                  <pre class="overflow-x-auto rounded bg-nt-hover px-2 py-1.5 font-mono text-[12px] leading-relaxed text-nt whitespace-pre-wrap break-words">{{ item.result }}</pre>
                </div>
              </div>
            </details>
          </div>

          <!-- 助手气泡 -->
          <div v-else-if="item.kind === 'assistant'" class="flex justify-start">
            <div class="max-w-[85%] rounded-2xl rounded-bl-sm bg-nt-hover px-3.5 py-2.5 text-[15px] leading-relaxed text-nt whitespace-pre-wrap break-words">{{ item.content }}<span v-if="item.streaming" class="ml-0.5 inline-block h-4 w-1.5 align-middle bg-nt-soft animate-pulse"></span></div>
          </div>
        </template>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="sticky bottom-0 border-t border-nt-divider bg-white px-3 py-3 md:px-8">
      <div class="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          :placeholder="aiReady ? '问点什么…  (Enter 发送,Shift+Enter 换行)' : '先去设置里配置大模型'"
          :disabled="!aiReady || streaming"
          class="max-h-32 flex-1 resize-none rounded-2xl bg-nt-hover px-3 py-2.5 text-[15px] text-nt outline-none placeholder:text-nt-hint disabled:opacity-60"
          @keydown="onKeydown"
          @input="autosize"
        ></textarea>
        <button
          type="button"
          :disabled="!aiReady || streaming || !draft.trim()"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nt text-white transition active:scale-95 disabled:bg-nt-hover-strong disabled:text-nt-soft"
          @click="ask()"
        >
          <svg v-if="!streaming" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          <svg v-else class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { apiChat, apiSettings } from '@/api/client'

const suggestions = [
  '我的想法里有多少条带 idea 标签的?',
  '最近一周新建了几条 memo?',
  '统计每个笔记本下的笔记数量',
]

// turns 是面向 UI 的渲染数组(扁平):
// { kind: 'user', content }
// { kind: 'assistant', content, streaming? }
// { kind: 'tool', id, name, args, reason, result, status: 'running'|'done'|'error', open }
const turns = ref([])
const toolMap = new Map() // tool_call_id → turn index in turns

const draft     = ref('')
const streaming = ref(false)
const loadingHistory = ref(true)

const checkingSettings = ref(true)
const aiReady = ref(false)

const scrollEl = ref(null)
const inputEl  = ref(null)

// 回车发送;Shift+Enter 换行;中文输入法上屏时(isComposing / keyCode 229)放行,不触发发送
function onKeydown(e) {
  if (e.key !== 'Enter') return
  if (e.shiftKey) return
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  ask()
}

function autosize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

// 智能滚动:用户在底部时才跟随;手动上滑后暂停,再次滚回底部恢复
const SCROLL_THRESHOLD = 50
const stickToBottom = ref(true)

function onScroll(e) {
  const el = e.target
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  stickToBottom.value = distance < SCROLL_THRESHOLD
}

function scrollBottom(force = false) {
  if (!force && !stickToBottom.value) return
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

async function checkAi() {
  checkingSettings.value = true
  try {
    const { settings } = await apiSettings.detail()
    aiReady.value = !!(settings.ai_base_url && settings.ai_model && settings.ai_api_key)
  } catch {
    aiReady.value = false
  } finally {
    checkingSettings.value = false
  }
}

// 从历史 messages 表回放 → turns
function pushFromMessage(msg) {
  if (!msg || !msg.role) return
  if (msg.role === 'user') {
    turns.value.push({ kind: 'user', content: String(msg.content || '') })
  } else if (msg.role === 'assistant') {
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      // 文本可能为空,但 tool_calls 要展示成工具块
      if (msg.content) {
        turns.value.push({ kind: 'assistant', content: String(msg.content) })
      }
      for (const tc of msg.tool_calls) {
        let argsObj = {}
        try { argsObj = JSON.parse(tc.function?.arguments || '{}') } catch {}
        const idx = turns.value.length
        turns.value.push({
          kind: 'tool',
          id: tc.id,
          name: tc.function?.name || 'tool',
          args: formatArgs(argsObj),
          reason: argsObj.reason || '',
          result: undefined,
          status: 'done',  // history 里已经有结果
          open: false,
        })
        toolMap.set(tc.id, idx)
      }
    } else {
      turns.value.push({ kind: 'assistant', content: String(msg.content || '') })
    }
  } else if (msg.role === 'tool') {
    const idx = toolMap.get(msg.tool_call_id)
    if (idx != null && turns.value[idx]) {
      turns.value[idx].result = msg.content
      turns.value[idx].status = 'done'
    }
  }
}

function formatArgs(obj) {
  // sql_query 的话直接显示 sql,其它工具显示 JSON
  if (obj?.sql) return String(obj.sql)
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    const { messages: rows } = await apiChat.messages()
    for (const r of rows) pushFromMessage(r.message)
    scrollBottom(true) // 首次加载强制滚到底
  } catch {} finally {
    loadingHistory.value = false
  }
}

async function ask(preset) {
  const content = (preset ?? draft.value).trim()
  if (!content || streaming.value || !aiReady.value) return

  turns.value.push({ kind: 'user', content })
  draft.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'

  // 当前正在 streaming 的 assistant bubble(如果存在)
  let currentAssistant = null
  const ensureAssistant = () => {
    if (currentAssistant && turns.value.includes(currentAssistant)) return currentAssistant
    currentAssistant = { kind: 'assistant', content: '', streaming: true }
    turns.value.push(currentAssistant)
    return currentAssistant
  }

  streaming.value = true
  // 用户主动发送:强制粘底
  stickToBottom.value = true
  scrollBottom(true)

  try {
    const resp = await fetch(apiChat.sendUrl(), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!resp.ok || !resp.body) {
      let msg = `http_${resp.status}`
      try { const j = await resp.json(); if (j?.message) msg = j.message } catch {}
      const a = ensureAssistant()
      a.content = `[错误] ${msg}`
      a.streaming = false
      streaming.value = false
      return
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          let evt
          try { evt = JSON.parse(payload) } catch { continue }

          if (evt.type === 'delta' && typeof evt.delta === 'string') {
            const a = ensureAssistant()
            a.content += evt.delta
            scrollBottom()
          } else if (evt.type === 'assistant_tool_calls' && evt.message?.tool_calls) {
            // 收到这条意味着该 assistant 文本段结束(模型转去调工具),
            // 给所有 tool_calls 创建占位卡片
            if (currentAssistant) currentAssistant.streaming = false
            currentAssistant = null
            for (const tc of evt.message.tool_calls) {
              let argsObj = {}
              try { argsObj = JSON.parse(tc.function?.arguments || '{}') } catch {}
              const i = turns.value.length
              turns.value.push({
                kind: 'tool',
                id: tc.id,
                name: tc.function?.name || 'tool',
                args: formatArgs(argsObj),
                reason: argsObj.reason || '',
                result: undefined,
                status: 'running',
                open: false,
              })
              toolMap.set(tc.id, i)
            }
            scrollBottom()
          } else if (evt.type === 'tool_result' && evt.message?.tool_call_id) {
            const i = toolMap.get(evt.message.tool_call_id)
            if (i != null && turns.value[i]) {
              turns.value[i].result = evt.message.content
              const isError = /^tool error:|^\[?error\]?:/i.test(String(evt.message.content || '').trim())
              turns.value[i].status = isError ? 'error' : 'done'
            }
            scrollBottom()
          } else if (evt.type === 'done') {
            if (currentAssistant) currentAssistant.streaming = false
          } else if (evt.type === 'error') {
            const a = ensureAssistant()
            a.content += `\n[错误] ${evt.message}`
            a.streaming = false
          }
        }
      }
    }
  } catch (e) {
    const a = ensureAssistant()
    a.content += `\n[网络错误] ${e?.message || ''}`
  } finally {
    if (currentAssistant) currentAssistant.streaming = false
    streaming.value = false
    scrollBottom()
  }
}

onMounted(async () => {
  await checkAi()
  await loadHistory()
})
</script>
