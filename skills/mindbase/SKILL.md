---
name: mindbase
description: 读写用户的 MindBase——一个跟 AI 同步生活上下文的个人数据库。涉及笔记、动态、待办、记账、健康、收藏、电影、书单、菜谱、回忆、足迹、设备、订阅、密码、API key、目标、个人档等任何"用户生活的某一面"时触发。也可用 SQL 直接查跨应用统计。
---

# 操作 MindBase

用户已授权你访问他的 MindBase。第一条消息里他会给你两个值:

- **Base URL** —— 比如 `https://i.mindbase.me`,或自部署实例
- **Bearer token** —— 以 `mb_` 开头。每次调 API 都带 `Authorization: Bearer <token>`

## 心智模型

MindBase 把用户生活的方方面面拆成一组**应用**(app),每个应用一张表,共享一份 D1 数据库。

- **上下文应用**(数十个,会持续增加):动态 / 待办 / 记账 / 笔记 / 收藏 / 音乐 / 电影 / 书单 / 网页 / 日程 / 旅行 / 项目 / 订阅 / 密码箱 / 简历 / 银行卡 / 网络账号 / 邮箱 / 回忆 / 域名 / 文章 / 资产 / 病例 / 游戏 / App / 影集 / 说明书 / 足迹 / 证件库 / 心愿单 / 通讯录 / 指令集 / 服务器 / 大模型 / API key / 健康 / 菜谱 / 设备 / 展览 / 演唱会 / 目标 / 个人档 ……
- **系统功能**:对话 / 协作 / 设置

表名前缀规则:
- **`app_<name>_*`** = 上下文应用的表(用户的生活数据,你应该看见)
- 裸表名(如 `conversations`、`messages`、`tokens`、`settings`)= 系统表(对话历史、授权、配置;**不要主动暴露这些数据**)

## 发现:先 SQL 看一眼

MindBase 还在扩张,**应用清单不固定**。每次任务开头,先用一句 SQL 摸清楚当前有哪些应用:

```
SELECT name FROM sqlite_master
WHERE type='table' AND name LIKE 'app_%'
ORDER BY name;
```

(如果你用的是内置助理,工具叫 `sql_query`。如果你通过 HTTP API,这步靠 `GET /api/ai/index` 拿到——但目前 index 可能不完整,推荐内置助理用 SQL,外部 AI 用 OpenAPI schema)

## HTTP API(外部 AI 用)

### 通用模式

每个应用挂在 `/api/<name>` 下,标准 CRUD:

| 操作 | 路径 |
|---|---|
| 列表 | `GET /api/<name>` |
| 创建 | `POST /api/<name>`,JSON body |
| 查单条 | `GET /api/<name>/<id>` |
| 修改 | `PATCH /api/<name>/<id>`,JSON body(只传要改的字段) |
| 删除 | `DELETE /api/<name>/<id>` |

少数应用有专属 sub-path:
- `/api/notes/notebooks`、`/api/notes/pages`、`/api/notes/root`(笔记应用三个资源)
- `/api/notes/items/reorder`(笔记拖拽排序)
- `/api/ledger/stats?month=YYYY-MM`、`/api/ledger/categories`(记账统计/历史分类)
- `/api/chat/conversations`、`/api/chat/messages`、`/api/chat/send`(对话)
- `/api/vault/import`(密码 CSV 导入)、`/api/contacts/import`(vCard 导入)
- `/api/profile`(个人档:多 block 列表 + CRUD)

完整 schema:`GET /api/ai/openapi.json`(部分应用未覆盖,以 SQL 查表为准)。

### 字段约定

