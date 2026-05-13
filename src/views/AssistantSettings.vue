<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">设置</h1>

      <div class="mt-6 overflow-x-auto no-scrollbar">
        <div class="flex gap-1 border-b border-nt-divider min-w-max">
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            :class="[
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition',
              tab === t.id
                ? 'border-nt font-medium text-nt'
                : 'border-transparent text-nt-soft hover:text-nt',
            ]"
            @click="setTab(t.id)"
          >{{ t.label }}</button>
        </div>
      </div>

      <!-- 账户 -->
      <section v-if="tab === 'account'" class="mt-6 space-y-5">
        <Field label="当前密码">
          <input
            v-model="pwdForm.old"
            type="password"
            autocomplete="current-password"
            class="mb-input"
          />
        </Field>
        <Field label="新密码" hint="至少 6 位">
          <input
            v-model="pwdForm.next"
            type="password"
            autocomplete="new-password"
            class="mb-input"
          />
        </Field>
        <Field label="重复新密码">
          <input
            v-model="pwdForm.next2"
            type="password"
            autocomplete="new-password"
            class="mb-input"
          />
        </Field>
        <SaveBar
          :busy="pwdBusy"
          :saved="pwdSaved"
          :error="pwdError"
          @save="onChangePassword"
        />
      </section>

      <!-- 模型 -->
      <section v-else-if="tab === 'model'" class="mt-6 space-y-5">
        <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>
        <template v-else>
          <Field label="Base URL">
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

          <SaveBar :busy="modelBusy" :saved="modelSaved" :error="modelError" @save="onSaveModel" />
        </template>
      </section>

      <!-- 上下文 -->
      <!-- 提示词 -->
      <section v-else-if="tab === 'prompt'" class="mt-6 space-y-5">
        <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>
        <template v-else>
          <Field label="System Prompt" hint="留空使用默认。你可以加入个人偏好、领域知识、回答风格等。">
            <textarea
              v-model="form.ai_system_prompt"
              rows="14"
              :placeholder="defaultSystemPrompt"
              class="mb-input font-mono text-[13px] leading-relaxed"
            ></textarea>
          </Field>
          <div class="flex items-center gap-3">
            <SaveBar :busy="promptBusy" :saved="promptSaved" :error="promptError" @save="onSavePrompt" />
            <button
              type="button"
              class="rounded px-3 py-1 text-xs text-nt-soft hover:bg-nt-hover hover:text-nt"
              @click="onUseDefault"
            >填入默认</button>
            <button
              v-if="form.ai_system_prompt"
              type="button"
              class="rounded px-3 py-1 text-xs text-nt-soft hover:bg-nt-hover hover:text-nt-danger"
              @click="onClearPrompt"
            >清空(用默认)</button>
          </div>
        </template>
      </section>

      <section v-else-if="tab === 'context'" class="mt-6 space-y-5">
        <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>
        <template v-else>
          <Field label="历史轮数" hint="每次调用送给模型的最近 user 回合数">
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

          <SaveBar :busy="contextBusy" :saved="contextSaved" :error="contextError" @save="onSaveContext" />
        </template>
      </section>

      <!-- 协作 -->
      <section v-else-if="tab === 'collab'" class="mt-6">
        <div v-if="authLoading" class="py-6 text-sm text-nt-soft">加载中…</div>

        <div v-else-if="!current">
          <p class="text-sm text-nt-muted">为外部 AI 工具(ChatGPT / Claude 等)开一把 token,可读写本机所有数据。</p>
          <button
            type="button"
            :disabled="authBusy"
            class="mt-4 rounded-md bg-nt px-5 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
            @click="onEnable"
          >{{ authBusy ? '开启中…' : '开启协作' }}</button>
        </div>

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
              @click="copy(aiMessage)"
            >{{ copied ? '✓ 已复制' : '复制' }}</button>
          </section>

          <div class="mt-6">
            <button
              type="button"
              :disabled="authBusy"
              class="rounded-md border border-nt-divider px-3 py-1.5 text-xs text-nt-muted hover:bg-nt-danger-bg hover:text-nt-danger disabled:opacity-50"
              @click="onDisable"
            >{{ authBusy ? '关闭中…' : '关闭协作' }}</button>
          </div>
        </template>
      </section>

      <!-- 技能 -->
      <section v-else-if="tab === 'skills'" class="mt-6">
        <section class="rounded-md border border-nt-divider p-4">
          <h2 class="text-sm font-medium text-nt">📦 MindBase 技能包</h2>
          <p class="mt-1 text-xs text-nt-muted">Claude Code 装到 <code class="rounded bg-nt-hover px-1 py-0.5 font-mono">~/.claude/skills/</code>。</p>
          <a
            href="/skills/mindbase.zip"
            download="mindbase-skill.zip"
            class="mt-3 inline-flex items-center gap-2 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
          >⬇ 下载 mindbase-skill.zip</a>
        </section>
      </section>

      <!-- 关于 -->
      <section v-else-if="tab === 'about'" class="mt-6 space-y-4">
        <div class="flex items-center gap-3">
          <img src="/favicon.svg" alt="" class="h-12 w-12" />
          <div>
            <h2 class="text-lg font-semibold text-nt">MindBase</h2>
            <p class="text-xs text-nt-soft">个人知识库 · 想法 · 笔记 · 助理</p>
          </div>
        </div>

        <p class="text-sm leading-relaxed text-nt-muted">
          MindBase 是一个开源的个人知识库工具,设计目标是单人单机自部署。
          基于 Cloudflare Workers + D1 + R2,部署成本接近零。
          数据完全握在自己手里,助理通过 sql_query 工具直接读写本地数据库,无需任何向量化或第三方服务。
        </p>

        <div class="rounded-md border border-nt-divider p-4">
          <div class="text-xs text-nt-soft">项目地址</div>
          <a
            href="https://github.com/valueriver/mindbase"
            target="_blank"
            rel="noopener"
            class="mt-1 inline-flex items-center gap-1 text-sm font-medium text-nt-accent hover:underline break-all"
          >
            github.com/valueriver/mindbase
            <span class="text-xs">↗</span>
          </a>
        </div>

        <p class="text-xs text-nt-soft">
          MIT License · 欢迎 issue / PR / star
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiSettings, apiTokens, apiUser } from '@/api/client'

