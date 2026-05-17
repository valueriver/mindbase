export default {
  name:     'home',
  label:    '主页',
  icon:     '🏠',
  kind:     'context',
  tables:   ["app_home_posts","app_home_events"],
  subpaths: ["/events"],
  summary:  '动态主页:用户和 AI 共写的时间轴,所有应用关键事件自动汇总在这里。',
}
