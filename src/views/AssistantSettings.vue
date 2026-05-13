<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">⚙️ 设置</h1>

      <!-- tabs -->
      <div class="mt-6 flex gap-1 border-b border-nt-divider">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          :class="[
            '-mb-px border-b-2 px-3 py-2 text-sm transition',
            tab === t.id
              ? 'border-nt font-medium text-nt'
              : 'border-transparent text-nt-soft hover:text-nt',
          ]"
          @click="setTab(t.id)"
        >{{ t.label }}</button>
      </div>

      <!-- 助理 -->
      <section v-if="tab === 'ai'" class="mt-6 space-y-5">
        <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>

        <template v-else>
          <Field label="Base URL" hint="完整地址,不会自动拼路径">
            <input
              v-model="form.ai_base_url"
              type="url"
              placeholder="https://api.openai.com/v1/chat/completions"
              class="mb-input"
            />
          </Field>

          <Field label="API Key">
            <input
              v-model="form.ai_api_key"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="sk-..."
              class="mb-input font-mono"
            />
          </Field>

          <Field label="Model">
            <input
              v-model="form.ai_model"
              type="text"
              placeholder="gpt-4o-mini"
              class="mb-input"
            />
          </Field>

          <Field label="上下文轮数">
            <div class="inline-flex overflow-hidden rounded-md border border-nt-divider">
              <button
                v-for="opt in roundOptions"
                :key="opt"
                type="button"
                :class="[
                  'px-4 py-1.5 text-sm transition',
                  Number(form.ai_context_rounds) === opt
                    ? 'bg-nt text-white'
                    : 'text-nt-muted hover:bg-nt-hover',
                ]"
                @click="form.ai_context_rounds = opt"
              >{{ opt }}</button>
            </div>
          </Field>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              :disabled="aiBusy"
              class="rounded-md bg-nt px-5 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
              @click="onSaveAi"
            >{{ aiBusy ? '保存中…' : '保存' }}</button>
            <span v-if="aiSaved" class="text-xs text-nt-soft">✓ 已保存</span>
            <span v-if="aiError" class="text-xs text-nt-danger">{{ aiError }}</span>
          </div>
        </template>
      </section>

      <!-- 授权 -->
      <section v-else-if="tab === 'auth'" class="mt-6">
        <div v-if="authLoading" class="py-6 text-sm text-nt-soft">加载中…</div>

        <!-- 未开启 -->
        <div v-else-if="!current">
          <p class="text-sm text-nt-muted">为外部 AI 工具(ChatGPT / Claude 等)开一把 token,可读写本机所有数据。</p>
          <button
            type="button"
            :disabled="authBusy"
            class="mt-4 rounded-md bg-nt px-5 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
            @click="onEnable"
          >{{ authBusy ? '开启中…' : '开启授权' }}</button>
        </div>

        <!-- 已开启 -->
        <template v-else>
          <div class="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <span>⚠️</span>
            <span>泄漏即丢号,谨慎复制。</span>
          </div>

          <section class="mt-4 rounded-md border border-nt-divider p-4">
            <h2 class="text-sm font-medium text-nt">💬 快捷消息</h2>
            <pre class="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-nt-hover p-3 font-mono text-xs leading-relaxed text-nt">{{ aiMessage }}</pre>
            <button
              type="button"
              class="mt-3 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
              @click="copy(aiMessage, 'msg')"
            >{{ copied === 'msg' ? '✓ 已复制' : '复制' }}</button>
          </section>

          <section class="mt-4 rounded-md border border-nt-divider p-4">
            <h2 class="text-sm font-medium text-nt">📦 技能包</h2>
            <p class="mt-1 text-xs text-nt-muted">Claude Code 装到 <code class="rounded bg-nt-hover px-1 py-0.5 font-mono">~/.claude/skills/</code>。</p>
            <a
              href="/skills/mindbase.zip"
              download="mindbase-skill.zip"
              class="mt-3 inline-flex items-center gap-2 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
            >⬇ 下载 mindbase-skill.zip</a>
          </section>

          <div class="mt-6">
            <button
              type="button"
              :disabled="authBusy"
              class="rounded-md border border-nt-divider px-3 py-1.5 text-xs text-nt-muted hover:bg-nt-danger-bg hover:text-nt-danger disabled:opacity-50"
              @click="onDisable"
            >{{ authBusy ? '关闭中…' : '关闭授权' }}</button>
          </div>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiSettings, apiTokens } from '@/api/client'

