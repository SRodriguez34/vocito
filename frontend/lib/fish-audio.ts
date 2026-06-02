const FISH_BASE = 'https://api.fish.audio'

// Server-only: uses FISH_AUDIO_API_KEY
export async function cloneVoice(audioBlob: Blob, name: string): Promise<string> {
  const form = new FormData()
  form.append('visibility', 'private')
  form.append('type', 'tts')
  form.append('train_mode', 'fast')
  form.append('title', name)
  form.append('voices', audioBlob, 'reference.wav')

  const res = await fetch(`${FISH_BASE}/model`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Fish Audio clone failed: ${res.status} — ${body}`)
  }
  const data = await res.json()
  return data._id as string
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
