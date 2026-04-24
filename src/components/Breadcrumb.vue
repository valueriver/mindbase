<template>
  <nav class="flex flex-wrap items-center gap-0.5 text-sm text-nt-muted">
    <router-link
      :to="{ name: 'home' }"
      class="rounded-sm px-1.5 py-0.5 hover:bg-nt-hover hover:text-nt"
    >
      首页
    </router-link>

    <template v-for="(item, idx) in items" :key="item.id ?? idx">
      <span class="select-none px-0.5 text-nt-soft">/</span>
      <router-link
        v-if="item.to"
        :to="item.to"
        class="flex max-w-64 items-center gap-1 truncate rounded-sm px-1.5 py-0.5 hover:bg-nt-hover hover:text-nt"
      >
        <span v-if="item.icon" class="inline-flex h-4 w-4 items-center justify-center">{{ item.icon }}</span>
        <span class="truncate">{{ item.name }}</span>
      </router-link>
      <span
        v-else
        class="flex max-w-64 items-center gap-1 truncate px-1.5 py-0.5 text-nt"
      >
        <span v-if="item.icon" class="inline-flex h-4 w-4 items-center justify-center">{{ item.icon }}</span>
        <span class="truncate">{{ item.name || '无标题' }}</span>
      </span>
    </template>
  </nav>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>
