<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">待办</h1>

      <!-- 新建顶层 -->
      <form class="mt-6 flex items-center gap-2 rounded-md border border-nt-divider bg-white px-3 py-2" @submit.prevent="onAdd()">
        <span class="text-nt-soft">＋</span>
        <input
          v-model="newTitle"
          type="text"
          placeholder="添加一个任务,回车保存"
          :disabled="busy"
          class="flex-1 bg-transparent text-[15px] text-nt outline-none placeholder:text-nt-hint"
        />
      </form>

      <div v-if="loading" class="mt-8 py-6 text-sm text-nt-soft">加载中…</div>
      <div v-else-if="error" class="mt-8 py-6 text-sm text-nt-danger">{{ error }}</div>
      <div v-else-if="!topLevel.length" class="mt-12 py-8 text-center text-sm text-nt-soft">还没有任务,从上面写一条吧 ✨</div>

      <ul v-else class="mt-6 divide-y divide-nt-divider rounded-md border border-nt-divider bg-white">
        <li v-for="t in topLevel" :key="t.id" class="px-2 py-2 md:px-3">
          <TodoRow
            :todo="t"
            :is-child="false"
            :menu-open-id="menuOpenId"
            @toggle="onToggle"
            @edit-save="onSaveTitle"
            @menu="openMenu"
          />
          <ul v-if="childrenOf(t.id).length" class="ml-7 mt-1 space-y-0.5">
            <li v-for="c in childrenOf(t.id)" :key="c.id">
              <TodoRow
                :todo="c"
                :is-child="true"
                :menu-open-id="menuOpenId"
                @toggle="onToggle"
                @edit-save="onSaveTitle"
                @menu="openMenu"
              />
            </li>
          </ul>

          <!-- 添加子任务输入 -->
          <form
            v-if="childInputFor === t.id"
            class="ml-7 mt-1 flex items-center gap-2 rounded px-2 py-1"
            @submit.prevent="onAddChild(t.id)"
          >
            <span class="text-nt-soft">＋</span>
            <input
              :ref="el => bindChildInput(t.id, el)"
              v-model="childTitle"
              type="text"
              placeholder="子任务,回车保存,Esc 取消"
              class="flex-1 bg-transparent text-[14px] text-nt outline-none placeholder:text-nt-hint"
              @keydown.esc.prevent="cancelChildInput"
              @blur="cancelChildInput"
            />
          </form>
        </li>
      </ul>
    </main>

    <Popover :open="!!menuOpenId" :anchor="menuAnchor" :width="160" @close="closeMenu">
      <button
        v-if="menuCanAddChild"
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
        @click="onMenuAddChild"
      ><span>＋</span> 添加子任务</button>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt-muted hover:bg-nt-hover hover:text-nt-danger"
        @click="onMenuDelete"
      ><span>🗑️</span> 删除</button>
    </Popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, h } from 'vue'
import Popover from '@/components/Popover.vue'
import { apiTodos } from '@/api/client'

// 内联子组件:一行 todo
const TodoRow = (props, { emit }) => {
  const t = props.todo
  return h('div', {
    class: [
      'group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-nt-hover',
      t.done ? 'text-nt-soft' : '',
    ],
  }, [
    // 复选框
    h('button', {
      type: 'button',
      class: [
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
        t.done
          ? 'border-nt bg-nt text-white'
          : 'border-nt-divider hover:border-nt-muted',
      ],
      onClick: () => emit('toggle', t),
    }, t.done ? '✓' : ''),

    // 标题(双击可编辑)
    h('input', {
      type: 'text',
      value: t.title,
      'data-id': t.id,
      class: [
        'flex-1 min-w-0 bg-transparent text-[15px] outline-none',
        t.done ? 'line-through text-nt-soft' : 'text-nt',
      ],
      onChange: (e) => emit('edit-save', t, e.target.value),
      onKeydown: (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur() }
        if (e.key === 'Escape') { e.target.value = t.title; e.target.blur() }
      },
    }),

    // ⋯
    h('button', {
      type: 'button',
      class: 'flex h-6 w-6 shrink-0 items-center justify-center rounded text-nt-soft hover:bg-nt-hover-strong hover:text-nt',
      title: '更多',
      onClick: (e) => emit('menu', t, props.isChild, e),
    }, [
      h('span', { class: 'text-base leading-none' }, '⋯'),
    ]),
  ])
}
TodoRow.props = ['todo', 'isChild', 'menuOpenId']
TodoRow.emits = ['toggle', 'edit-save', 'menu']

