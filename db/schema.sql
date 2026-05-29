-- TripSync schema — run once via: npm run db:init
-- Tables prefixed with ts_ to avoid collision with ludoryn

CREATE TABLE IF NOT EXISTS ts_groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  owner_id    TEXT NOT NULL,
  phase       TEXT DEFAULT 'lobby'
              CHECK (phase IN ('lobby','game','results','vote','winner')),
  winner_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ts_members (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id       UUID REFERENCES ts_groups(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  avatar_color   TEXT NOT NULL DEFAULT '#c14a1f',
  questions_done INTEGER DEFAULT 0,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS ts_answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID REFERENCES ts_groups(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,
  UNIQUE(group_id, user_id, question_id)
);

CREATE TABLE IF NOT EXISTS ts_votes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id       UUID REFERENCES ts_groups(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  rank           INTEGER NOT NULL CHECK (rank IN (1,2,3)),
  UNIQUE(group_id, user_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_ts_members_group ON ts_members(group_id);
CREATE INDEX IF NOT EXISTS idx_ts_answers_group ON ts_answers(group_id);
CREATE INDEX IF NOT EXISTS idx_ts_votes_group   ON ts_votes(group_id);
