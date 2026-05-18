// 应用注册中心 —— 一视同仁,没有"用户/系统"之分。
//
// ENTRIES 的顺序决定 /api/ai/apps 与启动器的显示顺序:前面的更重要 / 更常用。
//
// 字段:
//   - manifest:应用元信息(name / label / icon / tables / subpaths)。
//                contexts 是系统模块,不暴露 manifest,只走 prefix 注册路由。
//   - api:HTTP 处理器。省略 = 仅前端应用。
//   - style:'sub' 子路径模式 (handler 收到 sub/method), 'full' 全路径模式 (handler 自己解析 URL)。
//   - kind:context(默认,普通应用) / infra(基础设施,不进启动器) / system(系统功能)。
//   - prefix:覆盖默认 /api/<name> 前缀。

import homeManifest       from './home/manifest.js'
import homeApi            from './home/api.js'
import todosManifest      from './todos/manifest.js'
import todosApi           from './todos/api.js'
import notesManifest      from './notes/manifest.js'
import notesApi           from './notes/api.js'
import projectsManifest   from './projects/manifest.js'
import projectsApi        from './projects/api.js'
import promptsManifest    from './prompts/manifest.js'
import promptsApi         from './prompts/api.js'
import llmsManifest       from './llms/manifest.js'
import llmsApi            from './llms/api.js'
import apikeysManifest    from './apikeys/manifest.js'
import apikeysApi         from './apikeys/api.js'
import ledgerManifest     from './ledger/manifest.js'
import ledgerApi          from './ledger/api.js'
import profileManifest    from './profile/manifest.js'
import profileApi         from './profile/api.js'
import emailsManifest     from './emails/manifest.js'
import emailsApi          from './emails/api.js'
import domainsManifest    from './domains/manifest.js'
import domainsApi         from './domains/api.js'
import footprintsManifest from './footprints/manifest.js'
import footprintsApi      from './footprints/api.js'

import chatManifest       from './chat/manifest.js'
import chatApi            from './chat/api.js'
import collabManifest     from './collab/manifest.js'
import collabApi          from './collab/api.js'
import settingsManifest   from './settings/manifest.js'
import settingsApi        from './settings/api.js'
import userManifest       from './user/manifest.js'
import { handleUserApi }     from './user/api.js'
import { handleContextsApi } from '../system/contexts/api.js'

const ENTRIES = [
  { manifest: homeManifest,       api: homeApi,       style: 'sub' },
  { manifest: todosManifest,      api: todosApi,      style: 'sub' },
  { manifest: notesManifest,      api: notesApi,      style: 'sub' },
  { manifest: projectsManifest,   api: projectsApi,   style: 'sub' },
  { manifest: promptsManifest,    api: promptsApi,    style: 'sub' },
  { manifest: llmsManifest,       api: llmsApi,       style: 'sub' },
  { manifest: apikeysManifest,    api: apikeysApi,    style: 'sub' },
  { manifest: ledgerManifest,     api: ledgerApi,     style: 'sub' },
  { manifest: profileManifest,    api: profileApi,    style: 'sub' },
  { manifest: emailsManifest,     api: emailsApi,     style: 'sub' },
  { manifest: domainsManifest,    api: domainsApi,    style: 'sub' },
  { manifest: footprintsManifest, api: footprintsApi, style: 'sub' },

  // 系统类(在启动器底部 dock 出现):
  { manifest: chatManifest,       api: chatApi,           style: 'sub'  },
  { manifest: collabManifest,     api: collabApi,         style: 'sub'  },
  { manifest: settingsManifest,   api: settingsApi,       style: 'sub'  },

  // 基础设施 / 系统模块(不进启动器):
  { manifest: userManifest,       api: handleUserApi,     style: 'full' },
  { prefix: '/api/contexts',      api: handleContextsApi, style: 'sub'  },
]

// 启动器:过滤掉 infra(user)和无 api 也无 manifest 的纯路由(contexts)。
export const APPS = ENTRIES
  .filter((e) => e.manifest && e.manifest.kind !== 'infra')
  .map((e) => e.manifest)

export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))

// 路由:有 api 的全部参与分发(包括 contexts 这类无 manifest 的)。
export const APP_ROUTES = ENTRIES
  .filter((e) => e.api)
  .map((e) => ({
    prefix:  e.prefix || `/api/${e.manifest.name}`,
    handler: e.api,
    style:   e.style,
  }))
