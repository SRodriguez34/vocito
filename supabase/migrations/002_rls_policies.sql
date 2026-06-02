-- Vocito — RLS Policies

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven y modifican sus propios datos
CREATE POLICY "own_voice_profiles" ON voice_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_stories" ON stories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_audio_files" ON audio_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_subscription" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_usage" ON usage_log
  FOR ALL USING (auth.uid() = user_id);
