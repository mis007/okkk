
import React, { useState, useEffect, useRef } from 'react';
import { GeminiLiveService } from '../services/global/geminiLiveService';
import { ChinaDirectService } from '../services/china/chinaDirectService';
import { RegionType, VoiceMessage, DEFAULT_SYSTEM_INSTRUCTION } from '../types';

const Waveform: React.FC<{ volume: number; isConnected: boolean }> = ({ volume, isConnected }) => {
  if (!isConnected) return null;
  const bars = Array.from({ length: 12 });
  return (
    <div className="flex items-center justify-center gap-1 h-8 w-full py-2">
      {bars.map((_, i) => {
        const factor = Math.sin((i / 12) * Math.PI) * 0.8 + 0.2;
        const height = Math.max(4, volume * 120 * factor);
        return (
          <div
            key={i}
            className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
            style={{ height: `${height}px`, opacity: volume > 0.01 ? 0.8 : 0.2 }}
          />
        );
      })}
    </div>
  );
};

const VoiceWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [region, setRegion] = useState<RegionType>(RegionType.GLOBAL);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [isSecure, setIsSecure] = useState(true);
  
  const [customInstruction, setCustomInstruction] = useState({
    [RegionType.GLOBAL]: DEFAULT_SYSTEM_INSTRUCTION.GLOBAL,
    [RegionType.CHINA_MAINLAND]: DEFAULT_SYSTEM_INSTRUCTION.CHINA_MAINLAND
  });

  const serviceRef = useRef<GeminiLiveService | ChinaDirectService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检测是否是 HTTPS 环境
    const secure = window.isSecureContext;
    setIsSecure(secure);
    if (!secure) {
      setError("检测到非 HTTPS 环境：语音功能将被浏览器禁用。请在安全环境下运行。");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isConnected, volume]);

  const toggleConnection = async () => {
    if (!isSecure) {
      setError("环境不安全：请使用 HTTPS 访问以开启麦克风权限。");
      return;
    }

    if (isConnected) {
      serviceRef.current?.disconnect();
      serviceRef.current = null;
      setIsConnected(false);
      setVolume(0);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const instruction = customInstruction[region];
      if (region === RegionType.CHINA_MAINLAND) {
        serviceRef.current = new ChinaDirectService();
        await (serviceRef.current as ChinaDirectService).connect({
          onVolume: (v) => setVolume(v * 2),
          onMessage: (text, isUser) => handleIncomingMessage(text, isUser),
          onError: (err) => handleConnectionError(err)
        }, instruction);
      } else {
        serviceRef.current = new GeminiLiveService();
        await (serviceRef.current as GeminiLiveService).connect({
          onVolume: (v) => setVolume(v * 2),
          onMessage: (text, isUser) => handleIncomingMessage(text, isUser),
          onError: (err) => handleConnectionError(err)
        }, instruction);
      }
      setIsConnected(true);
    } catch (err) {
      setError("连接失败: " + (err as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleIncomingMessage = (text: string, isUser: boolean) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      const role = isUser ? 'user' : 'model';
      if (last && last.role === role && (Date.now() - last.timestamp < 3000)) {
          return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: Math.random().toString(), role, text, timestamp: Date.now() }];
    });
  };

  const handleConnectionError = (err: any) => {
    setError(typeof err === 'string' ? err : "线路连接超时或中断");
    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  };

  const handleRegionChange = (newRegion: RegionType) => {
    if (isConnected) {
      serviceRef.current?.disconnect();
      setIsConnected(false);
      setVolume(0);
    }
    setRegion(newRegion);
    setMessages([]);
    setError(isSecure ? null : "非安全环境警报");
  };

  const updateInstruction = (val: string) => {
    setCustomInstruction(prev => ({ ...prev, [region]: val }));
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-[9999]">
      {isOpen && (
        <div className="w-[340px] md:w-[400px] h-[600px] mb-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'hover:bg-slate-100 text-slate-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">云语音助手</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></span>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{isConnected ? '在线' : '离线'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {showSettings && (
            <div className="p-4 border-b bg-indigo-50/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">助手性格设定 ({region})</label>
              <textarea value={customInstruction[region]} onChange={(e) => updateInstruction(e.target.value)} className="w-full h-24 p-3 text-xs rounded-2xl border border-indigo-100 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner" placeholder="比如：你是一个英语口语教练..."/>
            </div>
          )}

          <div className="p-3 bg-slate-50 flex gap-2">
            <button onClick={() => handleRegionChange(RegionType.GLOBAL)} className={`flex-1 py-2 text-[11px] rounded-xl font-bold transition-all ${region === RegionType.GLOBAL ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-white border'}`}>Global 线路</button>
            <button onClick={() => handleRegionChange(RegionType.CHINA_MAINLAND)} className={`flex-1 py-2 text-[11px] rounded-xl font-bold transition-all ${region === RegionType.CHINA_MAINLAND ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-500 hover:bg-white border'}`}>大陆物理专线</button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FDFDFD] flex flex-col">
            {!isSecure && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-[11px] text-amber-800 leading-normal">
                  <b>安全警报</b>：当前网站非 HTTPS 环境。麦克风将无法启动。请在部署到支持 SSL 的服务器后再使用。
                </p>
              </div>
            )}
            {messages.length === 0 && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 text-center px-10">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <p className="text-xs font-medium">随时准备为您服务<br/>请点击下方按钮开始说话</p>
              </div>
            )}
            {error && <div className="p-4 bg-rose-50 text-rose-600 text-[11px] rounded-2xl border border-rose-100 font-medium">{error}</div>}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>{m.text}</div>
              </div>
            ))}
            {isConnected && (
              <div className="sticky bottom-0 left-0 right-0 py-4 flex flex-col items-center">
                <Waveform volume={volume} isConnected={isConnected} />
              </div>
            )}
          </div>

          <div className="p-8 border-t bg-white flex flex-col items-center justify-center relative">
            {isConnected && (
              <div 
                className="absolute w-20 h-20 rounded-full border-[3px] border-indigo-400 opacity-20 pointer-events-none transition-transform duration-100" 
                style={{ transform: `scale(${1 + volume * 2.5})` }}
              ></div>
            )}
            <button 
              onClick={toggleConnection} 
              disabled={isConnecting} 
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-90 z-10 ${isConnected ? 'bg-rose-500 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'} ${isConnecting ? 'animate-pulse opacity-50' : ''}`}
            >
              {isConnected ? (
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V3c0-1.1-.9-2-2-2zM7 9a1 1 0 00-2 0 7 7 0 0014 0 1 1 0 00-2 0 5 5 0 01-10 0z"></path></svg>
              )}
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-slate-800 transition-all transform hover:scale-110 active:scale-95"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
    </div>
  );
};

export default VoiceWidget;
