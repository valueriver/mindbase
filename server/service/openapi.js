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

const MemorySchema = {
  type: 'object',
  description: '用户写给 AI 看的长期上下文条目。启用的条目会被自动注入助理的 system prompt。',
  properties: {
    id:          { type: 'integer' },
    title:       { type: 'string' },
    description: { type: 'string', description: '一句话摘要;visibility=summary 档会被注入' },
    content:     { type: 'string', description: '完整内容;仅 visibility=full 档会被注入' },
    visibility:  {
      type: 'string',
      enum: ['count', 'summary', 'full'],
      description: 'count 只告诉助理"有这条";summary 注入标题+摘要;full 全部注入',
    },
    created_at: { type: 'string' },
  },
}

const LedgerSchema = {
  type: 'object',
  description: '记账流水。amount 是整数"分"(100 = 1 元);happened_at 是 YYYY-MM-DD。',
  properties: {
    id:          { type: 'string' },
    type:        { type: 'string', enum: ['expense', 'income'] },
    amount:      { type: 'integer', description: '单位"分",前端 ÷ 100 显示' },
    category:    { type: 'string', description: '分类,自由文本(餐饮 / 交通 / 工资 …)' },
    note:        { type: 'string' },
    happened_at: { type: 'string', description: '发生日期 YYYY-MM-DD' },
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
      Memory:   MemorySchema,
      Ledger:   LedgerSchema,
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

    '/api/memories': {
      get: {
        operationId: 'listMemories',
        summary: '列出用户写下的长期记忆条目(含所有 visibility 档)',
        responses: { '200': okJson('OK', wrap({
          items: { type: 'array', items: { $ref: '#/components/schemas/Memory' } },
        }))},
      },
      post: {
        operationId: 'createMemory',
        summary: '新建一条记忆',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['title', 'content'],
            properties: {
              title:       { type: 'string' },
              description: { type: 'string' },
              content:     { type: 'string' },
              visibility:  { type: 'string', enum: ['count', 'summary', 'full'], default: 'full' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Memory' } }))},
      },
    },

    '/api/memories/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        operationId: 'getMemory',
        summary: '获取单条记忆',
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Memory' } }))},
      },
      patch: {
        operationId: 'updateMemory',
        summary: '更新记忆(可改 title / description / content / visibility)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              title:       { type: 'string' },
              description: { type: 'string' },
              content:     { type: 'string' },
              visibility:  { type: 'string', enum: ['count', 'summary', 'full'] },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Memory' } }))},
      },
      delete: {
        operationId: 'deleteMemory',
        summary: '删除记忆',
        responses: { '200': okJson('OK', wrap({}))},
      },
    },

    '/api/ledger': {
      get: {
        operationId: 'listLedger',
        summary: '列出记账流水,按 happened_at 倒序',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'string', description: 'YYYY-MM,过滤某个月' } },
          { name: 'type',  in: 'query', schema: { type: 'string', enum: ['expense', 'income'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 500, maximum: 1000 } },
        ],
        responses: { '200': okJson('OK', wrap({
          items: { type: 'array', items: { $ref: '#/components/schemas/Ledger' } },
        }))},
      },
      post: {
        operationId: 'createLedger',
        summary: '记一笔。amount 用"元"传(数字,两位小数),后端转成"分"存',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['amount'],
            properties: {
              type:        { type: 'string', enum: ['expense', 'income'], default: 'expense' },
              amount:      { type: 'number', description: '元,>0,两位小数;后端 × 100 转分存' },
              category:    { type: 'string' },
              note:        { type: 'string' },
              happened_at: { type: 'string', description: 'YYYY-MM-DD,默认今天' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Ledger' } }))},
      },
    },

    '/api/ledger/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get:    { operationId: 'getLedger',    summary: '获取一笔',  responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Ledger' } }))} },
      patch: {
        operationId: 'updateLedger',
        summary: '改一笔',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              type:        { type: 'string', enum: ['expense', 'income'] },
              amount:      { type: 'number' },
              category:    { type: 'string' },
              note:        { type: 'string' },
              happened_at: { type: 'string' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Ledger' } }))},
      },
      delete: { operationId: 'deleteLedger', summary: '删一笔', responses: { '200': okJson('OK', wrap({}))} },
    },

    '/api/ledger/stats': {
      get: {
        operationId: 'ledgerStats',
        summary: '某月统计:支出 / 收入 / 结余(单位"分")',
        parameters: [{ name: 'month', in: 'query', schema: { type: 'string', description: 'YYYY-MM,默认当前月' } }],
        responses: { '200': okJson('OK', wrap({
          month:   { type: 'string' },
          expense: { type: 'integer', description: '支出合计(分)' },
          income:  { type: 'integer', description: '收入合计(分)' },
          balance: { type: 'integer', description: 'income - expense(分)' },
        }))},
      },
    },

    '/api/ledger/categories': {
      get: {
        operationId: 'ledgerCategories',
        summary: '历史用过的分类清单,按使用次数倒序',
        responses: { '200': okJson('OK', wrap({
          categories: { type: 'array', items: { type: 'string' } },
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
