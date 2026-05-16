// 把 skills/mindbase/* 打成项目根的 mindbase.zip,提交到仓库。
// 用户从 github.com/realuckyang/mindbase/raw/main/mindbase.zip 下载,
// 不走 Worker 静态资产,避免暴露 owner 的私有实例域名。
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const SRC_DIR = join(root, 'skills', 'mindbase')
const OUT_FILE = join(root, 'mindbase.zip')

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

writeFileSync(OUT_FILE, buf)
console.log(`[build-skill] wrote ${relative(root, OUT_FILE)} (${buf.length} bytes, ${files.length} files)`)
