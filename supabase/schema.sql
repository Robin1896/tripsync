-- TripSync database schema
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS groups (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  owner_id   TEXT NOT NULL,
  phase      TEXT DEFAULT 'lobby'
             CHECK (phase IN ('lobby','game','results','vote','winner')),
  winner_id  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id       UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  avatar_color   TEXT NOT NULL DEFAULT '#c14a1f',
  questions_done INTEGER DEFAULT 0,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,
  UNIQUE(group_id, user_id, question_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id       UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  rank           INTEGER NOT NULL CHECK (rank IN (1,2,3)),
  UNIQUE(group_id, user_id, rank)
);

-- Row Level Security (open for MVP — anon users can read/write)
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON groups        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON answers       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON votes         FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
