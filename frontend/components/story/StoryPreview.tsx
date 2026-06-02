'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

interface Props {
  storyId: string
  title: string
  content: string
  tierUsed: 0 | 1 | 2
}

export function StoryPreview({ storyId, title, content, tierUsed }: Props) {
  const shouldReduce = useReducedMotion()

  const anim = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      }

  const tierLabel = tierUsed === 0 ? 'clasico' : tierUsed === 1 ? 'Gemini Flash' : 'Groq'

  return (
    <motion.div {...anim} className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-serif text-[#F0EAE0] leading-snug">{title}</h2>
        <span className="text-xs text-[#8A7FA0]">Generado con {tierLabel}</span>
      </div>

      {/* Content */}
      <div className="bg-[#16121F] border border-[#2A2240] rounded-xl p-5">
        <p className="text-[#F0EAE0] leading-relaxed text-base whitespace-pre-wrap font-serif">
          {content}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={`/stories/${storyId}`}
        className="w-full py-4 rounded-2xl bg-[#7C5CBF] text-white font-semibold text-base text-center block active:scale-95 transition-transform"
      >
        Convertir en audio
      </Link>

      <button
        onClick={() => window.history.back()}
        className="w-full py-3 text-[#8A7FA0] text-sm text-center"
      >
        Generar otro
      </button>
    </motion.div>
  )
}
