import {
  listArticlesAction,
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listArticlesAction(request, env, url)
  if (sub === '' && method === 'POST') return createArticleAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateArticleAction(request, env, id)
    if (method === 'DELETE') return deleteArticleAction(request, env, id)
  }
  return null
}

export default handle
