export default {
  name:     'ledger',
  label:    '记账',
  icon:     '💰',
  kind:     'context',
  tables:   ["ledger_entries"],
  subpaths: ["/stats","/categories"],
  summary:  '逐笔收支流水,金额以"分"存储避免浮点,支持按月统计和分类聚合。',
}
