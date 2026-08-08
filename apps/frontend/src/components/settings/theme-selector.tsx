'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { parseThemePreference, type ThemePreference } from '@/lib/theme';

const options = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
] as const;

const themeChangeEvent = 'themechange';

function getThemePreference(): ThemePreference {
  return parseThemePreference(localStorage.getItem('theme'));
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function ThemeSelector() {
  const theme = useSyncExternalStore<ThemePreference>(subscribeToTheme, getThemePreference, () => 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function selectTheme(preference: ThemePreference) {
    localStorage.setItem('theme', preference);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <section className="rounded-panel border border-border-soft bg-card p-6 shadow-card">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-primary">Apariencia</h2>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          Elige cómo se muestra el sistema en este dispositivo.
        </p>
      </div>

      <div aria-label="Tema visual" className="grid grid-cols-2 gap-2" role="radiogroup">
        {options.map(({ value, label, icon: Icon }) => {
          const selected = theme === value;
          return (
            <button
              aria-checked={selected}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-control border text-sm font-bold transition ${
                selected
                  ? 'border-primary-accent bg-primary-soft text-primary'
                  : 'border-border-soft bg-surface-subtle text-text-secondary hover:border-primary-border'
              }`}
              key={value}
              onClick={() => selectTheme(value)}
              role="radio"
              type="button"
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
