export default {
  name:     'chat',
  label:    '对话',
  icon:     '💬',
  kind:     'system',
  tables:   ["conversations","messages"],
  subpaths: ["/send","/messages","/conversations"],
  summary:  '系统对话:用户与 AI 的会话历史,按会话归档。',
}
