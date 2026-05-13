import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { getAllSettings, setSetting } from '../repository/setting.js'
import { listNotebooksUnder } from '../repository/notebook.js'
import { listNotesIn } from '../repository/note.js'

// home_* 元数据存到 settings KV
const HOME_KEYS = { name: 'home_name', icon: 'home_icon', cover: 'home_cover' }

const toHome = (settings) => ({
  name:  settings.home_name  || '首页',
  icon:  settings.home_icon  || null,
  cover: settings.home_cover || null,
})

const readNullableString = (body, key, maxLen) => {
  if (!body || !(key in body)) return undefined
  const v = body[key]
  if (v === null || v === '') return null
  return String(v).slice(0, maxLen)
}

export const getRootAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const [settings, notebooks, notes] = await Promise.all([
    getAllSettings(env.DB),
    listNotebooksUnder(env.DB, null),
    listNotesIn(env.DB, null),
  ])

  return ok({ home: toHome(settings), notebooks, notes })
}

export const updateHomeAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const body = await readJsonBody(request)
  const writes = []

  if (typeof body?.name === 'string') {
    const next = body.name.trim().slice(0, 120) || '首页'
    writes.push(setSetting(env.DB, HOME_KEYS.name, next))
  }
  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) writes.push(setSetting(env.DB, HOME_KEYS.icon,  icon))
  if (cover !== undefined) writes.push(setSetting(env.DB, HOME_KEYS.cover, cover))

  await Promise.all(writes)

  const settings = await getAllSettings(env.DB)
  return ok({ home: toHome(settings) })
}
