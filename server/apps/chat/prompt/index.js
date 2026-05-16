// System prompt 组装器。
// instruction(用户编辑)+ environment(D1 表)+ model(当前模型)+ profile(用户档案)。
import { instruction } from './instruction.js'
import { environment } from './environment.js'
import { model } from './model.js'
import { buildProfileSection } from './profile.js'

export const buildSystemPrompt = async (env, settings) => {
  let prompt = instruction(settings)
  prompt += environment()
  prompt += model({ apiUrl: settings.ai_base_url, name: settings.ai_model })
  prompt += await buildProfileSection(env)
  return prompt
}
