export default {
  name:     'todos',
  label:    '待办',
  icon:     '✅',
  category: '流水',
  kind:     'context',
  tables:   ["app_todos_items"],
  subpaths: [],
  summary:  '待办清单:单层任务,完成/未完成两态,关键完成会冒泡到主页。',
}