const Field = (props, { slots }) => h('label', { class: 'block' }, [
  h('div', { class: 'mb-1 text-sm font-medium text-nt' }, props.label),
  props.hint ? h('div', { class: 'mb-1 text-xs text-nt-soft' }, props.hint) : null,
  slots.default?.(),
])
Field.props = ['label', 'hint']

const SaveBar = (props, { emit }) => h('div', { class: 'flex items-center gap-3 pt-2' }, [
  h('button', {
    type: 'button',
    disabled: props.busy,
    class: 'rounded-md bg-nt px-5 py-2 text-sm text-white hover:bg-black disabled:opacity-50',
    onClick: () => emit('save'),
  }, props.busy ? '保存中…' : '保存'),
  props.saved ? h('span', { class: 'text-xs text-nt-soft' }, '✓ 已保存') : null,
  props.error ? h('span', { class: 'text-xs text-nt-danger' }, props.error) : null,
])
SaveBar.props = ['busy', 'saved', 'error']
SaveBar.emits = ['save']

const route  = useRoute()
const router = useRouter()
const tabs = [
  { id: 'account', label: '账户' },
  { id: 'model',   label: '模型' },
  { id: 'prompt',  label: '提示词' },
  { id: 'context', label: '上下文' },
  { id: 'collab',  label: '协作' },
  { id: 'skills',  label: '技能' },
  { id: 'about',   label: '关于' },
]
const VALID = new Set(tabs.map(t => t.id))
const tab = ref(VALID.has(route.query.tab) ? route.query.tab : 'account')
function setTab(t) {
  tab.value = t
  router.replace({ query: { ...route.query, tab: t } })
}

// === 模型 / 上下文 共用同一份 form,因为都来自 settings ===
const roundOptions = [30, 100, 500]
const loading = ref(true)
const form = reactive({
  ai_base_url: '',
  ai_api_key:  '',
  ai_model:    '',
  ai_context_rounds: 100,
  ai_system_prompt: '',
})
const defaultSystemPrompt = ref('')

async function loadSettings() {
  loading.value = true
  try {
    const { settings } = await apiSettings.detail()
    form.ai_base_url = settings.ai_base_url
    form.ai_api_key  = settings.ai_api_key
    form.ai_model    = settings.ai_model
    form.ai_context_rounds = settings.ai_context_rounds || 100
    form.ai_system_prompt  = settings.ai_system_prompt || ''
    defaultSystemPrompt.value = settings.ai_system_prompt_default || ''
  } catch {} finally {
    loading.value = false
  }
}

