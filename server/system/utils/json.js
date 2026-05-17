import { buildCorsHeaders } from './http.js'

export const ok = (data = {}, status = 200, cookie = '') => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...buildCorsHeaders('Content-Type'),
  })
  if (cookie) headers.set('Set-Cookie', cookie)
  return new Response(JSON.stringify({ success: true, ...data }), { status, headers })
}

export const fail = (message = 'Bad request', status = 400, cookie = '') => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...buildCorsHeaders('Content-Type'),
  })
  if (cookie) headers.set('Set-Cookie', cookie)
  return new Response(JSON.stringify({ success: false, message }), { status, headers })
}
