
export enum RegionType {
  GLOBAL = 'GLOBAL',
  CHINA_MAINLAND = 'CHINA_MAINLAND'
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
}

export const DEFAULT_SYSTEM_INSTRUCTION = {
  GLOBAL: "You are a helpful and fast voice assistant. Keep responses brief for conversational speed.",
  CHINA_MAINLAND: "你是一个高效、快速的语音助手。针对中国大陆用户提供流畅的服务。请使用中文回答。"
};
