import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listRecipes, findRecipeById, insertRecipe, updateRecipe, deleteRecipe } from './repository.js'

const serialize = (row) => row && ({
  id:          row.id,
  title:       row.title,
  cuisine:     row.cuisine || '',
  servings:    row.servings ?? 0,
  prep_min:    row.prep_min ?? 0,
  ingredients: row.ingredients || '',
  steps:       row.steps || '',
  note:        row.note || '',
  cover:       row.cover || null,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanText = (v) => (v === undefined || v === null) ? '' : String(v)
const cleanInt = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

export const listRecipesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listRecipes(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createRecipeAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertRecipe(env.DB, {
    id:          crypto.randomUUID(),
    title,
    cuisine:     cleanStr(body?.cuisine),
    servings:    cleanInt(body?.servings) ?? 0,
    prep_min:    cleanInt(body?.prep_min) ?? 0,
    ingredients: cleanText(body?.ingredients),
    steps:       cleanText(body?.steps),
    note:        cleanStr(body?.note),
    cover:       cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateRecipeAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findRecipeById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.title !== undefined) {
    const t = cleanStr(body.title)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.cuisine     !== undefined) patch.cuisine     = cleanStr(body.cuisine)
  if (body?.servings    !== undefined) patch.servings    = cleanInt(body.servings)
  if (body?.prep_min    !== undefined) patch.prep_min    = cleanInt(body.prep_min)
  if (body?.ingredients !== undefined) patch.ingredients = cleanText(body.ingredients)
  if (body?.steps       !== undefined) patch.steps       = cleanText(body.steps)
  if (body?.note        !== undefined) patch.note        = cleanStr(body.note)
  if (body?.cover       !== undefined) patch.cover       = cleanOpt(body.cover)
  const row = await updateRecipe(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteRecipeAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findRecipeById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteRecipe(env.DB, id)
  return ok({})
}
