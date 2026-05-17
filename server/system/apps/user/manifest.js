// user 是平台基础设施(登录 / 鉴权),不进启动器、不进 /api/ai/apps。
// kind: 'infra' 将它从 launcher 派生中排除,但 registry 仍能驱动 router 分发。
export default {
  name:     'user',
  label:    '账号',
  icon:     '👤',
  kind:     'infra',
  tables:   [],
  subpaths: ['/auth/status', '/auth/setup', '/login', '/logout', '/me', '/password'],
  summary:  '账号登录与鉴权(平台基础设施)。',
}
