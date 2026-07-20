'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { GlobalSearchResult, GlobalSearchRole } from '@inversiones/shared';
import { globalSearch } from '@/lib/api/search';

const roleLabels: Record<GlobalSearchRole, string> = {
  CLIENT: 'Cliente',
  LOAN: 'Préstamo',
  INVESTOR: 'Inversionista',
  BORROWER: 'Prestatario',
};

export function GlobalSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setResults(await globalSearch(normalizedQuery, controller.signal));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const showPanel = open && normalizedQuery.length >= 2;

  return (
    <div className="relative w-full max-w-xl" ref={containerRef}>
      <div className="flex h-10 items-center gap-3 rounded-full border border-primary-border bg-page px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-soft">
        <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-expanded={showPanel}
          aria-label="Buscar en todo el sistema"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            setLoading(nextQuery.trim().length >= 2);
            if (nextQuery.trim().length < 2) setResults([]);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          placeholder="Buscar clientes, préstamos o inversionistas..."
          role="combobox"
          type="search"
          value={query}
        />
      </div>

      {showPanel && (
        <section
          className="absolute left-0 right-0 top-12 overflow-hidden rounded-[18px] border border-primary-border bg-white shadow-[0_18px_45px_rgba(32,76,54,0.16)]"
          id="global-search-results"
          role="listbox"
        >
          {loading ? (
            <p className="px-5 py-6 text-sm text-text-muted">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-6 text-sm text-text-muted">No encontramos resultados.</p>
          ) : (
            <div className="max-h-[min(65vh,32rem)] overflow-y-auto p-2">
              {results.map((result) => (
                <Link
                  className="flex items-center justify-between gap-4 rounded-[13px] px-3 py-3 transition hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-none"
                  href={result.href}
                  key={result.id}
                  onClick={() => setOpen(false)}
                  role="option"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">
                      {result.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-text-muted">
                      {result.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1">
                    {result.roles.map((role) => (
                      <span
                        className="rounded-full bg-surface-muted-ui px-2 py-1 text-[10px] font-semibold text-text-secondary"
                        key={role}
                      >
                        {roleLabels[role]}
                      </span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
