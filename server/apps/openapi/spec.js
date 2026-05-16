// 生成 OpenAPI 3.1 schema,GPTs Actions / Claude Custom Connector 直接 import。
// servers 字段动态用请求 origin,自托管的人也开箱即用。
//
// 策略:精选高频应用(home / notes / ledger / todos / profile)精确列出。
// 完整应用清单(40+)走 SQL 自发现:
//   SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'app_%'
// 所有应用都遵循 /api/<name> 标准 CRUD,精确字段 SELECT 表 schema 即可。

const HomePostSchema = {
  type: 'object',
  description: '主页帖子。author 是身份 slug(claude-code / codex / cursor / user 等)。',
  properties: {
    id:         { type: 'string' },
    author:     { type: 'string', description: '身份 slug,默认 user' },
    content:    { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
}

const HomeEventSchema = {
  type: 'object',
  description: '应用事件流。后端 emitHomeEvent() 维护,只读。',
  properties: {
    id:         { type: 'string' },
    app:        { type: 'string', description: '来源应用 slug,如 ledger / books / goals' },
    action:     { type: 'string', description: 'created / status_changed / milestone / completed 等' },
    ref_id:     { type: ['string', 'null'], description: '源记录 id,可空' },
    summary:    { type: 'string', description: '一行人话' },
    icon:       { type: ['string', 'null'] },
    created_at: { type: 'string' },
  },
}

const NotebookSchema = {
  type: 'object',
  properties: {
    id:         { type: 'string' },
    parent_id:  { type: ['string', 'null'], description: '父笔记本 id;为 null 表示挂在根层级' },
    name:       { type: 'string' },
    icon:       { type: ['string', 'null'], description: '单个 emoji,如 📚' },
    cover:      { type: ['string', 'null'], description: '封面 URL,或预置 key: preset:1 .. preset:8' },
    sort_order: { type: 'integer' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
}

const PageSchema = {
  type: 'object',
  properties: {
    id:          { type: 'string' },
    notebook_id: { type: ['string', 'null'], description: '所属笔记本 id;null 表示挂在根' },
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

const TodoSchema = {
  type: 'object',
  description: '待办。done 用整数 0/1。',
  properties: {
    id:         { type: 'string' },
    content:    { type: 'string' },
    done:       { type: 'integer', enum: [0, 1] },
    due_at:     { type: ['string', 'null'], description: 'YYYY-MM-DD,可空' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
}

const ProfileBlockSchema = {
  type: 'object',
  description: '个人档 block,会被注入对话的 system prompt。',
  properties: {
    id:         { type: 'string' },
    title:      { type: 'string' },
    content:    { type: 'string' },
    sort_order: { type: 'integer' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
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
      'MindBase——和 AI 同步生活上下文的个人数据库。\n\n' +
      '40+ 个应用共用一份 D1,每个应用一组表,前缀 `app_<name>_*`。\n' +
      '所有应用都遵循 `/api/<name>` 的标准 CRUD 模式:GET 列表、POST 创建、GET/PATCH/DELETE /<id>。\n\n' +
      '**这份 OpenAPI 只列出高频应用**(home / notes / ledger / todos / profile)的精确字段。' +
      '其它应用(电影 / 书单 / 健康 / 菜谱 / 设备 / 订阅 / 目标 / 回忆 / 足迹 / 简历 / 银行卡 / 网络账号 / 邮箱 / 域名 / 文章 / 资产 / 病例 / 游戏 / App / 影集 / 说明书 / 证件库 / 心愿单 / 通讯录 / 指令集 / 服务器 / 大模型 / API / 展览 / 演唱会 / 网页 / 收藏 / 音乐 / 旅行 / 项目 等)请按 `/api/<name>` CRUD 规律调用,精确字段 SELECT 表 schema 或调 GET 列表观察。\n\n' +
      '完整应用清单可通过 `SELECT name FROM sqlite_master WHERE type=\'table\' AND name LIKE \'app_%\'` 取得。',
    version: '2.0.0',
  },
  servers: [{ url: origin }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer' },
    },
    schemas: {
      HomePost:     HomePostSchema,
      HomeEvent:    HomeEventSchema,
      Notebook:     NotebookSchema,
      Page:         PageSchema,
      Ledger:       LedgerSchema,
      Todo:         TodoSchema,
      ProfileBlock: ProfileBlockSchema,
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {

    // ==================== 主页 ====================

    '/api/home': {
      get: {
        operationId: 'listHomePosts',
        summary: '列主页帖子,按时间倒序',
        parameters: [
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'before', in: 'query', schema: { type: 'string', description: '游标:created_at,返回更早的' } },
        ],
        responses: {
          '200': okJson('OK', wrap({
            posts: { type: 'array', items: { $ref: '#/components/schemas/HomePost' } },
          })),
        },
      },
      post: {
        operationId: 'createHomePost',
        summary: '写一条主页帖子。author 是身份 slug(claude-code / codex / cursor / 自己的 slug),不传默认 user。',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['content'],
            properties: {
              content: { type: 'string' },
              author:  { type: 'string', description: '身份 slug,[a-z0-9][a-z0-9-]*,≤32' },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({ post: { $ref: '#/components/schemas/HomePost' } })) },
      },
    },

    '/api/home/events': {
      get: {
        operationId: 'listHomeEvents',
        summary: '列应用事件流(只读)。各应用关键动作后由后端 emitHomeEvent() 自动写入。',
        parameters: [
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'before', in: 'query', schema: { type: 'string', description: '游标:created_at,返回更早的' } },
        ],
        responses: {
          '200': okJson('OK', wrap({
            events: { type: 'array', items: { $ref: '#/components/schemas/HomeEvent' } },
          })),
        },
      },
    },

    // ==================== 笔记 ====================

    '/api/notes/notebooks': {
      get: {
        operationId: 'listNotebooks',
        summary: '列子笔记本(默认根层级,传 parent_id 列某个笔记本下的子项)',
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
              parent_id: { type: ['string', 'null'] },
              icon:      { type: ['string', 'null'] },
              cover:     { type: ['string', 'null'] },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({ notebook: { $ref: '#/components/schemas/Notebook' } })) },
      },
    },

    '/api/notes/notebooks/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'getNotebook',
        summary: '笔记本详情:面包屑 + 子笔记本 + 直接笔记',
        responses: {
          '200': okJson('OK', wrap({
            notebook:   { $ref: '#/components/schemas/Notebook' },
            breadcrumb: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            children:   { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            pages:      { type: 'array', items: { $ref: '#/components/schemas/Page' } },
          })),
        },
      },
      patch: {
        operationId: 'updateNotebook',
        summary: '改名 / 图标 / 封面 / 父级 / 顺序。图标和封面传 null 表示清掉。',
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

    '/api/notes/pages': {
      post: {
        operationId: 'createPage',
        summary: '新建笔记。notebook_id 不传 / 传 null 就放在根层级。',
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
        responses: { '201': okJson('Created', wrap({ page: { $ref: '#/components/schemas/Page' } })) },
      },
    },

    '/api/notes/pages/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'getPage',
        summary: '笔记详情(含完整 HTML 正文 + 面包屑)',
        responses: {
          '200': okJson('OK', wrap({
            page:       { $ref: '#/components/schemas/Page' },
            breadcrumb: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
          })),
        },
      },
      patch: {
        operationId: 'updatePage',
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
        responses: { '200': okJson('OK', wrap({ page: { $ref: '#/components/schemas/Page' } })) },
      },
      delete: {
        operationId: 'deletePage',
        summary: '删除笔记(连带 R2 图片清理)',
        responses: { '200': okJson('OK', wrap({ deleted: { type: 'boolean' } })) },
      },
    },

    '/api/notes/root': {
      get: {
        operationId: 'getNotesRoot',
        summary: '笔记根层级:首页元数据 + 根层级的笔记本和笔记',
        responses: {
          '200': okJson('OK', wrap({
            home:      { type: 'object', properties: {
              name:  { type: 'string' },
              icon:  { type: ['string', 'null'] },
              cover: { type: ['string', 'null'] },
            }},
            notebooks: { type: 'array', items: { $ref: '#/components/schemas/Notebook' } },
            pages:     { type: 'array', items: { $ref: '#/components/schemas/Page' } },
          })),
        },
      },
      patch: {
        operationId: 'updateNotesRoot',
        summary: '改笔记首页 名字 / 图标 / 封面',
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

    // ==================== 记账 ====================

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

    // ==================== 待办 ====================

    '/api/todos': {
      get: {
        operationId: 'listTodos',
        summary: '列待办,按创建时间倒序',
        responses: { '200': okJson('OK', wrap({
          items: { type: 'array', items: { $ref: '#/components/schemas/Todo' } },
        }))},
      },
      post: {
        operationId: 'createTodo',
        summary: '新建一条待办',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['content'],
            properties: {
              content: { type: 'string' },
              due_at:  { type: ['string', 'null'], description: 'YYYY-MM-DD' },
            },
          }}},
        },
        responses: { '201': okJson('Created', wrap({ item: { $ref: '#/components/schemas/Todo' } }))},
      },
    },

    '/api/todos/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      patch: {
        operationId: 'updateTodo',
        summary: '改内容 / 完成态 / 截止日',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              done:    { type: 'integer', enum: [0, 1] },
              due_at:  { type: ['string', 'null'] },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ item: { $ref: '#/components/schemas/Todo' } }))},
      },
      delete: { operationId: 'deleteTodo', summary: '删一条', responses: { '200': okJson('OK', wrap({}))} },
    },

    // ==================== 个人档 ====================

    '/api/profile': {
      get: {
        operationId: 'listProfileBlocks',
        summary: '列出用户档案 block,按 sort_order 升序;每个 block 都会注入 system prompt',
        responses: { '200': okJson('OK', wrap({
          blocks: { type: 'array', items: { $ref: '#/components/schemas/ProfileBlock' } },
        }))},
      },
      post: {
        operationId: 'createProfileBlock',
        summary: '新建一个 block',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              title:   { type: 'string' },
              content: { type: 'string' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ block: { $ref: '#/components/schemas/ProfileBlock' } }))},
      },
    },

    '/api/profile/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      patch: {
        operationId: 'updateProfileBlock',
        summary: '改一个 block 的 title / content / sort_order',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              title:      { type: 'string' },
              content:    { type: 'string' },
              sort_order: { type: 'integer' },
            },
          }}},
        },
        responses: { '200': okJson('OK', wrap({ block: { $ref: '#/components/schemas/ProfileBlock' } }))},
      },
      delete: {
        operationId: 'deleteProfileBlock',
        summary: '删除一个 block',
        responses: { '200': okJson('OK', wrap({}))},
      },
    },

    // ==================== 图片上传(全应用共享) ====================

    '/api/images': {
      post: {
        operationId: 'uploadImage',
        summary: '上传图片到 R2,返回 /i/u/<uuid>.jpg 形式的 URL,可塞进任何应用的 cover / image 字段',
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

    // ==================== 搜索(全应用) ====================

    '/api/search': {
      get: {
        operationId: 'search',
        summary: '跨应用搜索',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
        ],
        responses: {
          '200': okJson('OK', wrap({
            query:   { type: 'string' },
            results: { type: 'array', items: { type: 'object' } },
          })),
        },
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
