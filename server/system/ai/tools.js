// 当前只暴露一个工具:对 MindBase 的 D1 执行任意 SQL。
// 用户明确要求"执行任意 sql"——单用户自部署,不做白名单。
export const tools = [
  {
    type: 'function',
    function: {
      name: 'sql_query',
      description: '在 MindBase 的 D1 数据库上执行任意 SQL,返回 JSON 结果(results + meta)。可用于查询、统计、修改,危险操作请先和用户确认。',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: '要执行的单条 SQL 语句(不要带分号结尾,不支持多条拼接)',
          },
          reason: {
            type: 'string',
            description: '简要说明执行此 SQL 的原因',
          },
        },
        required: ['sql', 'reason'],
      },
    },
  },
]
