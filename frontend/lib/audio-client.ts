'use client'

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: BlobPart[] = []
  private stream: MediaStream | null = null
  private startTime = 0
  private timerInterval: ReturnType<typeof setInterval> | null = null
  private mimeType = 'audio/webm'

  async start(onTick: (sec: number) => void): Promise<AnalyserNode> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(this.stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    // Use supported format — webm on Chrome, ogg on Firefox
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

  stop(): Promise<Blob> {
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.stream?.getTracks().forEach((t) => t.stop())

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob([], { type: this.mimeType }))
        return
      }
      this.mediaRecorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.mimeType }))
      }
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      } else {
        resolve(new Blob(this.chunks, { type: this.mimeType }))
      }
    })
  }
}
