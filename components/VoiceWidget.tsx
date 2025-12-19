
import React, { useState, useEffect, useRef } from 'react';
import { ChinaDirectService } from '../services/china/chinaDirectService';
import { VoiceMessage, DEFAULT_SYSTEM_INSTRUCTION } from '../types';

type StepId = 'HTTPS' | 'MIC' | 'GATEWAY' | 'TUNNEL' | 'READY';
interface DiagnosticStep {
  id: StepId;
  label: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMsg?: string;
}

const Waveform: React.FC<{ volume: number; isConnected: boolean }> = ({ volume, isConnected }) => {
  if (!isConnected) return null;
  const bars = Array.from({ length: 12 });
  return (
    <div className="flex items-center justify-center space-x-1 h-8 w-full py-2">
      {bars.map((_, i) => {
        const factor = Math.sin((i / 12) * Math.PI) * 0.8 + 0.2;
        const height = Math.max(4, volume * 120 * factor);
        return (
          <div key={i} className="w-1 bg-blue-600 rounded-full transition-all duration-75" style={{ height: `${height}px`, opacity: volume > 0.01 ? 0.8 : 0.2 }} />
        );
      })}
    </div>
  );
};

const VoiceWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [diagSteps, setDiagSteps] = useState<DiagnosticStep[]>([
    { id: 'HTTPS', label: '1. 安全环境检测 (HTTPS)', status: 'idle' },
    { id: 'MIC', label: '2. 麦克风硬件调用', status: 'idle' },
    { id: 'GATEWAY', label: '3. 胜算云大陆网关握手', status: 'idle' },
    { id: 'TUNNEL', label: '4. Gemini 实时引擎挂载', status: 'idle' },
    { id: 'READY', label: '5. 双向语音流就绪', status: 'idle' },
  ]);

  const serviceRef = useRef<ChinaDirectService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateStep = (id: StepId, status: DiagnosticStep['status'], errorMsg?: string) => {
    setDiagSteps(prev => prev.map(s => s.id === id ? { ...s, status, errorMsg } : s));
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, volume]);

  const toggleConnection = async () => {
    if (isConnected) {
      serviceRef.current?.disconnect();
      serviceRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
      setVolume(0);
      return;
    }

    setIsConnecting(true);
    setError(null);
    setDiagSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    try {
      // 1. HTTPS
      updateStep('HTTPS', window.isSecureContext ? 'success' : 'error', window.isSecureContext ? undefined : '请使用 HTTPS 访问');
      if (!window.isSecureContext) throw new Error("HTTPS Required");

      // 2. MIC
      updateStep('MIC', 'loading');
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStream.getTracks().forEach(t => t.stop());
      updateStep('MIC', 'success');

      // 3. GATEWAY
      updateStep('GATEWAY', 'loading');
      const service = new ChinaDirectService();
      serviceRef.current = service;
      updateStep('GATEWAY', 'success');

      // 4 & 5. TUNNEL & READY
      updateStep('TUNNEL', 'loading');
      updateStep('READY', 'loading');

      await service.connect({
        onReady: () => {
          updateStep('TUNNEL', 'success');
          updateStep('READY', 'success');
          setIsConnected(true);
          setIsConnecting(false);
        },
        onVolume: (v) => setVolume(v * 2),
        onMessage: (text, isUser) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const role = isUser ? 'user' : 'model';
            if (last && last.role === role && Date.now() - last.timestamp < 3000) {
              return [...prev.slice(0, -1), { ...last, text: last.text + text }];
            }
            return [...prev, { id: Math.random().toString(), role, text, timestamp: Date.now() }];
          });
        },
        onError: (err) => {
          setError("连接中断：" + err);
          setIsConnected(false);
          setIsConnecting(false);
          updateStep('TUNNEL', 'error', err);
          updateStep('READY', 'error');
        }
      }, DEFAULT_SYSTEM_INSTRUCTION.CHINA_MAINLAND);

    } catch (err: any) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {isOpen && (
        <div className="w-80 md:w-96 h-128 mb-4 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
          <div className="p-5 border-b flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-200">CN</div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">大陆优化版语音助手</h3>
                <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">胜算云专线负载中</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {(isConnecting || (!isConnected && error)) && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                {diagSteps.map(step => (
                  <div key={step.id} className="flex items-center justify-between text-[11px] font-bold">
                    <span className={step.status === 'error' ? 'text-red-500' : 'text-slate-600'}>{step.label}</span>
                    {step.status === 'loading' && <span className="animate-pulse text-blue-500">连接中...</span>}
                    {step.status === 'success' && <span className="text-green-500">●</span>}
                    {step.status === 'error' && <span className="text-red-500">×</span>}
                  </div>
                ))}
              </div>
            )}

            {messages.length === 0 && !isConnecting && !error && (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <p className="text-xs font-bold text-slate-500">点击下方按钮，开始中文对话</p>
              </div>
            )}

            {error && <div className="p-4 bg-red-50 text-red-600 text-[11px] rounded-2xl border border-red-100 font-bold leading-relaxed">{error}</div>}
            
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{m.text}</div>
              </div>
            ))}
            <Waveform volume={volume} isConnected={isConnected} />
          </div>

          <div className="p-8 border-t bg-white flex flex-col items-center">
            <button 
              onClick={toggleConnection} 
              disabled={isConnecting && !error} 
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${isConnected ? 'bg-red-500' : 'bg-slate-900'}`}
            >
              {isConnected ? (
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V3c0-1.1-.9-2-2-2zM7 9a1 1 0 00-2 0 7 7 0 0014 0 1 1 0 00-2 0 5 5 0 01-10 0z"></path></svg>
              )}
            </button>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isConnected ? '正在通话' : isConnecting ? '建立专线连接' : '点击开启智能对话'}</p>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 ${isOpen ? 'bg-red-500' : 'bg-slate-900'}`}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
    </div>
  );
};

export default VoiceWidget;
