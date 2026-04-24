import { exportAction } from '../service/export.js'

export const handleExportApi = async (request, env, path, method) => {
  if (path === '/api/export' && method === 'GET') return exportAction(request, env)
  return null
}
