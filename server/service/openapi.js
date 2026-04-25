// 生成 OpenAPI 3.1 schema,GPTs Actions / Claude Custom Connector 直接 import。
// servers 字段动态用请求 origin,自托管的人也开箱即用。

const NotebookSchema = {
  type: 'object',
  properties: {
    id:         { type: 'string' },
    parent_id:  { type: ['string', 'null'], description: '父笔记本 id;为 null 表示挂在首页根层级' },
    name:       { type: 'string' },
    icon:       { type: ['string', 'null'], description: '单个 emoji,如 📚' },
    cover:      { type: ['string', 'null'], description: '封面 URL,或预置 key: preset:1 .. preset:8' },
    sort_order: { type: 'integer' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
}

const NoteSchema = {
  type: 'object',
  properties: {
    id:          { type: 'string' },
    notebook_id: { type: ['string', 'null'], description: '所属笔记本 id;null 表示挂在首页' },
    title:       { type: 'string' },
    content:     {
      type: 'string',
      description: 'HTML 正文,允许的标签:<h1> <h2> <h3> <strong> <em> <div> <br> <img>。' +
                   '换行不要用 \\n,要用 <div>...</div> 或 <br>。',
    },
    icon:        { type: ['string', 'null'] },
    cover:       { type: ['string', 'null'] },
    sort_order:  { type: 'integer' },
    created_at:  { type: 'string' },
    updated_at:  { type: 'string' },
  },
}

const wrap = (extra) => ({
  type: 'object',
  properties: { success: { type: 'boolean' }, ...extra },
})

const okJson = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
})

const buildSpec = (origin) => ({
  openapi: '3.1.0',
  info: {
    title: 'MindBase',
    description:
      '用户和 AI 共用的嵌套笔记库。可以读、写、搜索、整理用户的笔记本和笔记。' +
      '约定:笔记的 content 字段是 HTML,不要塞 Markdown 或纯文本换行符。',
    version: '1.0.0',
  },
  servers: [{ url: origin }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer' },
    },
    schemas: {
      Notebook: NotebookSchema,
      Note:     NoteSchema,
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/ai/index': {
      get: {
        operationId: 'listIndex',
        summary: '一次性拿到所有笔记本 + 笔记的索引(标题和结构,不含正文)',
        responses: {
          '200': okJson('OK', wrap({
            notebooks: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            notes:     { type: 'array', items: { $ref: '#/components/schemas/Note' } },
          })),
        },
      },
    },

    '/api/root': {
      get: {
        operationId: 'getHome',
        summary: '首页元数据 + 根层级的笔记本和笔记',
        responses: {
          '200': okJson('OK', wrap({
            home:      { type: 'object', properties: {
              name:  { type: 'string' },
              icon:  { type: ['string', 'null'] },
              cover: { type: ['string', 'null'] },
            }},
            notebooks: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            notes:     { type: 'array', items: { $ref: '#/components/schemas/Note' } },
          })),
        },
      },
      patch: {
        operationId: 'updateHome',
        summary: '改首页名字 / 图标 / 封面',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: {
            name:  { type: 'string' },
            icon:  { type: ['string', 'null'] },
            cover: { type: ['string', 'null'] },
          }}}},
        },
        responses: { '200': okJson('OK', wrap({ home: { type: 'object' } })) },
      },
    },

    '/api/notebooks': {
      get: {
        operationId: 'listNotebooks',
        summary: '列子笔记本(默认首页根层级,传 parent_id 列某个笔记本下面的子笔记本)',
        parameters: [
          { name: 'parent_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': okJson('OK', wrap({
            notebooks: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
          })),
        },
      },
      post: {
        operationId: 'createNotebook',
        summary: '新建笔记本',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name:      { type: 'string' },
              parent_id: { type: ['string', 'null'], description: '不传或 null 就建在根' },
              icon:      { type: ['string', 'null'] },
              cover:     { type: ['string', 'null'] },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({ notebook: { $ref: '#/components/schemas/Notebook' } })) },
      },
    },

    '/api/notebooks/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'getNotebook',
        summary: '笔记本详情:面包屑 + 子笔记本 + 直接笔记',
        responses: {
          '200': okJson('OK', wrap({
            notebook:   { $ref: '#/components/schemas/Notebook' },
            breadcrumb: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            children:   { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            notes:      { type: 'array', items: { $ref: '#/components/schemas/Note' } },
          })),
        },
      },
      patch: {
        operationId: 'updateNotebook',
        summary: '改名 / 改图标 / 改封面 / 改父级 / 改顺序。图标和封面传 null 表示清掉。',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              name:       { type: 'string' },
              icon:       { type: ['string', 'null'] },
              cover:      { type: ['string', 'null'] },
              parent_id:  { type: ['string', 'null'] },
              sort_order: { type: 'integer' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ notebook: { $ref: '#/components/schemas/Notebook' } })) },
      },
      delete: {
        operationId: 'deleteNotebook',
        summary: '删除笔记本(级联删子孙 + R2 图片)',
        responses: { '200': okJson('OK', wrap({ deleted: { type: 'boolean' } })) },
      },
    },

    '/api/notes': {
      post: {
        operationId: 'createNote',
        summary: '新建笔记。notebook_id 不传 / 传 null 就放在首页根层级。',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              notebook_id: { type: ['string', 'null'] },
              title:       { type: 'string' },
              content:     { type: 'string', description: 'HTML' },
              icon:        { type: ['string', 'null'] },
              cover:       { type: ['string', 'null'] },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({ note: { $ref: '#/components/schemas/Note' } })) },
      },
    },

    '/api/notes/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'getNote',
        summary: '笔记详情(含完整 HTML 正文 + 面包屑)',
        responses: {
          '200': okJson('OK', wrap({
            note:       { $ref: '#/components/schemas/Note' },
            breadcrumb: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
          })),
        },
      },
      patch: {
        operationId: 'updateNote',
        summary: '改标题 / 正文 / 图标 / 封面 / 搬到别的笔记本 / 改顺序',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              title:       { type: 'string' },
              content:     { type: 'string', description: 'HTML' },
              icon:        { type: ['string', 'null'] },
              cover:       { type: ['string', 'null'] },
              notebook_id: { type: 'string' },
              sort_order:  { type: 'integer' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ note: { $ref: '#/components/schemas/Note' } })) },
      },
      delete: {
        operationId: 'deleteNote',
        summary: '删除笔记(连带 R2 图片清理)',
        responses: { '200': okJson('OK', wrap({ deleted: { type: 'boolean' } })) },
      },
    },

    '/api/search': {
      get: {
        operationId: 'search',
        summary: '搜笔记本名 + 笔记标题 + 笔记正文(去 HTML 标签后)',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
        ],
        responses: {
          '200': okJson('OK', wrap({
            query:     { type: 'string' },
            notebooks: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            notes: { type: 'array', items: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                notebook_id: { type: ['string', 'null'] },
                title:       { type: 'string' },
                icon:        { type: ['string', 'null'] },
                snippet:     { type: 'string' },
                updated_at:  { type: 'string' },
              },
            }},
          })),
        },
      },
    },

    '/api/images': {
      post: {
        operationId: 'uploadImage',
        summary: '上传图片到 R2,返回 /i/<key> 形式的 URL,塞到笔记 content 的 <img src> 里使用',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({
          url:  { type: 'string' },
          key:  { type: 'string' },
          size: { type: 'integer' },
          type: { type: 'string' },
        }))},
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
