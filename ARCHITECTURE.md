# Vocito — Arquitectura Técnica (Fish Audio API)

## Flujo principal simplificado

```
Usuario (browser mobile)
    │
    ├─[1. GRABACION]──────────────────────────────────────────────────┐
    │   Web Audio API → MediaRecorder → Blob (WAV)                    │
    │   → Upload a Supabase Storage: raw_voice/{userId}/{uuid}.wav    │
    │   → Next.js route handler: POST /api/voice/clone                │
    │       → Fish Audio API: POST /model (multipart con el WAV)      │
    │       → Recibe voice_id (string permanente)                     │
    │       → Guarda en tabla voice_profiles { voice_id, name }       │
    │       → Devuelve voice_profile_id al frontend                   │
    │
    ├─[2. CUENTO]────────────────────────────────────────────────────┐
    │   UI: edad / tema / duracion / nombre del nino                  │
    │   → Next.js route handler: POST /api/stories/generate           │
    │       → ai-provider.ts → Gemini Flash (Tier 1)                 │
    │           → fallback Groq (Tier 2)                             │
    │               → fallback template (Tier 0)                     │
    │   → Guarda texto en tabla stories                              │
    │   → Devuelve story_id + texto preview                          │
    │
    └─[3. SINTESIS]──────────────────────────────────────────────────┐
        Usuario confirma "Generar audio"
        → Next.js route handler: POST /api/audio/synthesize
            → Fetch story.content + voice_profiles.voice_id
            → Fish Audio API: POST /tts (texto + voice_id)
            → Recibe MP3 stream
            → Upload a Supabase Storage: audio/{userId}/{uuid}.mp3
            → Genera signed URL (24h reproduccion / 7d descarga pago)
            → Guarda en tabla audio_files
            → Devuelve signed URL
        → Player reproduce en mobile
```

---

## Por que desaparece el backend FastAPI

Con Chatterbox necesitabamos FastAPI porque:
- Chatterbox es un modelo Python que no corre en Node
- Requeria GPU → HF Spaces
- El frontend no podia llamarlo directamente

Con Fish Audio:
- Es una API REST simple
- Se llama igual que cualquier fetch() desde Next.js route handlers
- No hay modelo que hostear
- No hay Railway, no hay HF Spaces, no hay segundo servicio

**Stack: solo Next.js en Vercel + Supabase. Dos servicios.**

---

## Next.js Route Handlers — implementacion

### POST /api/voice/clone
```typescript
// frontend/app/api/voice/clone/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File
  const profileName = formData.get('name') as string
  const userId = formData.get('userId') as string

  // 1. Upload raw audio a Supabase Storage (respaldo)
  const supabase = createClient()
  const storagePath = `raw_voice/${userId}/${crypto.randomUUID()}.wav`
  await supabase.storage.from('vocito').upload(storagePath, audioFile)

  // 2. Clonar con Fish Audio API
  const fishForm = new FormData()
  fishForm.append('visibility', 'private')
  fishForm.append('type', 'tts')
  fishForm.append('title', profileName)
  fishForm.append('voices', audioFile)

  const fishRes = await fetch('https://api.fish.audio/model', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
    body: fishForm,
  })

  const { _id: voiceId } = await fishRes.json()

  // 3. Guardar en DB
  const { data } = await supabase
    .from('voice_profiles')
    .insert({ user_id: userId, name: profileName, voice_id: voiceId, storage_path: storagePath })
    .select('id')
    .single()

  return NextResponse.json({ voice_profile_id: data.id, voice_id: voiceId })
}
```

### POST /api/audio/synthesize
```typescript
// frontend/app/api/audio/synthesize/route.ts
export async function POST(req: NextRequest) {
  const { storyId, voiceProfileId, userId } = await req.json()
  const supabase = createClient()

  // 1. Fetch datos necesarios
  const { data: story } = await supabase.from('stories').select('content').eq('id', storyId).single()
  const { data: profile } = await supabase.from('voice_profiles').select('voice_id').eq('id', voiceProfileId).single()

  // 2. Sintetizar con Fish Audio
  const fishRes = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: story.content,
      reference_id: profile.voice_id,  // voice_id de Fish Audio
      format: 'mp3',
      mp3_bitrate: 128,
      latency: 'normal',               // 'normal' para cuentos largos
    }),
  })

  // 3. Subir MP3 a Supabase Storage
  const audioBuffer = await fishRes.arrayBuffer()
  const outputPath = `audio/${userId}/${crypto.randomUUID()}.mp3`
  await supabase.storage.from('vocito').upload(outputPath, audioBuffer, { contentType: 'audio/mpeg' })

  // 4. URL firmada (24h)
  const { data: { signedUrl } } = await supabase.storage
    .from('vocito')
    .createSignedUrl(outputPath, 86400)

  // 5. Registrar en DB
  await supabase.from('audio_files').insert({
    story_id: storyId,
    voice_profile_id: voiceProfileId,
    user_id: userId,
    storage_path: outputPath,
  })

  return NextResponse.json({ audio_url: signedUrl })
}
```

---

## Fish Audio API — referencia rapida

```
Base URL:       https://api.fish.audio
Auth:           Bearer token en header Authorization

Clonar voz:
  POST /model
  multipart/form-data: visibility, type="tts", title, voices (archivo)
  Response: { _id: "voice_id_permanente", ... }

Sintetizar:
  POST /v1/tts
  JSON: { text, reference_id, format, mp3_bitrate, latency }
  Response: audio/mpeg stream (MP3)

Free tier:
  ~7 minutos de audio por mes (aprox 1-2 cuentos de testing)
  Suficiente para desarrollar y testear el MVP completo
  Sin tarjeta de credito para empezar
```

---

## Supabase — Schema actualizado

```sql
-- Sin cambios estructurales vs version anterior
-- Solo voice_profiles cambia: model_ref → voice_id (string de Fish Audio)

CREATE TABLE voice_profiles (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,           -- "Papa", "Abuela Rosa"
  voice_id     TEXT NOT NULL,           -- _id devuelto por Fish Audio /model
  storage_path TEXT,                    -- raw_voice backup en Supabase Storage
  language     TEXT DEFAULT 'es',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- El resto de tablas (stories, audio_files, subscriptions, usage_log)
-- son identicas a la version anterior
```

---

## Estructura de archivos (simplificada sin backend)

```
vocito/
├── CLAUDE.md
├── ARCHITECTURE.md
├── DESIGN.md
├── docs/BUSINESS_MODEL.md
├── .claude/skills/...
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   └── 002_rls_policies.sql
└── frontend/                        ← unico servicio
    ├── app/
    │   ├── (auth)/
    │   ├── dashboard/
    │   ├── record/
    │   ├── stories/
    │   ├── player/
    │   └── api/                     ← route handlers (reemplazan FastAPI)
    │       ├── voice/
    │       │   └── clone/route.ts
    │       ├── stories/
    │       │   └── generate/route.ts
    │       └── audio/
    │           └── synthesize/route.ts
    ├── components/
    │   ├── voice/
    │   ├── story/
    │   └── layout/
    └── lib/
        ├── ai-provider.ts
        ├── audio-client.ts          ← Web Audio API wrapper
        ├── fish-audio.ts            ← Fish Audio API client
        ├── supabase.ts
        ├── env.ts
        └── logger.ts
```

---

## GitHub Actions

```yaml
# .github/workflows/deploy.yml
# Un solo workflow — solo Vercel, nada mas
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```
