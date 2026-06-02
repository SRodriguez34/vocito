# Vocito — Cuentos en tu voz para tus hijos
> Plataforma de clonación de voz + generación de cuentos con IA para el mercado hispanohablante.
> NO es un reproductor de audio. Es presencia emocional a distancia.

---

## TOKEN EFFICIENCY (Claude Token Efficient + Caveman — aplicar siempre)

### Output
- Respuesta en línea 1. Razonamiento después, nunca antes.
- Sin preámbulo. Sin "Claro!", "Por supuesto!", "Entendido!", "Excelente pregunta!".
- Sin cierres vacíos. Sin "Espero que ayude", "Avisame si necesitas algo".
- Sin reformular el prompt. Si la tarea es clara, ejecutar de inmediato.
- Sin explicar lo que vas a hacer. Hacerlo directamente.
- Sin sugerencias no pedidas. Hacer exactamente lo que se pidió, nada más.
- Output estructurado: bullets, tablas, bloques de código. Prosa solo si se pide.

### Compresión
- Comprimir respuestas. Cada frase debe ganarse su lugar.
- Sin contexto redundante. No repetir info ya establecida en la sesión.
- Sin introducciones largas ni transiciones entre secciones.
- Respuestas cortas son correctas salvo que se pida profundidad explícita.
- Caveman mode para código: fragmentos directos, sin explicación obvia.
  Mal: "La razón por la que el componente re-renderiza es porque creás una nueva referencia..."
  Bien: "Nueva ref en cada render. Wrappear en useMemo."

### Anti-sycophancy
- Nunca validar al usuario antes de responder.
- Nunca decir "Tenes razón!" salvo que sea verificablemente correcto.
- Disentir cuando algo está mal. Decirlo directamente.
- No cambiar una respuesta correcta porque el usuario insista.

### Prevención de alucinaciones
- Nunca especular sobre código, archivos o APIs que no se hayan leído.
- Si se referencia un archivo o función: leerlo primero, después responder.
- Si no se sabe: decir "No sé." Nunca adivinar con confianza.
- Nunca inventar paths, nombres de función o firmas de API.

### Scope
- No agregar features más allá de lo pedido.
- No refactorizar código circundante al arreglar un bug.
- No crear archivos nuevos salvo que sea estrictamente necesario.
- Leer el archivo antes de modificarlo. Nunca editar a ciegas.

### Código
- Devolver la solución más simple que funcione. Sin over-engineering.
- Sin abstracciones para operaciones de un solo uso.
- Sin features especulativos ni future-proofing no pedido.
- Sin docstrings ni comentarios en código que no fue cambiado.
- Comentarios inline solo donde la lógica no es obvia.

