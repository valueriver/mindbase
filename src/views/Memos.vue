<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-32 md:px-12 md:pt-10">
      <header class="mb-4 md:mb-6">
        <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">💡 想法</h1>
        <p class="mt-1 text-sm text-nt-soft">想到什么写什么,按时间倒序</p>
      </header>

      <!-- 输入卡 -->
      <div class="rounded-md border border-nt-divider bg-white p-3 md:p-4 mb-6">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="2"
          placeholder="此刻在想什么…  (⌘/Ctrl + Enter 记下)"
          :disabled="busy"
          class="w-full resize-none bg-transparent text-[15px] leading-relaxed text-nt outline-none placeholder:text-nt-hint"
          @keydown.meta.enter.prevent="onSubmit"
          @keydown.ctrl.enter.prevent="onSubmit"
        ></textarea>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in tagPalette"
              :key="t"
              type="button"
              :class="[
                'rounded-full border px-2 py-0.5 text-xs transition',
                draftTags.includes(t)
                  ? 'border-nt bg-nt text-white'
                  : 'border-nt-divider text-nt-muted hover:bg-nt-hover',
              ]"
              @click="toggleTag(t)"
            >#{{ t }}</button>
          </div>
          <button
            type="button"
            :disabled="busy || !draft.trim()"
            class="rounded-md bg-nt px-4 py-1.5 text-sm text-white hover:bg-black disabled:opacity-50"
            @click="onSubmit"
          >{{ busy ? '记下中…' : '记下' }}</button>
        </div>
      </div>

      <!-- 时间轴 -->
      <div v-if="loading" class="py-10 text-sm text-nt-soft">加载中…</div>
      <div v-else-if="error" class="py-10 text-sm text-nt-danger">{{ error }}</div>
      <div v-else-if="!memos.length" class="py-16 text-center text-sm text-nt-soft">
        还没有想法。试着写下第一条 ✨
      </div>

      <div v-else>
        <div v-for="group in grouped" :key="group.label" class="mb-6">
          <div class="sticky top-0 md:top-0 z-10 -mx-4 md:-mx-12 px-4 md:px-12 py-1.5 bg-white/95 backdrop-blur text-xs font-medium text-nt-soft">
            {{ group.label }}
          </div>
          <div class="mt-2 space-y-3">
            <article
              v-for="(m, idx) in group.items"
              :key="m.id"
              class="group relative pl-6"
            >
              <span
                class="absolute left-1.5 top-3 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-nt-divider"
              ></span>
              <span
                v-if="idx !== group.items.length - 1"
                class="absolute left-[10px] top-5 bottom-[-12px] w-px bg-nt-divider"
              ></span>

              <div class="rounded-md border border-nt-divider bg-white p-3 md:p-4">
                <div class="mb-1 text-xs text-nt-soft">{{ formatTime(m.created_at) }}</div>
                <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-nt">{{ m.content }}</p>
                <div v-if="m.tags.length" class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="t in m.tags"
                    :key="t"
                    class="rounded-full bg-nt-hover px-2 py-0.5 text-xs text-nt-muted"
                  >#{{ t }}</span>
                </div>
                <button
                  type="button"
                  class="absolute right-3 top-3 hidden text-nt-soft hover:text-nt-danger group-hover:block"
                  title="删除"
                  @click="onDelete(m)"
                >✕</button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiMemos } from '@/api/client'

const memos     = ref([])
const loading   = ref(true)
const error     = ref('')
const busy      = ref(false)

const draft     = ref('')
const draftTags = ref([])
const tagPalette = ['idea', '工作', '生活', '读书']
const inputEl = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { memos: list } = await apiMemos.list()
    memos.value = list
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function toggleTag(t) {
  const i = draftTags.value.indexOf(t)
  if (i >= 0) draftTags.value.splice(i, 1)
  else draftTags.value.push(t)
}

async function onSubmit() {
  const content = draft.value.trim()
  if (!content || busy.value) return
  busy.value = true
  try {
    const { memo } = await apiMemos.create({ content, tags: [...draftTags.value] })
    memos.value.unshift(memo)
    draft.value = ''
    draftTags.value = []
    inputEl.value?.focus()
  } catch (e) {
    alert(e?.message || '记下失败')
  } finally {
    busy.value = false
  }
}

async function onDelete(m) {
  if (!window.confirm('删除这条想法?')) return
  try {
    await apiMemos.remove(m.id)
    memos.value = memos.value.filter(x => x.id !== m.id)
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

function pad(n) { return String(n).padStart(2, '0') }
function formatTime(ts) {
  const d = parseTs(ts)
  if (!d) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function parseTs(ts) {
  if (!ts) return null
  // SQLite datetime('now') 返回 'YYYY-MM-DD HH:MM:SS' UTC
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}
function dateLabel(ts) {
  const d = parseTs(ts)
  if (!d) return '未知'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today); yest.setDate(today.getDate() - 1)
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (local.getTime() === today.getTime()) return '今天'
  if (local.getTime() === yest.getTime())  return '昨天'
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

const grouped = computed(() => {
  const groups = []
  for (const m of memos.value) {
    const label = dateLabel(m.created_at)
    const g = groups.find(g => g.label === label)
    if (g) g.items.push(m)
    else groups.push({ label, items: [m] })
  }
  return groups
})

onMounted(load)
</script>
