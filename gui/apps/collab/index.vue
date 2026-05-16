<template>
  <div>
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">协作</h1>
      <p class="mt-2 text-sm text-nt-soft">为外部 AI / Agent 生成访问凭证,让它们读写你的 MindBase。</p>

      <section class="mt-6">
        <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>

        <div v-else-if="!current">
          <p class="text-sm text-nt-muted">为外部协作工具生成访问凭证,授权其读写 MindBase 的内容。</p>
          <button
            type="button"
            :disabled="busy"
            class="mt-4 rounded-md bg-nt px-5 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
            @click="onEnable"
          >{{ busy ? '开启中…' : '开启协作' }}</button>
        </div>

        <template v-else>
          <div class="rounded-md border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
            <div class="flex items-start gap-1.5 font-medium">
              <span>⚠️</span>
              <span>提示</span>
            </div>
            <p class="mt-1.5 text-amber-900/85">
              下方消息含一把通行证,任何拿到的人或 AI 都能完整读写你 MindBase 里的数据。
            </p>
          </div>

          <section class="mt-4 rounded-md border border-nt-divider p-4">
            <h2 class="text-sm font-medium text-nt">💬 快捷消息</h2>
            <p class="mt-1 text-xs text-nt-muted">
              将下方的消息发送给 Codex、Claude Code 等 Agent,即可让它们访问并读写你的 MindBase。
            </p>
            <pre class="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-nt-hover p-3 font-mono text-xs leading-relaxed text-nt">{{ aiMessage }}</pre>
            <button
              type="button"
              class="mt-3 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
              @click="copy(aiMessage)"
            >{{ copied ? '✓ 已复制' : '复制' }}</button>
          </section>

          <section class="mt-4 rounded-md border border-nt-divider p-4">
            <h2 class="text-sm font-medium text-nt">📦 技能包(长期使用)</h2>
            <p class="mt-1 text-xs leading-relaxed text-nt-muted">
              一个 <code class="rounded bg-nt-hover px-1 py-0.5 font-mono">SKILL.md</code> 教 AI 用 MindBase 的 API。任何支持
              <a href="https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills" target="_blank" rel="noopener" class="underline hover:text-nt">Anthropic Skills 格式</a>
              的运行时装一次,这个 AI 就长期"会用"MindBase,不用每次重新粘上面的快捷消息。
            </p>

            <div class="mt-3 rounded-md bg-nt-hover/60 px-3 py-2.5 text-xs leading-relaxed text-nt-muted">
              <div class="font-medium text-nt">安装位置</div>
              <ul class="mt-1 space-y-0.5">
                <li>· Claude Code:<code class="ml-1 rounded bg-white px-1 py-0.5 font-mono text-[11px]">~/.claude/skills/mindbase/</code></li>
                <li>· 其它支持 Skills 的工具(Claude Desktop / Cursor 扩展 / Cline / 自建 agent 框架等):把整个 <code class="mx-0.5 rounded bg-white px-1 py-0.5 font-mono text-[11px]">mindbase/</code> 目录放进它自己的 skills 路径</li>
              </ul>
            </div>

            <a
              href="https://github.com/realuckyang/mindbase/raw/main/mindbase.zip"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-2 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
            >⬇ 下载 mindbase.zip</a>

            <p class="mt-3 text-[11px] leading-relaxed text-nt-soft">
              zip 不含任何凭证 —— 装好后用上面的 token + Base URL 配上即可。
            </p>
          </section>

          <div class="mt-6">
            <button
              type="button"
              :disabled="busy"
              class="rounded-md border border-nt-divider px-3 py-1.5 text-xs text-nt-muted hover:bg-nt-danger-bg hover:text-nt-danger disabled:opacity-50"
              @click="onDisable"
            >{{ busy ? '关闭中…' : '关闭协作' }}</button>
            <p class="mt-1.5 text-[11px] text-nt-soft">关闭后 token 立即作废;重新开启会生成新 token,旧的同时失效。</p>
          </div>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { apiTokens } from '@/api'

const loading = ref(true)
const busy    = ref(false)
const current = ref(null)
const copied  = ref(false)

const schemaUrl = computed(() => `${window.location.origin}/api/ai/openapi.json`)
const aiMessage = computed(() => current.value
  ? `这是我 MindBase 的 OpenAPI schema 和 token,你可以读写我的数据。

Schema: ${schemaUrl.value}
Authorization: Bearer ${current.value.token}

先 fetch schema 看可用接口,再按需操作。`
  : ''
)

async function load() {
  loading.value = true
  try {
    const { tokens } = await apiTokens.list()
    current.value = tokens[0] || null
  } catch {} finally {
    loading.value = false
  }
}

async function onEnable() {
  busy.value = true
  try {
    const { token } = await apiTokens.create('AI')
    current.value = token
  } catch (e) { alert(e?.message || '开启失败') }
  finally { busy.value = false }
}

async function onDisable() {
  if (!current.value) return
  if (!window.confirm('关闭协作?当前 token 立即失效。')) return
  busy.value = true
  try {
    await apiTokens.remove(current.value.id)
    current.value = null
  } catch (e) { alert(e?.message || '关闭失败') }
  finally { busy.value = false }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}

onMounted(load)
</script>
