export default {
  name:     'contacts',
  label:    '通讯录',
  icon:     '👥',
  kind:     'context',
  tables:   ["app_contacts_people"],
  subpaths: ["/import"],
  summary:  '人脉通讯录,支持从 vCard/CSV 导入。',
}
