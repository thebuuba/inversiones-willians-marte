'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      if ('caches' in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
      return;
    }
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    navigator.serviceWorker.register('/sw.js?v=4').catch(() => {
      /* PWA still works as a regular web app if registration fails. */
    });
  }, []);

  return null;
}
