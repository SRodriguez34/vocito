import { createClient } from '@supabase/supabase-js'

// Server-only: uses service role key for accurate count
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITS: Record<string, number> = {
  free: 5,
  familiar: Infinity,
  gift: Infinity,
}

export async function checkUsageLimit(
  userId: string,
  action: 'story_generated' | 'audio_synthesized'
): Promise<{ allowed: boolean; remaining: number }> {
  const monthYear = new Date().toISOString().slice(0, 7)

  const [{ count }, { data: sub }] = await Promise.all([
    adminClient
      .from('usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)
      .eq('month_year', monthYear),
    adminClient
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const tier = sub?.tier ?? 'free'
  const limit = LIMITS[tier] ?? 5
  const used = count ?? 0

  return { allowed: used < limit, remaining: Math.max(0, limit - used) }
}

export async function recordUsage(
  userId: string,
  action: 'story_generated' | 'audio_synthesized'
): Promise<void> {
  const monthYear = new Date().toISOString().slice(0, 7)
  await adminClient.from('usage_log').insert({ user_id: userId, action, month_year: monthYear })
}
