-- One rating per device per novel.
CREATE TABLE IF NOT EXISTS ratings (
  novel TEXT NOT NULL,
  device TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (novel, device)
);
CREATE INDEX IF NOT EXISTS ratings_updated ON ratings (updated_at);

-- One reaction per device per target. chapter 0 is the novel itself (the "like" heart).
CREATE TABLE IF NOT EXISTS reactions (
  novel TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  device TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (novel, chapter, device)
);
CREATE INDEX IF NOT EXISTS reactions_created ON reactions (created_at);

-- Dedupe: a device counts once per chapter per day. Pruned daily by the cron trigger.
CREATE TABLE IF NOT EXISTS view_log (
  novel TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  device TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (novel, chapter, device, day)
);

-- PDF downloads: a device counts once per novel.
CREATE TABLE IF NOT EXISTS downloads (
  novel TEXT NOT NULL,
  device TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (novel, device)
);

CREATE TABLE IF NOT EXISTS views_daily (
  novel TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (novel, day)
);
