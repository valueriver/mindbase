import { fail } from './lib/utils/json.js'
import { buildCorsHeaders } from './lib/utils/http.js'

// 子路径式 app(默认导出 handle(req,env,sub,method,url),sub 是 prefix 之后的剩余路径)
import home      from './apps/home/api.js'
import todos     from './apps/todos/api.js'
import ledger    from './apps/ledger/api.js'
import notes     from './apps/notes/api.js'
import profile   from './apps/profile/api.js'
import bookmarks from './apps/bookmarks/api.js'
import music     from './apps/music/api.js'
import movies    from './apps/movies/api.js'
import books     from './apps/books/api.js'
import webs      from './apps/webs/api.js'
import calendarApi from './apps/calendar/api.js'
import travel    from './apps/travel/api.js'
import projects  from './apps/projects/api.js'
import subs      from './apps/subs/api.js'
import vault     from './apps/vault/api.js'
import resume    from './apps/resume/api.js'
import cards     from './apps/cards/api.js'
import accounts  from './apps/accounts/api.js'
import emails    from './apps/emails/api.js'
import memories  from './apps/memories/api.js'
import domains   from './apps/domains/api.js'
import articles  from './apps/articles/api.js'
import assets    from './apps/assets/api.js'
import medical   from './apps/medical/api.js'
import games     from './apps/games/api.js'
import appsList  from './apps/apps/api.js'
import photos    from './apps/photos/api.js'
import manuals   from './apps/manuals/api.js'
import footprints from './apps/footprints/api.js'
import docs      from './apps/docs/api.js'
import wishlist  from './apps/wishlist/api.js'
import contacts  from './apps/contacts/api.js'
import prompts   from './apps/prompts/api.js'
import servers   from './apps/servers/api.js'
import llms      from './apps/llms/api.js'
import apikeys   from './apps/apikeys/api.js'
import health    from './apps/health/api.js'
import recipes   from './apps/recipes/api.js'
import devices   from './apps/devices/api.js'
import exhibitions from './apps/exhibitions/api.js'
import concerts  from './apps/concerts/api.js'
import goals     from './apps/goals/api.js'
import chat      from './apps/chat/api.js'
import collab    from './apps/collab/api.js'
import settings  from './apps/settings/api.js'

// 全路径式 app(命名导出 handleXxxApi(req,env,path,method,url),自己匹配 path)
import { handleUserApi }   from './apps/user/api.js'
import { handleImageApi }  from './apps/image/api.js'
import { handleSearchApi } from './apps/search/api.js'
import { handleAiApi }     from './apps/openapi/api.js'

