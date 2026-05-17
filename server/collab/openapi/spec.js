// 生成 OpenAPI 3.1 schema,GPTs Actions / Claude Custom Connector 直接 import。
// servers 字段动态用请求 origin,自托管的人也开箱即用。

const AppSchema = {
  type: 'object',
  description: '应用元信息:每个应用的标识、类别、对应的数据库表和 URL 子路径。',
  properties: {
    name:     { type: 'string', description: '应用 slug,如 ledger / books / todos' },
    label:    { type: 'string', description: '中文显示名,如"记账"' },
    kind:     { type: 'string', description: 'context = 用户上下文应用;system = 平台基础设施' },
    icon:     { type: 'string', description: '单 emoji' },
    summary:  { type: 'string', description: '一句话功能描述' },
    tables:   { type: 'array', items: { type: 'string' }, description: '本应用涉及的表名(用户应用一律 app_<name>_* 前缀)' },
    subpaths: { type: 'array', items: { type: 'string' }, description: '标准 CRUD 之外的子路径,如 /stats /categories' },
  },
}

const SqlRowsSchema = {
  type: 'object',
  description: '查询结果。results 是行数组,meta 含 changes、last_row_id 等执行元信息。',
  properties: {
    success: { type: 'boolean' },
    results: { type: 'array', items: { type: 'object' } },
    meta:    { type: ['object', 'null'] },
  },
}

const okJson = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
})

const buildSpec = (origin) => ({
  openapi: '3.1.0',
  info: {
    title: 'MindBase',
    description:
      '和 AI 同步生活上下文的个人数据库。每个应用是用户生活的一面(记账 / 待办 / 笔记 / 健康 / 收藏 …),共用同一份 SQLite。\n\n' +
      '通过这份 API,外部 AI 可以查询和写入用户授权的内容,作为长期记忆参与对话与任务。\n\n' +
      '**数据形态**:用户应用的表全部以 `app_<name>_*` 开头(`app_ledger_entries`、`app_books_items` 等),平台表使用 `conversations` / `messages` / `tokens` / `settings` 等名称。\n\n' +
      '**推荐流程**:先调用 `GET /api/ai/apps` 取得当前装了哪些应用,再用 `POST /api/ai/sql` 针对相关表查询或写入。',
    version: '2.0.0',
  },
  servers: [{ url: origin }],
  components: {
    securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer' } },
    schemas:         { App: AppSchema, SqlRows: SqlRowsSchema },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/ai/apps': {
      get: {
        operationId: 'appsList',
        summary: '列出当前实例已装的应用,以及每个应用对应的表和子路径。',
        security: [],
        responses: {
          '200': okJson('OK', {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              apps:    { type: 'array', items: { $ref: '#/components/schemas/App' } },
            },
          }),
        },
      },
    },
    '/api/ai/sql': {
      post: {
        operationId: 'sqlQuery',
        summary: '对实例的 D1 数据库执行一条 SQL 语句,支持查询与写入(SELECT / INSERT / UPDATE / DELETE / DDL),末尾无分号。',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['stmt'],
            properties: { stmt: { type: 'string', description: '单条 SQL 语句,末尾无分号' } },
          }}},
        },
        responses: { '200': okJson('OK', { $ref: '#/components/schemas/SqlRows' }) },
      },
    },
  },
})

export const openapiAction = (request) => {
  const url = new URL(request.url)
  const origin = `${url.protocol}//${url.host}`
  const spec = buildSpec(origin)
  return new Response(JSON.stringify(spec), {
    status: 200,
    headers: {
      'Content-Type':                'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'public, max-age=300',
    },
  })
}
