export class WavEncoder {
  private audioContext: AudioContext;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private isRecording: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
  }

  startRecording(stream: MediaStream) {
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.isRecording = true;

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      this.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };

    this.mediaStreamSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stopRecording(): Blob {
    this.isRecording = false;

    if (this.processor && this.mediaStreamSource) {
      this.processor.disconnect();
      this.mediaStreamSource.disconnect();
    }

    // Concatenate all chunks
    const length = this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioData = new Float32Array(length);
    let offset = 0;
    for (const chunk of this.chunks) {
      audioData.set(chunk, offset);
      offset += chunk.length;
    }

    // Create WAV file
    const wavFile = this.createWavFile(audioData);
    return new Blob([wavFile], { type: 'audio/wav' });
  }

  private createWavFile(audioData: Float32Array): ArrayBuffer {
    const format = 1; // PCM
    const numChannels = 1; // Mono
    const sampleRate = this.audioContext.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const samples = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset, samples[i], true);
      offset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  close() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
