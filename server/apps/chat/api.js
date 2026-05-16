import {
  sendChatAction,
  listMessagesAction,
  listConversationsAction,
  createConversationAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '/send'          && method === 'POST') return sendChatAction(request, env)
  if (sub === '/messages'      && method === 'GET')  return listMessagesAction(request, env, url)
  if (sub === '/conversations' && method === 'GET')  return listConversationsAction(request, env)
  if (sub === '/conversations' && method === 'POST') return createConversationAction(request, env)
  return null
}

export default handle
