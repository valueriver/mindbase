<template>
  <div class="min-h-screen">
    <AppHeader />

    <Cover
      v-if="notebook?.cover"
      :cover="notebook.cover"
      @update="updateCover"
    />

    <main class="mx-auto w-full max-w-3xl px-12 pt-10 pb-20">
      <Breadcrumb :items="breadcrumbItems" />

      <div v-if="loading" class="py-10 text-sm text-nt-soft">加载中…</div>
      <div v-else-if="error" class="py-10 text-sm text-nt-danger">{{ error }}</div>

      <template v-else-if="notebook">
        <div class="mt-4">
          <button
            v-if="notebook.icon"
            ref="iconBtn"
            type="button"
            class="flex h-[78px] w-[78px] items-center justify-center rounded-md text-[66px] leading-none hover:bg-nt-hover"
            @click="openEmoji"
          >
            {{ notebook.icon }}
          </button>
        </div>

        <div class="mt-2 flex items-center gap-1 text-nt-soft">
          <button
            v-if="!notebook.icon"
            ref="iconBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openEmoji"
          >
            😀 添加图标
          </button>
          <button
            v-if="!notebook.cover"
            ref="coverBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openCover"
          >
            🏞️ 添加封面
          </button>
          <button
            ref="manageBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openManage"
          >
            ⚙ 管理笔记本
          </button>
        </div>

        <input
          v-model="nameInput"
          placeholder="无标题"
          class="mt-2 w-full border-0 bg-transparent py-1 text-[40px] font-bold leading-tight tracking-tight text-nt outline-none placeholder:text-nt-hint"
          @blur="saveName"
          @keydown.enter.prevent="($event.target).blur()"
        />

        <ItemList
          class="mt-6"
          :notebooks="children"
          :notes="notes"
          @add-notebook="onAddNotebook"
          @add-note="onAddNote"
        />
      </template>
    </main>

    <EmojiPicker
      :open="emojiOpen"
      :anchor="emojiAnchor"
      @pick="onPickEmoji"
      @close="emojiOpen = false"
    />
    <CoverPicker
      :open="coverOpen"
      :anchor="coverAnchor"
      @pick="onPickCover"
      @close="coverOpen = false"
    />

    <Popover :open="manageOpen" :anchor="manageAnchor" :width="200" @close="manageOpen = false">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-danger-bg hover:text-nt-danger"
        @click="onDeleteNotebook"
      >
        <span>🗑</span> 删除笔记本
      </button>
    </Popover>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import Cover from '@/components/Cover.vue'
import CoverPicker from '@/components/CoverPicker.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import ItemList from '@/components/ItemList.vue'
import Popover from '@/components/Popover.vue'
import { apiNotebook, apiNote } from '@/api/client'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const loading    = ref(true)
const error      = ref('')
const notebook   = ref(null)
const breadcrumb = ref([])
const children   = ref([])
const notes      = ref([])
const nameInput  = ref('')

const iconBtn   = ref(null)
const coverBtn  = ref(null)
const manageBtn = ref(null)
const emojiOpen  = ref(false)
const coverOpen  = ref(false)
const manageOpen = ref(false)
const emojiAnchor  = ref(null)
const coverAnchor  = ref(null)
const manageAnchor = ref(null)

const breadcrumbItems = computed(() =>
  breadcrumb.value.map((b, i, arr) => ({
    id:   b.id,
    name: b.name,
    icon: b.icon,
    to:   i < arr.length - 1 ? { name: 'notebook', params: { id: b.id } } : null,
  }))
)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await apiNotebook.detail(props.id)
    notebook.value   = data.notebook
    breadcrumb.value = data.breadcrumb
    children.value   = data.children
    notes.value      = data.notes
    nameInput.value  = data.notebook.name
  } catch (e) {
    if (e.status === 404) router.replace({ name: 'home' })
    else error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function saveName() {
  const next = nameInput.value.trim()
  if (!next || !notebook.value || next === notebook.value.name) {
    nameInput.value = notebook.value?.name || ''
    return
  }
  try {
    const { notebook: updated } = await apiNotebook.update(props.id, { name: next })
    notebook.value = updated
    nameInput.value = updated.name
  } catch (e) {
    alert(e.message || '重命名失败')
    nameInput.value = notebook.value.name
  }
}

function openEmoji() {
  emojiAnchor.value = iconBtn.value?.getBoundingClientRect() || null
  emojiOpen.value = true
}
function openCover() {
  coverAnchor.value = coverBtn.value?.getBoundingClientRect() || null
  coverOpen.value = true
}
function openManage() {
  manageAnchor.value = manageBtn.value?.getBoundingClientRect() || null
  manageOpen.value = true
}

async function onPickEmoji(emoji) {
  emojiOpen.value = false
  try {
    const { notebook: updated } = await apiNotebook.update(props.id, { icon: emoji ?? null })
    notebook.value = { ...notebook.value, icon: updated.icon }
  } catch (e) { alert(e.message || '保存失败') }
}

async function onPickCover(value) {
  coverOpen.value = false
  await updateCover(value)
}

async function updateCover(value) {
  try {
    const { notebook: updated } = await apiNotebook.update(props.id, { cover: value ?? null })
    notebook.value = { ...notebook.value, cover: updated.cover }
  } catch (e) { alert(e.message || '保存失败') }
}

async function onAddNotebook() {
  const name = window.prompt('笔记本名称')
  if (!name) return
  try {
    await apiNotebook.create({ name, parent_id: props.id })
    await load()
  } catch (e) { alert(e.message || '创建失败') }
}

async function onAddNote() {
  try {
    const { note } = await apiNote.create({ notebook_id: props.id })
    router.push({ name: 'note', params: { id: note.id } })
  } catch (e) { alert(e.message || '创建失败') }
}

async function onDeleteNotebook() {
  manageOpen.value = false
  if (!notebook.value) return
  if (!window.confirm(`删除笔记本「${notebook.value.name}」及其全部内容？`)) return
  try {
    await apiNotebook.remove(props.id)
    router.back()
  } catch (e) { alert(e.message || '删除失败') }
}

watch(() => props.id, load, { immediate: true })
</script>
