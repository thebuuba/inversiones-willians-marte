'use client';

import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';

const DISMISSED_KEY = 'ios-pwa-install-hint-dismissed';

export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      navigatorWithStandalone.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    setVisible(
      isIos &&
        !isStandalone &&
        localStorage.getItem(DISMISSED_KEY) !== 'true',
    );
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  return (
    <aside
      aria-label="Instalar aplicación"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-panel border border-primary-border bg-card p-4 text-text-primary shadow-modal lg:left-auto lg:right-5 lg:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control-comfortable bg-primary-soft text-primary-accent">
          <Share className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Instalar Inversiones en tu iPhone</p>
          <p className="mt-1 text-sm leading-5 text-text-secondary">
            En Safari, pulsa Compartir y luego “Añadir a pantalla de inicio”.
          </p>
        </div>
        <button
          aria-label="Cerrar indicación de instalación"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-page"
          onClick={dismiss}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
