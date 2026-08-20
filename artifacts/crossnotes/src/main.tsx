import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';
import './premium.css';
import './crossnotes.css';

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline support is progressive enhancement; the study app remains usable without it.
    });
  });
}
