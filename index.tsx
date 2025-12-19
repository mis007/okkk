
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import VoiceWidget from './components/VoiceWidget';

// 检查是否在演示模式（App.tsx 包含完整页面）
const rootElement = document.getElementById('root');

if (rootElement) {
  // 演示模式：渲染完整演示页
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // 插件模式：如果页面没有 root，则自动在 Body 创建一个挂载点只渲染语音球
  const pluginContainer = document.createElement('div');
  pluginContainer.id = 'gemini-voice-plugin-root';
  document.body.appendChild(pluginContainer);
  
  const root = ReactDOM.createRoot(pluginContainer);
  root.render(<VoiceWidget />);
  console.log("%c Gemini Voice Plugin Loaded %c 大陆专线已就绪 ", "color:white;background:#1e293b;padding:4px;border-radius:4px 0 0 4px", "color:white;background:#dc2626;padding:4px;border-radius:0 4px 4px 0");
}
