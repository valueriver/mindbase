-- Music:收藏的曲目。url 可指向 Spotify / YouTube / 网易云 等。
CREATE TABLE app_music_tracks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  artist      TEXT NOT NULL DEFAULT '',
  url         TEXT,
  cover       TEXT,
  note        TEXT NOT NULL DEFAULT '',
  rating      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_music_tracks_created ON app_music_tracks(created_at DESC);
