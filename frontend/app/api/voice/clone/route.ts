import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cloneVoice } from '@/lib/fish-audio'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audioBlob = form.get('audio') as Blob | null
    const name = form.get('name') as string | null
    const userId = form.get('userId') as string | null

    if (!audioBlob || !name || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Upload raw audio to Supabase Storage (backup)
    const storagePath = `raw_voice/${userId}/${crypto.randomUUID()}.wav`
    const { error: uploadError } = await supabase.storage
      .from('vocito')
      .upload(storagePath, audioBlob, { contentType: 'audio/wav' })

    if (uploadError) {
      logger.warn('voice/clone: storage upload failed', { error: uploadError.message })
      // Non-fatal — continue with cloning
    }

    // 2. Clone with Fish Audio
    logger.info('voice/clone: cloning with Fish Audio', { userId, name })
    const voiceId = await cloneVoice(audioBlob, name)

    // 3. Save to DB
    const { data, error: dbError } = await supabase
      .from('voice_profiles')
      .insert({
        user_id: userId,
        name,
        voice_id: voiceId,
        storage_path: storagePath,
      })
      .select('id')
      .single()

    if (dbError) {
      logger.error('voice/clone: DB insert failed', { error: dbError.message })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    logger.info('voice/clone: success', { voiceProfileId: data.id, voiceId })
    return NextResponse.json({ voice_profile_id: data.id, voice_id: voiceId })
  } catch (err) {
    logger.error('voice/clone: unexpected error', { error: String(err) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
