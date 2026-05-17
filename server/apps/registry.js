// 用户应用注册中心 —— 用户上下文应用。
//
// 开箱预置 6 个:主页(home)、待办(todos)、笔记(notes)、记账(ledger)、项目(projects)、个人档(profile)
// 其余 36 个应用从 mindbase.me 应用商店按需装入,装上后在 ENTRIES 末尾 append 一行即可。

import homeManifest    from './home/manifest.js'
import homeApi         from './home/api.js'
import todosManifest   from './todos/manifest.js'
import todosApi        from './todos/api.js'
import notesManifest   from './notes/manifest.js'
import notesApi        from './notes/api.js'
import ledgerManifest  from './ledger/manifest.js'
import ledgerApi       from './ledger/api.js'
import projectsManifest from './projects/manifest.js'
import projectsApi      from './projects/api.js'
import profileManifest from './profile/manifest.js'
import profileApi      from './profile/api.js'

const ENTRIES = [
  { manifest: homeManifest,     api: homeApi,     style: 'sub' },
  { manifest: todosManifest,    api: todosApi,    style: 'sub' },
  { manifest: notesManifest,    api: notesApi,    style: 'sub' },
  { manifest: ledgerManifest,   api: ledgerApi,   style: 'sub' },
  { manifest: projectsManifest, api: projectsApi, style: 'sub' },
  { manifest: profileManifest,  api: profileApi,  style: 'sub' },
]

export const APPS = ENTRIES.map((e) => e.manifest)
export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))

export const APP_ROUTES = ENTRIES.map((e) => ({
  prefix:  e.prefix || `/api/${e.manifest.name}`,
  handler: e.api,
  style:   e.style,
}))
