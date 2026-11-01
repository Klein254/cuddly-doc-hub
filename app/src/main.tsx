import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { isNativeApp } from './lib/platform';
import { init } from './lib/store';
import './index.css';

// The installed apps ship their files inside the installer, so only the website needs the offline worker.
if (!isNativeApp) registerSW({ immediate: true });
init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
