// 系统级应用注册中心 —— 跟用户应用同样的机制,只是身份是"系统"。
//
// chat / collab / settings 是启动器下区的系统三件套(有 UI)。
// user 是基础设施(无 UI,只有 URL,kind: 'infra' 区分)。
//
// 跟 server/apps/registry.js 一样的形态:
//   - APPS:对外可见的应用元信息(filter 掉 infra)
//   - APP_ROUTES:router 用的全部分发条目

import chatManifest     from './chat/manifest.js'
import collabManifest   from './collab/manifest.js'
import settingsManifest from './settings/manifest.js'
import userManifest     from './user/manifest.js'

import chatApi     from './chat/api.js'
import collabApi   from './collab/api.js'
import settingsApi from './settings/api.js'
import { handleUserApi } from './user/api.js'

const ENTRIES = [
  { manifest: chatManifest,     api: chatApi,       style: 'sub'  },
  { manifest: collabManifest,   api: collabApi,     style: 'sub'  },
  { manifest: settingsManifest, api: settingsApi,   style: 'sub'  },
  { manifest: userManifest,     api: handleUserApi, style: 'full' },
]

export const APPS = ENTRIES
  .filter((e) => e.manifest.kind !== 'infra')
  .map((e) => e.manifest)

export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))

export const APP_ROUTES = ENTRIES.map((e) => ({
  prefix:  e.prefix || `/api/${e.manifest.name}`,
  handler: e.api,
  style:   e.style,
}))
