'use client'

import { motion } from 'framer-motion'

interface VoiceProfile {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

interface Props {
  profile: VoiceProfile
}

export function VoiceProfileCard({ profile }: Props) {
  const date = new Date(profile.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16121F] border border-[#2A2240] rounded-xl p-4 flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#C4A35A]/20 flex items-center justify-center flex-shrink-0">
        <span className="text-[#C4A35A] text-lg">
          {profile.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-[#F0EAE0] font-medium truncate">{profile.name}</span>
        <span className="text-[#8A7FA0] text-xs">Creado el {date}</span>
      </div>

      {/* Active indicator */}
      {profile.is_active && (
        <div className="ml-auto w-2 h-2 rounded-full bg-[#C4A35A] flex-shrink-0" />
      )}
    </motion.div>
  )
}
