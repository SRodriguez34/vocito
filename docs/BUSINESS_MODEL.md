# Vocito — Modelo de Negocio

## Propuesta de valor central

**Para padres con hijos pequeños:** Tu voz cuenta cuentos a tus hijos, aunque vos estés
dormido, viajando, o simplemente agotado. No es un reproductor de audio. Es tu presencia.

**Diferenciador vs competencia anglosajona:**
- Español rioplatense nativo (no traducido)
- Cuentos con cultura latinoamericana (folklore, personajes, lugares)
- Caso de uso abuelos — el mayor diferenciador emocional no explotado
- Precio adaptado al poder adquisitivo LATAM

---

## Segmentos de usuarios

### Primario — Padres 28-42 años, hijos 2-10 años
**Dolor:** El niño se despierta a las 2am queriendo un cuento. El padre está agotado.
**Contexto AR:** Familia argentina promedio: 1-2 hijos, madre y padre trabajando.
**Canal:** Instagram, grupos de mamás/papás en WhatsApp, TikTok de crianza.
**Willingness to pay:** ARS 5.000-8.000/mes (equivalente ~$5 USD a tipo oficial).

### Secundario — Abuelos 55-70 años viviendo lejos del nieto
**Dolor:** Quieren estar presentes pero no pueden estar físicamente.
**Contexto AR:** Migración interna masiva (Bolívar → CABA, interior → GBA).
**Canal:** Los hijos son los que convencen a los abuelos de usarlo.
**Willingness to pay:** Regalo pago por los hijos. Un solo pago anual de $12 USD.

### Terciario — Padres viajeros por trabajo
**Dolor:** Viajan 1-2 semanas al mes, sus hijos los extrañan.
**Canal:** LinkedIn de profesionales con hijos, comunidades de nómades LATAM.
**Willingness to pay:** Más alto — el dolor es más agudo. $8-12/mes.

---

## Tiers de monetización

### Free
- 5 cuentos/mes generados con IA
- 1 voz clonada
- Reproducción solo online
- Atribución "Hecho con Vocito"

### Familiar — $5 USD/mes (ARS ~5.000)
- Cuentos ilimitados
- 3 voces clonadas (papá, mamá, abuelo)
- Descarga MP3
- Sin atribución
- Cuentos con nombre del niño

### Abuelo Gift — $12 USD/año (ARS ~12.000)
- 1 voz clonada (el abuelo)
- Asociado a 1 nieto
- Cuentos ilimitados
- Descarga MP3
- Regalo de cumpleaños / Navidad

---

## Unit Economics (estimación conservadora)

```
Costo de infraestructura por usuario activo/mes:

Chatterbox (HF Spaces ZeroGPU):     $0     (gratis mientras <quota)
Supabase free tier:                  $0     (hasta 500MB DB / 1GB Storage)
Gemini Flash API:                    $0     (1M tokens/día gratis)
Vercel:                              $0     (Hobby plan)
Railway backend:                     $0     (free tier 500 horas/mes)
                                    ─────
Costo hasta primeros ~100 usuarios:  $0/mes

Al escalar (post 500 usuarios activos):
Supabase Pro:                        $25/mes
Railway starter:                     $5/mes
Gemini (si supera free tier):        ~$0.075/1M tokens → ~$3/mes a 100 usuarios
HF Spaces GPU (si excede quota):     $9/mes (T4 GPU)
                                    ─────
Costo real escalado:                 ~$42/mes
Break-even: 9 usuarios pagos (tier Familiar)
```

---

## Modelo de adquisición (LATAM, costo $0)

### Canal 1: Grupos de WhatsApp de padres (orgánico)
- Una madre lo menciona → 30 madres del grupo lo prueban
- Viralidad inherente: "Tu voz contándole el cuento a mis hijos"
- Compartir el audio por WhatsApp es la demostración del producto

### Canal 2: TikTok / Instagram Reels
- Video: papá duerme, en pantalla se ve a la hija escuchando el cuento con la voz del papá
- Formato emotivo → altamente compartible
- No se necesita inversión — solo grabar el momento real

### Canal 3: SEO / contenido
- "cuento en tu voz para niños argentina"
- "app para contar cuentos a distancia"
- Artículos en portales de crianza argentinos (Huella, BabyCenter en español)

---

## Roadmap estratégico

### MVP (Mes 1-2) — Objetivo: 50 usuarios beta
- Módulos 1, 2, 3 funcionando
- Solo Free tier
- Onboarding manual por WhatsApp con los primeros usuarios

### V1 (Mes 3-4) — Objetivo: primeros $200/mes
- Tier Familiar activado (MercadoPago para Argentina)
- Biblioteca de cuentos propios (15 cuentos latinoamericanos pre-escritos)
- Compartir cuento por WhatsApp directo

### V2 (Mes 5-6) — Objetivo: $1000/mes
- Tier Abuelo Gift con gifting flow
- Conversación con la voz (el niño le "habla" al papá virtual)
- App nativa PWA instalable

### V3 (Mes 7-12) — Objetivo: escala o salida
- B2B: jardines de infantes, guarderías
- Expansión a México y Colombia (mercados más grandes)
- Evaluación: ¿levantar capital o vender a player EdTech?

---

## Métricas clave (KPIs)

```
Conversión free → pago:    objetivo 8% (benchmark SaaS LATAM: 5-12%)
Churn mensual:             objetivo < 5%
Cuentos generados/usuario: > 3/mes (señal de engagement real)
NPS:                       > 60 (producto emocional, expectativa alta)
CAC orgánico:              $0 (solo canal viral)
LTV estimado Familiar:     $5 × 18 meses = $90 USD
LTV Abuelo:                $12 × 3 años = $36 USD
```

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| HF Spaces GPU quota agotada | Media | Alto | Fallback a Chatterbox en Railway con GPU básica |
| Calidad de voz insatisfactoria | Media | Muy Alto | Test de calidad con muestra real antes del MVP |
| Privacidad de datos de voz | Alta (preocupación) | Alto | Disclaimer explícito + borrado de audio crudo post-clonación |
| Competidor anglosajón en LATAM | Baja (corto plazo) | Medio | Localización profunda como moat |
| Regulación de datos de menores | Media | Alto | No almacenar datos del niño, solo del adulto |
