<template>
  <div>
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">搜索</h1>
      <p class="mt-1 text-sm text-nt-soft">笔记、想法、记账,一处查找。</p>

      <div class="mt-6">
        <input
          ref="inputEl"
          v-model="q"
          type="search"
          placeholder="搜索笔记本和笔记…"
          autocomplete="off"
          class="w-full rounded-md border border-nt-divider bg-white px-3 py-2.5 text-[15px] text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
          @input="debouncedSearch"
        />
      </div>

      <template v-if="q.trim()">
        <div v-if="loading" class="mt-8 text-center text-sm text-nt-soft">搜索中…</div>
        <div v-else-if="error" class="mt-8 text-center text-sm text-nt-danger">{{ error }}</div>
        <div v-else-if="empty" class="mt-8 text-center text-sm text-nt-soft">没找到相关内容</div>
        <div v-else class="mt-6 space-y-6">
          <section v-if="posts.length">
            <h2 class="mb-2 text-xs font-medium text-nt-soft">主页 · {{ posts.length }}</h2>
            <ul class="space-y-1.5">
              <li v-for="item in posts" :key="item.id">
                <router-link
                  :to="{ name: 'home' }"
                  class="block rounded px-2 py-1.5 hover:bg-nt-hover"
                >
                  <div class="text-[11px] text-nt-soft">{{ formatDate(item.created_at) }}</div>
                  <div v-if="item.snippet" class="text-sm text-nt">{{ item.snippet }}</div>
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
      </template>
      <div v-else class="mt-8 text-center text-sm text-nt-soft">输入关键词开始搜索</div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { apiSearch } from '@/api'

const q         = ref('')
const notebooks = ref([])
const notes     = ref([])
const posts     = ref([])
const loading   = ref(false)
const error     = ref('')
const inputEl   = ref(null)

const empty = computed(() => !notebooks.value.length && !notes.value.length && !posts.value.length)

function formatDate(s) {
  if (!s) return ''
  const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

let timer = null
function debouncedSearch() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(runSearch, 250)
}

async function runSearch() {
  const v = q.value.trim()
  if (!v) {
    notebooks.value = []
    notes.value = []
    posts.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const r = await apiSearch.run(v)
    notebooks.value = r.notebooks || []
    notes.value     = r.notes || []
    posts.value     = r.posts || []
  } catch (e) {
    error.value = e?.message || '搜索失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => { inputEl.value?.focus() })
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>
