# /story-gen — Módulo de generación de cuentos

## Propósito
Generar cuentos personalizados con IA usando el sistema tiered de ai-provider.ts.
Módulo 2. Requiere que Módulo 1 (voice-clone) esté completo.

## Contexto de dominio
- El cuento se genera primero como texto — el usuario lo previsualiza antes de sintetizar
- La personalización es el valor: nombre del niño, edad, tema favorito
- Temas base: aventura, animales, familia, magia, espacio, dinosaurios, folclore latinoamericano
- Idioma default: español rioplatense (es-AR)
- Velocidad de lectura: ~130 palabras/minuto
- 5 min de cuento = ~650 palabras / 10 min = ~1300 palabras

## Archivos a crear

```
frontend/app/stories/new/page.tsx      ← Formulario de configuración
frontend/app/stories/[id]/page.tsx     ← Preview del cuento + botón sintetizar
frontend/components/story/
  ├── StoryForm.tsx                    ← Config: edad, tema, duración, nombre
  ├── StoryPreview.tsx                 ← Preview de texto antes de audio
  └── StoryCard.tsx                   ← Card en biblioteca
frontend/lib/ai-provider.ts            ← Implementar sistema tiered completo
frontend/app/api/stories/generate/route.ts  ← Next.js route handler
```

## Prompt system para Gemini (es-AR)

```typescript
const SYSTEM_PROMPT = `Sos un narrador de cuentos infantiles argentino.
Escribís cuentos cálidos, creativos y culturalmente resonantes para niños latinoamericanos.
Usás español rioplatense natural, nunca forzado.
Tus cuentos tienen estructura clara: inicio, nudo, desenlace.
Evitás moralizar de forma obvia — los valores emergen de la historia.
El texto debe sonar bien leído en voz alta: frases cortas, ritmo musical.`;

function buildPrompt(params: StoryParams): string {
  const words = params.durationMin * 130;
  return `${SYSTEM_PROMPT}

Escribí un cuento para un niño de ${params.ageTarget} años.
Tema: ${params.theme}.
Palabras aproximadas: ${words}.
${params.childName ? `Protagonista: ${params.childName}.` : ''}
${params.parentName ? `El papá/mamá en el cuento se llama ${params.parentName}.` : ''}

Devolvé ÚNICAMENTE el texto del cuento. Sin título, sin introducción, sin "---".`;
}
```

## Temas con cultura latinoamericana
```typescript
export const THEMES = [
  { id: 'aventura', label: 'Aventura', icon: '🗺️' },
  { id: 'animales', label: 'Animales', icon: '🦁' },
  { id: 'magia', label: 'Magia', icon: '✨' },
  { id: 'familia', label: 'Familia', icon: '🏠' },
  { id: 'espacio', label: 'Espacio', icon: '🌙' },
  { id: 'dinosaurios', label: 'Dinosaurios', icon: '🦕' },
  { id: 'folklore', label: 'Leyendas del Sur', icon: '🌿' },  // ← diferenciador
  { id: 'tren', label: 'El tren de las pampas', icon: '🚂' }, // ← diferenciador
];
```

## Enforcement del free tier
```typescript
// frontend/lib/usage-guard.ts
export async function checkUsageLimit(
  userId: string,
  action: 'story_generated' | 'audio_synthesized'
): Promise<{ allowed: boolean; remaining: number }> {
  const monthYear = new Date().toISOString().slice(0, 7); // '2026-06'

  const { count } = await supabase
    .from('usage_log')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('action', action)
    .eq('month_year', monthYear);

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single();

  const limits = { free: 5, familiar: Infinity, abuelo: Infinity };
  const tier = sub?.tier ?? 'free';
  const limit = limits[tier as keyof typeof limits];
  const used = count ?? 0;

  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}
```

## Definition of Done (Módulo 2)
- [ ] Formulario completo: edad, tema, duración, nombre del niño (opcional)
- [ ] ai-provider.ts con Tier 0, 1 y 2 funcionando
- [ ] Preview de texto visible antes de pagar el audio
- [ ] Free tier enforcement: bloquea a los 5 cuentos/mes
- [ ] Historia guardada en DB con ai_tier_used registrado
- [ ] Loading state durante generación (skeleton + mensaje warm)
