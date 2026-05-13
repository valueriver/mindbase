<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <header class="mb-6">
        <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">⚙ 设置</h1>
        <p class="mt-1 text-sm text-nt-soft">配置助理使用的大模型(OpenAI 兼容协议)</p>
      </header>

      <div v-if="loading" class="py-10 text-sm text-nt-soft">加载中…</div>

      <form v-else class="space-y-5" @submit.prevent="onSave">
        <section>
          <label class="block text-sm font-medium text-nt">Base URL</label>
          <p class="mt-1 text-xs text-nt-soft">
            兼容 OpenAI 协议的 <code class="font-mono">/v1</code> 入口,不含末尾的 <code class="font-mono">/chat/completions</code>。
            例:<code class="font-mono">https://api.openai.com/v1</code>、
            <code class="font-mono">https://api.deepseek.com/v1</code>。
          </p>
          <input
            v-model="form.ai_base_url"
            type="url"
            placeholder="https://api.openai.com/v1"
            class="mt-2 w-full rounded-md border border-nt-divider bg-white px-3 py-2 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
          />
        </section>

        <section>
          <label class="block text-sm font-medium text-nt">API Key</label>
          <p class="mt-1 text-xs text-nt-soft">
            存到 D1 settings 表,前端只能写入、不可回读。当前
            <span v-if="data.ai_api_key_set" class="text-nt">已设置 · {{ data.ai_api_key_hint }}</span>
            <span v-else class="text-nt-danger">未设置</span>
          </p>
          <input
            v-model="form.ai_api_key"
            type="password"
            autocomplete="off"
            :placeholder="data.ai_api_key_set ? '留空保持不变,填新值则覆盖' : 'sk-...'"
            class="mt-2 w-full rounded-md border border-nt-divider bg-white px-3 py-2 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
          />
          <button
            v-if="data.ai_api_key_set"
            type="button"
            class="mt-1.5 text-xs text-nt-danger hover:underline"
            @click="onClearKey"
          >清除已存 API Key</button>
        </section>

        <section>
          <label class="block text-sm font-medium text-nt">Model</label>
          <p class="mt-1 text-xs text-nt-soft">
            例:<code class="font-mono">gpt-4o-mini</code>、<code class="font-mono">deepseek-chat</code>、
            <code class="font-mono">claude-3-5-sonnet-20241022</code>(走代理时)
          </p>
          <input
            v-model="form.ai_model"
            type="text"
            placeholder="gpt-4o-mini"
            class="mt-2 w-full rounded-md border border-nt-divider bg-white px-3 py-2 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
          />
        </section>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            :disabled="busy"
            class="rounded-md bg-nt px-5 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
          >{{ busy ? '保存中…' : '保存' }}</button>
          <span v-if="saved" class="text-xs text-nt-soft">✓ 已保存</span>
          <span v-if="error" class="text-xs text-nt-danger">{{ error }}</span>
        </div>
      </form>

      <div class="mt-12 border-t border-nt-divider pt-6">
        <h2 class="text-sm font-medium text-nt">对外授权</h2>
        <p class="mt-1 text-xs text-nt-soft">让外部 AI 通过 OpenAPI 读写你的笔记。</p>
        <router-link
          :to="{ name: 'assistant-authorize' }"
          class="mt-2 inline-block text-sm text-nt-accent hover:underline"
        >前往对外授权 →</router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiSettings } from '@/api/client'

const loading = ref(true)
const busy    = ref(false)
const saved   = ref(false)
const error   = ref('')

const data = ref({ ai_base_url: '', ai_model: '', ai_api_key_set: false, ai_api_key_hint: '' })
const form = reactive({ ai_base_url: '', ai_model: '', ai_api_key: '' })

async function load() {
  loading.value = true
  try {
    const { settings } = await apiSettings.detail()
    data.value = settings
    form.ai_base_url = settings.ai_base_url
    form.ai_model    = settings.ai_model
    form.ai_api_key  = ''
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function onSave() {
  busy.value = true
  saved.value = false
  error.value = ''
  try {
    const patch = {
      ai_base_url: form.ai_base_url.trim(),
      ai_model:    form.ai_model.trim(),
    }
    if (form.ai_api_key.trim()) patch.ai_api_key = form.ai_api_key.trim()
    const { settings } = await apiSettings.update(patch)
    data.value = settings
    form.ai_api_key = ''
    saved.value = true
    setTimeout(() => { saved.value = false }, 1500)
  } catch (e) {
    error.value = e?.message || '保存失败'
  } finally {
    busy.value = false
  }
}

async function onClearKey() {
  if (!confirm('清除已保存的 API Key?助理将无法调用。')) return
  busy.value = true
  try {
    const { settings } = await apiSettings.update({ ai_api_key: '' })
    data.value = settings
  } catch (e) {
    error.value = e?.message || '清除失败'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
