'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA still works as a regular web app if registration fails. */
    });
  }, []);

  return null;
}
