-- Vocito — Schema inicial
-- Usa gen_random_uuid() compatible con Supabase cloud

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Perfiles de voz (Fish Audio voice_id)
CREATE TABLE voice_profiles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  voice_id     TEXT NOT NULL,
  storage_path TEXT,
  language     TEXT DEFAULT 'es',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentos generados
CREATE TABLE stories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  age_target    INT,
  theme         TEXT,
  duration_min  INT DEFAULT 5,
  language      TEXT DEFAULT 'es-AR',
  ai_tier_used  INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Archivos de audio sintetizados
CREATE TABLE audio_files (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id         UUID REFERENCES stories(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES voice_profiles(id),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  duration_sec     INT,
  file_size_bytes  INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Suscripciones
CREATE TABLE subscriptions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier         TEXT DEFAULT 'free',
  status       TEXT DEFAULT 'active',
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Control de uso mensual (free tier enforcement)
CREATE TABLE usage_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_stories_user ON stories(user_id, created_at DESC);
CREATE INDEX idx_audio_files_story ON audio_files(story_id);
CREATE INDEX idx_voice_profiles_user ON voice_profiles(user_id) WHERE is_active = true;
CREATE INDEX idx_usage_log_user_month ON usage_log(user_id, month_year, action);
