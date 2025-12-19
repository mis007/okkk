
import React, { useState, useEffect, useRef } from 'react';
import { GeminiLiveService } from '../services/geminiLiveService';
import { ChinaDirectService } from '../services/chinaDirectService';
import { RegionType, VoiceMessage, DEFAULT_SYSTEM_INSTRUCTION } from '../types';

const Waveform: React.FC<{ volume: number; isConnected: boolean }> = ({ volume, isConnected }) => {
  if (!isConnected) return null;

  // We create 12 bars for the waveform
  const bars = Array.from({ length: 12 });

  return (
    <div className="flex items-center justify-center gap-1 h-8 w-full py-2">
      {bars.map((_, i) => {
        // Create a pseudo-randomized waveform effect using the single volume value
        // We use a sine wave + volume to make the bars look different
        const factor = Math.sin((i / 12) * Math.PI) * 0.8 + 0.2;
        const height = Math.max(4, volume * 100 * factor);
        
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
  
  // Custom system instruction state
  const [customInstruction, setCustomInstruction] = useState({
    [RegionType.GLOBAL]: DEFAULT_SYSTEM_INSTRUCTION.GLOBAL,
    [RegionType.CHINA_MAINLAND]: DEFAULT_SYSTEM_INSTRUCTION.CHINA_MAINLAND
  });

  const serviceRef = useRef<GeminiLiveService | ChinaDirectService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isConnected, volume]);

  const toggleConnection = async () => {
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
      setError("初始化失败");
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
    setError(typeof err === 'string' ? err : "连接错误");
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
    setError(null);
  };

  const updateInstruction = (val: string) => {
    setCustomInstruction(prev => ({
      ...prev,
      [region]: val
    }));
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {isOpen && (
        <div className="w-80 md:w-96 h-[550px] mb-4 glassmorphism rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 border-b bg-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                title="AI Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Gemini Voice Cloud</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Settings Overlay */}
          {showSettings && (
            <div className="p-4 border-b bg-indigo-50/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                System Instruction ({region === RegionType.GLOBAL ? 'Global' : 'China'})
              </label>
              <textarea 
                value={customInstruction[region]}
                onChange={(e) => updateInstruction(e.target.value)}
                className="w-full h-24 p-2 text-xs rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="How should the AI behave?"
              />
              <p className="text-[10px] text-indigo-700 italic">
                * Reconnect required for changes to take effect.
              </p>
            </div>
          )}

          {/* Region Selector */}
          <div className="p-3 bg-slate-50/80 flex gap-2">
            <button 
              onClick={() => handleRegionChange(RegionType.GLOBAL)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all ${region === RegionType.GLOBAL ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              Global Line
            </button>
            <button 
              onClick={() => handleRegionChange(RegionType.CHINA_MAINLAND)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all ${region === RegionType.CHINA_MAINLAND ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              大陆专线 (CN)
            </button>
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 flex flex-col">
            {messages.length === 0 && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm text-center px-8">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <p>Click the microphone to start a {region === RegionType.CHINA_MAINLAND ? 'CN-optimized' : 'global'} voice session</p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                {error}
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {/* Waveform Visualization inside Chat area */}
            {isConnected && (
              <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50/90 to-transparent pb-2 pt-4 flex flex-col items-center">
                <Waveform volume={volume} isConnected={isConnected} />
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  {volume > 0.05 ? 'Capturing Audio' : 'Microphone Active'}
                </span>
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="p-6 border-t bg-white flex flex-col items-center gap-4 relative">
            {/* Visualizer Ring (Background Pulse) */}
            {isConnected && (
              <div 
                className="absolute w-24 h-24 rounded-full border-2 border-indigo-400 opacity-20 pointer-events-none transition-transform duration-75"
                style={{ transform: `scale(${1 + volume * 1.5})` }}
              ></div>
            )}
            
            <button 
              onClick={toggleConnection}
              disabled={isConnecting}
              style={{ transform: isConnected ? `scale(${1 + volume * 0.4})` : 'scale(1)' }}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-75 transform hover:scale-105 active:scale-95 z-10 ${isConnected ? 'bg-red-500 hover:bg-red-600 shadow-red-200 shadow-2xl' : 'bg-indigo-600 hover:bg-indigo-700'} ${isConnecting ? 'animate-pulse opacity-50' : ''}`}
            >
              {isConnected ? (
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              )}
            </button>
            <p className="text-xs text-slate-400 font-medium">
              {isConnected ? (volume > 0.05 ? 'AI is listening...' : 'Say something...') : 'Tap to start conversation'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Launcher */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-indigo-700 transition-all transform hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </button>
    </div>
  );
};

export default VoiceWidget;
