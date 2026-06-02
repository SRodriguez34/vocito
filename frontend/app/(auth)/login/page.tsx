'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState('loading')
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (err) {
      setError(err.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0A12] flex flex-col items-center justify-center px-6 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#C4A35A]/20 border border-[#C4A35A]/40 flex items-center justify-center mb-2">
          <div className="w-5 h-5 rounded-full bg-[#C4A35A]" />
        </div>
        <h1 className="text-2xl font-serif text-[#F0EAE0]">Vocito</h1>
        <p className="text-[#8A7FA0] text-sm">Ingresa tu email para continuar</p>
      </motion.div>

      {state === 'sent' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 text-center max-w-xs"
        >
          <div className="w-14 h-14 rounded-full bg-[#C4A35A]/10 border border-[#C4A35A]/30 flex items-center justify-center">
            <span className="text-[#C4A35A] text-xl">✓</span>
          </div>
          <p className="text-[#F0EAE0] font-medium">Revisa tu email</p>
          <p className="text-[#8A7FA0] text-sm leading-relaxed">
            Te enviamos un enlace magico a <span className="text-[#F0EAE0]">{email}</span>.
            Tocalo para entrar.
          </p>
          <button
            onClick={() => setState('idle')}
            className="text-xs text-[#8A7FA0] underline mt-2"
          >
            Usar otro email
          </button>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="bg-[#16121F] border border-[#2A2240] rounded-xl px-4 py-4 text-[#F0EAE0] placeholder-[#8A7FA0] focus:outline-none focus:border-[#C4A35A] transition-colors text-base"
          />

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === 'loading' || !email}
            className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
          >
            {state === 'loading' ? 'Enviando...' : 'Continuar'}
          </button>

          <p className="text-xs text-[#8A7FA0] text-center leading-relaxed">
            Te enviamos un enlace por email. Sin contrasena.
          </p>
        </motion.form>
      )}
    </main>
  )
}
