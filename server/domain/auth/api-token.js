export const API_TOKEN_PREFIX = 'mb_'

// 明文形态:mb_ + 48 位十六进制(24 字节随机)
export function generateApiToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${API_TOKEN_PREFIX}${hex}`
}

export const isApiTokenShape = (s) => typeof s === 'string' && s.startsWith(API_TOKEN_PREFIX)
