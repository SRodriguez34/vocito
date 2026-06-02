import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { synthesize } from '@/lib/fish-audio'
import { checkUsageLimit, recordUsage } from '@/lib/usage-guard'
import { logger } from '@/lib/logger'

function getAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { storyId, voiceProfileId } = await req.json() as {
      storyId: string
      voiceProfileId: string
    }

    if (!storyId || !voiceProfileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Auth from server session — never trust client-provided userId
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const userId = user.id
    const admin = getAdmin()

    // Free tier check
    const { allowed, remaining } = await checkUsageLimit(userId, 'audio_synthesized')
    if (!allowed) {
      return NextResponse.json({ error: 'Limite de audio mensual alcanzado', remaining: 0 }, { status: 403 })
    }

    // Fetch story + voice profile via admin (no RLS issues)
    const [{ data: story, error: storyErr }, { data: profile, error: profileErr }] =
      await Promise.all([
        admin.from('stories').select('content, title').eq('id', storyId).single(),
        admin.from('voice_profiles').select('voice_id').eq('id', voiceProfileId).single(),
      ])

    if (storyErr || !story) {
      logger.error('audio/synthesize: story not found', { storyId, error: storyErr?.message })
      return NextResponse.json({ error: 'Cuento no encontrado' }, { status: 404 })
    }
    if (profileErr || !profile) {
      logger.error('audio/synthesize: profile not found', { voiceProfileId, error: profileErr?.message })
      return NextResponse.json({ error: 'Perfil de voz no encontrado' }, { status: 404 })
    }

    // Synthesize with Fish Audio
    logger.info('audio/synthesize: calling Fish Audio TTS', { storyId, voiceProfileId, voiceId: profile.voice_id })
    const mp3Buffer = await synthesize(story.content, profile.voice_id)

    // Upload to Supabase Storage
    const outputPath = `audio/${userId}/${crypto.randomUUID()}.mp3`
    const { error: uploadErr } = await admin.storage
      .from('vocito')
      .upload(outputPath, mp3Buffer, { contentType: 'audio/mpeg' })

    if (uploadErr) {
      logger.error('audio/synthesize: storage upload failed', { error: uploadErr.message })
      return NextResponse.json({ error: `Storage error: ${uploadErr.message}` }, { status: 500 })
    }

    // Signed URL — 24h
    const { data: signedData, error: signErr } = await admin.storage
      .from('vocito')
      .createSignedUrl(outputPath, 86400)

    if (signErr || !signedData) {
      return NextResponse.json({ error: `Signed URL error: ${signErr?.message}` }, { status: 500 })
    }

    // Register in audio_files
    const { data: audioFile, error: dbErr } = await admin
      .from('audio_files')
      .insert({ story_id: storyId, voice_profile_id: voiceProfileId, user_id: userId, storage_path: outputPath })
      .select('id')
      .single()

    if (dbErr) {
      logger.error('audio/synthesize: DB insert failed', { error: dbErr.message })
      return NextResponse.json({ error: `DB error: ${dbErr.message}` }, { status: 500 })
    }

    await recordUsage(userId, 'audio_synthesized')

    logger.info('audio/synthesize: success', { audioFileId: audioFile.id })
    return NextResponse.json({
      audio_url: signedData.signedUrl,
      audio_file_id: audioFile.id,
      storage_path: outputPath,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('audio/synthesize: unexpected error', { error: msg })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
