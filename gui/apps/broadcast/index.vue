<template>
  <div>
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">

      <!-- 列表视图 -->
      <template v-if="view === 'list'">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">广播</h1>
            <p class="mt-1 text-sm text-nt-soft">把内容同步发到各个平台,逐一打卡。</p>
          </div>
          <button
            type="button"
            class="text-sm text-nt-soft hover:text-nt px-2 py-1 rounded hover:bg-nt-hover"
            @click="view = 'platforms'"
          >管理平台</button>
        </div>

        <button
          type="button"
          class="mt-6 w-full flex items-center gap-2 rounded-md border border-dashed border-nt-divider px-4 py-3 text-sm text-nt-soft hover:border-nt-muted hover:text-nt transition"
          @click="openPostForm(null)"
        >
          <span class="text-lg leading-none">＋</span>
          <span>新建广播</span>
        </button>

        <div v-if="loading" class="mt-8 py-6 text-sm text-nt-soft">加载中…</div>
        <div v-else-if="error" class="mt-8 py-6 text-sm text-nt-danger">{{ error }}</div>
        <div v-else-if="!posts.length" class="mt-12 py-8 text-center text-sm text-nt-soft">还没有内容,点上面新建一条吧 📡</div>

        <ul v-else class="mt-4 divide-y divide-nt-divider rounded-md border border-nt-divider bg-white">
          <li
            v-for="p in posts"
            :key="p.id"
            class="group flex items-center gap-3 px-4 py-3 hover:bg-nt-hover cursor-pointer"
            @click="openDetail(p)"
          >
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-nt font-medium truncate">{{ p.title }}</div>
              <div v-if="p.note" class="mt-0.5 text-xs text-nt-soft truncate">{{ p.note }}</div>
            </div>
            <div class="shrink-0 text-xs text-nt-soft">
              {{ publishSummary(p.id) }}
            </div>
            <div class="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                type="button"
                class="p-1 rounded text-nt-soft hover:text-nt hover:bg-nt-hover-strong"
                title="编辑"
                @click.stop="openPostForm(p)"
              >✎</button>
              <button
                type="button"
                class="p-1 rounded text-nt-soft hover:text-nt-danger hover:bg-nt-hover-strong"
                title="删除"
                @click.stop="onDeletePost(p)"
              >✕</button>
            </div>
          </li>
        </ul>
      </template>

      <!-- 详情视图 -->
      <template v-else-if="view === 'detail' && currentPost">
        <div class="flex items-center gap-3 mb-6">
          <button
            type="button"
            class="text-sm text-nt-soft hover:text-nt"
            @click="view = 'list'"
          >← 返回</button>
          <h1 class="text-xl font-bold text-nt truncate">{{ currentPost.title }}</h1>
        </div>

        <div v-if="currentPost.note" class="mb-4 text-sm text-nt-soft">{{ currentPost.note }}</div>

        <div v-if="detailLoading" class="py-6 text-sm text-nt-soft">加载中…</div>
        <div v-else-if="!platforms.length" class="py-8 text-center text-sm text-nt-soft">
          还没有平台，先去
          <button type="button" class="underline" @click="view = 'platforms'">管理平台</button>
          添加几个吧
        </div>
        <ul v-else class="divide-y divide-nt-divider rounded-md border border-nt-divider bg-white">
          <li
            v-for="plat in platforms"
            :key="plat.id"
            class="flex items-center gap-4 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-nt font-medium">{{ plat.name }}</div>
              <div v-if="platStatus(plat.id)?.pub_url" class="mt-0.5 text-xs text-nt-soft truncate">
                <a :href="platStatus(plat.id).pub_url" target="_blank" class="underline hover:text-nt">{{ platStatus(plat.id).pub_url }}</a>
              </div>
            </div>

            <!-- pub_url 输入（已发布时显示） -->
            <input
              v-if="platStatus(plat.id)?.status === 'published'"
              type="text"
              placeholder="发布链接（可选）"
              :value="platStatus(plat.id)?.pub_url || ''"
              class="hidden md:block w-48 text-xs border border-nt-divider rounded px-2 py-1 text-nt outline-none focus:border-nt-muted"
              @change="onSetPubUrl(plat.id, $event.target.value)"
            />

            <!-- 状态切换 -->
            <button
              type="button"
              :class="[
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition',
                platStatus(plat.id)?.status === 'published'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-nt-hover text-nt-soft hover:bg-nt-hover-strong hover:text-nt',
              ]"
              @click="onToggleStatus(plat.id)"
            >
              {{ platStatus(plat.id)?.status === 'published' ? '已发布' : '未发布' }}
            </button>
          </li>
        </ul>
      </template>

      <!-- 平台管理视图 -->
      <template v-else-if="view === 'platforms'">
        <div class="flex items-center gap-3 mb-6">
          <button
            type="button"
            class="text-sm text-nt-soft hover:text-nt"
            @click="view = 'list'"
          >← 返回</button>
          <h1 class="text-xl font-bold text-nt">管理平台</h1>
        </div>

        <form class="flex gap-2 mb-4" @submit.prevent="onAddPlatform">
          <input
            v-model="newPlatName"
            type="text"
            placeholder="平台名称，如 v2ex"
            class="flex-1 rounded-md border border-nt-divider px-3 py-2 text-sm text-nt outline-none focus:border-nt-muted"
          />
          <input
            v-model="newPlatUrl"
            type="text"
            placeholder="主页链接（可选）"
            class="w-48 rounded-md border border-nt-divider px-3 py-2 text-sm text-nt outline-none focus:border-nt-muted"
          />
          <button
            type="submit"
            class="px-4 py-2 rounded-md bg-nt text-white text-sm hover:bg-nt/90 transition"
          >添加</button>
        </form>

        <div v-if="!platforms.length" class="py-8 text-center text-sm text-nt-soft">还没有平台，从上面添加一个吧</div>

        <ul v-else class="divide-y divide-nt-divider rounded-md border border-nt-divider bg-white">
          <li v-for="p in platforms" :key="p.id" class="group flex items-center gap-3 px-4 py-3">
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-nt font-medium">{{ p.name }}</div>
              <div v-if="p.url" class="text-xs text-nt-soft truncate">{{ p.url }}</div>
            </div>
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 p-1 rounded text-nt-soft hover:text-nt-danger hover:bg-nt-hover-strong transition"
              @click="onDeletePlatform(p)"
            >✕</button>
          </li>
        </ul>
      </template>
    </main>

    <!-- 新建/编辑帖子弹窗 -->
    <div
      v-if="postForm.open"
      class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      @click.self="postForm.open = false"
    >
      <div class="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-xl">
        <h2 class="text-lg font-bold text-nt mb-4">{{ postForm.id ? '编辑广播' : '新建广播' }}</h2>
        <div class="flex flex-col gap-3">
          <input
            v-model="postForm.title"
            type="text"
            placeholder="标题，如 MindBase 介绍稿"
            class="w-full rounded-md border border-nt-divider px-3 py-2 text-sm text-nt outline-none focus:border-nt-muted"
            autofocus
          />
          <textarea
            v-model="postForm.note"
            placeholder="备注（可选）"
            rows="2"
            class="w-full rounded-md border border-nt-divider px-3 py-2 text-sm text-nt outline-none focus:border-nt-muted resize-none"
          />
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm text-nt-soft hover:text-nt"
            @click="postForm.open = false"
          >取消</button>
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-nt text-white text-sm hover:bg-nt/90 transition"
            :disabled="postForm.busy"
            @click="onSavePost"
          >保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'

