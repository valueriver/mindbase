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
    <div ref="scrollEl" class="flex-1 overflow-y-auto px-3 py-4 md:px-8 md:py-6">
      <div class="mx-auto max-w-3xl space-y-4">
        <div v-if="loadingHistory" class="py-12 text-center text-sm text-nt-soft">加载中…</div>

        <div v-else-if="!messages.length && !streaming" class="py-12 text-center">
          <div class="text-4xl mb-2">🤖</div>
          <div class="text-sm text-nt-soft mb-4">问点什么</div>
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

        <div
          v-for="(m, i) in messages"
          :key="i"
          :class="['flex items-start gap-2', m.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div
            v-if="m.role !== 'user'"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nt-hover text-sm"
          >🤖</div>
          <div
            :class="[
              'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words',
              m.role === 'user'
                ? 'bg-nt text-white rounded-br-sm'
                : 'bg-nt-hover text-nt rounded-bl-sm',
            ]"
          >{{ m.content }}<span v-if="m.streaming" class="ml-0.5 inline-block h-4 w-1.5 align-middle bg-nt-soft animate-pulse"></span></div>
          <div
            v-if="m.role === 'user'"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nt-hover-strong text-xs text-nt-muted"
          >我</div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="sticky bottom-0 border-t border-nt-divider bg-white px-3 py-3 md:px-8">
      <div class="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          :placeholder="aiReady ? '问点什么…  (⌘/Ctrl + Enter 发送)' : '先去设置里配置大模型'"
          :disabled="!aiReady || streaming"
          class="max-h-32 flex-1 resize-none rounded-2xl bg-nt-hover px-3 py-2.5 text-[15px] text-nt outline-none placeholder:text-nt-hint disabled:opacity-60"
          @keydown.meta.enter.prevent="ask()"
          @keydown.ctrl.enter.prevent="ask()"
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

const suggestions = ['总结一下我最近的想法', '帮我把今天的随手记整理成 1 段周报', '我有哪些 idea 类的笔记?']

const messages   = ref([]) // [{role, content, streaming?}]
const draft      = ref('')
const streaming  = ref(false)
const loadingHistory = ref(true)

const checkingSettings = ref(true)
const aiReady = ref(false)

const scrollEl = ref(null)
const inputEl  = ref(null)

function autosize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function scrollBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

async function checkAi() {
  checkingSettings.value = true
  try {
    const { settings } = await apiSettings.detail()
    aiReady.value = !!(settings.ai_base_url && settings.ai_model && settings.ai_api_key_set)
  } catch {
    aiReady.value = false
  } finally {
    checkingSettings.value = false
  }
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    const { messages: rows } = await apiChat.messages()
    messages.value = rows
      .map(r => r.message)
      .filter(m => m && m.role)
      .map(m => ({ role: m.role, content: String(m.content || '') }))
    scrollBottom()
  } catch {} finally {
    loadingHistory.value = false
  }
}

async function ask(preset) {
  const content = (preset ?? draft.value).trim()
  if (!content || streaming.value) return
  if (!aiReady.value) return

  messages.value.push({ role: 'user', content })
  draft.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  const assistant = { role: 'assistant', content: '', streaming: true }
  messages.value.push(assistant)
  streaming.value = true
  scrollBottom()

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
      assistant.content = `[错误] ${msg}`
      assistant.streaming = false
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
          if (evt.type === 'delta' && typeof evt.text === 'string') {
            assistant.content += evt.text
            scrollBottom()
          } else if (evt.type === 'error') {
            assistant.content += `\n[错误] ${evt.message}`
          }
        }
      }
    }
  } catch (e) {
    assistant.content += `\n[网络错误] ${e?.message || ''}`
  } finally {
    assistant.streaming = false
    streaming.value = false
    scrollBottom()
  }
}

onMounted(async () => {
  await checkAi()
  await loadHistory()
})
</script>
