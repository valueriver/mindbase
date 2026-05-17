import {
  listMedicalAction,
  createMedicalAction,
  updateMedicalAction,
  deleteMedicalAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listMedicalAction(request, env, url)
  if (sub === '' && method === 'POST') return createMedicalAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateMedicalAction(request, env, id)
    if (method === 'DELETE') return deleteMedicalAction(request, env, id)
  }
  return null
}

export default handle
