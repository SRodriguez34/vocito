'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Props {
  analyser: AnalyserNode | null
  isRecording: boolean
}

export function WaveformVisual({ analyser, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser || !isRecording || shouldReduce) return

    const ctx = canvas.getContext('2d')!
    const data = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      analyser!.getByteFrequencyData(data)
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      const barW = canvas!.width / data.length
      data.forEach((val, i) => {
        const h = (val / 255) * canvas!.height
        const alpha = 0.4 + (val / 255) * 0.6
        ctx.fillStyle = `rgba(196, 163, 90, ${alpha})`
        ctx.fillRect(i * barW, canvas!.height - h, barW - 1, h)
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser, isRecording])

  // Idle state — subtle pulse
  if (!isRecording) {
    return (
      <div className="w-full h-16 flex items-center justify-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-[#2A2240]"
            style={{ height: `${8 + Math.sin(i * 0.8) * 6}px` }}
          />
        ))}
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={64}
      className="w-full h-16 rounded-lg"
    />
  )
}
