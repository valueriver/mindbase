---
name: mindbase
description: Read and write the user's personal MindBase nested notes library. Trigger when the user asks to look up, create, edit, organize, summarize, or otherwise act on anything that lives in their MindBase notes.
---

# Working with MindBase

The user has authorized you to access their MindBase notes library. They will share two values in their first message:

- **Base URL** — typically `https://mindbase.me`, but can be any self-hosted instance
- **Bearer token** — starts with `mb_`. Send as `Authorization: Bearer <token>` on every request

## Step 1 — discover the API

Fetch the OpenAPI 3.1 schema once at the start of a session:

```
GET <base>/api/ai/openapi.json
```

This file defines every operation, parameter, and response shape. Use it as the source of truth instead of guessing.

## Step 2 — typical workflows

### Find something

- Title or content keyword → `GET /api/search?q=<term>`
- Browse the whole tree → `GET /api/ai/index` (returns notebooks + note titles, no bodies)
- Fetch a specific note's full HTML → `GET /api/notes/<id>`

### Create a note

`POST /api/notes` with body:

```json
{
  "title": "Some title",
  "content": "<h1>Heading</h1><div>Paragraph</div>",
  "notebook_id": null,
  "icon": "📝"
}
```

- `notebook_id: null` (or omitted) places the note at the home root
- `content` MUST be HTML. Allowed tags: `<h1>` `<h2>` `<h3>` `<strong>` `<em>` `<div>` `<br>` `<img>`. Wrap each paragraph in `<div>...</div>`. Don't use `\n` or Markdown.

### Edit a note

`PATCH /api/notes/<id>` with any subset of `{ title, content, icon, cover, notebook_id, sort_order }`. Pass `null` for `icon` or `cover` to clear them.

### Organize

- Move a note: `PATCH /api/notes/<id>` with `{ "notebook_id": "<target_or_null>" }`
- Move a notebook: `PATCH /api/notebooks/<id>` with `{ "parent_id": "<target_or_null>" }` (the server rejects cycles)
- Reorder within a parent: `{ "sort_order": <integer> }` — lower comes first

### Insert images

1. Upload: `POST /api/images` as `multipart/form-data` with field `file` → returns `{ "url": "/i/<key>" }`
2. Embed in a note: include `<img src="<base>/i/<key>"/>` inside `content`

### Long-term memories

The user can write down facts they want you to remember across all conversations (preferences, project context, personal info). Three visibility levels control what the local assistant sees — but **as an external AI accessing via this skill, you can read every memory regardless of `visibility`**.

- `GET /api/memories` — list everything
- `GET /api/memories/<id>` — one entry
- `POST /api/memories` — create (`title`, `content` required; `description` and `visibility` optional)
- `PATCH /api/memories/<id>` — update
- `DELETE /api/memories/<id>` — remove

`visibility` ∈ `{ count, summary, full }` — only matters for what the local MindBase assistant gets injected into its prompt. Set it when the user says "记一条记忆但内容不要给本地助理看" or similar.

### Personal ledger (expense / income tracking)

The user tracks expenses and income here.

- `GET /api/ledger?month=YYYY-MM&type=expense|income` — list, newest first
- `GET /api/ledger/stats?month=YYYY-MM` — `{ expense, income, balance }` for the month, all in **cents**
- `GET /api/ledger/categories` — distinct categories the user has used, sorted by frequency (use these for autocomplete-style suggestions)
- `POST /api/ledger` — record one. Body: `{ type, amount, category, note, happened_at }`
  - `amount` is **yuan as a number** (e.g. `30.5`), server converts to cents internally
  - `type` ∈ `{ expense, income }`, default `expense`
  - `happened_at` is `YYYY-MM-DD`, defaults to today
- `PATCH /api/ledger/<id>` / `DELETE /api/ledger/<id>` — edit / remove

When the user asks "上个月外卖花了多少" or "记一笔今天午餐 30 块", use these endpoints directly. **Amounts in responses are in cents — divide by 100 for display.**

## Conventions

- Don't bulk-pull the whole library proactively. Use `/api/ai/index` for structure; fetch bodies on demand.
- Confirm with the user before destructive actions (`DELETE /api/notes/...` or `/api/notebooks/...`).
- Icons are single emojis. Covers are full image URLs or one of `preset:1` ... `preset:8`.
- Notes can live at the home root (`notebook_id = null`); they don't have to sit inside a notebook.

## Restrictions

You cannot create, list, or revoke MindBase tokens. Endpoints under `/api/tokens/*` reject `mb_` tokens. If the user asks for that, tell them to open the AI Authorization page in MindBase.

## Failure handling

| Status | Meaning | What to do |
|---|---|---|
| 401 | Token revoked or expired | Stop. Ask the user to re-enable AI authorization. |
| 403 | Touched `/api/tokens/*` | Don't retry. |
| 404 | id no longer exists | Refetch `/api/ai/index` for current ids. |
