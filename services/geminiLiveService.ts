
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../types';

export class GeminiLiveService {
  private ai: any;
  private session: any;
  private audioContextOut: AudioContext | null = null;
  private audioContextIn: AudioContext | null = null;
  private nextStartTime = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private stream: MediaStream | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async connect(
    callbacks: {
      onMessage: (text: string, isUser: boolean) => void;
      onVolume: (volume: number) => void;
      onError: (err: any) => void;
    },
    systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION.GLOBAL
  ) {
    this.audioContextOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.audioContextIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      callbacks.onError("Microphone access denied");
      return;
    }

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          if (!this.stream || !this.audioContextIn) return;
          const source = this.audioContextIn.createMediaStreamSource(this.stream);
          const scriptProcessor = this.audioContextIn.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            
            // Real-time volume detection (RMS)
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            callbacks.onVolume(rms);

            const pcmBlob = createPcmBlob(inputData);
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(this.audioContextIn.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            callbacks.onMessage(message.serverContent.outputTranscription.text, false);
          }
          if (message.serverContent?.inputTranscription) {
            callbacks.onMessage(message.serverContent.inputTranscription.text, true);
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.audioContextOut) {
            this.nextStartTime = Math.max(this.nextStartTime, this.audioContextOut.currentTime);
            const audioBuffer = await decodeAudioData(
              decode(base64Audio),
              this.audioContextOut,
              24000,
              1
            );
            const source = this.audioContextOut.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContextOut.destination);
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
            source.onended = () => this.sources.delete(source);
          }

          if (message.serverContent?.interrupted) {
            this.sources.forEach(s => s.stop());
            this.sources.clear();
            this.nextStartTime = 0;
          }
        },
        onerror: (e: any) => callbacks.onError(e),
        onclose: () => console.log('Session closed'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: systemInstruction,
      }
    });

    this.session = await sessionPromise;
  }

  disconnect() {
    if (this.session) this.session.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.sources.forEach(s => s.stop());
    this.sources.clear();
  }
}
