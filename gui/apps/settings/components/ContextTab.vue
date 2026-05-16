<template>
  <section class="mt-6 space-y-5">
    <div v-if="loading" class="py-6 text-sm text-nt-soft">加载中…</div>
    <template v-else>
      <Field label="历史轮数" hint="每次调用送给模型的最近 user 回合数">
        <div class="inline-flex overflow-hidden rounded-md border border-nt-divider">
          <button
            v-for="opt in roundOptions"
            :key="opt"
            type="button"
            :class="[
              'px-4 py-1.5 text-sm transition',
              Number(form.ai_context_rounds) === opt
                ? 'bg-nt text-white'
                : 'text-nt-muted hover:bg-nt-hover',
            ]"
            @click="form.ai_context_rounds = opt"
          >{{ opt }}</button>
        </div>
      </Field>

      <SaveBar :busy="busy" :saved="saved" :error="error" @save="onSave" />
    </template>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { apiSettings } from '@/api'
import Field from './Field.vue'
import SaveBar from './SaveBar.vue'

const props = defineProps({
  form:    { type: Object, required: true },
  loading: { type: Boolean, default: false },
})

const roundOptions = [30, 100, 500]
const busy  = ref(false)
const saved = ref(false)
const error = ref('')

async function onSave() {
  busy.value = true; saved.value = false; error.value = ''
  try {
    const { settings } = await apiSettings.update({
      ai_context_rounds: props.form.ai_context_rounds,
    })
    props.form.ai_context_rounds = settings.ai_context_rounds
    saved.value = true
    setTimeout(() => { saved.value = false }, 1500)
  } catch (e) {
    error.value = e?.message || '保存失败'
  } finally { busy.value = false }
}
</script>
