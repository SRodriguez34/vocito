import { logger } from './logger'

export interface StoryParams {
  childName?: string
  parentName?: string
  ageTarget: number
  theme: string
  durationMin: number
}

export interface StoryResult {
  content: string
  tierUsed: 0 | 1 | 2
}

const SYSTEM_PROMPT = `Sos un narrador de cuentos infantiles argentino.
Escribís cuentos cálidos, creativos y culturalmente resonantes para niños latinoamericanos.
Usás español rioplatense natural, nunca forzado.
Tus cuentos tienen estructura clara: inicio, nudo, desenlace.
Evitás moralizar de forma obvia — los valores emergen de la historia.
El texto debe sonar bien leído en voz alta: frases cortas, ritmo musical.`

function buildPrompt(p: StoryParams): string {
  const words = p.durationMin * 130
  return `Escribí un cuento para un niño de ${p.ageTarget} años.
Tema: ${p.theme}.
Palabras aproximadas: ${words}.
${p.childName ? `Protagonista: ${p.childName}.` : ''}
${p.parentName ? `El papá/mamá en el cuento se llama ${p.parentName}.` : ''}

Devolvé ÚNICAMENTE el texto del cuento. Sin título, sin introducción, sin "---".`
}

// Tier 0: static fallback — no internet needed
function fallback(p: StoryParams): string {
  const name = p.childName ?? 'Luca'
  return `Había una vez ${name}, que vivía en un pueblo donde las estrellas contaban historias. ` +
    `Una noche, mientras miraba el cielo desde su ventana, una estrella se desprendió y cayó suavemente en su jardín. ` +
    `${name} salió de puntitas para no despertar a nadie y encontró una lucecita parpadeando entre las flores. ` +
    `"Me perdí", dijo la estrella con una voz muy finita. "¿Me ayudás a volver?" ` +
    `${name} pensó un momento y dijo: "Claro. Juntos encontramos el camino." ` +
    `Se tomaron de la mano —una mano chiquita y una de luz— y caminaron hasta el lugar más alto del pueblo. ` +
    `Desde ahí, la estrella vio a sus amigas y de un saltito volvió al cielo. ` +
    `Antes de irse, dejó en la mano de ${name} un brillo dorado que duró toda la noche. ` +
    `Y así, ${name} aprendió que ayudar a alguien perdido es la aventura más grande de todas.`
}

// Tier 1: Gemini 2.0 Flash
async function gemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const json = await res.json()
  return json.candidates[0].content.parts[0].text as string
}

// Tier 2: Groq llama-3.3-70b
async function groq(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.85,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const json = await res.json()
  return json.choices[0].message.content as string
}

export async function generateStory(params: StoryParams): Promise<StoryResult> {
  const prompt = buildPrompt(params)

  try {
    logger.info('story-gen: Gemini Flash (Tier 1)')
    const content = await gemini(prompt)
    return { content, tierUsed: 1 }
  } catch (e) {
    logger.warn('story-gen: Gemini failed', { error: String(e) })
  }

  try {
    logger.info('story-gen: Groq fallback (Tier 2)')
    const content = await groq(prompt)
    return { content, tierUsed: 2 }
  } catch (e) {
    logger.warn('story-gen: Groq failed', { error: String(e) })
  }

  logger.warn('story-gen: using static fallback (Tier 0)')
  return { content: fallback(params), tierUsed: 0 }
}
