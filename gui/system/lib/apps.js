// 上下文应用元数据 —— 启动器读取的派生层。
//
// 用 import.meta.glob 直接扫 server/apps/*/manifest.js,装一个新包就有,
// 不需要手工注册。系统应用(chat / collab / settings)在 AppShell 单独派生。

const modules = import.meta.glob(
  '../../../server/apps/*/manifest.js',
  { eager: true, import: 'default' },
)

const CONTEXT_MANIFESTS = Object.values(modules)

// 启动器内的显示顺序。前面是按重要性排好的常用应用,后面的应用按 slug
// 字母序补齐 —— 新装一个包,扔进 apps/ 就自动出现在尾部。
const ORDER = [
  'home', 'todos', 'notes', 'projects', 'prompts', 'llms', 'apikeys',
]

const orderIndex = (name) => {
  const i = ORDER.indexOf(name)
  return i === -1 ? ORDER.length : i
}

const SORTED = [...CONTEXT_MANIFESTS].sort((a, b) => {
  const ia = orderIndex(a.name)
  const ib = orderIndex(b.name)
  if (ia !== ib) return ia - ib
  return a.name.localeCompare(b.name)
})

// 路由匹配规则:大部分应用 = path.startsWith('/<name>'),少数有特殊路径在这里覆写。
const MATCH_OVERRIDES = {
  home: (p) => p === '/' || p.startsWith('/home'),
}

export const APPS_META = SORTED.map((m) => ({
  name:  m.name,
  icon:  m.icon,
  label: m.label,
  to:    m.kind === 'placeholder' ? null : { name: m.name },
  match: MATCH_OVERRIDES[m.name] || ((p) => p.startsWith('/' + m.name)),
}))

const META_BY_NAME = Object.fromEntries(APPS_META.map((a) => [a.name, a]))

export const appMeta = (slug) => META_BY_NAME[slug] || null
export const iconOf  = (slug) => META_BY_NAME[slug]?.icon  || '🧩'
export const labelOf = (slug) => META_BY_NAME[slug]?.label || slug
