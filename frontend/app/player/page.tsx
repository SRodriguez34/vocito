import { Suspense } from 'react'
import { PlayerContent } from './PlayerContent'

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0D0A12] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C4A35A] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PlayerContent />
    </Suspense>
  )
}
