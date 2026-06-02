# /voice-clone — Modulo de clonacion de voz (Fish Audio API)

## Proposito
Grabar la voz del usuario en el browser y clonarla via Fish Audio API.
Modulo 1. No avanzar al 2 hasta que este completo.

## Como funciona Fish Audio para clonacion
1. Usuario graba 30s en browser (Web Audio API)
2. Next.js route handler recibe el Blob
3. POST a https://api.fish.audio/model con el audio como multipart
4. Fish Audio devuelve un voice_id permanente
5. Ese voice_id se guarda en voice_profiles y se usa en cada sintesis

## Archivos a crear

```
frontend/app/record/page.tsx
frontend/components/voice/VoiceRecorder.tsx
frontend/components/voice/WaveformVisual.tsx
frontend/app/api/voice/clone/route.ts     ← llama a Fish Audio
frontend/lib/audio-client.ts              ← Web Audio API wrapper
frontend/lib/fish-audio.ts               ← Fish Audio client
```

## fish-audio.ts

```typescript
// frontend/lib/fish-audio.ts
const FISH_BASE = 'https://api.fish.audio'

export async function cloneVoice(audioBlob: Blob, name: string): Promise<string> {
  const form = new FormData()
  form.append('visibility', 'private')
  form.append('type', 'tts')
  form.append('title', name)
  form.append('voices', audioBlob, 'reference.wav')

  const res = await fetch(`${FISH_BASE}/model`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
    body: form,
  })

  if (!res.ok) throw new Error(`Fish Audio clone failed: ${res.status}`)
  const data = await res.json()
  return data._id  // voice_id permanente
}

export async function synthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${FISH_BASE}/v1/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      reference_id: voiceId,
      format: 'mp3',
      mp3_bitrate: 128,
      latency: 'normal',
    }),
  })

  if (!res.ok) throw new Error(`Fish Audio TTS failed: ${res.status}`)
  return res.arrayBuffer()
}
```

## Definition of Done
- [ ] Grabacion 30s funciona en Chrome mobile
- [ ] Waveform animado durante grabacion
- [ ] POST a Fish Audio /model devuelve voice_id
- [ ] voice_profile guardado en DB con voice_id
- [ ] VoiceProfileCard muestra la voz creada
- [ ] Error handling: microfono denegado, API error
