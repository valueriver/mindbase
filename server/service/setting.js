import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import { getAllSettings, setSetting } from '../repository/setting.js'

// 暴露给前端的字段白名单(AI key 也回传以便前端展示掩码,但前端永远不能拿原值)
const PUBLIC_KEYS = ['ai_base_url', 'ai_model', 'memos_icon', 'memos_cover']
const SECRET_KEYS = ['ai_api_key']
const WRITABLE = new Set([...PUBLIC_KEYS, ...SECRET_KEYS])

const maskKey = (v) => {
  if (!v) return ''
  if (v.length <= 8) return '••••'
  return `${v.slice(0, 4)}••••${v.slice(-4)}`
}

export const getSettingsAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)
  const all = await getAllSettings(env.DB)
  return ok({
    settings: {
      ai_base_url:     all.ai_base_url || '',
      ai_model:        all.ai_model    || '',
      ai_api_key_set:  !!all.ai_api_key,
      ai_api_key_hint: maskKey(all.ai_api_key || ''),
      memos_icon:      all.memos_icon  || '',
      memos_cover:     all.memos_cover || '',
    },
  })
}

export const updateSettingsAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)
  const body = await readJsonBody(request) || {}
  for (const [k, v] of Object.entries(body)) {
    if (!WRITABLE.has(k)) continue
    // 空字符串视为删除该配置
    const val = v === '' || v === null ? null : String(v)
    await setSetting(env.DB, k, val)
  }
  return getSettingsAction(request, env)
}
