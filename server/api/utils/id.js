const ID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const randomId = (length) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (let i = 0; i < length; i++) out += ID_CHARS[bytes[i] % ID_CHARS.length]
  return out
}

export const createUserId     = () => randomId(16)
export const createNotebookId = () => randomId(12)
export const createNoteId     = () => randomId(12)
