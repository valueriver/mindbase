import { DEFAULT_SYSTEM_PROMPT } from './default.js'

// 用户在设置里写的 system prompt;空就用 default。
export const instruction = (settings) =>
  String(settings?.ai_system_prompt || '').trim() || DEFAULT_SYSTEM_PROMPT
