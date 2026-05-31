
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './App.css'
import './index.css'
import 'vis-network/styles/vis-network.css'
import './i18n.ts' // Explicit file extension

// Auto-recover from stale dynamic chunk errors after a new deploy.
// When the browser holds an old index.html that references hashed chunks
// that no longer exist, the dynamic import throws "Failed to fetch
// dynamically imported module". A single hard reload fixes it.
if (typeof window !== 'undefined') {
  const RELOAD_KEY = '__chunk_reload_attempted__';
  const isChunkError = (msg?: string) =>
    !!msg && (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Unable to preload CSS') ||
      msg.includes('Failed to load stylesheet')
    );
  const tryReload = () => {
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, '1');
    window.location.reload();
  };
  window.addEventListener('error', (e) => {
    if (isChunkError(e?.message)) tryReload();
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: any = e?.reason;
    if (isChunkError(reason?.message ?? String(reason))) tryReload();
  });
  // Clear the guard once the app loads successfully.
  window.addEventListener('load', () => {
    setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 2000);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
