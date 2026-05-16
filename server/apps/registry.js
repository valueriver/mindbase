// 全部应用 manifest 的静态聚合 —— 单一事实源。
// 新加一个应用,在这里追加一行 import + 一项 APPS 即可。
// 元信息层,纯静态,不接 D1。

import accounts    from './accounts/manifest.js'
import apikeys     from './apikeys/manifest.js'
import apps        from './apps/manifest.js'
import articles    from './articles/manifest.js'
import assets      from './assets/manifest.js'
import bookmarks   from './bookmarks/manifest.js'
import books       from './books/manifest.js'
import calendar    from './calendar/manifest.js'
import cards       from './cards/manifest.js'
import chat        from './chat/manifest.js'
import collab      from './collab/manifest.js'
import concerts    from './concerts/manifest.js'
import contacts    from './contacts/manifest.js'
import devices     from './devices/manifest.js'
import docs        from './docs/manifest.js'
import domains     from './domains/manifest.js'
import emails      from './emails/manifest.js'
import exhibitions from './exhibitions/manifest.js'
import footprints  from './footprints/manifest.js'
import games       from './games/manifest.js'
import goals       from './goals/manifest.js'
import health      from './health/manifest.js'
import home        from './home/manifest.js'
import ledger      from './ledger/manifest.js'
import llms        from './llms/manifest.js'
import manuals     from './manuals/manifest.js'
import medical     from './medical/manifest.js'
import memories    from './memories/manifest.js'
import mindmap     from './mindmap/manifest.js'
import movies      from './movies/manifest.js'
import music       from './music/manifest.js'
import notes       from './notes/manifest.js'
import outline     from './outline/manifest.js'
import photos      from './photos/manifest.js'
import profile     from './profile/manifest.js'
import projects    from './projects/manifest.js'
import prompts     from './prompts/manifest.js'
import recipes     from './recipes/manifest.js'
import resume      from './resume/manifest.js'
import servers     from './servers/manifest.js'
import settings    from './settings/manifest.js'
import subs        from './subs/manifest.js'
import todos       from './todos/manifest.js'
import travel      from './travel/manifest.js'
import vault       from './vault/manifest.js'
import webs        from './webs/manifest.js'
import wishlist    from './wishlist/manifest.js'

export const APPS = [
  home, todos, ledger, notes, bookmarks, music, movies, books, outline, mindmap,
  webs, calendar, travel, projects, subs, vault, resume, cards, accounts, emails,
  memories, domains, articles, assets, medical, games, apps, photos, manuals, footprints,
  docs, wishlist, contacts, prompts, servers, llms, apikeys, health, recipes, devices,
  exhibitions, concerts, goals, profile, chat, collab, settings,
]

export const APPS_BY_NAME = Object.fromEntries(APPS.map((a) => [a.name, a]))
