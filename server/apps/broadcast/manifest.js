export default {
  name:     'broadcast',
  label:    '广播',
  icon:     '📡',
  kind:     'context',
  tables:   ['app_broadcast_posts', 'app_broadcast_platforms', 'app_broadcast_statuses'],
  subpaths: ['/platforms', '/statuses'],
  summary:  '把一篇内容同步发到多个平台,逐一跟踪发布状态。',
}
