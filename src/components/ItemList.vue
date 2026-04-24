<template>
  <div class="w-full">
    <ul v-if="hasItems" class="flex flex-col">
      <li v-for="nb in notebooks" :key="`nb-${nb.id}`">
        <router-link
          :to="{ name: 'notebook', params: { id: nb.id } }"
          class="flex min-h-7 items-center gap-2 rounded px-1.5 py-1 hover:bg-nt-hover"
        >
          <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base">
            {{ nb.icon || '📁' }}
          </span>
          <span class="flex-1 min-w-0 truncate text-sm text-nt">
            {{ nb.name || '无标题' }}<span class="text-nt-soft"> /</span>
          </span>
        </router-link>
      </li>

      <li v-for="n in notes" :key="`note-${n.id}`">
        <router-link
          :to="{ name: 'note', params: { id: n.id } }"
          class="flex min-h-7 items-center gap-2 rounded px-1.5 py-1 hover:bg-nt-hover"
        >
          <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base">
            {{ n.icon || '📄' }}
          </span>
          <span class="flex-1 min-w-0 truncate text-sm text-nt">
            {{ n.title || '无标题' }}
          </span>
        </router-link>
      </li>
    </ul>

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
import { computed } from 'vue'

const props = defineProps({
  notebooks:  { type: Array, default: () => [] },
  notes:      { type: Array, default: () => [] },
  canAddNote: { type: Boolean, default: true },
})
defineEmits(['add-notebook', 'add-note'])

const hasItems = computed(() => props.notebooks.length > 0 || props.notes.length > 0)
</script>
