export default {
  name:     'vault',
  label:    '密码箱',
  icon:     '🔐',
  category: '凭据',
  kind:     'context',
  tables:   ["app_vault_entries"],
  subpaths: ["/import"],
  summary:  '网站和应用的密码,明文存(单机自部署),支持 Chrome/1Password CSV 导入。',
  private:  true,
}
