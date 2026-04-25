<template>
  <div class="min-h-screen">
    <AppHeader />

    <Cover
      v-if="home?.cover"
      :cover="home.cover"
      @update="updateCover"
    />

    <main class="mx-auto w-full max-w-3xl px-12 pt-10 pb-20">
      <div v-if="loading" class="py-10 text-sm text-nt-soft">加载中…</div>
      <div v-else-if="error" class="py-10 text-sm text-nt-danger">{{ error }}</div>

      <template v-else>
        <div class="mt-4">
          <button
            v-if="home.icon"
            ref="iconBtn"
            type="button"
            class="flex h-[78px] w-[78px] items-center justify-center rounded-md text-[66px] leading-none hover:bg-nt-hover"
            @click="openEmoji"
          >
            {{ home.icon }}
          </button>
        </div>

        <div class="mt-2 flex items-center gap-1 text-nt-soft">
          <button
            v-if="!home.icon"
            ref="iconBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openEmoji"
          >
            😀 添加图标
          </button>
          <button
            v-if="!home.cover"
            ref="coverBtn"
            type="button"
            class="rounded px-1.5 py-1 text-sm hover:bg-nt-hover hover:text-nt-muted"
            @click="openCover"
          >
            🏞️ 添加封面
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
          :notebooks="notebooks"
          :notes="notes"
          @add-notebook="onAddNotebook"
          @add-note="onAddNote"
          @reorder="onReorder"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import Cover from '@/components/Cover.vue'
import CoverPicker from '@/components/CoverPicker.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import ItemList from '@/components/ItemList.vue'
import { apiRoot, apiNotebook, apiNote, apiItems } from '@/api/client'

const router = useRouter()

const loading   = ref(true)
const error     = ref('')
const home      = ref({ name: '首页', icon: null, cover: null })
const nameInput = ref('')
const notebooks = ref([])
const notes     = ref([])

const iconBtn   = ref(null)
const coverBtn  = ref(null)
const emojiOpen = ref(false)
const coverOpen = ref(false)
const emojiAnchor = ref(null)
const coverAnchor = ref(null)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await apiRoot.detail()
    home.value      = data.home
    nameInput.value = data.home.name
    notebooks.value = data.notebooks
    notes.value     = data.notes
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function saveName() {
  const next = nameInput.value.trim()
  if (!next || next === home.value.name) {
    nameInput.value = home.value.name
    return
  }
  try {
    const { home: updated } = await apiRoot.update({ name: next })
    home.value      = updated
    nameInput.value = updated.name
  } catch (e) {
    alert(e.message || '重命名失败')
    nameInput.value = home.value.name
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

async function onPickEmoji(emoji) {
  emojiOpen.value = false
  try {
    const { home: updated } = await apiRoot.update({ icon: emoji ?? null })
    home.value = updated
  } catch (e) { alert(e.message || '保存失败') }
}

async function onPickCover(value) {
  coverOpen.value = false
  await updateCover(value)
}

async function updateCover(value) {
  try {
    const { home: updated } = await apiRoot.update({ cover: value ?? null })
    home.value = updated
  } catch (e) { alert(e.message || '保存失败') }
}

async function onAddNotebook() {
  const name = window.prompt('笔记本名称')
  if (!name) return
  try {
    await apiNotebook.create({ name, parent_id: null })
    await load()
  } catch (e) { alert(e.message || '创建失败') }
}

async function onAddNote() {
  try {
    const { note } = await apiNote.create({ notebook_id: null })
    router.push({ name: 'note', params: { id: note.id } })
  } catch (e) { alert(e.message || '创建失败') }
}

async function onReorder(items) {
  try {
    await apiItems.reorder({ parent_id: null, items })
    // 拉一遍最新的 sort_order,保证状态一致
    await load()
  } catch (e) {
    alert(e.message || '排序失败')
    await load() // 失败也回到服务端真值,避免前端乱序
  }
}

onMounted(load)
</script>
