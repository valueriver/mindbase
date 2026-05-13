<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">搜索</h1>

      <div class="mt-6">
        <input
          ref="inputEl"
          v-model="q"
          type="search"
          placeholder="搜索笔记本和笔记…"
          autocomplete="off"
          class="w-full rounded-md border border-nt-divider bg-white px-3 py-2.5 text-[15px] text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
          @input="onInput"
        />
      </div>

      <div v-if="!q.trim()" class="mt-8 text-center text-sm text-nt-soft">输入关键词开始搜索</div>
      <div v-else-if="loading" class="mt-8 text-center text-sm text-nt-soft">搜索中…</div>
      <div v-else-if="error" class="mt-8 text-center text-sm text-nt-danger">{{ error }}</div>
      <div v-else-if="empty" class="mt-8 text-center text-sm text-nt-soft">没找到相关内容</div>

      <div v-else class="mt-6 space-y-6">
        <section v-if="memos.length">
          <h2 class="mb-2 text-xs font-medium text-nt-soft">想法 · {{ memos.length }}</h2>
          <ul class="space-y-1.5">
            <li v-for="m in memos" :key="m.id">
              <router-link
                :to="{ name: 'memos' }"
                class="block rounded px-2 py-1.5 hover:bg-nt-hover"
              >
                <div class="text-[11px] text-nt-soft">{{ shortDate(m.created_at) }}</div>
                <div v-if="m.snippet" class="text-sm text-nt">{{ m.snippet }}</div>
              </router-link>
            </li>
          </ul>
        </section>

        <section v-if="notebooks.length">
          <h2 class="mb-2 text-xs font-medium text-nt-soft">笔记本 · {{ notebooks.length }}</h2>
          <ul class="space-y-1">
            <li v-for="nb in notebooks" :key="nb.id">
              <router-link
                :to="{ name: 'notebook', params: { id: nb.id } }"
                class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-nt-hover"
              >
                <span class="text-base">{{ nb.icon || '📁' }}</span>
                <span class="truncate text-sm text-nt">{{ nb.name || '无标题' }}</span>
              </router-link>
            </li>
          </ul>
        </section>

        <section v-if="notes.length">
          <h2 class="mb-2 text-xs font-medium text-nt-soft">笔记 · {{ notes.length }}</h2>
          <ul class="space-y-1.5">
            <li v-for="n in notes" :key="n.id">
              <router-link
                :to="{ name: 'note', params: { id: n.id } }"
                class="block rounded px-2 py-1.5 hover:bg-nt-hover"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base">{{ n.icon || '📄' }}</span>
                  <span class="truncate text-sm text-nt font-medium">{{ n.title || '无标题' }}</span>
                </div>
                <div v-if="n.snippet" class="ml-7 truncate text-xs text-nt-soft">{{ n.snippet }}</div>
              </router-link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiSearch } from '@/api/client'

const q = ref('')
const notebooks = ref([])
const notes     = ref([])
const memos     = ref([])
const loading   = ref(false)
const error     = ref('')
const inputEl   = ref(null)

const empty = computed(() => !notebooks.value.length && !notes.value.length && !memos.value.length)

function shortDate(ts) {
  if (!ts) return ''
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

let timer = null
function onInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(run, 250)
}

async function run() {
  const term = q.value.trim()
  if (!term) {
    notebooks.value = []
    notes.value = []
    memos.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const r = await apiSearch.run(term)
    notebooks.value = r.notebooks || []
    notes.value     = r.notes     || []
    memos.value     = r.memos     || []
  } catch (e) {
    error.value = e?.message || '搜索失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => { inputEl.value?.focus() })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>
