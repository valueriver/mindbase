import {
  listConversationsAction,
  listMessagesAction,
  deleteConversationAction,
  sendChatAction,
} from '../service/chat.js'

export const handleChatApi = async (request, env, path, method) => {
  if (path === '/api/chat/send' && method === 'POST') return sendChatAction(request, env)
  if (path === '/api/chat/conversations' && method === 'GET') return listConversationsAction(request, env)

  let m = path.match(/^\/api\/chat\/conversations\/([0-9A-Za-z_-]+)\/messages$/)
  if (m && method === 'GET') return listMessagesAction(request, env, m[1])

  m = path.match(/^\/api\/chat\/conversations\/([0-9A-Za-z_-]+)$/)
  if (m && method === 'DELETE') return deleteConversationAction(request, env, m[1])

  return null
}
