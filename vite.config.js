import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// 所有配置都集中在 wrangler.jsonc 的 vars 里(文件本身 gitignore)。
// 这里读出来,挑几个需要暴露给前端的,注入到 build 里。
function loadWranglerVars() {
  const path = fileURLToPath(new URL('./wrangler.jsonc', import.meta.url))
  try {
    const raw = readFileSync(path, 'utf8')
    const noLine  = raw.replace(/\/\/.*$/gm, '')
    const noBlock = noLine.replace(/\/\*[\s\S]*?\*\//g, '')
    return JSON.parse(noBlock)?.vars || {}
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[mindbase] 未找到 wrangler.jsonc,前端配置将为空;按 README 复制 wrangler.example.jsonc 并填入')
    return {}
  }
}

const wranglerVars = loadWranglerVars()

// 只把明确列出来的 key 暴露给前端,JWT_SECRET 这种服务端配置不要泄进 bundle
const PUBLIC_CONFIG = {
  GOOGLE_CLIENT_ID: wranglerVars.GOOGLE_CLIENT_ID || '',
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __PUBLIC_CONFIG__: JSON.stringify(PUBLIC_CONFIG),
  },
})
