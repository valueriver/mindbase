<template>
  <div class="flex min-h-dvh flex-col">
    <header class="fixed inset-x-0 top-0 z-40 flex h-11 items-center justify-between border-b border-nt-divider bg-white/95 px-3 backdrop-blur md:px-4">
      <div class="flex min-w-0 items-center gap-1.5 px-1">
        <span class="text-base leading-none">{{ currentApp.icon }}</span>
        <h1 class="truncate text-sm font-semibold text-nt">{{ currentApp.label }}</h1>
      </div>

      <button
        ref="launcherBtn"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded text-nt-muted hover:bg-nt-hover hover:text-nt"
        :title="launcherOpen ? '关闭' : '切换应用'"
        @click="toggleLauncher"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <rect x="1"  y="1"  width="7" height="7" rx="1.4"/>
          <rect x="10" y="1"  width="7" height="7" rx="1.4"/>
          <rect x="1"  y="10" width="7" height="7" rx="1.4"/>
          <rect x="10" y="10" width="7" height="7" rx="1.4"/>
        </svg>
      </button>

      <Popover :open="launcherOpen" :anchor="launcherAnchor" :width="320" @close="launcherOpen = false">
        <div class="flex items-center justify-between px-2 pt-1 pb-2">
          <span class="text-[11px] font-medium text-nt">应用中心</span>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-nt-muted hover:bg-nt-hover hover:text-nt"
              title="整理应用"
              @click="onOrganize"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11.5 1.5 L14.5 4.5 L5 14 H2 V11 Z"/>
                <path d="M9.5 3.5 L12.5 6.5"/>
              </svg>
              <span>整理</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-nt-muted hover:bg-nt-hover hover:text-nt"
              title="创建新应用"
              @click="onCreate"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M8 3 V13 M3 8 H13"/>
              </svg>
              <span>创建</span>
            </button>
          </div>
        </div>
        <div class="border-t border-nt-divider"></div>

        <div class="max-h-[60vh] overflow-y-auto overscroll-contain px-1 pt-1">
          <section v-for="group in renderedGroups" :key="group.name" class="mb-2 last:mb-0">
            <div class="px-1.5 pt-1 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-nt-soft">
              {{ group.name }}
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="app in group.items"
                :key="app.name"
                type="button"
                :disabled="!app.to"
                :class="[
                  'flex flex-col items-center justify-center gap-1 rounded-md py-3 transition',
                  isActive(app)
                    ? 'bg-nt-hover-strong text-nt'
                    : app.to
                      ? 'text-nt hover:bg-nt-hover'
                      : 'cursor-not-allowed text-nt opacity-40',
                ]"
                @click="goTo(app)"
              >
                <span class="text-2xl leading-none">{{ app.icon }}</span>
                <span class="text-[11px] font-medium">{{ app.label }}</span>
              </button>
            </div>
          </section>
        </div>

        <div class="mt-2 border-t border-nt-divider"></div>
        <div class="grid grid-cols-3 gap-1 px-1 pt-1 pb-1">
          <button
            v-for="sys in systems"
            :key="sys.name"
            type="button"
            :class="[
              'flex flex-col items-center justify-center gap-1 rounded-md py-3 transition',
              isActive(sys)
                ? 'bg-nt-hover-strong text-nt'
                : 'text-nt hover:bg-nt-hover',
            ]"
            @click="goTo(sys)"
          >
            <span class="text-2xl leading-none">{{ sys.icon }}</span>
            <span class="text-[11px] font-medium">{{ sys.label }}</span>
          </button>
        </div>
      </Popover>
    </header>

    <main class="min-w-0 flex-1 pt-11">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Popover from './Popover.vue'
import { APPS_META, DEFAULT_LAYOUT, appMeta } from '@/system/lib/apps.js'
import { api } from '@/api'

const route   = useRoute()
const router  = useRouter()

// 系统级别 — 不是上下文,是产品功能,固定在启动器底部,不参与布局。
// 直接 glob 派生 server/system/apps/*/manifest.js,过掉 infra(如 user 登录)。
const systemManifests = import.meta.glob(
  '../../../server/system/apps/*/manifest.js',
  { eager: true, import: 'default' },
)
const systems = Object.values(systemManifests)
  .filter((m) => m.kind !== 'infra')
  .map((m) => ({
    name:  m.name,
    icon:  m.icon,
    label: m.label,
    to:    { name: m.name },
    match: (p) => p === `/${m.name}` || p.startsWith(`/${m.name}/`),
  }))

// 用户布局。拉接口失败时兜底用默认布局,正常情况以服务端为准。
const layout = ref(DEFAULT_LAYOUT)

onMounted(async () => {
  try {
    const data = await api.get('/api/home/layout')
    if (data?.layout?.groups) layout.value = data.layout
  } catch {
    // 401 / 网络失败:保持默认布局,不弹错。
  }
})

// 按布局组装出渲染用的分组,过滤掉隐藏的,丢弃无法识别的 slug。
// 未在任何分组、也没被隐藏的应用(新加的)自动归到末尾"未分组",提示用户去 /layout 收编。
const renderedGroups = computed(() => {
  const hidden = new Set(layout.value.hidden || [])
  const used   = new Set()
  const groups = []

  for (const g of layout.value.groups || []) {
    const items = []
    for (const slug of g.apps || []) {
      if (hidden.has(slug)) { used.add(slug); continue }
      const meta = appMeta(slug)
      if (!meta) continue
      used.add(slug)
      items.push(meta)
    }
    if (items.length) groups.push({ name: g.name, items })
  }

  const orphans = APPS_META.filter((a) => !used.has(a.name) && !hidden.has(a.name))
  if (orphans.length) groups.push({ name: '未分组', items: orphans })

  return groups
})

function isActive(app) {
  return app.match(route.path)
}

const currentApp = computed(() => {
  const a = [...APPS_META, ...systems].find(isActive)
  return a || { icon: '🧠', label: 'MindBase' }
})

const launcherBtn    = ref(null)
const launcherOpen   = ref(false)
const launcherAnchor = ref(null)

function toggleLauncher() {
  if (launcherOpen.value) { launcherOpen.value = false; return }
  launcherAnchor.value = launcherBtn.value || null
  launcherOpen.value = true
}

function goTo(app) {
  launcherOpen.value = false
  if (!app.to) return
  router.push(app.to)
}

function onOrganize() {
  launcherOpen.value = false
  router.push({ name: 'layout' })
}

function onCreate() {
  launcherOpen.value = false
  router.push({ name: 'create' })
}
</script>
