import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateStory, StoryParams } from '@/lib/ai-provider'
import { checkUsageLimit, recordUsage } from '@/lib/usage-guard'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string
      childName?: string
      parentName?: string
      ageTarget: number
      theme: string
      durationMin: number
    }

    const { userId, childName, parentName, ageTarget, theme, durationMin } = body

    if (!userId || !ageTarget || !theme || !durationMin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Free tier check
    const { allowed, remaining } = await checkUsageLimit(userId, 'story_generated')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite mensual alcanzado', remaining: 0 },
        { status: 403 }
      )
    }

    const params: StoryParams = { childName, parentName, ageTarget, theme, durationMin }

    logger.info('story-gen: generating', { userId, theme, ageTarget, durationMin })
    const { content, tierUsed } = await generateStory(params)

    // Title from theme + child name
    const title = childName
      ? `El cuento de ${childName} — ${theme}`
      : `Cuento de ${theme}`

    // Save to DB
    const supabase = await createClient()
    const { data, error: dbError } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        title,
        content,
        age_target: ageTarget,
        theme,
        duration_min: durationMin,
        language: 'es-AR',
        ai_tier_used: tierUsed,
      })
      .select('id')
      .single()

    if (dbError) {
      logger.error('story-gen: DB insert failed', { error: dbError.message })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Record usage
    await recordUsage(userId, 'story_generated')

    logger.info('story-gen: success', { storyId: data.id, tierUsed, remaining: remaining - 1 })
    return NextResponse.json({
      story_id: data.id,
      title,
      content,
      tier_used: tierUsed,
      remaining: remaining - 1,
    })
  } catch (err) {
    logger.error('story-gen: unexpected error', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
