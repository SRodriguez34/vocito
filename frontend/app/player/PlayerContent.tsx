'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { StoryPlayer } from '@/components/story/StoryPlayer'
import { VoiceProfileCard } from '@/components/voice/VoiceProfileCard'
import { createClient } from '@/lib/supabase'

const SYNTHESIS_MESSAGES = [
  'Tu voz esta despertando...',
  'El cuento esta tomando forma...',
  'Las palabras ya tienen tu voz...',
  'Casi listo, tu cuento te espera...',
]

interface Story {
  id: string
  title: string
  duration_min: number
}

interface VoiceProfile {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

interface AudioResult {
  audioUrl: string
  audioFileId: string
  storagePath: string
}

type PageState = 'loading' | 'select-voice' | 'synthesizing' | 'playing' | 'error'

export function PlayerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storyId = searchParams.get('storyId')

  const [userId, setUserId] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<string>('free')
  const [story, setStory] = useState<Story | null>(null)
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [msgIdx, setMsgIdx] = useState(0)
  const [audio, setAudio] = useState<AudioResult | null>(null)
  const [error, setError] = useState('')
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!storyId) { router.push('/stories/new'); return }

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/'); return }
      const uid = data.user.id
      setUserId(uid)

      const [{ data: storyData }, { data: profilesData }, { data: subData }] =
        await Promise.all([
          supabase.from('stories').select('id, title, duration_min').eq('id', storyId).single(),
          supabase
            .from('voice_profiles')
            .select('id, name, created_at, is_active')
            .eq('user_id', uid)
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('tier').eq('user_id', uid).maybeSingle(),
        ])

      setStory(storyData ?? null)
      setProfiles(profilesData ?? [])
      setUserTier(subData?.tier ?? 'free')

      if (!profilesData || profilesData.length === 0) {
        setError('No tenes un perfil de voz. Graba tu voz primero.')
        setPageState('error')
        return
      }

      if (profilesData.length === 1) setSelectedProfile(profilesData[0].id)
      setPageState('select-voice')
    })
  }, [storyId, router])

  const synthesize = useCallback(async () => {
    if (!userId || !storyId || !selectedProfile) return

    setPageState('synthesizing')
    setError('')

    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % SYNTHESIS_MESSAGES.length)
    }, 3000)

    try {
      const res = await fetch('/api/audio/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, voiceProfileId: selectedProfile, userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setPageState('error')
        return
      }

      setAudio({
        audioUrl: data.audio_url,
        audioFileId: data.audio_file_id,
        storagePath: data.storage_path,
      })
      setPageState('playing')
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
      setPageState('error')
    } finally {
      clearInterval(interval)
    }
  }, [userId, storyId, selectedProfile])

  // Auto-synthesize when single profile
  useEffect(() => {
    if (pageState === 'select-voice' && profiles.length === 1 && selectedProfile) {
      synthesize()
    }
  }, [pageState, profiles.length, selectedProfile, synthesize])

  const canDownload = userTier === 'familiar' || userTier === 'gift'

  if (pageState === 'loading') {
    return (
      <main className="min-h-screen bg-[#0D0A12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4A35A] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0D0A12] px-4 py-10 max-w-lg mx-auto flex flex-col gap-8">
      {story && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-serif text-[#F0EAE0]">{story.title}</h1>
          <p className="text-[#8A7FA0] text-sm">{story.duration_min} minutos</p>
        </motion.div>
      )}

      {/* Voice selection — multiple profiles */}
      {pageState === 'select-voice' && profiles.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <h2 className="text-sm text-[#8A7FA0] uppercase tracking-wider">Con que voz lo cuento?</h2>
          <div className="flex flex-col gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p.id)}
                className={`text-left rounded-xl transition-colors border ${
                  selectedProfile === p.id ? 'border-[#C4A35A]' : 'border-transparent'
                }`}
              >
                <VoiceProfileCard profile={p} />
              </button>
            ))}
          </div>
          <button
            onClick={synthesize}
            disabled={!selectedProfile}
            className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
          >
            Generar audio
          </button>
        </motion.div>
      )}

      {/* Synthesizing */}
      {pageState === 'synthesizing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#C4A35A]/20 border-2 border-[#C4A35A]/40 flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full bg-[#C4A35A]/60 ${shouldReduce ? '' : 'animate-pulse'}`} />
          </div>
          <p className="text-[#C4A35A] text-base text-center animate-pulse">
            {SYNTHESIS_MESSAGES[msgIdx]}
          </p>
        </motion.div>
      )}

      {/* Player */}
      {pageState === 'playing' && audio && story && (
        <StoryPlayer
          audioUrl={audio.audioUrl}
          title={story.title}
          canDownload={canDownload}
          storagePath={audio.storagePath}
        />
      )}

      {/* Error */}
      {pageState === 'error' && (
        <div className="flex flex-col gap-4">
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
          {error.includes('voz') ? (
            <a
              href="/record"
              className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base text-center block"
            >
              Grabar mi voz
            </a>
          ) : (
            <button
              onClick={() => { setPageState('select-voice'); setError('') }}
              className="w-full py-3 text-[#8A7FA0] text-sm text-center"
            >
              Reintentar
            </button>
          )}
        </div>
      )}
    </main>
  )
}
