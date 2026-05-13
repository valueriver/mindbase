import { sendChatAction, listMessagesAction } from '../service/chat.js'

export const handleChatApi = async (request, env, path, method) => {
  if (path === '/api/chat/send'     && method === 'POST') return sendChatAction(request, env)
  if (path === '/api/chat/messages' && method === 'GET')  return listMessagesAction(request, env)
  return null
}
