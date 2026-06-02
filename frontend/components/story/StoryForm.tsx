'use client'

import { useState } from 'react'

export const THEMES = [
  { id: 'aventura', label: 'Aventura' },
  { id: 'animales', label: 'Animales' },
  { id: 'magia', label: 'Magia' },
  { id: 'familia', label: 'Familia' },
  { id: 'espacio', label: 'Espacio' },
  { id: 'dinosaurios', label: 'Dinosaurios' },
  { id: 'folklore', label: 'Leyendas del Sur' },
  { id: 'tren', label: 'El tren de las pampas' },
]

export interface StoryFormValues {
  childName: string
  parentName: string
  ageTarget: number
  theme: string
  durationMin: number
}

interface Props {
  onSubmit: (values: StoryFormValues) => void
  loading: boolean
  remaining: number | null
}

export function StoryForm({ onSubmit, loading, remaining }: Props) {
  const [values, setValues] = useState<StoryFormValues>({
    childName: '',
    parentName: '',
    ageTarget: 5,
    theme: 'aventura',
    durationMin: 5,
  })

  function set<K extends keyof StoryFormValues>(key: K, val: StoryFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(values)
  }

  const blocked = remaining !== null && remaining <= 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Child name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Nombre del nino (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Sofia, Mateo"
          value={values.childName}
          onChange={(e) => set('childName', e.target.value)}
          className="bg-[#16121F] border border-[#2A2240] rounded-lg px-4 py-3 text-[#F0EAE0] placeholder-[#8A7FA0] focus:outline-none focus:border-[#C4A35A] transition-colors"
        />
      </div>

      {/* Parent name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Tu nombre (para el cuento)</label>
        <input
          type="text"
          placeholder="Ej: Papa, Mama, Abuela"
          value={values.parentName}
          onChange={(e) => set('parentName', e.target.value)}
          className="bg-[#16121F] border border-[#2A2240] rounded-lg px-4 py-3 text-[#F0EAE0] placeholder-[#8A7FA0] focus:outline-none focus:border-[#C4A35A] transition-colors"
        />
      </div>

      {/* Age */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Edad: {values.ageTarget} anos</label>
        <input
          type="range"
          min={2}
          max={12}
          value={values.ageTarget}
          onChange={(e) => set('ageTarget', Number(e.target.value))}
          className="accent-[#C4A35A]"
        />
        <div className="flex justify-between text-xs text-[#8A7FA0]">
          <span>2</span><span>12</span>
        </div>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Tema</label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set('theme', t.id)}
              className={`py-3 px-4 rounded-xl text-sm text-left transition-colors ${
                values.theme === t.id
                  ? 'bg-[#C4A35A]/20 border border-[#C4A35A] text-[#C4A35A]'
                  : 'bg-[#16121F] border border-[#2A2240] text-[#8A7FA0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-[#8A7FA0]">Duracion</label>
        <div className="flex gap-2">
          {[3, 5, 10].map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => set('durationMin', min)}
              className={`flex-1 py-3 rounded-xl text-sm transition-colors ${
                values.durationMin === min
                  ? 'bg-[#C4A35A]/20 border border-[#C4A35A] text-[#C4A35A]'
                  : 'bg-[#16121F] border border-[#2A2240] text-[#8A7FA0]'
              }`}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      {/* Free tier indicator */}
      {remaining !== null && (
        <p className="text-xs text-center text-[#8A7FA0]">
          {remaining > 0
            ? `${remaining} cuento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} este mes`
            : 'Alcanzaste el limite mensual del plan gratuito'}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || blocked}
        className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
      >
        {loading ? 'Generando...' : 'Generar cuento'}
      </button>
    </form>
  )
}
