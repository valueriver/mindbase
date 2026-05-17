import {
  listDevicesAction,
  createDeviceAction,
  updateDeviceAction,
  deleteDeviceAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listDevicesAction(request, env, url)
  if (sub === '' && method === 'POST') return createDeviceAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateDeviceAction(request, env, id)
    if (method === 'DELETE') return deleteDeviceAction(request, env, id)
  }
  return null
}

export default handle
