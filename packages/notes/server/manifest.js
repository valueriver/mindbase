export default {
  name:     'notes',
  label:    '笔记',
  icon:     '📚',
  category: '内容',
  kind:     'context',
  tables:   ["app_notes_notebooks","app_notes_pages"],
  subpaths: ["/root","/notebooks","/pages","/items/reorder"],
  summary:  '层级笔记本+页面:支持嵌套笔记本和富文本页面,可拖动排序。',
}
