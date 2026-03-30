-- Tether Database Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  partner_id  UUID REFERENCES users(id),
  invite_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COUPLES ──────────────────────────────────────────────────────────────────
CREATE TABLE couples (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_one_id         UUID NOT NULL REFERENCES users(id),
  user_two_id         UUID NOT NULL REFERENCES users(id),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_step     INTEGER DEFAULT 1,  -- 1–5
  onboarding_phase    TEXT DEFAULT 'p1_answer', -- p1_answer | p2_answer | p1_react | p2_react
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ONBOARDING ANSWERS ───────────────────────────────────────────────────────
CREATE TABLE onboarding_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id       UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 5),
  answer_type     TEXT NOT NULL CHECK (answer_type IN ('base', 'reaction')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ENTRIES ──────────────────────────────────────────────────────────────────
CREATE TABLE entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id),
  couple_id           UUID NOT NULL REFERENCES couples(id),
  date                DATE NOT NULL,
  title               TEXT,
  location            TEXT,
  description         TEXT NOT NULL,
  mood                TEXT,
  entry_type          TEXT NOT NULL DEFAULT 'full' CHECK (entry_type IN ('full', 'quick_memo', 'little_thing')),
  is_lockbox          BOOLEAN DEFAULT FALSE,
  shared_little_thing BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMBINED STORIES ─────────────────────────────────────────────────────────
CREATE TABLE combined_stories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id    UUID NOT NULL REFERENCES couples(id),
  entry_date   DATE NOT NULL,
  ai_narrative TEXT NOT NULL,
  entry_one_id UUID REFERENCES entries(id),
  entry_two_id UUID REFERENCES entries(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (couple_id, entry_date)
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples            ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_stories   ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Read partner profile" ON users
  FOR SELECT USING (
    id IN (SELECT partner_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- couples
CREATE POLICY "Couple members can read" ON couples
  FOR SELECT USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- onboarding_answers
CREATE POLICY "Couple members can read answers" ON onboarding_answers
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()
    )
  );

CREATE POLICY "Insert own answers" ON onboarding_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- entries: own
CREATE POLICY "Read own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

-- entries: partner (non-lockbox, non-little-thing)
CREATE POLICY "Read partner shared entries" ON entries
  FOR SELECT USING (
    auth.uid() != user_id
    AND is_lockbox = false
    AND entry_type != 'little_thing'
    AND couple_id IN (
      SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()
    )
  );

-- entries: partner shared little things
CREATE POLICY "Read partner shared little things" ON entries
  FOR SELECT USING (
    auth.uid() != user_id
    AND entry_type = 'little_thing'
    AND shared_little_thing = true
    AND couple_id IN (
      SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()
    )
  );

CREATE POLICY "Insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);

-- combined_stories
CREATE POLICY "Couple members can read stories" ON combined_stories
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_one_id = auth.uid() OR user_two_id = auth.uid()
    )
  );
