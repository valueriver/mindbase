import { reorderItemsAction } from '../service/item.js'

export const handleItemApi = async (request, env, path, method) => {
  if (path === '/api/items/reorder' && method === 'POST') return reorderItemsAction(request, env)
  return null
}
