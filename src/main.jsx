import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ─── Pre-React localStorage cleanup ───
// The app no longer uses localStorage (all data lives in Supabase).
// Clear any legacy entries left by old versions to prevent QuotaExceededError.
try { localStorage.clear(); } catch (_) {}

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
