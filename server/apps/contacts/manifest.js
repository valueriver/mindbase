export default {
  name:     'contacts',
  label:    '通讯录',
  icon:     '👥',
  category: '身份',
  kind:     'context',
  tables:   ["app_contacts_people"],
  subpaths: ["/import"],
  summary:  '人脉通讯录,支持从 vCard/CSV 导入。',
  private:  false,
}
