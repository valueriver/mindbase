import {
  listPromptsAction,
  createPromptAction,
  updatePromptAction,
  deletePromptAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listPromptsAction(request, env, url)
  if (sub === '' && method === 'POST') return createPromptAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updatePromptAction(request, env, id)
    if (method === 'DELETE') return deletePromptAction(request, env, id)
  }
  return null
}

export default handle