### Tipografía ASCII (Claude Token Efficient)
- Sin em dashes. Usar guiones (-).
- Sin comillas curvas. Usar comillas rectas (" ').
- Sin Unicode bullets. Usar (-) o (*).

---

## PLUGINS ACTIVOS EN ESTE PROYECTO
- Claude Token Efficient: CLAUDE.md en raiz (este archivo)
- Caveman: instalado via `npx skills add JuliusBrussee/caveman`
- Context Mode: instalado via `/plugin marketplace add mksglu/context-mode`
- Code Review Graph: instalar cuando el repo supere 100 archivos
  Comando: `pip install code-review-graph && code-review-graph install --platform claude-code`

---

## REGLAS KARPATHY (No negociables — leer antes de escribir una línea)

1. **Un módulo a la vez.** No saltes al siguiente hasta que el actual esté funcionando con datos reales.
2. **No inventes APIs.** Si no sabés si un endpoint existe, buscalo antes de usarlo.
3. **Nada de console.log en producción.** Usá el logger estructurado definido en `lib/logger.ts`.
4. **Siempre tipar.** TypeScript strict mode. Ningún `any` sin justificación explícita en comentario.
5. **Primero el schema, después el código.** Toda tabla nueva → migración SQL → revisión → luego el ORM.
6. **RLS en Supabase desde el día 1.** Cada tabla tiene row-level security habilitada. Sin excepciones.
7. **Audio como ciudadano de primera clase.** Cualquier archivo de audio generado se almacena en Supabase Storage con URL firmada. Nunca en el filesystem local.
8. **Tests de humo después de cada módulo.** Mínimo: seed data visible en UI + endpoint respondiendo 200.
9. **Variables de entorno tipadas.** Usar `lib/env.ts` para validar env vars al startup. App no arranca sin las requeridas.
10. **Mobile-first siempre.** El 90% de los usuarios accede desde el celular a las 2am.

---

## Stack técnico (no negociable)

```
FRONTEND:      Next.js 14+ (App Router) + TypeScript
ESTILOS:       Tailwind CSS v3 + shadcn/ui + Framer Motion
BASE DE DATOS: Supabase (Postgres + Storage + Auth + RLS)
VOICE ENGINE:  Fish Audio API (S2) — free tier — clonacion + TTS en un solo endpoint
               SDK: fish-audio-sdk (Python) o REST directo desde Next.js route handlers
LLM STORIES:  Gemini 2.0 Flash (gratis, 1M tokens/día) → fallback: Groq/llama-3.3-70b
AUDIO:         Web Audio API nativa (grabacion) + Supabase Storage (referencia + output)
DEPLOY:        Vercel (unico servicio de deploy — no hay backend separado)
CI/CD:         GitHub Actions

SIN FastAPI. SIN HF Spaces. SIN Railway.
Fish Audio reemplaza toda la capa de infraestructura de voz.
```

---

## Arquitectura de IA — Sistema por capas (patrón Cartero adaptado)

```typescript
// lib/ai-provider.ts — el mismo patrón tiered que Cartero

Tier 0: Templates estáticos
  → Cuentos pre-escritos hardcodeados (fallback sin internet)
  → 20 cuentos base en español rioplatense incluidos en el repo

Tier 1: Gemini Flash (free API)
  → Generación dinámica de cuentos por edad/tema/duración
  → 1M tokens/día gratis = ~3000 cuentos/día sin costo
  → Primary provider

Tier 2: Groq (free API)
  → Fallback si Gemini falla o cuota agotada
  → llama-3.3-70b-versatile (ya probado en Motor Financiero)

Tier 3: Claude API
  → Solo para casos edge: cuentos muy complejos, personalización avanzada
  → Usar con moderación, solo si el usuario tiene tier pago
```

---

## Mapa de producto / módulos

```
Módulo 1: VOICE CLONE
  → Grabación 30s en browser (Web Audio API)
  → Upload a Supabase Storage
  → POST a FastAPI → Chatterbox clona la voz
  → Guarda voice_model_id en tabla `voice_profiles`

Módulo 2: STORY GENERATOR
  → UI de configuración: edad/tema/duración/idioma
  → Gemini Flash genera texto del cuento
  → Texto guardado en tabla `stories`
  → Preview en texto antes de sintetizar

Módulo 3: AUDIO PIPELINE
  → POST a FastAPI con story_id + voice_profile_id
  → Chatterbox sintetiza → devuelve MP3
  → Upload a Supabase Storage (URL firmada)
  → Registra en tabla `audio_files`

Módulo 4: PLAYER + BIBLIOTECA
  → Player mobile-optimizado
  → Biblioteca de cuentos generados
  → Descarga MP3 (tier pago)
  → Compartir por WhatsApp (deep link)

Módulo 5: MONETIZACIÓN
  → Supabase Auth + tabla `subscriptions`
  → Free: 5 cuentos/mes, 1 voz
  → Familiar $5/mes: ilimitado, 3 voces, descarga
  → Gift abuelo $12/año: 1 voz, 1 nieto
```

---

## Design System — Vocito

**Personalidad visual:** Cálido, nocturno, íntimo. Como una habitación con luz tenue a las 2am.
**NO es:** Colorido, infantil, caricaturesco, startup frío.

```css
/* Paleta principal */
--color-bg:        #0D0A12;   /* Noche profunda */
--color-surface:   #16121F;   /* Superficie de carta */
--color-border:    #2A2240;   /* Borde sutil */
--color-primary:   #C4A35A;   /* Oro cálido — presencia */
--color-primary-2: #E8C97A;   /* Oro claro — hover */
--color-accent:    #7C5CBF;   /* Violeta sueño */
--color-text:      #F0EAE0;   /* Crema — legible en oscuro */
--color-muted:     #8A7FA0;   /* Texto secundario */

/* Tipografía */
Display:  'Lora' (serif) — calidez, cuento, historia
Body:     'DM Sans' — legibilidad, claridad, mobile
Mono:     'JetBrains Mono' — solo para código interno

/* Escala de espaciado: 4px base */
/* Border radius: 12px cards, 8px inputs, 24px pills */
/* Sombras: sombra de luna (difusa, cálida) no box-shadow duro */
```

**Anti-patterns Vocito (nunca hacer):**
- No usar colores primarios puros (rojo, azul, verde) → todo pasa por la paleta nocturna
- No usar emojis en la UI principal → solo en tooltips o estados vacíos
- No usar tipografía san-serif genérica (Inter, Roboto) para display
- No diseñar para desktop primero
- No poner más de 2 CTAs visibles al mismo tiempo
- No mostrar waveforms técnicos — el audio se siente, no se ve como herramienta

---

## Patrones de animación (Framer Motion)

```typescript
// Entrada de carta/cuento — suave, como girar una página
export const storyReveal = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
}

// Player aparece — sube desde abajo como un cassette
export const playerSlideUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
}

// Pulso de grabación — latido suave
export const recordPulse = {
  animate: { scale: [1, 1.08, 1] },
  transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
}

// prefers-reduced-motion: siempre wrappear con useReducedMotion()
```

---

## Estructura de archivos

```
vocito/
├── CLAUDE.md                    ← este archivo
├── ARCHITECTURE.md
├── DESIGN.md
├── AGENTS.md
├── docs/
│   ├── BUSINESS_MODEL.md
│   ├── SCHEMA.md
│   └── ROADMAP.md
├── design-system/
│   └── MASTER.md
├── .claude/
│   └── skills/
│       ├── voice-clone/SKILL.md
│       ├── story-gen/SKILL.md
│       ├── audio-pipeline/SKILL.md
│       └── vocito-sprint/SKILL.md
├── frontend/                    ← Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── record/
│   │   ├── stories/
│   │   └── player/
│   ├── components/
│   │   ├── ui/                  ← shadcn primitives
│   │   ├── voice/               ← VoiceRecorder, WaveformVisual
│   │   ├── story/               ← StoryCard, StoryForm, StoryPlayer
│   │   └── layout/
│   └── lib/
│       ├── ai-provider.ts       ← tiered AI (patrón Cartero)
│       ├── audio-client.ts      ← Web Audio API wrapper
│       ├── supabase.ts
│       ├── env.ts
│       └── logger.ts
├── backend/                     ← FastAPI (Python)
│   ├── main.py
│   ├── routers/
│   │   ├── voice.py             ← /clone, /synthesize
│   │   └── health.py
│   ├── services/
│   │   ├── chatterbox.py        ← wrapper Chatterbox TTS
│   │   └── storage.py           ← Supabase Storage client
│   └── requirements.txt
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
└── .github/
    └── workflows/
        ├── deploy-frontend.yml
        ├── deploy-backend.yml
        └── test-audio-pipeline.yml
```

---

## Schema Supabase (resumen — ver SCHEMA.md para detalle completo)

```sql
-- Perfiles de voz clonada
voice_profiles (id, user_id, name, model_ref, storage_path, created_at, is_active)

-- Cuentos generados
stories (id, user_id, title, content, age_target, theme, duration_min, language, created_at)

-- Archivos de audio sintetizados
audio_files (id, story_id, voice_profile_id, user_id, storage_path, duration_sec, created_at)

-- Suscripciones
subscriptions (id, user_id, tier, status, period_start, period_end, created_at)

-- Uso mensual (para enforcement de free tier)
usage_log (id, user_id, action, month_year, count, created_at)
```

---

## Variables de entorno requeridas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Fish Audio (voz — clonacion + TTS)
FISH_AUDIO_API_KEY=        # desde fish.audio/developers → API Keys
# No hay BACKEND_URL ni HF_SPACE_URL — todo va directo desde Next.js route handlers

# LLM (Tier 1)
GEMINI_API_KEY=

# LLM (Tier 2 fallback)
GROQ_API_KEY=
```

---

## Comandos de desarrollo

```bash
# Frontend (unico servicio local)
cd frontend && npm install && npm run dev

# Supabase local
supabase start

# Primer build completo
/vocito-sprint setup-tokens  ← instalar Caveman + Context Mode
/vocito-sprint start         ← crear estructura + migraciones
/plan-eng-review             ← verificar Fish Audio API key activa
/build-module-1              ← arrancar
```

---

## Checklist pre-deploy (heredado del Design OS de Lexia)

- [ ] RLS habilitado en todas las tablas
- [ ] Variables de entorno validadas en `env.ts`
- [ ] Audio pipeline testeado end-to-end con voz real
- [ ] Free tier enforcement testeado (límite de 5 cuentos)
- [ ] Disclaimer de privacidad de voz visible antes del onboarding
- [ ] Mobile: testeado en 375px (iPhone SE)
- [ ] Lighthouse score > 90 en mobile
- [ ] Framer Motion con `useReducedMotion()` en todas las animaciones
