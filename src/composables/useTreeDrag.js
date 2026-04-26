import { reactive } from 'vue'

/**
 * 全局拖动状态:ItemList 在 dragstart 时写、dragend 时清。
 * Breadcrumb 的 drop target 读这个 state 来判断是否高亮 + 处理放下。
 *
 * 不依赖 SortableJS 跨容器,纯 module-level singleton + native HTML5 events,
 * 实现最简单且不跟 vuedraggable 内部状态打架。
 */
export const dragState = reactive({
  active: false,
  kind: null, // 'note' | 'notebook'
  id: null,
  /**
   * 当前拖动元素所在的 parent。Breadcrumb drop target 用来判断
   * "拖到当前所在父级是 noop"(不发请求)。
   * - 在 Notebook 视图里被拖出去的子项,parent 就是当前 notebook id
   * - 在首页(根)被拖出去的子项,parent 是 null
   */
  parentId: null,
})

export const beginDrag = ({ kind, id, parentId }) => {
  dragState.active = true
  dragState.kind = kind
  dragState.id = id
  dragState.parentId = parentId ?? null
}

export const endDrag = () => {
  dragState.active = false
  dragState.kind = null
  dragState.id = null
  dragState.parentId = null
}