- **id** 一律 UUID 字符串
- **日期**:`date` / `*_at` / `happened_at` / `visited_at` 等是 `YYYY-MM-DD`(部分允许 `YYYY-MM`,如足迹 `visited_at`)
- **时间戳**:`created_at` / `updated_at` 是 `YYYY-MM-DD HH:MM:SS`
- **金额**:DB 一律用整数"分"存(`amount` / `price` / `cost` / `ticket_price` 都是分),显示给用户除以 100
- **健康**:`weight_g` 是克,`sleep_min` 是分钟
- **可空字段**:PATCH 时,传 `null` 显式清空,**不传**字段则保留原值
- **图片**:`cover` / `avatar` / `image_url` / `image_front` / `image_back` 等存 R2 URL(`/i/u/<uuid>.jpg` 格式),上传走 `POST /api/images`(multipart `file`)
- **状态字段**:不同应用 enum 不同,看应用的 schema(电影 `want|watching|watched`,书单 `want|reading|read`,旅行 `planning|booked|done`,目标 `active|done|gave_up` 等)
- **AI 写入身份**:`app_feed_posts.author` 字段。**你应该用自己的身份 slug**,不要笼统填 `'ai'`。下面是已登记的:`claude-code` / `codex` / `opencode` / `cursor` / `gemini-cli` / `zed` / `cline`。用户自己写填 `'user'`(默认值)。未登记的 slug 也能用,前端会 fallback 显示通用图标。slug 规则:`[a-z0-9][a-z0-9-]*`,≤32 字符。

## 典型用法举例

**"上个月外卖花了多少"** → 优先 SQL:
```sql
SELECT SUM(amount)/100.0 AS yuan
  FROM app_ledger_entries
 WHERE category = '外卖'
   AND happened_at >= '2026-04-01'
   AND happened_at <  '2026-05-01'
```

**"我最近看了什么电影"**:
```sql
SELECT title, year, rating
  FROM app_movies_items
 WHERE status = 'watched'
 ORDER BY updated_at DESC LIMIT 10
```

**"今年读完了几本书"**:
```sql
SELECT COUNT(*) FROM app_books_items
 WHERE status = 'read'
   AND strftime('%Y', updated_at) = '2026'
```

**"整理今天动态成笔记"** —— 跨应用读写:
```sql
SELECT content FROM app_feed_posts
 WHERE date(created_at) = date('now') ORDER BY created_at;
-- 然后整理成 HTML,POST /api/notes/pages 写入
```

**记一笔账** → `POST /api/ledger` body:
```json
{ "type": "expense", "amount": 1800, "category": "咖啡", "happened_at": "2026-05-16" }
```
(amount=1800 表示 18.00 元)

**写一条动态(标上自己的身份)** → `POST /api/feed` body:
```json
{ "author": "claude-code", "content": "注意到你这周睡眠都不到 6 小时,要不要早点睡?" }
```
(把 `claude-code` 换成你自己的 slug:`codex` / `cursor` / `opencode` 等。用户的内置助理写动态用 `ai`。)

**新建笔记** → `POST /api/notes/pages` body:
```json
{
  "title": "今天的总结",
  "content": "<h1>5/16</h1><div>第一段</div><div>第二段</div>",
  "notebook_id": null,
  "icon": "📝"
}
```

笔记 `content` 只能是 HTML,允许 `<h1>` `<h2>` `<h3>` `<strong>` `<em>` `<div>` `<br>` `<img>`。**段落换行用 `<div>...</div>` 或 `<br>`,不要 `\n`、不要 markdown**。

## 配合内置助理(产品里那个对话)

内置助理拿到 D1 直连,只有**一个工具**:`sql_query(stmt)`,接一条 SQL(SELECT/INSERT/UPDATE/DELETE/DDL 都行,无末尾分号)。它的视野规则就是表前缀——`app_*` 是上下文,裸表是系统。

如果你**是**内置助理:优先 SQL。如果你**通过 HTTP** 接入(ChatGPT / Claude.ai / Codex CLI 等):用 REST,SQL 通道不可用。

## 失败处理

| 状态 | 含义 | 怎么办 |
|---|---|---|
| 401 | token 被吊销或过期 | 停下,让用户去「协作」重新生成 token |
| 404 | 这个 id 没了 | 重新列一次,id 可能变了 |
| 400 + `*_invalid` / `*_required` | 字段校验没过 | 看 message,补/修字段 |

## 限制

- 你**不能**创建/列出/吊销 mb_ token —— 这是产品自己的事,token 操作给 mb_ 凭证返 403
- 跟用户讨论隐私时,默认假设**密码箱 / 银行卡 / 证件库 / API key / 大模型 key** 这些内容用户不希望你主动复述,除非他明确问
- 用户可能随时通过 Claude Code / Codex **加新应用**(目前 41+ 个,在长)。每次开新会话,先 SQL 扫一遍 `app_%` 表清单,不要假设固定
