import handleApiRoutes from './api/index.js'
import { serveImageAction } from './service/image.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 用户上传到 mindbase 桶的图片(笔记里的截图)
    if (url.pathname.startsWith('/i/')) {
      const key = decodeURIComponent(url.pathname.slice(3))
      return serveImageAction(request, env, key)
    }

    // 项目静态资源(README 截图等),从 woodchange 桶 mindbase/screenshots/ 路径读
    if (url.pathname.startsWith('/screenshots/')) {
      if (!env.WOODCHANGE) return new Response('not_configured', { status: 500 })
      const name = decodeURIComponent(url.pathname.slice('/screenshots/'.length))
      if (!name || name.length > 256) return new Response('bad_key', { status: 400 })
      const key = `mindbase/screenshots/${name}`
      const object = await env.WOODCHANGE.get(key)
      if (!object) return new Response('not_found', { status: 404 })
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('cache-control', 'public, max-age=31536000, immutable')
      headers.set('etag', object.httpEtag)
      return new Response(object.body, { headers })
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
