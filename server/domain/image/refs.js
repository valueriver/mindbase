// /i/u/<userId>/<uuid>.<ext> 形式的图片 URL
const R2_KEY_RE = /\/i\/(u\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\.[A-Za-z0-9]+)/g

// 从正文 HTML 里抽出 "本用户的" R2 key。跨用户的 key 一律忽略,
// 防止恶意内容触发别人图片的删除。
export function extractOwnedR2Keys(content, userId) {
  if (!content) return []
  const prefix = `u/${userId}/`
  const out = new Set()
  for (const m of content.matchAll(R2_KEY_RE)) {
    const key = m[1]
    if (key.startsWith(prefix)) out.add(key)
  }
  return [...out]
}

// 删除一组 R2 key。R2 binding 的 delete() 支持数组。
export async function deleteR2Keys(env, keys) {
  if (!env?.IMAGES || !keys || keys.length === 0) return
  try {
    await env.IMAGES.delete(keys)
  } catch (err) {
    // 清理失败不阻塞业务,先记日志
    console.error('r2 delete failed:', err?.message, keys.length, 'keys')
  }
}

// 给定旧/新内容,返回被移除的 key 列表(仅本用户的)
export function diffRemovedKeys(oldContent, newContent, userId) {
  const oldKeys = new Set(extractOwnedR2Keys(oldContent, userId))
  const newKeys = new Set(extractOwnedR2Keys(newContent, userId))
  return [...oldKeys].filter(k => !newKeys.has(k))
}
