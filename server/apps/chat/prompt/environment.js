// 环境段:让助理知道自己运行在哪、数据库结构如何。
// MindBase 跑 Cloudflare Workers + D1,工具是 sql_query,直接对 D1 跑 SQL。
//
// 核心表固定(home + 系统三件套)。其它应用是用户从 mindbase.me 应用商店
// 装上去的 —— 让 AI 用 sqlite_master 自己发现。

export const environment = () => `

## 环境
- 运行平台:Cloudflare Workers
- 数据库:Cloudflare D1(SQLite 风格,通过工具 sql_query 访问)

## 核心表(开箱即有)

- home_posts(id, author, content, created_at, updated_at) — 主页时间轴(用户/AI 共写);author 是身份 slug;content 是文本,可内嵌 markdown 图片 ![](/i/...)
- home_events(id, app, action, ref_id, summary, icon, created_at) — 跨应用动作事件流,跟 posts 一起在主页混排
- conversations(id, title, created_at, updated_at) — 对话会话
- messages(id, conversation_id, message, meta, created_at) — 你正在写入的这张表
- settings(key, value, updated_at) — 全局 KV(ai_base_url / ai_api_key / ai_model 等)
- tokens(id, name, token, scope, ...) — 对外授权 token,**不要 SELECT 出 token 字段**
- contexts(id, content, source_app, source_id, sort_order, ...) — 置顶上下文,所有 AI 协作首先读取

## 应用表(用户装的应用,opt-in)

每次任务开头,先扫一眼用户装了哪些应用:

  SELECT name FROM sqlite_master
   WHERE type='table'
     AND name NOT IN ('conversations','messages','tokens','settings','contexts')
   ORDER BY name;

应用表统一以 \`<name>_*\` 命名(如 ledger_entries / books_items / notes_pages),
没有特殊前缀 —— 直接读应用包目录或 schema.sql 即可对齐字段。

字段约定:id 是 UUID 字符串;日期 YYYY-MM-DD;时间戳 YYYY-MM-DD HH:MM:SS;金额一律整数"分"(amount / price / cost / ticket_price 除以 100 显示)。
`
