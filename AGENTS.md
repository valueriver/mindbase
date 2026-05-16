# AGENTS.md

这份文件给在本仓库里写代码的 agent(Claude Code / Codex / 其它)看。读完你应该能独立加一个应用、改一个应用,而不需要回头问人。

## 这个项目是什么

MindBase 单仓库,跑在 Cloudflare Workers(D1 + R2 + Assets)。Vue 3 前端 + 单 Worker 后端。一份 SQLite 数据库,用户和 AI 共享。前端和后端都是**应用 (app) 的集合**。

## 核心心智模型

**所有功能都是一个 app**。应用分两类,**只靠表名前缀区分**:

| 类型 | 数据形态 | 表名 | 启动器位置 | AI 默认可见 |
|---|---|---|---|---|
| **上下文应用** | 用户的生活数据 | `app_<name>_*` | 上区(网格) | ✅(AI 用 `SELECT name FROM sqlite_master WHERE name LIKE 'app_%'` 自动发现) |
| **系统应用** | 平台运转的数据,或无数据 | 裸名(`conversations`、`tokens`、`settings`)或无表 | 下区(三格) | ❌ |

上下文应用例:feed / todos / ledger / notes / profile  
系统应用例:chat / collab / settings / user / image / search / openapi

`scripts/build-schema.mjs` 强制这条规则:一个 app 的 `schema.sql` 里要么**全部**用 `app_<name>_*` 前缀,要么**全部**裸名,混用报错。

## 仓库结构

```
server/
  index.js               Worker 入口(/i/* 走 R2,/api/* 走 router,其它走 ASSETS)
  router.js              唯一总路由,/api/<name> 全部从这里分发
  config.js              全局常量
  lib/
    auth/                JWT + password + api-token(被 import 的库)
    utils/               body / http / id / json helpers
  apps/<name>/           每个应用一个文件夹
    schema.sql           DDL(如果有数据)
    repository.js        D1 SQL
    service.js           业务逻辑 + 鉴权
    api.js               HTTP 路由

gui/
  main.js                Vue 入口
  App.vue  router.js  config.js  api.js   平台薄壳
  assets/  components/  composables/  lib/  跨应用共享(AppShell / Popover / Cover / Editor 等)
  apps/<name>/           每个应用一个文件夹
    index.vue            应用入口页(约定)
    其它 .vue            子页面,在 router.js 里按需引用
    components/          (可选)应用专属组件
```

## 加一个新应用 `<name>` 的完整步骤

**后端 5 处:**

1. `server/apps/<name>/schema.sql` —— 有用户数据用 `CREATE TABLE app_<name>_<resource> (...)`;系统应用用裸表名;无表就别建文件。
2. `server/apps/<name>/repository.js` —— SQL 函数,从 `'../../lib/utils/...'` import 工具。
3. `server/apps/<name>/service.js` —— 业务逻辑,鉴权用 `import { isAuthenticated } from '../../lib/auth/index.js'`,每个 action 第一行 `if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)`。
4. `server/apps/<name>/api.js` —— **默认导出 sub-path 风格** handler(详见下面"API 风格")。
5. `server/router.js` —— 顶部加 `import <name> from './apps/<name>/api.js'`,在对应组里加一行 `if ((r = await stripDispatch('/api/<name>', <name>)) !== undefined) return r`。

**前端 4 处:**

6. `gui/apps/<name>/index.vue` —— 应用入口页。布局参考其它 app(`<main class="mx-auto w-full max-w-3xl px-4 md:px-12 pt-6 md:pt-10">` 是常用骨架)。
7. `gui/router.js` —— 加一行 `{ path: '/<name>', name: '<name>', component: () => import('@/apps/<name>/index.vue') }`。
8. `gui/api.js` —— 加一段 `export const api<Name> = { list: () => api.get('/api/<name>'), create: (b) => api.post('/api/<name>', b), ... }`。
9. `gui/components/AppShell.vue` —— `apps` 数组里:如果已有占位(`to: null`)就把它改成 `to: { name: '<name>' }`;没有就加一项 `{ name: '<name>', icon: '🔖', label: '收藏', to: { name: '<name>' }, match: (p) => p.startsWith('/<name>') }`。

