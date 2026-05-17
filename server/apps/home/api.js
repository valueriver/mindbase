import {
  listPostsAction,
  createPostAction,
  updatePostAction,
  deletePostAction,
  listEventsAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '/events' && method === 'GET') return listEventsAction(request, env, url)

  if (sub === '' && method === 'GET')  return listPostsAction(request, env, url)
  if (sub === '' && method === 'POST') return createPostAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updatePostAction(request, env, id)
    if (method === 'DELETE') return deletePostAction(request, env, id)
  }
  return null
}

export default handle
