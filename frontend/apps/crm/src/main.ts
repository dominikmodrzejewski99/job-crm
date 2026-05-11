import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Register the PWA service worker. Skipped in dev (file:// origins,
// no-https environments) and after bootstrap so it doesn't block the
// initial render.
if ('serviceWorker' in navigator && location.protocol === 'https:' ||
    location.hostname === 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed', err));
  });
}
