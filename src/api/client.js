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
  me:           ()                       => api.get('/api/user/me'),
  authStatus:   ()                       => api.get('/api/user/auth/status'),
  setupAuth:    (username, password)     => api.post('/api/user/auth/setup', { username, password }),
  login:        (username, password)     => api.post('/api/user/login', { username, password }),
  logout:       ()                       => api.post('/api/user/logout'),
  changePassword: (oldPwd, newPwd)       => api.post('/api/user/password', { old_password: oldPwd, new_password: newPwd }),
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

export const apiTokens = {
  list:   ()     => api.get('/api/tokens'),
  create: (name) => api.post('/api/tokens', { name }),
  remove: (id)   => api.delete(`/api/tokens/${id}`),
}

export const apiMemos = {
  list:   ()           => api.get('/api/memos'),
  create: ({ content }) => api.post('/api/memos', { content }),
  update: (id, { content }) => api.patch(`/api/memos/${id}`, { content }),
  remove: (id)         => api.delete(`/api/memos/${id}`),
}

export const apiSettings = {
  detail: ()      => api.get('/api/settings'),
  update: (patch) => api.patch('/api/settings', patch),
}

export const apiChat = {
  messages: () => api.get('/api/chat/messages'),
  sendUrl:  () => '/api/chat/send',
}

export const apiItems = {
  // items: [{ kind: 'notebook'|'note', id: string }]
  reorder: ({ parent_id = null, items }) =>
    api.post('/api/items/reorder', { parent_id, items }),
}