// ---------- state ----------

const view        = ref('list')
const posts       = ref([])
const platforms   = ref([])
const statuses    = ref([])   // statuses for currentPost
const loading     = ref(true)
const detailLoading = ref(false)
const error       = ref('')
const currentPost = ref(null)

const postForm = ref({ open: false, id: null, title: '', note: '', busy: false })
const newPlatName = ref('')
const newPlatUrl  = ref('')

// ---------- api helpers ----------

const bcApi = {
  listPosts:       ()               => api.get('/api/broadcast'),
  createPost:      (body)           => api.post('/api/broadcast', body),
  updatePost:      (id, body)       => api.patch(`/api/broadcast/${id}`, body),
  deletePost:      (id)             => api.delete(`/api/broadcast/${id}`),
  listPlatforms:   ()               => api.get('/api/broadcast/platforms'),
  createPlatform:  (body)           => api.post('/api/broadcast/platforms', body),
  deletePlatform:  (id)             => api.delete(`/api/broadcast/platforms/${id}`),
  listStatuses:    (postId)         => api.get(`/api/broadcast/${postId}/statuses`),
  setStatus:       (postId, platId, body) => api.put(`/api/broadcast/${postId}/statuses/${platId}`, body),
}

// ---------- computed ----------

const statusMap = computed(() => {
  const m = {}
  for (const s of statuses.value) m[s.platform_id] = s
  return m
})

