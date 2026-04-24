import { uploadImageAction } from '../service/image.js'

// /api/images POST (multipart/form-data, field "file")
export const handleImageApi = async (request, env, path, method) => {
  if (path === '/api/images' && method === 'POST') return uploadImageAction(request, env)
  return null
}
