import { ok, fail } from "../../system/utils/json.js"
import { readJsonBody } from "../../system/utils/body.js"
import { isAuthenticated } from "../../system/auth/index.js"
import { getAllSettings, setSetting } from './repository.js'
import { DEFAULT_SYSTEM_PROMPT } from '../../system/prompt/default.js'

const ROUND_CHOICES = [30, 100, 500]
const DEFAULT_ROUNDS = 100

const WRITABLE = new Set([
  'ai_base_url',
  'ai_api_key',
  'ai_model',
  'ai_context_rounds',
  'ai_system_prompt',
  'home_name',
  'home_icon',
  'home_cover',
])

const normalizeRounds = (raw) => {
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_ROUNDS
  return ROUND_CHOICES.includes(n) ? n : DEFAULT_ROUNDS
}

const serialize = (all) => ({
  ai_base_url:              all.ai_base_url || '',
  ai_api_key:               all.ai_api_key  || '',
  ai_model:                 all.ai_model    || '',
  ai_context_rounds:        normalizeRounds(all.ai_context_rounds),
  ai_system_prompt:         all.ai_system_prompt || '',
  ai_system_prompt_default: DEFAULT_SYSTEM_PROMPT,
})

export const getSettingsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const all = await getAllSettings(env.DB)
  return ok({ settings: serialize(all) })
}

export const updateSettingsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request) || {}
  for (const [k, v] of Object.entries(body)) {
    if (!WRITABLE.has(k)) continue
    let val
    if (k === 'ai_context_rounds') {
      val = String(normalizeRounds(v))
    } else {
      val = v === '' || v === null ? null : String(v)
    }
    await setSetting(env.DB, k, val)
  }
  const all = await getAllSettings(env.DB)
  return ok({ settings: serialize(all) })
}
