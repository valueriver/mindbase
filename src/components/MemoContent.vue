<template>
  <div class="space-y-2">
    <template v-for="(n, i) in nodes" :key="i">
      <p
        v-if="n.type === 'text'"
        class="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-nt"
      >{{ n.value }}</p>
      <a
        v-else-if="n.type === 'image'"
        :href="n.src"
        target="_blank"
        rel="noopener"
        class="block"
      >
        <img
          :src="n.src"
          alt=""
          loading="lazy"
          class="max-h-80 rounded border border-nt-divider object-contain"
        />
      </a>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
})

// 把纯文本里的 ![alt](url) 拆成节点。url 必须是 /i/ 或 http(s) 前缀,避免被注入。
const IMG_RE = /!\[[^\]\n]*\]\((\S+?)\)/g
const SAFE_SRC = /^(?:\/i\/|https?:\/\/)/i

const nodes = computed(() => {
  const raw = String(props.content || '')
  const out = []
  let last = 0
  let m
  IMG_RE.lastIndex = 0
  while ((m = IMG_RE.exec(raw)) !== null) {
    const src = m[1]
    if (!SAFE_SRC.test(src)) continue
    if (m.index > last) {
      const t = raw.slice(last, m.index).replace(/\n+$/, '')
      if (t) out.push({ type: 'text', value: t })
    }
    out.push({ type: 'image', src })
    last = m.index + m[0].length
  }
  if (last < raw.length) {
    const t = raw.slice(last).replace(/^\n+/, '')
    if (t) out.push({ type: 'text', value: t })
  }
  return out
})
</script>
