# /vocito-sprint — Sprint methodology para Claude Code

## Propósito
Orquestar el build completo de Vocito usando la metodología gstack.
Un módulo a la vez. Nunca saltear el Definition of Done.

---

## /vocito-sprint setup-tokens (correr PRIMERO, una sola vez)

```
Leer .claude/skills/token-efficiency/SKILL.md
Instalar Caveman y Context Mode segun las instrucciones.
Verificar que ambos responden OK.
No avanzar al siguiente paso hasta que /context-mode doctor muestre todo [x].
```

## /vocito-sprint start

```
1. Crear estructura de directorios completa
2. Instalar dependencias frontend: next, typescript, tailwind, shadcn, framer-motion, @supabase/ssr
3. Instalar dependencias backend: fastapi, uvicorn, httpx, gradio-client, supabase
4. Configurar .env.local con placeholders
5. Correr supabase start (local)
6. Aplicar migraciones SQL
7. Verificar: supabase status → todos los servicios corriendo
8. Mostrar: checklist de next steps
```

## /plan-eng-review (antes de Módulo 1)

```
Preguntas a responder antes de escribir código:
1. ¿Tenemos acceso a HF Spaces con Chatterbox deployado? (si no, deployar primero)
2. ¿Las env vars están configuradas?
3. ¿El schema SQL está revisado y aplicado?
4. ¿MediaRecorder API disponible en el browser target?
Stop si alguna respuesta es NO. No avanzar con código hasta resolver.
```

## /build-module-1

```
Construir voice-clone siguiendo exactamente .claude/skills/voice-clone/SKILL.md
Detener cuando Definition of Done esté completo.
No iniciar Módulo 2.
```

## /build-module-2

```
Construir story-gen siguiendo .claude/skills/story-gen/SKILL.md
Requiere: Módulo 1 completo.
```

## /build-module-3

```
Construir audio-pipeline siguiendo .claude/skills/audio-pipeline/SKILL.md
Requiere: Módulos 1 y 2 completos.
```

## /review

```
Verificar:
- Seed data visible en UI
- Todos los endpoints responden 200
- RLS habilitado en todas las tablas
- Sin console.log en producción
- Sin any de TypeScript sin justificar
- Mobile: probado en 375px viewport
```

## /ship

```
1. Build de producción: npm run build (0 errores)
2. Push a main → GitHub Actions deploya a Vercel
3. Verificar deploy en producción
4. Smoke test manual: grabar voz → generar cuento → sintetizar → reproducir
```

---

## Prompt inicial para Claude Code (copiar y pegar completo)

```
Lee CLAUDE.md completo antes de escribir cualquier línea de código.
Lee ARCHITECTURE.md para entender el flujo técnico.

Empezá con /vocito-sprint start para crear la estructura del proyecto.
Luego ejecutá /plan-eng-review.
Si todo está listo, ejecutá /build-module-1.

Reglas estrictas:
- Un módulo a la vez
- Respetar el Definition of Done antes de avanzar
- RLS en todas las tablas desde el primer día
- TypeScript strict, sin any
- Mobile-first siempre
- Audio nunca procesado en el cliente, siempre en el backend

Stack: Next.js 14 App Router + FastAPI + Supabase + Chatterbox (HF Spaces) + Gemini Flash
```
