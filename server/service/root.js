import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import { findUserById, updateUserHome } from '../repository/user.js'
import { listNotebooksUnder } from '../repository/notebook.js'
import { listNotesIn } from '../repository/note.js'

const toHome = (u) => ({
  name:  u?.home_name  || '首页',
  icon:  u?.home_icon  || null,
  cover: u?.home_cover || null,
})

const readNullableString = (body, key, maxLen) => {
  if (!body || !(key in body)) return undefined
  const v = body[key]
  if (v === null || v === '') return null
  return String(v).slice(0, maxLen)
}

// GET /api/root — 返回当前用户 "首页" 元数据 + 根层级的笔记本 + 笔记
export const getRootAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const [dbUser, notebooks, notes] = await Promise.all([
    findUserById(env.DB, user.id),
    listNotebooksUnder(env.DB, user.id, null),
    listNotesIn(env.DB, user.id, null),
  ])

  return ok({ home: toHome(dbUser), notebooks, notes })
}

// PATCH /api/root — 改首页名字 / 图标 / 封面
export const updateHomeAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const body = await readJsonBody(request)

  const patch = {}
  if (typeof body?.name === 'string') {
    const next = body.name.trim().slice(0, 120)
    patch.homeName = next || '首页'
  }
  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) patch.homeIcon  = icon
  if (cover !== undefined) patch.homeCover = cover

  const dbUser = await updateUserHome(env.DB, user.id, patch)
  return ok({ home: toHome(dbUser) })
}
