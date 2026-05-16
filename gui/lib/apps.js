// 应用元数据 — 上下文载体清单。
//
// 这是启动器、整理页(/layout)等需要列出"全部应用"的地方读取的派生层:
// name / icon / label / category / kind 都从各 app 的 manifest.js 派生,
// to / match 这两个跟 Vue Router 耦合的函数留在本文件手写。
//
// 单一事实源 = server/apps/<name>/manifest.js。新增应用先写 manifest,
// 再在本文件 import 一行,APPS_META 自动包含。

import home        from '../../server/apps/home/manifest.js'
import todos       from '../../server/apps/todos/manifest.js'
import ledger      from '../../server/apps/ledger/manifest.js'
import notes       from '../../server/apps/notes/manifest.js'
import bookmarks   from '../../server/apps/bookmarks/manifest.js'
import music       from '../../server/apps/music/manifest.js'
import movies      from '../../server/apps/movies/manifest.js'
import books       from '../../server/apps/books/manifest.js'
import outline     from '../../server/apps/outline/manifest.js'
import mindmap     from '../../server/apps/mindmap/manifest.js'
import webs        from '../../server/apps/webs/manifest.js'
import calendar    from '../../server/apps/calendar/manifest.js'
import travel      from '../../server/apps/travel/manifest.js'
import projects    from '../../server/apps/projects/manifest.js'
import subs        from '../../server/apps/subs/manifest.js'
import vault       from '../../server/apps/vault/manifest.js'
import resume      from '../../server/apps/resume/manifest.js'
import cards       from '../../server/apps/cards/manifest.js'
import accounts    from '../../server/apps/accounts/manifest.js'
import emails      from '../../server/apps/emails/manifest.js'
import memories    from '../../server/apps/memories/manifest.js'
import domains     from '../../server/apps/domains/manifest.js'
import articles    from '../../server/apps/articles/manifest.js'
import assets      from '../../server/apps/assets/manifest.js'
import medical     from '../../server/apps/medical/manifest.js'
import games       from '../../server/apps/games/manifest.js'
import appsItem    from '../../server/apps/apps/manifest.js'
import photos      from '../../server/apps/photos/manifest.js'
import manuals     from '../../server/apps/manuals/manifest.js'
import footprints  from '../../server/apps/footprints/manifest.js'
import docs        from '../../server/apps/docs/manifest.js'
import wishlist    from '../../server/apps/wishlist/manifest.js'
import contacts    from '../../server/apps/contacts/manifest.js'
import prompts     from '../../server/apps/prompts/manifest.js'
import servers     from '../../server/apps/servers/manifest.js'
import llms        from '../../server/apps/llms/manifest.js'
import apikeys     from '../../server/apps/apikeys/manifest.js'
import health      from '../../server/apps/health/manifest.js'
import recipes     from '../../server/apps/recipes/manifest.js'
import devices     from '../../server/apps/devices/manifest.js'
import exhibitions from '../../server/apps/exhibitions/manifest.js'
import concerts    from '../../server/apps/concerts/manifest.js'
import goals       from '../../server/apps/goals/manifest.js'
import profile     from '../../server/apps/profile/manifest.js'

// 仅上下文应用 + placeholder 进入启动器。系统功能(chat / collab / settings)
// 在 AppShell 内单独维护,不在这里。
const CONTEXT_MANIFESTS = [
  home, todos, ledger, notes, bookmarks, music, movies, books, outline, mindmap,
  webs, calendar, travel, projects, subs, vault, resume, cards, accounts, emails,
  memories, domains, articles, assets, medical, games, appsItem, photos, manuals, footprints,
  docs, wishlist, contacts, prompts, servers, llms, apikeys, health, recipes, devices,
  exhibitions, concerts, goals, profile,
]

// 路由匹配规则:大部分应用 = path.startsWith('/<name>'),少数有特殊路径在这里覆写。
const MATCH_OVERRIDES = {
  home:  (p) => p === '/' || p.startsWith('/home'),
  notes: (p) => p === '/notes' || p.startsWith('/notebook') || p.startsWith('/note'),
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
    { name: '日常', apps: ['home', 'todos', 'ledger', 'calendar', 'health', 'profile'] },
    { name: '兴趣', apps: ['books', 'movies', 'music', 'games', 'exhibitions', 'concerts', 'bookmarks'] },
    { name: '生活', apps: ['footprints', 'photos', 'travel', 'memories', 'contacts', 'recipes'] },
    { name: '创作', apps: ['notes', 'articles', 'prompts', 'webs', 'projects', 'goals', 'wishlist'] },
    { name: '身份', apps: ['resume', 'cards', 'vault', 'docs', 'emails', 'accounts'] },
    { name: '技术', apps: ['servers', 'llms', 'apikeys', 'domains', 'devices', 'apps'] },
    { name: '其它', apps: ['assets', 'subs', 'medical', 'manuals', 'outline', 'mindmap'] },
  ],
  hidden: [],
}

const META_BY_NAME = Object.fromEntries(APPS_META.map((a) => [a.name, a]))

export const appMeta = (slug) => META_BY_NAME[slug] || null
export const iconOf  = (slug) => META_BY_NAME[slug]?.icon  || '🧩'
export const labelOf = (slug) => META_BY_NAME[slug]?.label || slug
