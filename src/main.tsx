import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign sandbox/iframe WebSocket and WebChannel stream reconnect warnings from triggering error overlays
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('WebSocket closed') ||
      msg.includes('vite') ||
      msg.includes('WebChannelConnection') ||
      msg.includes('RPC')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
