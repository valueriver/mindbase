import {
  listProjectsAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listProjectsAction(request, env, url)
  if (sub === '' && method === 'POST') return createProjectAction(request, env)

  const m = sub.match(/^\/([\w-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateProjectAction(request, env, id)
    if (method === 'DELETE') return deleteProjectAction(request, env, id)
  }
  return null
}

export default handle