// 内联小组件:label + slot
const Field = (props, { slots }) => h('label', { class: 'block' }, [
  h('div', { class: 'mb-1 text-sm font-medium text-nt' }, props.label),
  props.hint ? h('div', { class: 'mb-1 text-xs text-nt-soft' }, props.hint) : null,
  slots.default?.(),
])
Field.props = ['label', 'hint']

const route  = useRoute()
const router = useRouter()
const tabs = [
  { id: 'ai',   label: '助理' },
  { id: 'auth', label: '授权' },
]
const tab = ref(route.query.tab === 'auth' ? 'auth' : 'ai')

// 切 tab 时同步 url(便于刷新保持)
function setTab(t) { tab.value = t; router.replace({ query: { ...route.query, tab: t } }) }

// === 助理 ===
const roundOptions = [30, 100, 500]
const loading = ref(true)
const aiBusy  = ref(false)
const aiSaved = ref(false)
const aiError = ref('')
const form = reactive({
  ai_base_url: '',
  ai_api_key:  '',
  ai_model:    '',
  ai_context_rounds: 100,
})

async function loadAi() {
  loading.value = true
  try {
    const { settings } = await apiSettings.detail()
    form.ai_base_url = settings.ai_base_url
    form.ai_api_key  = settings.ai_api_key
    form.ai_model    = settings.ai_model
    form.ai_context_rounds = settings.ai_context_rounds || 100
  } catch (e) {
    aiError.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function onSaveAi() {
  aiBusy.value = true
  aiSaved.value = false
  aiError.value = ''
  try {
    const { settings } = await apiSettings.update({
      ai_base_url:       form.ai_base_url.trim(),
      ai_api_key:        form.ai_api_key.trim(),
      ai_model:          form.ai_model.trim(),
      ai_context_rounds: form.ai_context_rounds,
    })
    form.ai_base_url = settings.ai_base_url
    form.ai_api_key  = settings.ai_api_key
    form.ai_model    = settings.ai_model
    form.ai_context_rounds = settings.ai_context_rounds
    aiSaved.value = true
    setTimeout(() => { aiSaved.value = false }, 1500)
  } catch (e) {
    aiError.value = e?.message || '保存失败'
  } finally {
    aiBusy.value = false
  }
}

// === 授权 ===
const authLoading = ref(true)
const authBusy = ref(false)
const current  = ref(null)
const copied   = ref('')

const schemaUrl = computed(() => `${window.location.origin}/api/ai/openapi.json`)
const aiMessage = computed(() => current.value
  ? `这是我 MindBase 的 OpenAPI schema 和 token,你可以读写我的数据。

Schema: ${schemaUrl.value}
Authorization: Bearer ${current.value.token}

先 fetch schema 看可用接口,再按需操作。`
  : ''
)

async function loadAuth() {
  authLoading.value = true
  try {
    const { tokens } = await apiTokens.list()
    current.value = tokens[0] || null
  } catch (e) {
    alert(e?.message || '加载失败')
  } finally {
    authLoading.value = false
  }
}

async function onEnable() {
  authBusy.value = true
  try {
    const { token } = await apiTokens.create('AI')
    current.value = token
  } catch (e) {
    alert(e?.message || '开启失败')
  } finally {
    authBusy.value = false
  }
}

async function onDisable() {
  if (!current.value) return
  if (!window.confirm('关闭授权?当前 token 立即失效。')) return
  authBusy.value = true
  try {
    await apiTokens.remove(current.value.id)
    current.value = null
  } catch (e) {
    alert(e?.message || '关闭失败')
  } finally {
    authBusy.value = false
  }
}

async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    setTimeout(() => { if (copied.value === key) copied.value = '' }, 1500)
  } catch {}
}

onMounted(() => { loadAi(); loadAuth() })
</script>

<style scoped>
.mb-input {
  width: 100%;
  border-radius: 6px;
  border: 1px solid rgba(55, 53, 47, 0.16);
  padding: 8px 10px;
  font-size: 14px;
  color: var(--color-nt);
  background: white;
  outline: none;
}
.mb-input:focus { border-color: var(--color-nt-accent); }
.mb-input::placeholder { color: var(--color-nt-hint); }
</style>
