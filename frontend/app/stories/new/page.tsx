'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { StoryForm, StoryFormValues } from '@/components/story/StoryForm'
import { StoryPreview } from '@/components/story/StoryPreview'
import { createClient } from '@/lib/supabase'

interface GeneratedStory {
  storyId: string
  title: string
  content: string
  tierUsed: 0 | 1 | 2
}

const WARM_MESSAGES = [
  'Escribiendo el cuento...',
  'Eligiendo las palabras justas...',
  'Casi listo...',
]

export default function NewStoryPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [warmIdx, setWarmIdx] = useState(0)
  const [story, setStory] = useState<GeneratedStory | null>(null)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  async function handleSubmit(values: StoryFormValues) {
    if (!userId) return
    setLoading(true)
    setStory(null)
    setError('')

    // Warm message rotation
    const interval = setInterval(() => {
      setWarmIdx((i) => (i + 1) % WARM_MESSAGES.length)
    }, 2500)

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...values }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          setRemaining(0)
          setError(data.error ?? 'Limite mensual alcanzado')
        } else {
          setError(data.error ?? 'Error generando el cuento')
        }
        return
      }

      setStory({
        storyId: data.story_id,
        title: data.title,
        content: data.content,
        tierUsed: data.tier_used,
      })
      setRemaining(data.remaining)
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  if (!userId) return null

  return (
    <main className="min-h-screen bg-[#0D0A12] px-4 py-10 max-w-lg mx-auto flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl font-serif text-[#F0EAE0]">Nuevo cuento</h1>
        <p className="text-[#8A7FA0] text-sm">Personaliza el cuento para tu hijo.</p>
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          <p className="text-[#C4A35A] text-sm text-center animate-pulse">
            {WARM_MESSAGES[warmIdx]}
          </p>
          <div className="bg-[#16121F] border border-[#2A2240] rounded-xl p-5 flex flex-col gap-3">
            {[100, 85, 90, 70, 95, 60].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-[#2A2240] rounded animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {story && !loading && (
        <StoryPreview
          storyId={story.storyId}
          title={story.title}
          content={story.content}
          tierUsed={story.tierUsed}
        />
      )}

      {/* Form — hide after story generated */}
      {!story && !loading && (
        <StoryForm onSubmit={handleSubmit} loading={loading} remaining={remaining} />
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </main>
  )
}
