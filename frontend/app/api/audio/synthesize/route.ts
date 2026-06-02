import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { synthesize } from '@/lib/fish-audio'
import { checkUsageLimit, recordUsage } from '@/lib/usage-guard'
import { logger } from '@/lib/logger'

// Service role client for storage upload (bypasses RLS on upload path)
function getAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { storyId, voiceProfileId, userId } = await req.json() as {
      storyId: string
      voiceProfileId: string
      userId: string
    }

    if (!storyId || !voiceProfileId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Free tier check
    const { allowed, remaining } = await checkUsageLimit(userId, 'audio_synthesized')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite de audio mensual alcanzado', remaining: 0 },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Fetch story content and voice_id in parallel
    const [{ data: story, error: storyErr }, { data: profile, error: profileErr }] =
      await Promise.all([
        supabase.from('stories').select('content, title').eq('id', storyId).single(),
        supabase.from('voice_profiles').select('voice_id').eq('id', voiceProfileId).single(),
      ])

    if (storyErr || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Voice profile not found' }, { status: 404 })
    }

    // Synthesize with Fish Audio
    logger.info('audio/synthesize: calling Fish Audio TTS', { storyId, voiceProfileId })
    const mp3Buffer = await synthesize(story.content, profile.voice_id)

    // Upload to Supabase Storage
    const admin = getAdmin()
    const outputPath = `audio/${userId}/${crypto.randomUUID()}.mp3`
    const { error: uploadErr } = await admin.storage
      .from('vocito')
      .upload(outputPath, mp3Buffer, { contentType: 'audio/mpeg' })

    if (uploadErr) {
      logger.error('audio/synthesize: storage upload failed', { error: uploadErr.message })
      return NextResponse.json({ error: 'Storage error' }, { status: 500 })
    }

    // Signed URL — 24h
    const { data: signedData, error: signErr } = await admin.storage
      .from('vocito')
      .createSignedUrl(outputPath, 86400)

    if (signErr || !signedData) {
      return NextResponse.json({ error: 'Could not create signed URL' }, { status: 500 })
    }

    // Register in audio_files
    const { data: audioFile, error: dbErr } = await supabase
      .from('audio_files')
      .insert({
        story_id: storyId,
        voice_profile_id: voiceProfileId,
        user_id: userId,
        storage_path: outputPath,
      })
      .select('id')
      .single()

    if (dbErr) {
      logger.error('audio/synthesize: DB insert failed', { error: dbErr.message })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Record usage
    await recordUsage(userId, 'audio_synthesized')

    logger.info('audio/synthesize: success', { audioFileId: audioFile.id, remaining: remaining - 1 })
    return NextResponse.json({
      audio_url: signedData.signedUrl,
      audio_file_id: audioFile.id,
      storage_path: outputPath,
    })
  } catch (err) {
    logger.error('audio/synthesize: unexpected error', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
