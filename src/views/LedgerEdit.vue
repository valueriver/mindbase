<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-md px-4 pt-6 pb-20 md:pt-10">
      <div class="flex items-center gap-2">
        <router-link
          :to="{ name: 'ledger' }"
          class="rounded p-1 text-nt-soft hover:bg-nt-hover hover:text-nt"
          title="返回列表"
        >←</router-link>
        <h1 class="text-2xl font-bold tracking-tight text-nt">
          {{ isNew ? '记一笔' : '编辑' }}
        </h1>
      </div>

      <div v-if="loading" class="mt-10 text-center text-sm text-nt-soft">加载中…</div>

      <div v-else-if="error" class="mt-6 rounded border border-nt-danger/30 bg-nt-danger/5 px-3 py-2 text-sm text-nt-danger">{{ error }}</div>

      <div v-else class="mt-6 rounded-md border border-nt-divider bg-white px-4 py-3">
        <LedgerEditor
          :model-value="form"
          :is-edit="!isNew"
          :category-options="categoryOptions"
          @save="onSave"
          @cancel="goBack"
          @delete="onDelete"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiLedger } from '@/api/client'
import LedgerEditor from '@/components/LedgerEditor.vue'

const props = defineProps({
  id: { type: [String, Number], default: null },
})

const router  = useRouter()
const form    = ref({ type: 'expense', amount: '', category: '', note: '', happened_at: '' })
const loading = ref(false)
const error   = ref('')
const categoryOptions = ref([])

const isNew = computed(() => !props.id || props.id === 'new')

const goBack = () => router.push({ name: 'ledger' })

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadCategories = async () => {
  try {
    const { categories } = await apiLedger.categories()
    categoryOptions.value = categories || []
  } catch {}
}

const load = async () => {
  await loadCategories()
  if (isNew.value) {
    form.value = { type: 'expense', amount: '', category: '', note: '', happened_at: todayIso() }
    return
  }
  loading.value = true
  try {
    const { item } = await apiLedger.get(props.id)
    form.value = {
      type:        item.type,
      amount:      (item.amount / 100).toFixed(2),
      category:    item.category || '',
      note:        item.note || '',
      happened_at: item.happened_at,
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const onSave = async (patch) => {
  try {
    if (isNew.value) await apiLedger.create(patch)
    else             await apiLedger.update(props.id, patch)
    goBack()
  } catch (e) {
    alert(e.message)
  }
}

const onDelete = async () => {
  if (!confirm('删除这条记录?')) return
  try {
    await apiLedger.remove(props.id)
    goBack()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(load)
</script>
