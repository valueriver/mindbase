// 朴素 vCard 3.0/4.0 解析器:支持基础字段 + line folding + 反斜杠转义。
// parseVCards(text) -> Array<{ name, nickname, phone, email, company, title, address, birthday, note }>
//
// 故意保持最小:不处理 PHOTO,不处理 base64,不处理 quoted-printable。
// 未能识别 name 的条目跳过。

const unescape = (v) =>
  String(v)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')

// 拆 "PARAM=VAL;PARAM2=VAL2:..." 的 prefix(冒号前)与 value(冒号后)。
const splitProp = (line) => {
  const i = line.indexOf(':')
  if (i < 0) return null
  const head = line.slice(0, i)
  const value = line.slice(i + 1)
  // head 形如 "TEL;TYPE=CELL" 或 "EMAIL"
  const parts = head.split(';')
  const nameRaw = parts[0]
  // 跳过 group 前缀 "item1.TEL"
  const dot = nameRaw.lastIndexOf('.')
  const name = (dot >= 0 ? nameRaw.slice(dot + 1) : nameRaw).toUpperCase()
  return { name, value }
}

// 把行折叠合并(下一行以 space/tab 开头是上一行的延续)。
const unfold = (text) => {
  const raw = String(text).replace(/\r\n/g, '\n').split('\n')
  const out = []
  for (const line of raw) {
    if (/^[ \t]/.test(line) && out.length > 0) {
      out[out.length - 1] += line.slice(1)
    } else {
      out.push(line)
    }
  }
  return out
}

const normalizeBday = (v) => {
  const s = String(v || '').trim()
  if (!s) return null
  // 已是 YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // YYYYMMDD
  m = s.match(/^(\d{4})(\d{2})(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return null
}

const parseOne = (lines) => {
  const out = {
    name: '', nickname: '', phone: '', email: '',
    company: '', title: '', address: '',
    birthday: null, note: '',
  }
  let fn = ''
  let nFallback = ''
  for (const line of lines) {
    if (!line || /^BEGIN:VCARD/i.test(line) || /^END:VCARD/i.test(line) || /^VERSION:/i.test(line)) continue
    const p = splitProp(line)
    if (!p) continue
    const val = unescape(p.value)
    switch (p.name) {
      case 'FN':
        fn = val.trim()
        break
      case 'N': {
        // N:Family;Given;Additional;Prefix;Suffix
        const parts = val.split(';')
        const family = (parts[0] || '').trim()
        const given  = (parts[1] || '').trim()
        const joined = [given, family].filter(Boolean).join(' ').trim()
        if (joined) nFallback = joined
        break
      }
      case 'NICKNAME':
        if (!out.nickname) out.nickname = val.trim()
        break
      case 'TEL':
        if (!out.phone) out.phone = val.trim()
        break
      case 'EMAIL':
        if (!out.email) out.email = val.trim()
        break
      case 'ORG':
        if (!out.company) out.company = val.split(';')[0].trim()
        break
      case 'TITLE':
        if (!out.title) out.title = val.trim()
        break
      case 'ADR': {
        // ADR:POBox;Ext;Street;City;State;Zip;Country
        const parts = val.split(';').map((s) => s.trim())
        const street = parts[2] || ''
        const city   = parts[3] || ''
        const state  = parts[4] || ''
        const country = parts[6] || ''
        const joined = [street, city, state, country].filter(Boolean).join(', ')
        if (joined && !out.address) out.address = joined
        break
      }
      case 'BDAY': {
        const b = normalizeBday(val)
        if (b) out.birthday = b
        break
      }
      case 'NOTE':
        if (!out.note) out.note = val.trim()
        break
      default:
        break
    }
  }
  out.name = fn || nFallback
  return out
}

export const parseVCards = (text) => {
  const lines = unfold(text)
  const results = []
  let buf = null
  for (const line of lines) {
    if (/^BEGIN:VCARD/i.test(line)) {
      buf = []
      continue
    }
    if (/^END:VCARD/i.test(line)) {
      if (buf) {
        const card = parseOne(buf)
        if (card.name) results.push(card)
      }
      buf = null
      continue
    }
    if (buf) buf.push(line)
  }
  return results
}
