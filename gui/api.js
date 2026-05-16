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
  detail: ()     => api.get('/api/notes/root'),
  update: (patch) => api.patch('/api/notes/root', patch),
}

export const apiNotebook = {
  list:   (parentId = null) =>
    api.get(`/api/notes/notebooks${parentId ? `?parent_id=${encodeURIComponent(parentId)}` : ''}`),
  detail: (id)             => api.get(`/api/notes/notebooks/${id}`),
  create: ({ name, parent_id = null, icon = null }) =>
    api.post('/api/notes/notebooks', { name, parent_id, icon }),
  update: (id, patch)      => api.patch(`/api/notes/notebooks/${id}`, patch),
  remove: (id)             => api.delete(`/api/notes/notebooks/${id}`),
}

export const apiNote = {
  detail: (id)                               => api.get(`/api/notes/pages/${id}`),
  create: ({ notebook_id, title = '', content = '' }) =>
    api.post('/api/notes/pages', { notebook_id, title, content }),
  update: (id, patch)                        => api.patch(`/api/notes/pages/${id}`, patch),
  remove: (id)                               => api.delete(`/api/notes/pages/${id}`),
}

export const apiTokens = {
  list:   ()     => api.get('/api/collab/tokens'),
  create: (name) => api.post('/api/collab/tokens', { name }),
  remove: (id)   => api.delete(`/api/collab/tokens/${id}`),
}

export const apiFeed = {
  list:   ({ offset = 0, limit = 30 } = {}) => api.get(`/api/feed?offset=${offset}&limit=${limit}`),
  create: ({ content })                     => api.post('/api/feed', { content }),
  update: (id, { content })                 => api.patch(`/api/feed/${id}`, { content }),
  remove: (id)                              => api.delete(`/api/feed/${id}`),
}

export const apiSearch = {
  run: (q, limit = 30) => api.get(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`),
}

export const apiTodos = {
  list:   ()           => api.get('/api/todos'),
  create: ({ title })  => api.post('/api/todos', { title }),
  update: (id, patch)  => api.patch(`/api/todos/${id}`, patch),
  remove: (id)         => api.delete(`/api/todos/${id}`),
}

export const apiSettings = {
  detail: ()      => api.get('/api/settings'),
  update: (patch) => api.patch('/api/settings', patch),
}

export const apiLedger = {
  list: ({ month = null, type = null, limit = 500 } = {}) => {
    const p = new URLSearchParams()
    if (month) p.set('month', month)
    if (type)  p.set('type',  type)
    p.set('limit', String(limit))
    return api.get(`/api/ledger?${p}`)
  },
  stats:      (month = null) => api.get(`/api/ledger/stats${month ? `?month=${month}` : ''}`),
  categories: ()              => api.get('/api/ledger/categories'),
  get:        (id)            => api.get(`/api/ledger/${id}`),
  create:     (patch)         => api.post('/api/ledger', patch),
  update:     (id, patch)     => api.patch(`/api/ledger/${id}`, patch),
  remove:     (id)            => api.delete(`/api/ledger/${id}`),
}

export const apiProfile = {
  list:   ()         => api.get('/api/profile'),
  create: (body)     => api.post('/api/profile', body),
  update: (id, body) => api.patch(`/api/profile/${id}`, body),
  remove: (id)       => api.delete(`/api/profile/${id}`),
}

export const apiChat = {
  messages: ({ before, limit = 30 } = {}) => {
    const params = new URLSearchParams()
    if (before) params.set('before', String(before))
    params.set('limit', String(limit))
    return api.get(`/api/chat/messages?${params.toString()}`)
  },
  sendUrl:  () => '/api/chat/send',
}

export const apiItems = {
  // items: [{ kind: 'notebook'|'note', id: string }]
  reorder: ({ parent_id = null, items }) =>
    api.post('/api/notes/items/reorder', { parent_id, items }),
}
