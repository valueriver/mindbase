// System prompt 组装器。
// instruction(用户编辑)+ environment(D1 表)+ model(当前模型)+ memory(启用的记忆)。
import { instruction } from './instruction.js'
import { environment } from './environment.js'
import { model } from './model.js'
import { memory } from './memory.js'

export const buildSystemPrompt = async (db, settings) => {
  let prompt = instruction(settings)
  prompt += environment()
  prompt += model({ apiUrl: settings.ai_base_url, name: settings.ai_model })
  prompt += await memory(db)
  return prompt
}