const publishSummary = (postId) => {
  // count from all loaded statuses — only meaningful after opening detail
  // In list view we show a dot indicator per-post based on cached statuses
  const pub = statuses.value.filter(s => s.post_id === postId && s.status === 'published').length
  const total = platforms.value.length
  if (!total) return ''
  return `${pub} / ${total}`
}

const platStatus = (platId) => statusMap.value[platId] || null

// ---------- loaders ----------

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const [postsRes, platsRes] = await Promise.all([bcApi.listPosts(), bcApi.listPlatforms()])
    posts.value     = postsRes.posts     || []
    platforms.value = platsRes.platforms || []
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadStatuses(postId) {
  detailLoading.value = true
  try {
    const { statuses: list } = await bcApi.listStatuses(postId)
    statuses.value = list || []
  } catch (e) {
    // ignore
  } finally {
    detailLoading.value = false
  }
}

// ---------- posts ----------

function openPostForm(post) {
  postForm.value = {
    open:  true,
    id:    post?.id    || null,
    title: post?.title || '',
    note:  post?.note  || '',
    busy:  false,
  }
}

async function onSavePost() {
  const title = postForm.value.title.trim()
  if (!title) return
  postForm.value.busy = true
  try {
    if (postForm.value.id) {
      const { post } = await bcApi.updatePost(postForm.value.id, { title, note: postForm.value.note.trim() })
      const i = posts.value.findIndex(p => p.id === post.id)
      if (i >= 0) posts.value[i] = post
    } else {
      const { post } = await bcApi.createPost({ title, note: postForm.value.note.trim() })
      posts.value.unshift(post)
    }
    postForm.value.open = false
  } catch (e) {
    alert(e?.message || '保存失败')
  } finally {
    postForm.value.busy = false
  }
}

async function onDeletePost(post) {
  if (!window.confirm(`删除「${post.title}」?`)) return
  try {
    await bcApi.deletePost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

// ---------- detail ----------

async function openDetail(post) {
  currentPost.value = post
  statuses.value    = []
  view.value        = 'detail'
  await loadStatuses(post.id)
}

async function onToggleStatus(platId) {
  const current = platStatus(platId)
  const next    = current?.status === 'published' ? 'pending' : 'published'
  const pubUrl  = current?.pub_url || ''
  try {
    const { status } = await bcApi.setStatus(currentPost.value.id, platId, { status: next, pub_url: pubUrl })
    const i = statuses.value.findIndex(s => s.platform_id === platId)
    if (i >= 0) statuses.value[i] = status
    else statuses.value.push(status)
  } catch (e) {
    alert(e?.message || '更新失败')
  }
}

async function onSetPubUrl(platId, url) {
  const current = platStatus(platId)
  if (!current) return
  try {
    const { status } = await bcApi.setStatus(currentPost.value.id, platId, { status: current.status, pub_url: url.trim() })
    const i = statuses.value.findIndex(s => s.platform_id === platId)
    if (i >= 0) statuses.value[i] = status
  } catch (e) {
    // ignore url save error
  }
}

// ---------- platforms ----------

async function onAddPlatform() {
  const name = newPlatName.value.trim()
  if (!name) return
  try {
    const { platform } = await bcApi.createPlatform({ name, url: newPlatUrl.value.trim() })
    platforms.value.push(platform)
    newPlatName.value = ''
    newPlatUrl.value  = ''
  } catch (e) {
    alert(e?.message || '创建失败')
  }
}

async function onDeletePlatform(plat) {
  if (!window.confirm(`删除平台「${plat.name}」?`)) return
  try {
    await bcApi.deletePlatform(plat.id)
    platforms.value = platforms.value.filter(p => p.id !== plat.id)
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

onMounted(load)
</script>
