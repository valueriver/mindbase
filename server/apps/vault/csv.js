// 朴素 RFC4180 CSV 解析器 + 列名匹配。
// parseVaultCSV(text) -> Array<{ name, url, username, password, note }>(跳过 name 为空的行)

const parseCsv = (text) => {
  const src = String(text).replace(/^﻿/, '') // strip BOM
  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i += 2; continue }
        inQuotes = false
        i += 1
        continue
      }
      cur += ch
      i += 1
      continue
    }
    if (ch === '"') { inQuotes = true; i += 1; continue }
    if (ch === ',') { row.push(cur); cur = ''; i += 1; continue }
    if (ch === '\r') {
      // 吃掉 CR(无论后面是不是 LF)
      i += 1
      continue
    }
    if (ch === '\n') {
      row.push(cur); cur = ''
      rows.push(row); row = []
      i += 1
      continue
    }
    cur += ch
    i += 1
  }
  // 最后一个单元 / 行
  if (cur.length > 0 || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

// 列名同义词,小写比对
const ALIASES = {
  name:     ['name', 'title', 'item', 'entry'],
  url:      ['url', 'website', 'web site', 'login_uri', 'uri', 'site'],
  username: ['username', 'login', 'user', 'login_username', 'user name'],
  password: ['password', 'passwd', 'pass', 'login_password'],
  note:     ['notes', 'note', 'comment', 'comments', 'extra'],
}

const buildColMap = (header) => {
  const map = {}
  header.forEach((h, idx) => {
    const low = String(h || '').trim().toLowerCase()
    if (!low) return
    for (const field of Object.keys(ALIASES)) {
      if (ALIASES[field].includes(low) && map[field] === undefined) {
        map[field] = idx
      }
    }
  })
  return map
}

export const parseVaultCSV = (text) => {
  const rows = parseCsv(text).filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''))
  if (rows.length < 2) return []
  const header = rows[0]
  const map = buildColMap(header)
  if (map.name === undefined) return []

  const out = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const pick = (k) => (map[k] === undefined ? '' : String(r[map[k]] ?? '').trim())
    const name = pick('name')
    if (!name) continue
    out.push({
      name,
      url:      pick('url'),
      username: pick('username'),
      password: map.password === undefined ? '' : String(r[map.password] ?? ''), // 密码不 trim 末尾空格?保守起见仍不 trim
      note:     pick('note'),
    })
  }
  return out
}
