'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { resolveTheme, themes, type ThemePreference } from '@/lib/theme';

const options = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

const themeChangeEvent = 'themechange';

function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem('theme');
  return themes.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
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
  const theme = useSyncExternalStore<ThemePreference>(subscribeToTheme, getThemePreference, () => 'system');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () =>
      (document.documentElement.dataset.theme = resolveTheme(theme, media.matches));

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
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

      <div aria-label="Tema visual" className="grid grid-cols-3 gap-2" role="radiogroup">
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
