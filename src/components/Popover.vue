<template>
  <div v-if="open" class="fixed inset-0 z-40" @mousedown.self="$emit('close')">
    <div
      class="absolute rounded-lg border border-nt-divider bg-white p-2 shadow-2xl"
      :style="pos"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open:   { type: Boolean, default: false },
  anchor: { type: Object, default: null },
  width:  { type: Number, default: 360 },
})
defineEmits(['close'])

const pos = computed(() => {
  // 屏幕宽度有上限,手机上 360 或 380 会溢出右边
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600
  const gutter = 8
  const width  = Math.min(props.width, vw - gutter * 2)

  if (!props.anchor) {
    return {
      top:       '50%',
      left:      '50%',
      transform: 'translate(-50%,-50%)',
      width:     `${width}px`,
    }
  }

  const r = props.anchor
  const margin  = 6
  const maxLeft = vw - width - gutter
  const left    = Math.max(gutter, Math.min(r.left, maxLeft))
  // 如果往下不够放,贴到锚点上面
  const top     = (r.bottom + margin + 300 > vh)
    ? Math.max(gutter, r.top - margin - 8)
    : r.bottom + margin

  return {
    top:   `${top}px`,
    left:  `${left}px`,
    width: `${width}px`,
  }
})
</script>
