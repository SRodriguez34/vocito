'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  audioUrl: string
  title: string
  canDownload: boolean
  storagePath: string
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StoryPlayer({ audioUrl, title, canDownload, storagePath }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const shouldReduce = useReducedMotion()

  const slideUp = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration)
    const onEnded = () => setPlaying(false)

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play()
      setPlaying(true)
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Number(e.target.value)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <motion.div
      {...slideUp}
      className="bg-[#16121F] border border-[#2A2240] rounded-2xl p-5 flex flex-col gap-5"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-[#8A7FA0] uppercase tracking-wider">Reproduciendo</p>
        <h3 className="text-[#F0EAE0] font-serif text-base leading-snug">{title}</h3>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="relative h-1 bg-[#2A2240] rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-[#C4A35A] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            aria-label="Progreso del audio"
          />
        </div>
        <div className="flex justify-between text-xs text-[#8A7FA0] tabular-nums">
          <span>{fmt(currentTime)}</span>
          <span>{duration > 0 ? fmt(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Rewind 10s */}
        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
          className="text-[#8A7FA0] text-sm w-10 h-10 flex items-center justify-center"
          aria-label="Retroceder 10 segundos"
        >
          -10s
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-[#C4A35A] flex items-center justify-center active:scale-95 transition-transform"
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? (
            <span className="flex gap-1">
              <span className="w-1.5 h-5 bg-[#0D0A12] rounded-sm" />
              <span className="w-1.5 h-5 bg-[#0D0A12] rounded-sm" />
            </span>
          ) : (
            <span className="ml-1 border-y-8 border-y-transparent border-l-[14px] border-l-[#0D0A12]" />
          )}
        </button>

        {/* Forward 10s */}
        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
          className="text-[#8A7FA0] text-sm w-10 h-10 flex items-center justify-center"
          aria-label="Adelantar 10 segundos"
        >
          +10s
        </button>
      </div>

      {/* Download — paid tier only */}
      {canDownload && (
        <a
          href={audioUrl}
          download={`${title}.mp3`}
          className="w-full py-3 rounded-xl border border-[#2A2240] text-[#8A7FA0] text-sm text-center active:scale-95 transition-transform"
        >
          Descargar MP3
        </a>
      )}
    </motion.div>
  )
}
