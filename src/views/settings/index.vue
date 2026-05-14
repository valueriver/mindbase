<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">设置</h1>

      <div class="mt-6 overflow-x-auto no-scrollbar">
        <div class="flex gap-1 border-b border-nt-divider min-w-max">
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            :class="[
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition',
              tab === t.id
                ? 'border-nt font-medium text-nt'
                : 'border-transparent text-nt-soft hover:text-nt',
            ]"
            @click="setTab(t.id)"
          >{{ t.label }}</button>
        </div>
      </div>

      <AccountTab v-if="tab === 'account'" />
      <ModelTab   v-else-if="tab === 'model'"   :form="form" :loading="loading" />
      <PromptTab  v-else-if="tab === 'prompt'"  :form="form" :loading="loading" :default-prompt="defaultPrompt" />
      <ContextTab v-else-if="tab === 'context'" :form="form" :loading="loading" />
      <CollabTab  v-else-if="tab === 'collab'" />
      <SkillsTab  v-else-if="tab === 'skills'" />
      <AboutTab   v-else-if="tab === 'about'" />
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiSettings } from '@/api/client'
import AccountTab from '@/components/settings/AccountTab.vue'
import ModelTab   from '@/components/settings/ModelTab.vue'
import PromptTab  from '@/components/settings/PromptTab.vue'
import ContextTab from '@/components/settings/ContextTab.vue'
import CollabTab  from '@/components/settings/CollabTab.vue'
import SkillsTab  from '@/components/settings/SkillsTab.vue'
import AboutTab   from '@/components/settings/AboutTab.vue'

const route  = useRoute()
const router = useRouter()
const tabs = [
  { id: 'account', label: '账户' },
  { id: 'model',   label: '模型' },
  { id: 'prompt',  label: '提示词' },
  { id: 'context', label: '上下文' },
  { id: 'collab',  label: '协作' },
  { id: 'skills',  label: '技能' },
  { id: 'about',   label: '关于' },
]
const VALID = new Set(tabs.map(t => t.id))
const tab = ref(VALID.has(route.query.tab) ? route.query.tab : 'account')
function setTab(t) {
  tab.value = t
  router.replace({ query: { ...route.query, tab: t } })
}

// model / prompt / context 共用的 settings form
const loading = ref(true)
const form = reactive({
  ai_base_url: '',
  ai_api_key:  '',
  ai_model:    '',
  ai_context_rounds: 100,
  ai_system_prompt: '',
})
const defaultPrompt = ref('')

onMounted(async () => {
  try {
    const { settings } = await apiSettings.detail()
    form.ai_base_url       = settings.ai_base_url
    form.ai_api_key        = settings.ai_api_key
    form.ai_model          = settings.ai_model
    form.ai_context_rounds = settings.ai_context_rounds || 100
    form.ai_system_prompt  = settings.ai_system_prompt || ''
    defaultPrompt.value    = settings.ai_system_prompt_default || ''
  } catch {} finally {
    loading.value = false
  }
})
</script>

