'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/record')
      else router.replace('/login')
    })
  }, [router])

  return (
    <main className="min-h-screen bg-[#0D0A12] flex flex-col items-center justify-center px-6 gap-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#C4A35A]/20 border border-[#C4A35A]/40 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#C4A35A]" />
        </div>
        <h1 className="text-4xl font-serif text-[#F0EAE0]">Vocito</h1>
        <p className="text-[#8A7FA0] text-base leading-relaxed max-w-xs">
          Cuentos para tus hijos en tu propia voz. Aunque no estes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <a
          href="/record"
          className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base text-center active:scale-95 transition-transform"
        >
          Empezar
        </a>
        <a
          href="/stories/new"
          className="w-full py-4 rounded-2xl bg-[#16121F] border border-[#2A2240] text-[#F0EAE0] font-medium text-base text-center active:scale-95 transition-transform"
        >
          Generar un cuento
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-[#8A7FA0] text-center"
      >
        Presencia emocional a distancia.
      </motion.p>
    </main>
  )
}
