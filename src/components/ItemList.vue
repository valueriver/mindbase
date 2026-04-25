<template>
  <div class="w-full">
    <draggable
      v-if="merged.length > 0"
      v-model="merged"
      item-key="key"
      tag="ul"
      class="flex flex-col"
      :animation="160"
      ghost-class="mb-drag-ghost"
      drag-class="mb-drag-drag"
      :delay="touchDelay"
      :delay-on-touch-only="true"
      :touch-start-threshold="3"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <li>
          <router-link
            :to="element.kind === 'notebook'
              ? { name: 'notebook', params: { id: element.id } }
              : { name: 'note',     params: { id: element.id } }"
            class="flex min-h-7 items-center gap-2 rounded px-1.5 py-1 hover:bg-nt-hover"
          >
            <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base">
              {{ element.icon || (element.kind === 'notebook' ? '📁' : '📄') }}
            </span>
            <span class="flex-1 min-w-0 truncate text-sm text-nt">
              <template v-if="element.kind === 'notebook'">
                {{ element.name || '无标题' }}<span class="text-nt-soft"> /</span>
              </template>
              <template v-else>
                {{ element.title || '无标题' }}
              </template>
            </span>
          </router-link>
        </li>
      </template>
    </draggable>

    <div v-else class="py-6 text-sm text-nt-soft">还没有内容。</div>

    <div class="mt-3 flex flex-col gap-0.5">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm text-nt-muted hover:bg-nt-hover hover:text-nt"
        @click="$emit('add-notebook')"
      >
        <span class="inline-flex h-5 w-5 items-center justify-center text-base">＋</span>
        <span>新建笔记本</span>
      </button>
      <button
        v-if="canAddNote"
        type="button"
        class="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm text-nt-muted hover:bg-nt-hover hover:text-nt"
        @click="$emit('add-note')"
      >
        <span class="inline-flex h-5 w-5 items-center justify-center text-base">＋</span>
        <span>新建笔记</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  notebooks:  { type: Array, default: () => [] },
  notes:      { type: Array, default: () => [] },
  canAddNote: { type: Boolean, default: true },
})
const emit = defineEmits(['add-notebook', 'add-note', 'reorder'])

// 移动端长按 200ms 才触发拖动,避免点击/滚动误触发;桌面 0ms 立即响应
const touchDelay = 200

// 合并 notebooks + notes,按 sort_order 升序;同 sort_order 时笔记本在前
const merged = ref([])

watch(
  () => [props.notebooks, props.notes],
  () => {
    const all = [
      ...props.notebooks.map(n => ({ ...n, kind: 'notebook', key: `nb-${n.id}` })),
      ...props.notes.map(n     => ({ ...n, kind: 'note',     key: `n-${n.id}` })),
    ]
    all.sort((a, b) => {
      const oa = a.sort_order ?? 0
      const ob = b.sort_order ?? 0
      if (oa !== ob) return oa - ob
      if (a.kind !== b.kind) return a.kind === 'notebook' ? -1 : 1
      return (a.created_at || '').localeCompare(b.created_at || '')
    })
    merged.value = all
  },
  { immediate: true, deep: true },
)

function onDragEnd(e) {
  if (e.oldIndex === e.newIndex) return
  emit(
    'reorder',
    merged.value.map(item => ({ kind: item.kind, id: item.id })),
  )
}
</script>

<style scoped>
.mb-drag-ghost { opacity: 0.35; }
.mb-drag-drag  { background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
</style>
