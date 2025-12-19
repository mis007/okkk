
import React from 'react';
import VoiceWidget from './components/VoiceWidget';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-slate-50 relative overflow-x-hidden">
      {/* 头部区域 */}
      <div className="w-full max-w-4xl mt-16 mb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-8 text-[10px] font-black tracking-[0.3em] text-indigo-600 uppercase bg-indigo-50 rounded-full border border-indigo-100">
          STABLE & HOT-SWAPPABLE
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
          Gemini Voice <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-500">
            热插拔智能云
          </span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          物理隔离的大陆专线，专为极致体验而生。只需一行脚本，激活智能交互。
        </p>
      </div>

      {/* 核心卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-24">
        
        <div className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-transparent transition-all duration-500">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">01</div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">极简集成</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
            无需繁琐配置，通过 <b>index.tsx</b> 自动挂载技术，实现秒级上线。
          </p>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <code className="text-[10px] text-slate-400 font-mono">script:module:src="./index.tsx"</code>
          </div>
        </div>

        <div className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-transparent transition-all duration-500">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center font-black text-xl mb-8 group-hover:bg-rose-500 group-hover:text-white transition-colors">02</div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">物理隔离</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            <code>/services/china/</code> 目录独立路由，确保大陆地区数据传输低延迟且不混叠。
          </p>
        </div>

        <div className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-transparent transition-all duration-500">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl mb-8 group-hover:bg-amber-500 group-hover:text-white transition-colors">03</div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">语音感知</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            实时 RMS 音量检测，通过动态波形算法直观反馈 AI 倾听状态。
          </p>
        </div>
      </div>

      {/* 部署警告 */}
      <div className="max-w-2xl w-full bg-slate-900 p-8 rounded-[32px] shadow-2xl flex items-start gap-6 mb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="text-3xl">🔒</div>
        <div>
          <h4 className="font-black text-white text-lg mb-2">部署先决条件</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            为了确保麦克风能正常开启，您的网站必须开启 <b>HTTPS</b>。如果您在非加密环境使用，语音球会通过红色横幅提示您。
          </p>
        </div>
      </div>

      {/* 挂载语音组件 */}
      <VoiceWidget />

      {/* 全局背景装饰 */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-50 rounded-full blur-[140px]"></div>
      </div>
    </div>
  );
};

export default App;
