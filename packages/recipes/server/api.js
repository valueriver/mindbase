import {
  listRecipesAction,
  createRecipeAction,
  updateRecipeAction,
  deleteRecipeAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listRecipesAction(request, env, url)
  if (sub === '' && method === 'POST') return createRecipeAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateRecipeAction(request, env, id)
    if (method === 'DELETE') return deleteRecipeAction(request, env, id)
  }
  return null
}

export default handle
