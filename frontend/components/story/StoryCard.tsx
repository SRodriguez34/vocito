'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface Story {
  id: string
  title: string
  theme: string
  duration_min: number
  created_at: string
}

interface Props {
  story: Story
  index?: number
}

export function StoryCard({ story, index = 0 }: Props) {
  const date = new Date(story.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/stories/${story.id}`}>
        <div className="bg-[#16121F] border border-[#2A2240] rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
          {/* Theme dot */}
          <div className="w-10 h-10 rounded-full bg-[#7C5CBF]/20 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#7C5CBF]" />
          </div>

          {/* Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[#F0EAE0] font-medium truncate text-sm">{story.title}</span>
            <span className="text-[#8A7FA0] text-xs capitalize">
              {story.theme} - {story.duration_min} min - {date}
            </span>
          </div>

          {/* Arrow */}
          <span className="text-[#2A2240] flex-shrink-0">›</span>
        </div>
      </Link>
    </motion.div>
  )
}
