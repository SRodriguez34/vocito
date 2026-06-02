import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { cloneVoice } from '@/lib/fish-audio'
import { logger } from '@/lib/logger'

function getAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audioBlob = form.get('audio') as Blob | null
    const name = (form.get('name') as string | null) ?? 'Mi voz'

    if (!audioBlob || audioBlob.size === 0) {
      return NextResponse.json({ error: 'Audio vacio o faltante' }, { status: 400 })
    }

    // Get authenticated user from server session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = user.id
    const admin = getAdmin()

    // 1. Upload raw audio backup (non-fatal)
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
    const storagePath = `raw_voice/${userId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await admin.storage
      .from('vocito')
      .upload(storagePath, audioBlob, { contentType: audioBlob.type })

    if (uploadError) {
      logger.warn('voice/clone: storage upload failed', { error: uploadError.message })
    }

    // 2. Clone with Fish Audio
    logger.info('voice/clone: calling Fish Audio', { userId, name, size: audioBlob.size, type: audioBlob.type })
    const voiceId = await cloneVoice(audioBlob, name)

    // 3. Save to DB via admin (bypasses RLS — user identity already verified above)
    const { data, error: dbError } = await admin
      .from('voice_profiles')
      .insert({ user_id: userId, name, voice_id: voiceId, storage_path: storagePath })
      .select('id')
      .single()

    if (dbError) {
      logger.error('voice/clone: DB insert failed', { error: dbError.message, code: dbError.code })
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 })
    }

    logger.info('voice/clone: success', { voiceProfileId: data.id, voiceId })
    return NextResponse.json({ voice_profile_id: data.id, voice_id: voiceId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('voice/clone: unexpected error', { error: msg })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
