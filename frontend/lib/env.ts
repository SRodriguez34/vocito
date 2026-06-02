// Validated env vars — app fails to start if required vars are missing
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const env = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  fishAudioApiKey: requireEnv('FISH_AUDIO_API_KEY'),
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  groqApiKey: process.env.GROQ_API_KEY ?? '',
} as const
