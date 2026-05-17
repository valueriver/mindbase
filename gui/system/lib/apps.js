// 上下文应用元数据 —— 启动器、整理页(/layout)等读取的派生层。
//
// 用 import.meta.glob 直接扫 server/apps/*/manifest.js,装一个新包就有,
// 这里不需要任何手工注册。系统功能(chat / collab / settings)在 AppShell 单独派生。

const modules = import.meta.glob(
  '../../../server/apps/*/manifest.js',
  { eager: true, import: 'default' },
)

const CONTEXT_MANIFESTS = Object.values(modules)

// 路由匹配规则:大部分应用 = path.startsWith('/<name>'),少数有特殊路径在这里覆写。
const MATCH_OVERRIDES = {
  home: (p) => p === '/' || p.startsWith('/home'),
}

export const APPS_META = CONTEXT_MANIFESTS.map((m) => ({
  name:  m.name,
  icon:  m.icon,
  label: m.label,
  to:    m.kind === 'placeholder' ? null : { name: m.name },
  match: MATCH_OVERRIDES[m.name] || ((p) => p.startsWith('/' + m.name)),
}))

// 默认布局 — 接口失败时兜底使用,正常情况下以服务端返回为准。
// 和 server/apps/home/service.js 的 DEFAULT_LAYOUT 内容保持一致。
export const DEFAULT_LAYOUT = {
  groups: [
    { name: '日常', apps: ['home', 'todos', 'ledger', 'footprints'] },
    { name: '内容', apps: ['notes', 'projects', 'prompts'] },
    { name: '身份', apps: ['profile', 'emails', 'domains'] },
    { name: '凭据', apps: ['apikeys', 'llms'] },
  ],
  hidden: [],
}

const META_BY_NAME = Object.fromEntries(APPS_META.map((a) => [a.name, a]))

export const appMeta = (slug) => META_BY_NAME[slug] || null
export const iconOf  = (slug) => META_BY_NAME[slug]?.icon  || '🧩'
export const labelOf = (slug) => META_BY_NAME[slug]?.label || slug
