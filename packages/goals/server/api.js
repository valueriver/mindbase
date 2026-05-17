import {
  listGoalsAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listGoalsAction(request, env, url)
  if (sub === '' && method === 'POST') return createGoalAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateGoalAction(request, env, id)
    if (method === 'DELETE') return deleteGoalAction(request, env, id)
  }
  return null
}

export default handle
