export default {
  name:     'collab',
  label:    '协作',
  icon:     '🔗',
  category: '系统',
  kind:     'system',
  tables:   ["tokens"],
  subpaths: ["/tokens"],
  summary:  '协作授权:生成 bearer token 让外部 AI 接入本实例。',
}
