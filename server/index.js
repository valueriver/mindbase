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

    // 其它路径走 assets,assets 又找不到时根据 wrangler.jsonc 的
    // not_found_handling: single-page-application 配置,自动 fallback 到 index.html
    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response(null, { status: 404 })
  },
}
