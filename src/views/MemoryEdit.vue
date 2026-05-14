<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <!-- 顶栏 -->
      <div class="flex items-center gap-2">
        <router-link
          :to="{ name: 'memory' }"
          class="rounded p-1 text-nt-soft hover:bg-nt-hover hover:text-nt"
          title="返回列表"
        >←</router-link>
        <h1 class="text-2xl font-bold tracking-tight text-nt">
          {{ isNew ? '新记忆' : '编辑记忆' }}
        </h1>
      </div>

      <!-- 表单 -->
      <div v-if="loading" class="mt-10 text-center text-sm text-nt-soft">加载中…</div>

      <div v-else-if="error" class="mt-6 rounded border border-nt-danger/30 bg-nt-danger/5 px-3 py-2 text-sm text-nt-danger">{{ error }}</div>

      <div v-else class="mt-6 rounded-md border border-nt-divider bg-white px-4 py-3">
        <MemoryEditor
          :model-value="form"
          :is-edit="!isNew"
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
import { apiMemory } from '@/api/client'
import MemoryEditor from '@/components/MemoryEditor.vue'

const props = defineProps({
  id: { type: [String, Number], default: null },
})

const router  = useRouter()
const form    = ref({ title: '', description: '', content: '', visibility: 'full' })
const loading = ref(false)
const error   = ref('')

const isNew = computed(() => !props.id || props.id === 'new')

const goBack = () => router.push({ name: 'memory' })

const load = async () => {
  if (isNew.value) return
  loading.value = true
  try {
    const { item } = await apiMemory.get(props.id)
    form.value = {
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      visibility: item.visibility || 'full',
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const onSave = async (patch) => {
  try {
    if (isNew.value) await apiMemory.create(patch)
    else             await apiMemory.update(props.id, patch)
    goBack()
  } catch (e) {
    alert(e.message)
  }
}

const onDelete = async () => {
  if (!confirm('删除这条记忆?')) return
  try {
    await apiMemory.remove(props.id)
    goBack()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(load)
</script>
