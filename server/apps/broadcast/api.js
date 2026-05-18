import {
  listPostsAction, createPostAction, updatePostAction, deletePostAction,
  listPlatformsAction, createPlatformAction, updatePlatformAction, deletePlatformAction,
  listStatusesAction, upsertStatusAction,
} from './service.js'

const handle = async (request, env, sub, method) => {
  // /api/broadcast
  if (sub === '' && method === 'GET')  return listPostsAction(request, env)
  if (sub === '' && method === 'POST') return createPostAction(request, env)

  // /api/broadcast/platforms
  if (sub === '/platforms' && method === 'GET')  return listPlatformsAction(request, env)
  if (sub === '/platforms' && method === 'POST') return createPlatformAction(request, env)

  // /api/broadcast/platforms/:id
  const mp = sub.match(/^\/platforms\/([\w-]+)$/)
  if (mp) {
    const id = mp[1]
    if (method === 'PATCH')  return updatePlatformAction(request, env, id)
    if (method === 'DELETE') return deletePlatformAction(request, env, id)
  }

  // /api/broadcast/:postId
  const mpost = sub.match(/^\/([\w-]+)$/)
  if (mpost) {
    const id = mpost[1]
    if (method === 'PATCH')  return updatePostAction(request, env, id)
    if (method === 'DELETE') return deletePostAction(request, env, id)
  }

  // /api/broadcast/:postId/statuses
  const ms = sub.match(/^\/([\w-]+)\/statuses$/)
  if (ms && method === 'GET') return listStatusesAction(request, env, ms[1])

  // /api/broadcast/:postId/statuses/:platformId
  const msp = sub.match(/^\/([\w-]+)\/statuses\/([\w-]+)$/)
  if (msp && method === 'PUT') return upsertStatusAction(request, env, msp[1], msp[2])

  return null
}

export default handle