export async function handleApiRoutes(request, env, url) {
  const path   = url.pathname
  const method = request.method

  try {
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders('Content-Type,Authorization'),
      })
    }

    if (path === '/api' || path === '/api/') {
      return Response.json({ name: 'MindBase', status: 'ok' })
    }

    const stripDispatch = async (prefix, handler) => {
      if (!path.startsWith(prefix)) return undefined
      const sub = path.slice(prefix.length)
      if (sub !== '' && !sub.startsWith('/')) return undefined
      const r = await handler(request, env, sub, method, url)
      return r || fail('not_found', 404)
    }

    const fullDispatch = async (prefix, handler) => {
      if (!path.startsWith(prefix)) return undefined
      const r = await handler(request, env, path, method, url)
      return r || fail('not_found', 404)
    }

    let r
    // sub-path apps
    if ((r = await stripDispatch('/api/home',      home))        !== undefined) return r
    if ((r = await stripDispatch('/api/todos',     todos))       !== undefined) return r
    if ((r = await stripDispatch('/api/ledger',    ledger))      !== undefined) return r
    if ((r = await stripDispatch('/api/notes',     notes))       !== undefined) return r
    if ((r = await stripDispatch('/api/profile',   profile))     !== undefined) return r
    if ((r = await stripDispatch('/api/bookmarks', bookmarks))   !== undefined) return r
    if ((r = await stripDispatch('/api/music',     music))       !== undefined) return r
    if ((r = await stripDispatch('/api/movies',    movies))      !== undefined) return r
    if ((r = await stripDispatch('/api/books',     books))       !== undefined) return r
    if ((r = await stripDispatch('/api/webs',      webs))        !== undefined) return r
    if ((r = await stripDispatch('/api/calendar',  calendarApi)) !== undefined) return r
    if ((r = await stripDispatch('/api/travel',    travel))      !== undefined) return r
    if ((r = await stripDispatch('/api/projects',  projects))    !== undefined) return r
    if ((r = await stripDispatch('/api/subs',      subs))        !== undefined) return r
    if ((r = await stripDispatch('/api/vault',     vault))       !== undefined) return r
    if ((r = await stripDispatch('/api/resume',    resume))      !== undefined) return r
    if ((r = await stripDispatch('/api/cards',     cards))       !== undefined) return r
    if ((r = await stripDispatch('/api/accounts',  accounts))    !== undefined) return r
    if ((r = await stripDispatch('/api/emails',    emails))      !== undefined) return r
    if ((r = await stripDispatch('/api/memories',  memories))    !== undefined) return r
    if ((r = await stripDispatch('/api/domains',   domains))     !== undefined) return r
    if ((r = await stripDispatch('/api/articles',  articles))    !== undefined) return r
    if ((r = await stripDispatch('/api/assets',    assets))      !== undefined) return r
    if ((r = await stripDispatch('/api/medical',   medical))     !== undefined) return r
    if ((r = await stripDispatch('/api/games',     games))       !== undefined) return r
    if ((r = await stripDispatch('/api/apps',      appsList))    !== undefined) return r
    if ((r = await stripDispatch('/api/photos',    photos))      !== undefined) return r
    if ((r = await stripDispatch('/api/manuals',   manuals))     !== undefined) return r
    if ((r = await stripDispatch('/api/footprints', footprints)) !== undefined) return r
    if ((r = await stripDispatch('/api/docs',      docs))        !== undefined) return r
    if ((r = await stripDispatch('/api/wishlist',  wishlist))    !== undefined) return r
    if ((r = await stripDispatch('/api/contacts',  contacts))    !== undefined) return r
    if ((r = await stripDispatch('/api/prompts',   prompts))     !== undefined) return r
    if ((r = await stripDispatch('/api/servers',   servers))     !== undefined) return r
    if ((r = await stripDispatch('/api/llms',      llms))        !== undefined) return r
    if ((r = await stripDispatch('/api/apikeys',   apikeys))     !== undefined) return r
    if ((r = await stripDispatch('/api/health',    health))      !== undefined) return r
    if ((r = await stripDispatch('/api/recipes',   recipes))     !== undefined) return r
    if ((r = await stripDispatch('/api/devices',   devices))     !== undefined) return r
    if ((r = await stripDispatch('/api/exhibitions', exhibitions)) !== undefined) return r
    if ((r = await stripDispatch('/api/concerts',  concerts))    !== undefined) return r
    if ((r = await stripDispatch('/api/goals',     goals))       !== undefined) return r
    if ((r = await stripDispatch('/api/chat',      chat))        !== undefined) return r
    if ((r = await stripDispatch('/api/collab',    collab))      !== undefined) return r
    if ((r = await stripDispatch('/api/settings',  settings))    !== undefined) return r
    // full-path apps
    if ((r = await fullDispatch('/api/user',   handleUserApi))   !== undefined) return r
    if ((r = await fullDispatch('/api/images', handleImageApi))  !== undefined) return r
    if ((r = await fullDispatch('/api/search', handleSearchApi)) !== undefined) return r
    if ((r = await fullDispatch('/api/ai',     handleAiApi))     !== undefined) return r

    return fail('not_found', 404)
  } catch (err) {
    console.error('api error:', err?.message, err?.stack)
    return fail(err?.message || 'internal_server_error', 500)
  }
}

export default handleApiRoutes