// === 数据 ===
const todos    = ref([])
const loading  = ref(true)
const error    = ref('')

async function load() {
  loading.value = true
  try {
    const { todos: list } = await apiTodos.list()
    todos.value = list
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const topLevel = computed(() =>
  todos.value
    .filter(t => !t.parent_id)
    .sort((a, b) => (a.done - b.done) || a.sort_order - b.sort_order)
)
function childrenOf(parentId) {
  return todos.value
    .filter(t => t.parent_id === parentId)
    .sort((a, b) => (a.done - b.done) || a.sort_order - b.sort_order)
}

// === 新建顶层 ===
const newTitle = ref('')
const busy     = ref(false)

async function onAdd() {
  const title = newTitle.value.trim()
  if (!title || busy.value) return
  busy.value = true
  try {
    const { todo } = await apiTodos.create({ title })
    todos.value.push(todo)
    newTitle.value = ''
  } catch (e) {
    alert(e?.message || '创建失败')
  } finally {
    busy.value = false
  }
}

// === 新建子任务 ===
const childInputFor = ref('')
const childTitle    = ref('')
let childInputEl = null

function bindChildInput(_id, el) {
  if (el) {
    childInputEl = el
    nextTick(() => el?.focus())
  }
}
function openChildInput(parentId) {
  childInputFor.value = parentId
  childTitle.value = ''
}
function cancelChildInput() {
  // 给保存留时间(blur 也会触发)
  setTimeout(() => {
    if (!childTitle.value.trim()) {
      childInputFor.value = ''
      childTitle.value = ''
    }
  }, 50)
}
async function onAddChild(parentId) {
  const title = childTitle.value.trim()
  if (!title) { childInputFor.value = ''; return }
  try {
    const { todo } = await apiTodos.create({ title, parent_id: parentId })
    todos.value.push(todo)
    childTitle.value = ''
    childInputFor.value = ''
  } catch (e) {
    alert(e?.message || '创建失败')
  }
}

// === 完成切换 ===
async function onToggle(t) {
  const next = !t.done
  // 乐观更新
  t.done = next
  try {
    const { todo } = await apiTodos.update(t.id, { done: next })
    const i = todos.value.findIndex(x => x.id === t.id)
    if (i >= 0) todos.value[i] = todo
  } catch (e) {
    t.done = !next
    alert(e?.message || '更新失败')
  }
}

// === 标题编辑 ===
async function onSaveTitle(t, newVal) {
  const title = String(newVal || '').trim()
  if (!title || title === t.title) return
  try {
    const { todo } = await apiTodos.update(t.id, { title })
    const i = todos.value.findIndex(x => x.id === t.id)
    if (i >= 0) todos.value[i] = todo
  } catch (e) {
    alert(e?.message || '更新失败')
  }
}

// === ⋯ 菜单 ===
const menuOpenId   = ref('')
const menuAnchor   = ref(null)
const menuCanAddChild = ref(false)

function openMenu(t, isChild, evt) {
  menuOpenId.value = t.id
  menuAnchor.value = evt.currentTarget
  menuCanAddChild.value = !isChild  // 子任务不能再加子任务
}
function closeMenu() {
  menuOpenId.value = ''
  menuAnchor.value = null
}
function onMenuAddChild() {
  const id = menuOpenId.value
  closeMenu()
  openChildInput(id)
}
async function onMenuDelete() {
  const id = menuOpenId.value
  closeMenu()
  const t = todos.value.find(x => x.id === id)
  if (!t) return
  if (!window.confirm(t.parent_id ? '删除这个子任务?' : '删除这个任务及其全部子任务?')) return
  try {
    await apiTodos.remove(id)
    todos.value = todos.value.filter(x => x.id !== id && x.parent_id !== id)
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

onMounted(load)
</script>
