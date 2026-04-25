import { searchAction } from '../service/search.js'

export const handleSearchApi = async (request, env, path, method, url) => {
  if (path === '/api/search' && method === 'GET') return searchAction(request, env, url)
  return null
}
