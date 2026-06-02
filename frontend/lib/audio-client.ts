'use client'

// Encode AudioBuffer to WAV (PCM 16-bit, mono)
function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1 // mono — Fish Audio solo necesita 1 canal
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.getChannelData(0) // use channel 0
  const numSamples = samples.length
  const dataLength = numSamples * 2 // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  function writeStr(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  function writeUint32(offset: number, val: number) { view.setUint32(offset, val, true) }
  function writeUint16(offset: number, val: number) { view.setUint16(offset, val, true) }

  // RIFF header
  writeStr(0, 'RIFF')
  writeUint32(4, 36 + dataLength)
  writeStr(8, 'WAVE')
  // fmt chunk
  writeStr(12, 'fmt ')
  writeUint32(16, 16)          // chunk size
  writeUint16(20, 1)           // PCM
  writeUint16(22, numChannels)
  writeUint32(24, sampleRate)
  writeUint32(28, sampleRate * numChannels * 2) // byte rate
  writeUint16(32, numChannels * 2)              // block align
  writeUint16(34, 16)          // bits per sample
  // data chunk
  writeStr(36, 'data')
  writeUint32(40, dataLength)
  // PCM samples — clamp to [-1, 1] then convert to int16
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return buffer
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private stream: MediaStream | null = null
  private startTime = 0
  private timerInterval: ReturnType<typeof setInterval> | null = null
  private mimeType = 'audio/webm'

  async start(onTick: (sec: number) => void): Promise<AnalyserNode> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(this.stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    this.mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/ogg'

    this.chunks = []
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.mimeType })
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(100)

    this.startTime = Date.now()
    this.timerInterval = setInterval(() => {
      onTick(Math.floor((Date.now() - this.startTime) / 1000))
    }, 1000)

    return analyser
  }

  // Returns WAV blob — Fish Audio accepts WAV reliably
  stop(): Promise<Blob> {
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.stream?.getTracks().forEach((t) => t.stop())

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder no inicializado'))
        return
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const rawBlob = new Blob(this.chunks, { type: this.mimeType })
          const arrayBuffer = await rawBlob.arrayBuffer()
          const audioCtx = new AudioContext()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          const wavBuffer = encodeWav(audioBuffer)
          resolve(new Blob([wavBuffer], { type: 'audio/wav' }))
        } catch (err) {
          reject(err)
        }
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      } else {
        this.mediaRecorder.onstop?.(new Event('stop'))
      }
    })
  }
}
