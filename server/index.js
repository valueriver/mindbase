import handleApiRoutes from './api/index.js'
import { serveImageAction } from './service/image.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 图片公开读取(key 本身是不可枚举的 uuid,够做弱保护)
    if (url.pathname.startsWith('/i/')) {
      const key = decodeURIComponent(url.pathname.slice(3))
      return serveImageAction(request, env, key)
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRoutes(request, env, url)
    }

    return new Response(null, { status: 404 })
  },
}
