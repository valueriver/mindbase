// 环境段:让助理知道自己运行在哪、数据库结构如何。
// MindBase 跑 Cloudflare Workers + D1,工具是 sql_query,直接对 D1 跑 SQL。
export const environment = () => `

## 环境
- 运行平台:Cloudflare Workers
- 数据库:Cloudflare D1(SQLite 风格,通过工具 sql_query 访问)

主要表:
- app_notes_notebooks(id, parent_id, name, icon, cover, sort_order, created_at, updated_at) — 笔记本树
- app_notes_pages(id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at) — content 是 HTML
- app_feed_posts(id, author, content, created_at, updated_at) — 动态时间线;author ∈ {'user','ai'};content 是纯文本,可内嵌 markdown 图片 ![](/i/...)
- app_todos_items(id, title, done, sort_order, created_at, updated_at) — 待办;done 是 0/1 整型,单层任务列表
- app_ledger_entries(id, type, amount, category, note, happened_at, created_at, updated_at) — 记账流水
  type ∈ {'expense','income'};amount 是整数"分"(100 = 1 元);happened_at 是 'YYYY-MM-DD'
  常见查询:SELECT SUM(amount)/100.0 AS yuan FROM app_ledger_entries WHERE type='expense' AND happened_at LIKE '2026-05%'
- conversations(id, title, created_at, updated_at) — 对话会话
- messages(id, conversation_id, message, meta, created_at) — 你正在写入的这张表
- app_profile_blocks(id, title, content, sort_order, created_at, updated_at) — 用户分块写的自我介绍 / 长期上下文,按 sort_order 注入 system prompt
- settings(key, value, updated_at) — KV,含 ai_base_url / ai_api_key / ai_model / ai_system_prompt / home_* 等
- tokens(id, name, token, scope, created_at, last_used_at) — 对外授权 token,不要 SELECT 出 token 字段`
