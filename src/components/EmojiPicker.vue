<template>
  <Popover :open="open" :anchor="anchor" :width="360" @close="$emit('close')">
    <div class="flex items-center gap-2 border-b border-nt-divider px-2 pb-2">
      <input
        v-model="q"
        type="text"
        placeholder="搜索 emoji…"
        class="flex-1 rounded-md bg-nt-hover px-2 py-1 text-sm outline-none placeholder:text-nt-hint focus:bg-nt-hover-strong"
      />
      <button
        type="button"
        class="rounded-md px-2 py-1 text-xs text-nt-muted hover:bg-nt-hover hover:text-nt"
        @click="$emit('pick', randomEmoji())"
      >
        随机
      </button>
      <button
        type="button"
        class="rounded-md px-2 py-1 text-xs text-nt-muted hover:bg-nt-hover hover:text-nt"
        @click="$emit('pick', null)"
      >
        清除
      </button>
    </div>

    <div class="mt-2 max-h-72 overflow-y-auto">
      <template v-if="q">
        <div class="grid grid-cols-8 gap-0.5">
          <button
            v-for="e in filtered"
            :key="`s-${e}`"
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-nt-hover"
            @click="$emit('pick', e)"
          >{{ e }}</button>
        </div>
      </template>
      <template v-else>
        <div v-for="group in EMOJI_GROUPS" :key="group.key" class="mb-2">
          <div class="px-1 pb-1 text-xs text-nt-soft">{{ group.label }}</div>
          <div class="grid grid-cols-8 gap-0.5">
            <button
              v-for="e in group.list"
              :key="`${group.key}-${e}`"
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-nt-hover"
              @click="$emit('pick', e)"
            >{{ e }}</button>
          </div>
        </div>
      </template>
    </div>
  </Popover>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Popover from './Popover.vue'
import { EMOJI_GROUPS } from '@/lib/emoji'

const props = defineProps({
  open:   { type: Boolean, default: false },
  anchor: { type: Object,  default: null },
})
defineEmits(['pick', 'close'])

const q = ref('')

watch(() => props.open, (v) => { if (v) q.value = '' })

const all = EMOJI_GROUPS.flatMap(g => g.list)
const filtered = computed(() => {
  const term = q.value.trim()
  if (!term) return []
  // emoji 搜索:要么直接包含字符,要么是 latin keyword 对不上就退化为随机一组
  return all.filter(e => e.includes(term)).slice(0, 120)
})

function randomEmoji() {
  return all[Math.floor(Math.random() * all.length)]
}
</script>
