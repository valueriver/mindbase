// Music 仓储:单表 app_music_tracks 的 CRUD。
const COLS = `id, title, artist, url, cover, note, rating, created_at, updated_at`

export const listTracks = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_music_tracks
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findTrackById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_music_tracks WHERE id = ?1`).bind(id).first()

export const insertTrack = async (db, { id, title, artist = '', url = null, cover = null, note = '', rating = 0 }) => {
  await db.prepare(
    `INSERT INTO app_music_tracks (id, title, artist, url, cover, note, rating, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, title, artist, url, cover, note, rating).run()
  return findTrackById(db, id)
}

export const updateTrack = async (db, id, { title, artist, url, cover, note, rating }) => {
  await db.prepare(
    `UPDATE app_music_tracks
        SET title      = COALESCE(?2, title),
            artist     = COALESCE(?3, artist),
            url        = CASE WHEN ?4 IS NULL THEN url ELSE ?4 END,
            cover      = CASE WHEN ?5 IS NULL THEN cover ELSE ?5 END,
            note       = COALESCE(?6, note),
            rating     = COALESCE(?7, rating),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, artist ?? null, url ?? null, cover ?? null, note ?? null, rating ?? null).run()
  return findTrackById(db, id)
}

export const deleteTrack = (db, id) =>
  db.prepare(`DELETE FROM app_music_tracks WHERE id = ?1`).bind(id).run()
