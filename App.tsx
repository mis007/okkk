
import React, { useState } from 'react';
import VoiceWidget from './components/VoiceWidget';

const App: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const integrationCode = `
<!-- 1. 引入 Tailwind (如果你的页面没用的话) -->
<link href="https://cdn.staticfile.org/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">

<!-- 2. 配置配置项 (可选) -->
<script>
  window.process = { env: { API_KEY: "你的密钥" } };
</script>

<!-- 3. 引入插件脚本 -->
<script type="module" src="https://your-deploy-url/index.tsx"></script>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(integrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-slate-50 relative overflow-x-hidden">
      <div className="w-full max-w-4xl mt-16 mb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-8 text-[10px] font-black tracking-[0.3em] text-red-600 uppercase bg-red-50 rounded-full border border-red-100">
          MAINLAND CHINA OPTIMIZED
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
          Gemini Voice <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-500">
            大陆专线独立版
          </span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          集成胜算云物理隔离网关。无需翻墙，针对大陆网络深度调优，实现秒级语音响应。
        </p>
      </div>

      {/* 集成控制台 */}
      <div className="w-full max-w-4xl bg-slate-900 rounded-[40px] p-8 md:p-12 mb-24 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white text-2xl font-black">一键集成到您的网站</h2>
            <button 
              onClick={handleCopy}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {copied ? '已复制！' : '点击复制集成代码'}
            </button>
          </div>
          
          <div className="bg-black/40 rounded-2xl p-6 font-mono text-sm text-blue-300 overflow-x-auto border border-white/5">
            <pre>{integrationCode}</pre>
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>大陆物理专线</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>支持 React / Vue / HTML</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>自适应移动端</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mb-24">
        <div className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 transition-all duration-500">
          <h3 className="text-2xl font-black text-slate-800 mb-4">大陆专线</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            内置 <code>router.shengsuanyun.com</code> 网关支持，确保请求在大陆网络环境下 100% 可达。
          </p>
        </div>
        <div className="group bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 transition-all duration-500">
          <h3 className="text-2xl font-black text-slate-800 mb-4">即插即用</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            只需在页面引入脚本即可挂载。UI 面板自动处理 HTTPS 环境检测与麦克风授权。
          </p>
        </div>
      </div>

      <VoiceWidget />

      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-50 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-50 rounded-full blur-[140px]"></div>
      </div>
    </div>
  );
};

export default App;
