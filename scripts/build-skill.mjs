// 把 skills/mindbase/* 打成 public/skills/mindbase.zip,前端再原样下发给用户。
// 在 npm run build 之前跑一次,zip 进入 dist/client/skills/ 经 vite 静态资产输出。
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const SRC_DIR = join(root, 'skills', 'mindbase')
const OUT_DIR = join(root, 'public', 'skills')
const OUT_FILE = join(OUT_DIR, 'mindbase.zip')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const files = walk(SRC_DIR)
if (files.length === 0) {
  throw new Error(`no files under ${SRC_DIR}`)
}

const zip = new JSZip()
const folder = zip.folder('mindbase')
for (const file of files) {
  const rel = relative(SRC_DIR, file).split(/[\\/]/).join('/')
  folder.file(rel, readFileSync(file))
}

const buf = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
})

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, buf)
console.log(`[build-skill] wrote ${relative(root, OUT_FILE)} (${buf.length} bytes, ${files.length} files)`)
