/* eslint-disable no-undef */
// build 时由 vite.config.js 从 wrangler.jsonc 的 vars 里注入
const CONFIG = (typeof __PUBLIC_CONFIG__ !== 'undefined') ? __PUBLIC_CONFIG__ : {}

export const GOOGLE_CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID || ''
