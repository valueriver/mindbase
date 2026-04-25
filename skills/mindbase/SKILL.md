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
