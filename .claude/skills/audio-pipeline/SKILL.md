# /audio-pipeline — Sintesis con Fish Audio API

## Proposito
Sintetizar el cuento generado usando el voice_id de Fish Audio.
Modulo 3. Requiere Modulos 1 y 2 completos.

## Flujo simplificado
1. Frontend hace POST a /api/audio/synthesize { storyId, voiceProfileId }
2. Route handler busca story.content y voice_profiles.voice_id en Supabase
3. POST a https://api.fish.audio/v1/tts con texto + reference_id
4. Recibe MP3 como ArrayBuffer
5. Upload a Supabase Storage
6. Devuelve signed URL al frontend
7. Player reproduce

## Sin backend separado
Todo corre en Next.js route handlers en Vercel.
No hay FastAPI, no hay Railway, no hay HF Spaces.

## Mensajes durante sintesis (mostrar al usuario)
```typescript
export const SYNTHESIS_MESSAGES = [
  "Tu voz está despertando...",
  "El cuento está tomando forma...",
  "Las palabras ya tienen tu voz...",
  "Casi listo, tu cuento te espera...",
]
```

## Limite free tier Fish Audio
~7 minutos/mes = suficiente para 1-2 cuentos de testing
Para MVP con usuarios reales: plan Plus $11/mes = 200 minutos (~40 cuentos de 5 min)
Break-even: 3 usuarios pagos tier Familiar ($5 x 3 = $15 > $11)

## Definition of Done
- [ ] POST /api/audio/synthesize funciona end-to-end
- [ ] Progress indicator con mensajes calidos
- [ ] Player mobile-first reproduce MP3
- [ ] audio_files registrado en Supabase DB
- [ ] Signed URL funciona 24h
- [ ] Descarga habilitada para tier familiar
