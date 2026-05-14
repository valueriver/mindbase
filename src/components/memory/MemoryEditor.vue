<template>
  <div class="space-y-2">
    <input
      v-model="form.title"
      type="text"
      placeholder="标题(必填,例:我的口味偏好)"
      class="w-full rounded border border-nt-divider bg-white px-2 py-1.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
    />
    <input
      v-model="form.description"
      type="text"
      placeholder="摘要(一句话概括,summary 档会注入这条)"
      class="w-full rounded border border-nt-divider bg-white px-2 py-1.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
    />
    <textarea
      v-model="form.content"
      rows="6"
      placeholder="内容(必填,仅 full 档助理才能读到原文)"
      class="w-full resize-y rounded border border-nt-divider bg-white px-2 py-1.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
    ></textarea>

    <!-- visibility 三档 -->
    <div class="rounded border border-nt-divider bg-nt-hover/40 p-2 text-xs">
      <div class="mb-1 text-nt-soft">助理可见性</div>
      <div class="grid grid-cols-3 gap-1.5">
        <label
          v-for="opt in VIS_OPTIONS"
          :key="opt.value"
          class="cursor-pointer rounded border px-2 py-1.5 text-center transition"
          :class="form.visibility === opt.value
            ? 'border-nt bg-white text-nt'
            : 'border-transparent text-nt-soft hover:bg-white'"
        >
          <input v-model="form.visibility" type="radio" :value="opt.value" class="sr-only" />
          <div class="font-medium">{{ opt.label }}</div>
          <div class="mt-0.5 text-[10px] text-nt-soft">{{ opt.hint }}</div>
        </label>
      </div>
    </div>

    <div class="flex items-center gap-2 pt-1 text-xs">
      <button
        type="button"
        class="rounded px-2 py-1 text-nt-soft hover:bg-nt-hover hover:text-nt"
        @click="$emit('cancel')"
      >取消</button>
      <button
        v-if="isEdit"
        type="button"
        class="rounded px-2 py-1 text-nt-danger hover:bg-nt-danger/10"
        @click="$emit('delete')"
      >删除</button>
      <button
        type="button"
        :disabled="!form.title.trim() || !form.content.trim()"
        class="ml-auto rounded bg-nt px-3 py-1 text-white hover:bg-nt-strong disabled:opacity-50"
        @click="onSave"
      >保存</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const VIS_OPTIONS = [
  { value: 'count',   label: '已存',  hint: '助理只知道有这条' },
  { value: 'summary', label: '摘要',  hint: '标题 + 描述可见' },
  { value: 'full',    label: '必读',  hint: '内容也注入' },
]

const props = defineProps({
  modelValue: { type: Object, required: true },
  isEdit:     { type: Boolean, default: false },
})
const emit = defineEmits(['save', 'cancel', 'delete'])

const form = reactive({ ...props.modelValue, visibility: props.modelValue.visibility || 'full' })
watch(() => props.modelValue, (v) => Object.assign(form, v))

const onSave = () => {
  emit('save', {
    title:       form.title.trim(),
    description: form.description.trim(),
    content:     form.content.trim(),
    visibility:  form.visibility || 'full',
  })
}
</script>
