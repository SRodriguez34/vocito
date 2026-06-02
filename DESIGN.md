# Vocito — Design System

## Personalidad visual

**Referencia mental:** Una habitación de niño con luz tenue a las 2am.
Una voz conocida en la oscuridad. Algo cálido, íntimo, seguro.

**NO es:** Un app de kids colorida y ruidosa. No es Fisher-Price. No es Duolingo.
**SÍ es:** Calm.app para padres. Warm. Nocturno. Emocional.

---

## Paleta

```css
:root {
  /* Fondos */
  --color-bg:          #0D0A12;  /* Noche */
  --color-surface:     #16121F;  /* Carta */
  --color-surface-2:   #1E192B;  /* Card elevada */
  --color-border:      #2A2240;  /* Borde sutil */

  /* Acento principal */
  --color-gold:        #C4A35A;  /* Oro cálido */
  --color-gold-light:  #E8C97A;  /* Hover */
  --color-gold-dim:    #7A6438;  /* Subtext en gold */

  /* Acento secundario */
  --color-purple:      #7C5CBF;  /* Violeta sueño */
  --color-purple-dim:  #4A3875;  /* Borde en violeta */

  /* Texto */
  --color-text:        #F0EAE0;  /* Crema */
  --color-muted:       #8A7FA0;  /* Secundario */
  --color-hint:        #4D4560;  /* Tertiary */

  /* Estados */
  --color-success:     #5A8C6A;  /* Verde suave */
  --color-error:       #A05050;  /* Rojo nocturno */
  --color-recording:   #C45A5A;  /* Rojo grabación */
}
```

---

## Tipografía

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

/* Display / Títulos: Lora */
--font-display: 'Lora', Georgia, serif;

/* Body / UI: DM Sans */
--font-body: 'DM Sans', system-ui, sans-serif;

/* Escala */
--text-xs:   0.75rem;   /* 12px — labels, hints */
--text-sm:   0.875rem;  /* 14px — body secundario */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — body importante */
--text-xl:   1.25rem;   /* 20px — subtítulos */
--text-2xl:  1.5rem;    /* 24px — títulos de sección */
--text-3xl:  1.875rem;  /* 30px — títulos de página */
--text-4xl:  2.25rem;   /* 36px — hero */
```

---

## Componentes clave

### Botón de grabación
```
- Circular, 80px de diámetro en mobile
- Color base: var(--color-surface-2)
- Border: 2px solid var(--color-gold)
- Al grabar: border: 2px solid var(--color-recording) + pulse animation
- Ícono: micrófono de Lucide (no emoji)
- Texto abajo: "Tocá para grabar" → "Grabando..." → "Listo"
```

### Card de cuento
```
- Background: var(--color-surface)
- Border: 0.5px solid var(--color-border)
- Border-radius: 16px
- Padding: 20px
- Título: Lora 18px, color-text
- Metadata: DM Sans 13px, color-muted
- Ícono temático a la derecha (basado en theme)
- Tap target completo: toda la card es clickeable
```

### Player
```
- Fijo en bottom cuando activo: position fixed, bottom 0
- Background: var(--color-surface-2) con blur de fondo
- Altura: 80px en mobile
- Controles: play/pause (center, 44px), barra de progreso (tactile)
- Velocidad: chip pequeño "1x" que al tocar cicla entre 0.8x → 1x → 1.2x
- NO mostrar waveform → mostrar color temático del cuento
```

---

## Flujo de onboarding

```
Pantalla 1: Splash (2s) — logo + tagline
  "Tu voz, su cuento"
  → auto-avanza

Pantalla 2: Auth — solo email (magic link)
  "¿Cómo te llamás?" (nombre del padre, para personalizar cuentos)

Pantalla 3: Grabar voz
  "Grabá 30 segundos leyendo cualquier cosa"
  Texto de ejemplo: un párrafo de cuento provisto por Vocito
  CTA: "Grabar mi voz"

Pantalla 4: Primer cuento
  "Perfecto. Ahora elegí el primer cuento"
  → StoryForm simplificado (solo tema + edad del niño)
  CTA: "Crear mi cuento"

Pantalla 5: Síntesis + éxito emocional
  "Tu voz está contando el cuento..."
  → Player con el primer cuento en tu voz
```

---

## Anti-patterns (heredados del Design OS de Lexia, adaptados)

- **Nunca** fondo blanco o claro — siempre dark mode
- **Nunca** colores primarios saturados (rojo vivo, azul eléctrico, verde lima)
- **Nunca** mostrar datos técnicos al usuario (model_id, storage_path, duration_sec en bytes)
- **Nunca** font sans-serif genérica (Inter, Roboto) para títulos o CTAs emocionales
- **Nunca** más de 2 CTAs visibles simultáneamente
- **Nunca** animaciones rápidas o disruptivas — todo suave, < 500ms
- **Nunca** diseñar primero en desktop — el 90% usa celular
- **Nunca** mostrar errores técnicos al usuario — siempre mensajes cálidos humanizados
