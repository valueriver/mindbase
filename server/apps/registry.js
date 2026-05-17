// 用户应用注册中心 —— 真正属于"用户上下文"的 app。
//
// 开箱即用 = home(主页时间轴)。其它 41 个上下文应用从 mindbase.me
// 应用商店装入,装上后在这里 append 一行 entry 即可。

import homeManifest from './home/manifest.js'
import homeApi      from './home/api.js'

const ENTRIES = [
  { manifest: homeManifest, api: homeApi, style: 'sub' },
]

export const APPS = ENTRIES.map((e) => e.manifest)
export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))

export const APP_ROUTES = ENTRIES.map((e) => ({
  prefix:  e.prefix || `/api/${e.manifest.name}`,
  handler: e.api,
  style:   e.style,
}))
