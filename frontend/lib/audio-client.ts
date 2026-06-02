'use client'

export interface RecordingState {
  isRecording: boolean
  durationSec: number
  analyserNode: AnalyserNode | null
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private stream: MediaStream | null = null
  private startTime = 0
  private timerInterval: ReturnType<typeof setInterval> | null = null

  async start(onTick: (sec: number) => void): Promise<AnalyserNode> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(this.stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    this.chunks = []
    this.mediaRecorder = new MediaRecorder(this.stream)
    this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data)
    this.mediaRecorder.start(100)

    this.startTime = Date.now()
    this.timerInterval = setInterval(() => {
      onTick(Math.floor((Date.now() - this.startTime) / 1000))
    }, 1000)

    return analyser
  }

  stop(): Blob {
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.mediaRecorder?.stop()
    this.stream?.getTracks().forEach((t) => t.stop())
    return new Blob(this.chunks, { type: 'audio/wav' })
  }
}
