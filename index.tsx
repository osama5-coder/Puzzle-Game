import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Global error reporter to catch and show errors that cause black screens
window.onerror = (message, source, lineno, colno, error) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #020617; color: #ef4444; padding: 20px; font-family: monospace; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">NEBULA SYSTEM CRITICAL ERROR</h1>
        <p style="color: #94a3b8; font-size: 14px;">The simulation failed to initialize.</p>
        <pre style="background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #ef444455; max-width: 90%; overflow: auto; text-align: left; margin-top: 20px;">${message}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">REBOOT SYSTEM</button>
      </div>
    `;
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Nebula Error: Root element not found in DOM.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);