async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({ success: false, message: 'invalid_json' }))
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `http_${res.status}`)
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

export const api = {
  get:    (p)    => request('GET',    p),
  post:   (p, b) => request('POST',   p, b),
  patch:  (p, b) => request('PATCH',  p, b),
  delete: (p)    => request('DELETE', p),
}

export const apiUser = {
  me:          ()      => api.get('/api/user/me'),
  googleLogin: (token) => api.post('/api/user/login/google', { token }),
  logout:      ()      => api.post('/api/user/logout'),
}

export const apiRoot = {
  detail: ()     => api.get('/api/root'),
  update: (patch) => api.patch('/api/root', patch),
}

export const apiNotebook = {
  list:   (parentId = null) =>
    api.get(`/api/notebooks${parentId ? `?parent_id=${encodeURIComponent(parentId)}` : ''}`),
  detail: (id)             => api.get(`/api/notebooks/${id}`),
  create: ({ name, parent_id = null, icon = null }) =>
    api.post('/api/notebooks', { name, parent_id, icon }),
  update: (id, patch)      => api.patch(`/api/notebooks/${id}`, patch),
  remove: (id)             => api.delete(`/api/notebooks/${id}`),
}

export const apiNote = {
  detail: (id)                               => api.get(`/api/notes/${id}`),
  create: ({ notebook_id, title = '', content = '' }) =>
    api.post('/api/notes', { notebook_id, title, content }),
  update: (id, patch)                        => api.patch(`/api/notes/${id}`, patch),
  remove: (id)                               => api.delete(`/api/notes/${id}`),
}
