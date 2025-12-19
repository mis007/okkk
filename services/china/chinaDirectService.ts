
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../../utils/audioUtils';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../../types';

/**
 * 【大陆物理专线版】
 * 专门针对中国大陆环境优化，使用胜算云路由中转。
 */
export class ChinaDirectService {
  private ai: any;
  private session: any;
  private audioContextOut: AudioContext | null = null;
  private audioContextIn: AudioContext | null = null;
  private nextStartTime = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private stream: MediaStream | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY || '',
      // 强制指向胜算云路由
      baseUrl: 'https://router.shengsuanyun.com' 
    });
  }

  async connect(
    callbacks: {
      onMessage: (text: string, isUser: boolean) => void;
      onVolume: (volume: number) => void;
      onError: (err: any) => void;
    },
    systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION.CHINA_MAINLAND
  ) {
    if (!window.isSecureContext) {
      callbacks.onError("浏览器安全策略：必须在 HTTPS 环境下才能启动麦克风。");
      return;
    }

    this.audioContextOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.audioContextIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      callbacks.onError("无法调用麦克风，请检查浏览器权限设置或是否开启了 HTTPS。");
      return;
    }

    try {
      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("[China Direct] 隧道建立成功，实时语音已激活。");
            if (!this.stream || !this.audioContextIn) return;
            const source = this.audioContextIn.createMediaStreamSource(this.stream);
            const scriptProcessor = this.audioContextIn.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
              const inputData = event.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              callbacks.onVolume(Math.sqrt(sum / inputData.length));
              
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session: any) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(this.audioContextIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) callbacks.onMessage(message.serverContent.outputTranscription.text, false);
            if (message.serverContent?.inputTranscription) callbacks.onMessage(message.serverContent.inputTranscription.text, true);
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.audioContextOut) {
              this.nextStartTime = Math.max(this.nextStartTime, this.audioContextOut.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), this.audioContextOut, 24000, 1);
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
          onerror: (e: any) => {
            console.error("[专线异常]", e);
            callbacks.onError("连接不稳定或 Key 无效，请检查胜算云后台。");
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction,
        }
      });
      this.session = await sessionPromise;
    } catch (err) {
      callbacks.onError("初始化连接失败：" + (err as Error).message);
    }
  }

  disconnect() {
    if (this.session) this.session.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.sources.forEach(s => s.stop());
    this.sources.clear();
  }
}