跑 `node scripts/build-schema.mjs` 重生成 `mindbase.sql`,然后 `npx wrangler d1 execute mindbase --local --file=mindbase.sql` 重建本地库。

## 约定细节

### API 风格:sub-path(默认)vs full-path

**默认用 sub-path**——`router.js` 里 `stripDispatch('/api/<name>', handler)` 会把前缀剥掉,handler 收到 `sub`(空串或 `/foo` 这种):

```js
const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listAction(request, env, url)
  if (sub === '' && method === 'POST') return createAction(request, env)
  const m = sub.match(/^\/([0-9A-Za-z]+)$/)
  if (m) {
    if (method === 'PATCH')  return updateAction(request, env, m[1])
    if (method === 'DELETE') return deleteAction(request, env, m[1])
  }
  return null
}
export default handle
```

**用 full-path** 仅当应用没有 `:id` 路由(完全固定的 URL):user/image/search/openapi。用命名导出 `handleXxxApi(req, env, path, method, url)`,自己匹配完整 `path`,router 里用 `fullDispatch`。

### 多资源应用

像 notes 那样一个 app 管多个资源(notebooks + pages + items),sub-path 里再分支:

```js
if (sub.startsWith('/notebooks')) { ... }
if (sub.startsWith('/pages'))     { ... }
if (sub.startsWith('/items'))     { ... }
```

参考 `server/apps/notes/api.js`。

### 启动器分区(`gui/components/AppShell.vue`)

`apps` 数组里上下文应用(放上区),`systems` 数组里 3 个固定项(对话/协作/设置)。新加的上下文应用进 `apps` 数组,新加的系统应用通常**不进启动器**(image/search/openapi 是无 UI 的纯后端能力)。

### 跨应用 import

允许但要谨慎:
- 任何 app 可以 `import { ... } from '../../lib/...'`
- 任何 app 可以 `import { ... } from '../<other>/repository.js'`(比如 search 跨表查询)
- **不要**在 `lib/` 里 import 任何 app(单向依赖,保持 lib 干净)

## 数据库工作流

- DDL 单一事实源:每个 `server/apps/<name>/schema.sql`。**不要直接改 `mindbase.sql`**(自动生成)。
- 改了 schema → `node scripts/build-schema.mjs` → `rm -rf .wrangler/state/v3/d1` → `npx wrangler d1 execute mindbase --local --file=mindbase.sql`。
- 远端部署:`npm run deploy` 之前手动跑 `npx wrangler d1 execute mindbase --remote --file=mindbase.sql`(只在 schema 变化时)。

## 命令

```bash
npm run dev                    本地 vite + miniflare(Worker + D1 + R2)
npm run build                  打包(给 wrangler deploy 用)
npm run deploy                 部署到 Cloudflare
node scripts/build-schema.mjs  重生 mindbase.sql
```

## 写代码的硬要求

这些违反会被人类拒掉:

- **不要兼容旧 schema 或旧路由**。开发阶段没有历史包袱,改名一改到底,删 DB 重建。看到 `// 历史:旧 X / 新 X 都识别` 这种注释,删掉,只留新的。
- **不要做半成品**。要么完整改完(含 import / DDL / gui),要么不动。
- **不要给单消费者建 Pinia store**。一个 view 用的状态留在 `<script setup>`。
- **commit author email** 用 `62820747+valueriver@users.noreply.github.com`。
- **产品文案不暴露内部**。副标题 / placeholder 不写"先不分类"、"单层任务"、"三档可见性"这种描述限制的话。
- **服务永远是 `npm run deploy`** 部署,除了 mindbase 本身(它是仓库自身,只在本地跑)。

## 命名

- 表:`app_<name>_<resource>`(上下文)或 `<resource>`(系统)
- API 路径:`/api/<name>[/<resource>][/<id>]`
- 路由名:跟应用名一致(`'feed'`、`'todos'`),notes 多资源用 `'home'`/`'notebook'`/`'note'`
- 视图文件:`gui/apps/<name>/index.vue` 是入口,其它按需,在 `gui/router.js` 引用

## 当不确定时

照着 **feed**(最简单的单表 CRUD app)抄;多资源应用照着 **notes** 抄。两个都是从零开始的好模板。
