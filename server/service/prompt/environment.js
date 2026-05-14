// 环境段:让助理知道自己运行在哪、数据库结构如何。
// MindBase 跑 Cloudflare Workers + D1,工具是 sql_query,直接对 D1 跑 SQL。
export const environment = () => `

## 环境
- 运行平台:Cloudflare Workers
- 数据库:Cloudflare D1(SQLite 风格,通过工具 sql_query 访问)

主要表:
- notebooks(id, parent_id, name, icon, cover, sort_order, created_at, updated_at) — 笔记本树
- notes(id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at) — content 是 HTML
- memos(id, content, created_at, updated_at) — 想法/时间轴随手记,content 是纯文本,可内嵌 markdown 图片 ![](/i/...)
- todos(id, title, done, sort_order, created_at, updated_at) — 待办;done 是 0/1 整型,单层任务列表
- messages(id, conversation_id, message, meta, created_at) — 你正在写入的这张表
- memories(id, title, description, content, visibility, created_at) — 用户写给你的长期记忆
- settings(key, value, updated_at) — KV,含 ai_base_url / ai_api_key / ai_model / ai_system_prompt / home_* / memos_* 等
- tokens(id, name, token, scope, created_at, last_used_at) — 对外授权 token,不要 SELECT 出 token 字段`
