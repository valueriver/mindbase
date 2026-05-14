import {
  listLedgerAction,
  statsLedgerAction,
  categoriesLedgerAction,
  getLedgerAction,
  createLedgerAction,
  updateLedgerAction,
  deleteLedgerAction,
} from '../service/ledger.js'

export const handleLedgerApi = async (request, env, path, method, url) => {
  if (path === '/api/ledger' && method === 'GET')  return listLedgerAction(request, env, url)
  if (path === '/api/ledger' && method === 'POST') return createLedgerAction(request, env)
  if (path === '/api/ledger/stats'      && method === 'GET') return statsLedgerAction(request, env, url)
  if (path === '/api/ledger/categories' && method === 'GET') return categoriesLedgerAction(request, env)

  const m = path.match(/^\/api\/ledger\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getLedgerAction(request, env, id)
    if (method === 'PATCH')  return updateLedgerAction(request, env, id)
    if (method === 'DELETE') return deleteLedgerAction(request, env, id)
  }
  return null
}
