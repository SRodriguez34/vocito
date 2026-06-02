'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { VoiceProfileCard } from '@/components/voice/VoiceProfileCard'
import { createClient } from '@/lib/supabase'

interface VoiceProfile {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

const storyReveal = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
}

export default function RecordPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('voice_profiles')
      .select('id, name, created_at, is_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoadingProfiles(false)
      })
  }, [userId])

  function handleSuccess(voiceProfileId: string) {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('voice_profiles')
      .select('id, name, created_at, is_active')
      .eq('id', voiceProfileId)
      .single()
      .then(({ data }) => {
        if (data) setProfiles((prev) => [data, ...prev])
      })
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#0D0A12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4A35A] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0D0A12] px-4 py-10 flex flex-col gap-8 max-w-lg mx-auto">
      {/* Header */}
      <motion.div {...storyReveal} className="flex flex-col gap-2">
        <h1 className="text-2xl font-serif text-[#F0EAE0]">Tu voz</h1>
        <p className="text-[#8A7FA0] text-sm leading-relaxed">
          Graba 30 segundos leyendo algo en voz alta. Con eso alcanza para clonar tu voz.
        </p>
      </motion.div>

      {/* Recorder */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <VoiceRecorder userId={userId} onSuccess={handleSuccess} />
      </motion.div>

      {/* Profiles list */}
      {(profiles.length > 0 || loadingProfiles) && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm text-[#8A7FA0] uppercase tracking-wider">
            Voces guardadas
          </h2>
          {loadingProfiles ? (
            <div className="h-16 bg-[#16121F] rounded-xl animate-pulse" />
          ) : (
            profiles.map((p) => <VoiceProfileCard key={p.id} profile={p} />)
          )}
        </motion.section>
      )}
    </main>
  )
}
