'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StoryCard } from '@/components/story/StoryCard'
import { createClient } from '@/lib/supabase'

interface Story {
  id: string
  title: string
  theme: string
  duration_min: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }

      const { data: rows } = await supabase
        .from('stories')
        .select('id, title, theme, duration_min, created_at')
        .order('created_at', { ascending: false })

      setStories(rows ?? [])
      setLoading(false)
    })
  }, [router])

  return (
    <main className="min-h-screen bg-[#0D0A12] px-4 py-10 max-w-lg mx-auto flex flex-col gap-6">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl font-serif text-[#F0EAE0]"
      >
        Biblioteca
      </motion.h1>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#16121F] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-[#8A7FA0] text-sm">Todavia no hay cuentos.</p>
          <a
            href="/stories/new"
            className="px-6 py-3 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-sm"
          >
            Generar el primero
          </a>
        </div>
      )}

      {!loading && stories.length > 0 && (
        <div className="flex flex-col gap-3">
          {stories.map((s, i) => (
            <StoryCard key={s.id} story={s} index={i} />
          ))}
        </div>
      )}
    </main>
  )
}
