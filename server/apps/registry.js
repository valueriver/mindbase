// 用户应用注册中心 —— 用户上下文应用。
//
// 开箱预置 12 个常用应用。其余 30 个应用从 mindbase.me 应用商店按需装入,
// 装上后在 ENTRIES 末尾 append 一行即可。

import homeManifest       from './home/manifest.js'
import homeApi            from './home/api.js'
import todosManifest      from './todos/manifest.js'
import todosApi           from './todos/api.js'
import notesManifest      from './notes/manifest.js'
import notesApi           from './notes/api.js'
import ledgerManifest     from './ledger/manifest.js'
import ledgerApi          from './ledger/api.js'
import projectsManifest   from './projects/manifest.js'
import projectsApi        from './projects/api.js'
import profileManifest    from './profile/manifest.js'
import profileApi         from './profile/api.js'
import llmsManifest       from './llms/manifest.js'
import llmsApi            from './llms/api.js'
import promptsManifest    from './prompts/manifest.js'
import promptsApi         from './prompts/api.js'
import apikeysManifest    from './apikeys/manifest.js'
import apikeysApi         from './apikeys/api.js'
import emailsManifest     from './emails/manifest.js'
import emailsApi          from './emails/api.js'
import domainsManifest    from './domains/manifest.js'
import domainsApi         from './domains/api.js'
import footprintsManifest from './footprints/manifest.js'
import footprintsApi      from './footprints/api.js'

const ENTRIES = [
  { manifest: homeManifest,       api: homeApi,       style: 'sub' },
  { manifest: todosManifest,      api: todosApi,      style: 'sub' },
  { manifest: notesManifest,      api: notesApi,      style: 'sub' },
  { manifest: ledgerManifest,     api: ledgerApi,     style: 'sub' },
  { manifest: projectsManifest,   api: projectsApi,   style: 'sub' },
  { manifest: profileManifest,    api: profileApi,    style: 'sub' },
  { manifest: llmsManifest,       api: llmsApi,       style: 'sub' },
  { manifest: promptsManifest,    api: promptsApi,    style: 'sub' },
  { manifest: apikeysManifest,    api: apikeysApi,    style: 'sub' },
  { manifest: emailsManifest,     api: emailsApi,     style: 'sub' },
  { manifest: domainsManifest,    api: domainsApi,    style: 'sub' },
  { manifest: footprintsManifest, api: footprintsApi, style: 'sub' },
]

export const APPS = ENTRIES.map((e) => e.manifest)
export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))

export const APP_ROUTES = ENTRIES.map((e) => ({
  prefix:  e.prefix || `/api/${e.manifest.name}`,
  handler: e.api,
  style:   e.style,
}))
