'use client'

import { useState, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { WaveformVisual } from './WaveformVisual'
import { AudioRecorder } from '@/lib/audio-client'

const MAX_DURATION = 30

interface Props {
  userId: string
  onSuccess: (voiceProfileId: string) => void
}

type Status = 'idle' | 'recording' | 'uploading' | 'done' | 'error'

export function VoiceRecorder({ userId, onSuccess }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [duration, setDuration] = useState(0)
  const [profileName, setProfileName] = useState('')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const recorderRef = useRef(new AudioRecorder())
  const shouldReduceMotion = useReducedMotion()

  const recordPulse = shouldReduceMotion
    ? {}
    : {
        animate: { scale: [1, 1.08, 1] },
        transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const },
      }

  async function startRecording() {
    setErrorMsg('')
    try {
      const node = await recorderRef.current.start((sec) => {
        setDuration(sec)
        if (sec >= MAX_DURATION) stopRecording()
      })
      setAnalyser(node)
      setStatus('recording')
    } catch {
      setErrorMsg('No se pudo acceder al microfono. Verifica los permisos.')
      setStatus('error')
    }
  }

  async function stopRecording() {
    const blob = await recorderRef.current.stop()
    setStatus('uploading')
    setAnalyser(null)

    const form = new FormData()
    form.append('audio', blob, 'recording.wav')
    form.append('name', profileName || 'Mi voz')
    form.append('userId', userId)

    try {
      const res = await fetch('/api/voice/clone', { method: 'POST', body: form })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? `HTTP ${res.status}`)
      }
      const { voice_profile_id } = await res.json()
      setStatus('done')
      onSuccess(voice_profile_id)
    } catch (err) {
      setErrorMsg(String(err))
      setStatus('error')
    }
  }

  const progress = Math.min((duration / MAX_DURATION) * 100, 100)

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      {/* Profile name input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Nombre del perfil de voz</label>
        <input
          type="text"
          placeholder="Ej: Papa, Abuela Rosa"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          disabled={status === 'recording' || status === 'uploading'}
          className="bg-[#16121F] border border-[#2A2240] rounded-lg px-4 py-3 text-[#F0EAE0] placeholder-[#8A7FA0] focus:outline-none focus:border-[#C4A35A] transition-colors"
        />
      </div>

      {/* Waveform */}
      <WaveformVisual analyser={analyser} isRecording={status === 'recording'} />

      {/* Progress bar */}
      {status === 'recording' && (
        <div className="w-full bg-[#2A2240] rounded-full h-1">
          <div
            className="bg-[#C4A35A] h-1 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Timer */}
      {status === 'recording' && (
        <p className="text-center text-[#8A7FA0] text-sm tabular-nums">
          {duration}s / {MAX_DURATION}s
        </p>
      )}

      {/* Record button */}
      {(status === 'idle' || status === 'error') && (
        <button
          onClick={startRecording}
          className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base active:scale-95 transition-transform"
        >
          Grabar mi voz
        </button>
      )}

      {status === 'recording' && (
        <motion.button
          onClick={stopRecording}
          className="w-full py-4 rounded-2xl bg-[#7C5CBF] text-white font-semibold text-base"
          {...recordPulse}
        >
          Detener ({MAX_DURATION - duration}s restantes)
        </motion.button>
      )}

      {status === 'uploading' && (
        <div className="w-full py-4 rounded-2xl bg-[#16121F] border border-[#2A2240] text-[#8A7FA0] text-center text-base">
          Clonando voz...
        </div>
      )}

      {status === 'done' && (
        <div className="w-full py-4 rounded-2xl bg-[#16121F] border border-[#C4A35A] text-[#C4A35A] text-center text-base">
          Voz guardada
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <p className="text-sm text-red-400 text-center">{errorMsg}</p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-[#8A7FA0] text-center leading-relaxed">
        Tu voz se procesa de forma segura y se usa unicamente para generar cuentos.
        No se comparte con terceros.
      </p>
    </div>
  )
}