const modelBusy = ref(false), modelSaved = ref(false), modelError = ref('')
async function onSaveModel() {
  modelBusy.value = true; modelSaved.value = false; modelError.value = ''
  try {
    const { settings } = await apiSettings.update({
      ai_base_url: form.ai_base_url.trim(),
      ai_api_key:  form.ai_api_key.trim(),
      ai_model:    form.ai_model.trim(),
    })
    form.ai_base_url = settings.ai_base_url
    form.ai_api_key  = settings.ai_api_key
    form.ai_model    = settings.ai_model
    modelSaved.value = true
    setTimeout(() => { modelSaved.value = false }, 1500)
  } catch (e) {
    modelError.value = e?.message || '保存失败'
  } finally { modelBusy.value = false }
}

const promptBusy = ref(false), promptSaved = ref(false), promptError = ref('')
async function onSavePrompt() {
  promptBusy.value = true; promptSaved.value = false; promptError.value = ''
  try {
    const { settings } = await apiSettings.update({
      ai_system_prompt: form.ai_system_prompt,
    })
    form.ai_system_prompt = settings.ai_system_prompt
    promptSaved.value = true
    setTimeout(() => { promptSaved.value = false }, 1500)
  } catch (e) {
    promptError.value = e?.message || '保存失败'
  } finally { promptBusy.value = false }
}
function onUseDefault() { form.ai_system_prompt = defaultSystemPrompt.value }
function onClearPrompt() { form.ai_system_prompt = '' }

const contextBusy = ref(false), contextSaved = ref(false), contextError = ref('')
async function onSaveContext() {
  contextBusy.value = true; contextSaved.value = false; contextError.value = ''
  try {
    const { settings } = await apiSettings.update({
      ai_context_rounds: form.ai_context_rounds,
    })
    form.ai_context_rounds = settings.ai_context_rounds
    contextSaved.value = true
    setTimeout(() => { contextSaved.value = false }, 1500)
  } catch (e) {
    contextError.value = e?.message || '保存失败'
  } finally { contextBusy.value = false }
}

// === 协作 ===
const authLoading = ref(true)
const authBusy = ref(false)
const current  = ref(null)
const copied   = ref(false)

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
  } catch {} finally {
    authLoading.value = false
  }
}

async function onEnable() {
  authBusy.value = true
  try {
    const { token } = await apiTokens.create('AI')
    current.value = token
  } catch (e) { alert(e?.message || '开启失败') }
  finally { authBusy.value = false }
}

async function onDisable() {
  if (!current.value) return
  if (!window.confirm('关闭协作?当前 token 立即失效。')) return
  authBusy.value = true
  try {
    await apiTokens.remove(current.value.id)
    current.value = null
  } catch (e) { alert(e?.message || '关闭失败') }
  finally { authBusy.value = false }
}

// === 账户:改密码 ===
const pwdForm = reactive({ old: '', next: '', next2: '' })
const pwdBusy  = ref(false)
const pwdSaved = ref(false)
const pwdError = ref('')

async function onChangePassword() {
  pwdError.value = ''
  pwdSaved.value = false
  if (!pwdForm.old)            { pwdError.value = '请输入当前密码'; return }
  if (pwdForm.next.length < 6) { pwdError.value = '新密码至少 6 位'; return }
  if (pwdForm.next !== pwdForm.next2) { pwdError.value = '两次输入的新密码不一致'; return }

  pwdBusy.value = true
  try {
    await apiUser.changePassword(pwdForm.old, pwdForm.next)
    pwdForm.old = ''
    pwdForm.next = ''
    pwdForm.next2 = ''
    pwdSaved.value = true
    setTimeout(() => { pwdSaved.value = false }, 1500)
  } catch (e) {
    const msg = e?.message || ''
    if (/invalid_old_password/.test(msg)) pwdError.value = '当前密码错误'
    else if (/password_too_short/.test(msg)) pwdError.value = '新密码至少 6 位'
    else pwdError.value = msg || '修改失败'
  } finally {
    pwdBusy.value = false
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}

onMounted(() => { loadSettings(); loadAuth() })
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
