import {
  listLedgerAction,
  statsLedgerAction,
  categoriesLedgerAction,
  getLedgerAction,
  createLedgerAction,
  updateLedgerAction,
  deleteLedgerAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === ''            && method === 'GET')  return listLedgerAction(request, env, url)
  if (sub === ''            && method === 'POST') return createLedgerAction(request, env)
  if (sub === '/stats'      && method === 'GET')  return statsLedgerAction(request, env, url)
  if (sub === '/categories' && method === 'GET')  return categoriesLedgerAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getLedgerAction(request, env, id)
    if (method === 'PATCH')  return updateLedgerAction(request, env, id)
    if (method === 'DELETE') return deleteLedgerAction(request, env, id)
  }
  return null
}

export default handle
