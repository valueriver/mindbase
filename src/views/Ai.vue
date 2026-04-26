<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="mx-auto w-full max-w-3xl px-12 pt-16 pb-20">
      <Breadcrumb :items="[{ name: 'AI 授权', icon: '🤖' }]" />
      <h1 class="mt-8 text-[40px] font-bold leading-tight tracking-tight text-nt">AI 授权</h1>

      <p class="mt-3 text-sm leading-relaxed text-nt-muted">
        通过标准 OpenAPI 接口,让 ChatGPT、Claude 或任何支持 OpenAPI 的 AI 工具读写你的笔记。
      </p>

      <div v-if="loading" class="mt-10 py-6 text-sm text-nt-soft">加载中…</div>

      <!-- 未开启 -->
      <div v-else-if="!current" class="mt-8">
        <button
          type="button"
          :disabled="working"
          class="rounded-md bg-nt px-5 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
          @click="onEnable"
        >{{ working ? '开启中…' : '开启 AI 授权' }}</button>
      </div>

      <!-- 已开启 -->
      <template v-else>
        <div class="mt-6 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <span>⚠️</span>
          <span>不要把下面的内容泄漏出去 —— 拿到的人都能读写你的笔记。</span>
        </div>

        <!-- 💬 快捷消息 -->
        <section class="mt-6 rounded-md border border-nt-divider p-4">
          <h2 class="flex items-center gap-2 text-sm font-medium text-nt">
            <span>💬</span> 快捷消息
          </h2>
          <p class="mt-1 text-xs text-nt-muted">
            把下面这段直接发给对话型 AI(ChatGPT / Claude),它会自己 fetch schema 然后开始用。
          </p>
          <pre class="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-nt-hover p-3 font-mono text-xs leading-relaxed text-nt">{{ aiMessage }}</pre>
          <button
            type="button"
            class="mt-3 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
            @click="copy(aiMessage, 'msg')"
          >{{ copied === 'msg' ? '✓ 已复制' : '复制消息' }}</button>
        </section>

        <!-- 📦 技能包 -->
        <section class="mt-4 rounded-md border border-nt-divider p-4">
          <h2 class="flex items-center gap-2 text-sm font-medium text-nt">
            <span>📦</span> 技能包
          </h2>
          <p class="mt-1 text-xs text-nt-muted">
            把 Skill 装到 AI 运行时的 skills 目录(Claude Code 是
            <code class="rounded bg-nt-hover px-1 py-0.5 font-mono">~/.claude/skills/</code>),
            AI 就会在你提到笔记时自动加载这套指令,不用每次粘消息。
          </p>
          <a
            href="/skills/mindbase.zip"
            download="mindbase-skill.zip"
            class="mt-3 inline-flex items-center gap-2 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
          >
            <span>⬇</span> 下载 mindbase-skill.zip
          </a>
        </section>

        <!-- 关闭授权 -->
        <div class="mt-8 flex">
          <button
            type="button"
            :disabled="working"
            class="rounded-md border border-nt-divider px-3 py-1.5 text-xs text-nt-muted hover:bg-nt-danger-bg hover:text-nt-danger disabled:opacity-50"
            @click="onDisable"
          >{{ working ? '关闭中…' : '关闭授权' }}</button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { apiTokens } from '@/api/client'

const loading = ref(true)
const working = ref(false)
const current = ref(null)
const copied  = ref('')

const schemaUrl = computed(() => `${window.location.origin}/api/ai/openapi.json`)

const aiMessage = computed(() => {
  if (!current.value) return ''
  return `这是我 MindBase 笔记库的 OpenAPI schema 和访问令牌,你可以读写我的笔记。

Schema:${schemaUrl.value}
Authorization: Bearer ${current.value.token}

请先 fetch 一下 schema 了解可用接口,然后在我明确请求时再操作。`
})

async function load() {
  loading.value = true
  try {
    const { tokens } = await apiTokens.list()
    current.value = tokens[0] || null
  } catch (e) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function onEnable() {
  working.value = true
  try {
    const { token } = await apiTokens.create('AI')
    current.value = token
    copied.value = ''
  } catch (e) {
    alert(e.message || '开启失败')
  } finally {
    working.value = false
  }
}

async function onDisable() {
  if (!current.value) return
  if (!window.confirm('关闭 AI 授权?当前 token 立即失效,所有用它的 AI 会断开。')) return
  working.value = true
  try {
    await apiTokens.remove(current.value.id)
    current.value = null
    copied.value = ''
  } catch (e) {
    alert(e.message || '关闭失败')
  } finally {
    working.value = false
  }
}

async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    setTimeout(() => { if (copied.value === key) copied.value = '' }, 1500)
  } catch {
    copied.value = ''
  }
}

onMounted(load)
</script>
