<template>
  <router-link
    :to="to"
    :class="[
      'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition',
      collapsed ? 'justify-center' : '',
      active ? 'bg-nt-hover-strong text-nt font-medium' : 'text-nt-muted hover:bg-nt-hover hover:text-nt',
    ]"
    :title="collapsed ? label : ''"
  >
    <span class="text-base leading-none">{{ icon }}</span>
    <span v-if="!collapsed" class="truncate">{{ label }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  to:        { type: [String, Object], required: true },
  icon:      { type: String, default: '' },
  label:     { type: String, required: true },
  collapsed: { type: Boolean, default: false },
  active:    { type: Boolean, default: false },
})
</script>
