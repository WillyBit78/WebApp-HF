import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ─── Pre-React localStorage cleanup ───
// Purge any oversized entries left by old sessions (selfie Base64 photos)
// This MUST run before React mounts to prevent QuotaExceededError
try {
  const keysToCheck = ['hf_current_user', 'hf_users_data', 'hf_audit_logs'];
  for (const key of keysToCheck) {
    const val = localStorage.getItem(key);
    if (val && val.length > 50000) {
      console.warn(`[Startup] Purging oversized localStorage key "${key}" (${val.length} chars)`);
      localStorage.removeItem(key);
    }
  }
} catch (e) {
  // If localStorage is completely full, nuke everything
  try { localStorage.clear(); } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for PWA Android Chrome compatibility
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('PWA ServiceWorker registrado con éxito:', registration.scope);
    }).catch((err) => {
      console.log('Error registrando ServiceWorker:', err);
    });
  });
}
