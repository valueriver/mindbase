import { insertEvent } from '../apps/home/repository.js'

/**
 * 给主页时间轴发一条事件。
 * 各应用的 service.js 在创建/状态跃迁/里程碑时调它。
 * 失败不抛(事件不影响主操作)。
 *
 * @param {D1Database} db
 * @param {{ app: string, action: string, ref_id?: string, summary: string, icon?: string }} ev
 */
export const emitHomeEvent = async (db, ev) => {
  try {
    await insertEvent(db, {
      id: crypto.randomUUID(),
      app: ev.app,
      action: ev.action,
      ref_id: ev.ref_id || null,
      summary: ev.summary,
      icon: ev.icon || null,
    })
  } catch (err) {
    console.error('[emitHomeEvent] failed:', err?.message)
  }
}
