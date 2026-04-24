<template>
  <div class="min-h-screen">
    <AppHeader />

    <Cover
      v-if="note?.cover"
      :cover="note.cover"
      @update="updateCover"
    />

    <main class="mx-auto w-full max-w-3xl px-12 pt-10 pb-32">
      <Breadcrumb :items="breadcrumbItems" />

      <div v-if="loading" class="py-10 text-sm text-nt-soft">加载中…</div>
      <div v-else-if="error" class="py-10 text-sm text-nt-danger">{{ error }}</div>

      <template v-else-if="note">
        <div class="mt-4">
          <button
            v-if="note.icon"
            ref="iconBtn"
            type="button"
            class="flex h-[78px] w-[78px] items-center justify-center rounded-md text-[66px] leading-none hover:bg-nt-hover"
            @click="openEmoji"
          >
            {{ note.icon }}
          </button>
        </div>

        <div class="mt-2 flex items-center gap-1 text-nt-soft">
          <button
            v-if="!note.icon"
            ref="iconBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openEmoji"
          >
            😀 添加图标
          </button>
          <button
            v-if="!note.cover"
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
            ⚙ 管理笔记
          </button>
        </div>

        <input
          v-model="title"
          placeholder="无标题"
          class="mt-2 w-full border-0 bg-transparent py-1 text-[40px] font-bold leading-tight tracking-tight text-nt outline-none placeholder:text-nt-hint"
          @input="scheduleSave"
        />

        <ContentEditor
          ref="editorRef"
          class="mt-4"
          :value="content"
          placeholder="开始写点什么…"
          @update:value="onContentChange"
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

    <Popover :open="manageOpen" :anchor="manageAnchor" :width="180" @close="manageOpen = false">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-danger-bg hover:text-nt-danger"
        @click="onDelete"
      >
        <span>🗑</span> 删除笔记
      </button>
    </Popover>

    <EditorToolbar v-if="note" :on-insert-image="insertImageFromToolbar" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ContentEditor from '@/components/ContentEditor.vue'
import Cover from '@/components/Cover.vue'
import CoverPicker from '@/components/CoverPicker.vue'
import EditorToolbar from '@/components/EditorToolbar.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import Popover from '@/components/Popover.vue'
import { apiNote } from '@/api/client'

const props  = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const loading    = ref(true)
const error      = ref('')
const note       = ref(null)
const breadcrumb = ref([])
const title      = ref('')
const content    = ref('')

const editorRef  = ref(null)
const iconBtn    = ref(null)
const coverBtn   = ref(null)
const manageBtn  = ref(null)
const emojiOpen  = ref(false)
const coverOpen  = ref(false)
const manageOpen = ref(false)
const emojiAnchor  = ref(null)
const coverAnchor  = ref(null)
const manageAnchor = ref(null)

let saveTimer = null

const breadcrumbItems = computed(() => {
  const chain = breadcrumb.value.map(b => ({
    id: b.id, name: b.name, icon: b.icon,
    to: { name: 'notebook', params: { id: b.id } },
  }))
  chain.push({
    id:   note.value?.id,
    name: note.value?.title || '无标题',
    icon: note.value?.icon,
    to:   null,
  })
  return chain
})

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await apiNote.detail(props.id)
    note.value       = data.note
    breadcrumb.value = data.breadcrumb
    title.value      = data.note.title
    content.value    = data.note.content
  } catch (e) {
    if (e.status === 404) router.replace({ name: 'home' })
    else error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 600)
}

function onContentChange(next) {
  content.value = next
  scheduleSave()
}

function insertImageFromToolbar(file) {
  editorRef.value?.uploadAndInsert?.(file)
}

async function save() {
  if (!note.value) return
  try {
    const { note: updated } = await apiNote.update(props.id, {
      title:   title.value,
      content: content.value,
    })
    note.value = { ...note.value, ...updated }
  } catch (e) {
    console.error('note save failed:', e?.message)
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
    const { note: updated } = await apiNote.update(props.id, { icon: emoji ?? null })
    note.value = { ...note.value, icon: updated.icon }
  } catch (e) { alert(e.message || '保存失败') }
}

async function onPickCover(value) {
  coverOpen.value = false
  await updateCover(value)
}

async function updateCover(value) {
  try {
    const { note: updated } = await apiNote.update(props.id, { cover: value ?? null })
    note.value = { ...note.value, cover: updated.cover }
  } catch (e) { alert(e.message || '保存失败') }
}

async function onDelete() {
  manageOpen.value = false
  if (!window.confirm('删除这条笔记？')) return
  try {
    await apiNote.remove(props.id)
    router.back()
  } catch (e) { alert(e.message || '删除失败') }
}

onBeforeUnmount(() => clearTimeout(saveTimer))
watch(() => props.id, load, { immediate: true })
</script>
