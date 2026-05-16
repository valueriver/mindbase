# mindbase

个人数据库 / 同步用户与 AI 的上下文。

- origin: `https://github.com/realuckyang/mindbase.git`
- 部署:`https://i.mindbase.me`(在用中)
- Node:`^20.19.0 || >=22.12.0`

## 当前状态

- **在用中**,核心承载用户的"和 AI 同步的生活上下文"。
- 主页是入口:用户手写 posts + 各应用自动事件流,合成一条时间轴。
- 40+ 个应用共用一份 D1,持续在加。新功能直接在这里做。

## 命名规则(三处必须对齐)

| 层 | 路径 |
|---|---|
| DB 表前缀 | `app_<name>_*` |
| 后端文件 | `server/apps/<name>/` |
| 前端文件 | `gui/apps/<name>/` |
| HTTP 路径 | `/api/<name>` |

改一个 name 就所有地方都改干净,不留兼容痕迹。

## 加一个新应用

后端 5 文件 + 前端 1 文件,改 3 处中央注册表:

1. `server/apps/<name>/manifest.js` —— 声明 `name / label / icon / category / kind / tables / subpaths / summary / private`,是启动器、`GET /api/ai/apps` 和 SKILL 自发现的单一事实源
2. `server/apps/<name>/schema.sql` —— DDL,所有表带 `app_<name>_` 前缀
3. `server/apps/<name>/repository.js` —— 纯 D1 查询,无校验、无副作用
4. `server/apps/<name>/service.js` —— 业务逻辑、校验、`emitHomeEvent()` 调用
5. `server/apps/<name>/api.js` —— HTTP 入口,标准 CRUD 路由
6. `gui/apps/<name>/index.vue` —— 单个视图

中央注册:
- `server/router.js` —— 加 import 和 `stripDispatch('/api/<name>', xxx)`
- `server/apps/registry.js` —— 加 import 和加进 `APPS` 数组
- `gui/router.js` —— 加路由
- `gui/lib/apps.js` —— 加 manifest import 和加进 `CONTEXT_MANIFESTS` 数组

`gui/components/AppShell.vue` 从 `APPS_META` 派生,不用再单独改 —— 启动器入口自动从 manifest 派生。

`mindbase.sql` 是 build 脚本从各 `schema.sql` 拼出来的,**不要手改**。

## 事件流约定

有"完成度语义"的关键动作(创建一笔账、读完一本书、目标 +1、达到里程碑)后,在 service 里调:

```js
import { emitHomeEvent } from '../../lib/events.js'

await emitHomeEvent(env.DB, {
  app:     'ledger',
  action:  'created',
  ref_id:  entry.id,
  summary: '记了一笔咖啡 ¥18',
  icon:    '💰',
})
```

失败不抛(主操作不能被事件流影响)。事件写进 `app_home_events`,主页时间轴自动渲染。

**隐私边界 —— 默认不 emit 事件的应用**:`vault` / `cards` / `docs` / `apikeys` / `llms` / `accounts` / `profile` / `emails`。这些数据用户不希望出现在时间轴上,只读不冒泡。

## 凭证

凭证从不进代码。本机用 `~/.codex` `~/.claude` skills 里的 config.json。仓库里所有 `wrangler.jsonc` / `.env` 由用户在本机维护,不提交。

## 原则

### 一致性

前端、后端、数据库的命名和概念必须统一。改一个名字就所有地方都改干净,不留兼容痕迹。

模块化、拆分清晰。每个文件不要太长,目录结构反映逻辑包含关系。

### 不兼容

开发阶段不写垫片,不写向后兼容 hack。DDL 即单一事实源,改 schema 直接删 DB 重建;命名改就所有地方改干净。

### 轻量工程

不过度设计。不自作聪明、不加多余抽象、不添加未要求的功能。

禁止模拟实现。所有功能必须真实可用,不用假数据、mock 接口或占位逻辑糊弄。

### 面向用户

产品文案不暴露内部。副标题/placeholder 上不写"先不分类"、"单层任务"、"三档可见性"这种话;用用户语言描述价值,不描述限制和实现。

样式优先 Tailwind,不写无必要的原生 CSS。

## 技术栈

- 前端:Vue 3 + Vite + Tailwind v4 + vuedraggable
- 后端:Cloudflare Workers + Cloudflare Vite plugin
- 存储:D1 (SQLite) + R2 (图片)
- 鉴权:PBKDF2 + HS256 JWT cookie

## 命令

```bash
npm run dev       # vite + worker 本地
npm run build     # build:skill(打 mindbase.zip)+ vite build
npm run preview   # build + wrangler dev
npm run deploy    # wrangler deploy(部署到 i.mindbase.me)
```
