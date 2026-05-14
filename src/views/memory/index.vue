<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">记忆</h1>
          <p class="mt-1 text-sm text-nt-soft">希望助理始终记得的事情。</p>
        </div>
        <router-link
          :to="{ name: 'memory-new' }"
          class="shrink-0 rounded-md bg-nt px-3 py-1.5 text-sm text-white hover:bg-nt-strong"
        >＋ 新记忆</router-link>
      </div>

      <div v-if="error" class="mt-6 rounded border border-nt-danger/30 bg-nt-danger/5 px-3 py-2 text-sm text-nt-danger">{{ error }}</div>

      <div v-if="loading && !items.length" class="mt-10 text-center text-sm text-nt-soft">加载中…</div>

      <div v-else-if="!items.length" class="mt-10 text-center text-sm text-nt-soft">
        还没有记忆 —— 点右上角「新记忆」加一条。
      </div>

      <ul v-else class="mt-6 space-y-3">
        <li
          v-for="m in items"
          :key="m.id"
          class="cursor-pointer rounded-md border border-nt-divider bg-white px-4 py-3 hover:bg-nt-hover"
          @click="open(m.id)"
        >
          <div class="flex items-center gap-2">
            <span class="truncate font-medium text-nt">{{ m.title || '无标题' }}</span>
            <span
              class="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px]"
              :class="visBadgeClass(m.visibility)"
            >{{ visLabel(m.visibility) }}</span>
          </div>
          <p v-if="m.description" class="mt-1 truncate text-sm text-nt-soft">{{ m.description }}</p>
          <p v-else-if="m.content" class="mt-1 truncate text-sm text-nt-soft">{{ m.content.slice(0, 120) }}</p>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiMemory } from '@/api/client'

const router  = useRouter()
const items   = ref([])
const loading = ref(true)
const error   = ref('')

const visLabel = (v) => ({ count: '已存', summary: '摘要', full: '必读' }[v] || v)
const visBadgeClass = (v) => ({
  count:   'bg-nt-hover text-nt-soft',
  summary: 'bg-amber-50 text-amber-700',
  full:    'bg-emerald-50 text-emerald-700',
}[v] || 'bg-nt-hover text-nt-soft')

const open = (id) => router.push({ name: 'memory-edit', params: { id } })

const refresh = async () => {
  loading.value = true
  error.value = ''
  try {
    const { items: rows } = await apiMemory.list()
    items.value = rows || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>
