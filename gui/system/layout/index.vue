<template>
  <div>
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-nt">整理应用</h1>
          <p class="mt-1 text-sm text-nt-soft">拖动调整顺序和分组,把不常用的收起来。</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-md bg-nt px-3 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-nt-soft"
          :disabled="!dirty || saving"
          @click="save"
        >{{ saving ? '保存中' : '保存' }}</button>
      </header>

      <draggable
        v-model="layout.groups"
        handle=".group-handle"
        item-key="name"
        :animation="160"
        ghost-class="mb-drag-ghost"
        @change="markDirty"
      >
        <template #item="{ element: group, index: gi }">
          <section class="mt-4 rounded-md border border-nt-divider bg-white p-4">
            <div class="group-handle mb-3 flex cursor-move items-center gap-2">
              <span class="select-none text-nt-soft">⋮⋮</span>
              <input
                v-model="group.name"
                type="text"
                class="flex-1 cursor-text rounded border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-nt outline-none transition hover:border-nt-divider focus:border-nt-divider focus:bg-white"
                placeholder="分组名"
                @input="markDirty"
                @mousedown.stop
              />
              <button
                type="button"
                class="rounded px-1.5 py-0.5 text-xs text-nt-muted transition hover:bg-nt-hover hover:text-nt disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="group.apps.length > 0"
                :title="group.apps.length > 0 ? '分组里还有应用,先把它们移走' : '删除分组'"
                @click="removeGroup(gi)"
              >删除</button>
            </div>
            <draggable
              v-model="group.apps"
              :group="{ name: 'apps' }"
              item-key="self"
              :animation="160"
              ghost-class="mb-drag-ghost"
              class="grid min-h-[60px] grid-cols-4 gap-1 rounded sm:grid-cols-6"
              @change="markDirty"
            >
              <template #item="{ element: slug }">
                <div
                  class="flex cursor-move flex-col items-center gap-1 rounded-md py-2 transition hover:bg-nt-hover"
                  :title="labelOf(slug)"
                >
                  <span class="text-2xl leading-none">{{ iconOf(slug) }}</span>
                  <span class="truncate text-[11px] text-nt">{{ labelOf(slug) }}</span>
                </div>
              </template>
            </draggable>
          </section>
        </template>
      </draggable>

      <button
        type="button"
        class="mt-4 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-nt-divider py-3 text-sm text-nt-soft transition hover:border-nt-muted hover:text-nt"
        @click="addGroup"
      ><span>＋</span><span>新建分组</span></button>

      <section class="mt-6 rounded-md border border-nt-divider bg-nt-hover/40 p-4">
        <h3 class="mb-2 text-sm font-medium text-nt">🙈 已隐藏</h3>
        <draggable
          v-model="layout.hidden"
          :group="{ name: 'apps' }"
          item-key="self"
          :animation="160"
          ghost-class="mb-drag-ghost"
          class="grid min-h-[60px] grid-cols-4 gap-1 sm:grid-cols-6"
          @change="markDirty"
        >
          <template #item="{ element: slug }">
            <div
              class="flex cursor-move flex-col items-center gap-1 rounded-md py-2 opacity-60 transition hover:bg-nt-hover hover:opacity-100"
              :title="labelOf(slug)"
            >
              <span class="text-2xl leading-none">{{ iconOf(slug) }}</span>
              <span class="truncate text-[11px] text-nt">{{ labelOf(slug) }}</span>
            </div>
          </template>
        </draggable>
        <p v-if="!layout.hidden.length" class="mt-2 text-xs text-nt-soft">拖应用到这里可以从启动器隐藏。</p>
      </section>

      <section v-if="orphanApps.length" class="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4">
        <h3 class="mb-1 text-sm font-medium text-amber-900">🆕 未分组</h3>
        <p class="mb-2 text-xs text-amber-900/70">这些是新添加的应用,还没归到任何分组,拖进上面任意分组即可。</p>
        <draggable
          v-model="orphanList"
          :group="{ name: 'apps' }"
          item-key="self"
          :animation="160"
          ghost-class="mb-drag-ghost"
          class="grid grid-cols-4 gap-1 sm:grid-cols-6"
          @change="markDirty"
        >
          <template #item="{ element: slug }">
            <div
              class="flex cursor-move flex-col items-center gap-1 rounded-md py-2 transition hover:bg-amber-100"
              :title="labelOf(slug)"
            >
              <span class="text-2xl leading-none">{{ iconOf(slug) }}</span>
              <span class="truncate text-[11px] text-amber-900">{{ labelOf(slug) }}</span>
            </div>
          </template>
        </draggable>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { APPS_META, DEFAULT_LAYOUT, iconOf, labelOf } from '@/system/lib/apps.js'
import { api } from '@/api'

// 深拷贝默认布局,避免共享引用被改坏。
const cloneLayout = (l) => ({
  groups: (l?.groups || []).map((g) => ({ name: g.name, apps: [...(g.apps || [])] })),
  hidden: [...(l?.hidden || [])],
})

const layout  = ref(cloneLayout(DEFAULT_LAYOUT))
const dirty   = ref(false)
const saving  = ref(false)

const markDirty = () => { dirty.value = true }

// 未在任何分组、未隐藏的应用 — 通常是新加的、用户还没收编的。
// orphanList 是可写 ref,跟随 layout 变化重算;draggable 拖出后这里也会被它写一次,
// 但下一轮 watch 会重新和 layout 对齐。
const orphanApps = computed(() => {
  const used = new Set()
  for (const g of layout.value.groups) for (const a of g.apps) used.add(a)
  for (const a of layout.value.hidden) used.add(a)
  return APPS_META.map((a) => a.name).filter((s) => !used.has(s))
})

const orphanList = ref([...orphanApps.value])
watch(orphanApps, (v) => { orphanList.value = [...v] })

onMounted(async () => {
  try {
    const data = await api.get('/api/home/layout')
    if (data?.layout?.groups) layout.value = cloneLayout(data.layout)
  } catch {
    // 401 / 接口失败时保持默认布局,用户保存时会被 401 挡回去。
  }
})

function addGroup() {
  layout.value.groups.push({ name: '新分组', apps: [] })
  markDirty()
}

function removeGroup(index) {
  const g = layout.value.groups[index]
  if (!g || g.apps.length > 0) return
  layout.value.groups.splice(index, 1)
  markDirty()
}

async function save() {
  if (!dirty.value || saving.value) return
  saving.value = true
  try {
    const data = await api.patch('/api/home/layout', {
      groups: layout.value.groups,
      hidden: layout.value.hidden,
    })
    if (data?.layout) layout.value = cloneLayout(data.layout)
    dirty.value = false
  } finally {
    saving.value = false
  }
}
</script>
