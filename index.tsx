
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 插件自初始化逻辑
 * 允许用户通过一行 <script type="module" src="..."></script> 即可在任何页面启用
 */
function initVoicePlugin() {
  const MOUNT_ID = 'gemini-voice-plugin-root';
  
  // 1. 检查是否已经存在挂载点
  let rootElement = document.getElementById(MOUNT_ID);
  
  // 2. 如果不存在，动态创建一个容器并挂载到 body
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = MOUNT_ID;
    document.body.appendChild(rootElement);
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Gemini Voice Cloud Plugin initialized.");
  } catch (err) {
    console.error("❌ Failed to mount Gemini Voice Plugin:", err);
  }
}

// 确保 DOM 加载完成后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVoicePlugin);
} else {
  initVoicePlugin();
}
