# Clients Panel — Viewport-Fit Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace internal scroll in clients panel with dynamic pagination that auto-calculates rows based on viewport height.

**Architecture:** Single file change to `clients-panel.tsx`. Add `ResizeObserver` to measure available space, calculate `pageSize = Math.floor(availableHeight / 64)`, remove scroll, add subtle fade gradient when more pages exist.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Native ResizeObserver

---

### Task 1: Modify `clients-panel.tsx` — dynamic page size + remove scroll

**Files:**
- Modify: `apps/frontend/src/components/clients/clients-panel.tsx`

- [ ] **Step 1: Add imports and refs**

Add at the top:

```tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
```

(No new imports needed — `useCallback`, `useEffect`, `useRef`, `useState` are already there or available)

- [ ] **Step 2: Replace static `PAGE_SIZE` with dynamic state**

Remove:
```tsx
const PAGE_SIZE = 50;
```

Add after the existing state declarations (inside `ClientsPanel` component):
```tsx
const [pageSize, setPageSize] = useState(10);
const tableRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Add ResizeObserver effect to calculate page size**

Add before the `clientsFetcher`:
```tsx
useEffect(() => {
  const container = tableRef.current;
  if (!container) return;

  const HEADER_H = 76;
  const COL_H = 49;
  const FOOTER_H = 65;
  const BORDER = 1;
  const ROW_H = 64;

  const observer = new ResizeObserver(([entry]) => {
    const available = entry.contentRect.height - HEADER_H - COL_H - FOOTER_H - BORDER;
    const calculated = Math.max(1, Math.floor(available / ROW_H));
    setPageSize((prev) => {
      if (prev !== calculated) {
        setPage((p) => {
          const newTotalPages = Math.ceil(total / calculated);
          return Math.min(p, Math.max(0, newTotalPages - 1));
        });
      }
      return calculated;
    });
  });

  observer.observe(container);
  return () => observer.disconnect();
}, [total]);
```

- [ ] **Step 4: Update the clientsFetcher to use dynamic pageSize**

Replace:
```tsx
const clientsFetcher = useCallback(
  () => getClients(search || undefined, PAGE_SIZE, page * PAGE_SIZE),
  [page, search],
);
```

With:
```tsx
const clientsFetcher = useCallback(
  () => getClients(search || undefined, pageSize, page * pageSize),
  [page, search, pageSize],
);
```

- [ ] **Step 5: Update `totalPages` calculation**

Replace:
```tsx
const totalPages = Math.ceil(total / PAGE_SIZE);
```

With:
```tsx
const totalPages = Math.ceil(total / pageSize);
```

- [ ] **Step 6: Add ref to table container and remove scroll**

Find the PanelCard section with `overflow-hidden` and add ref:

```tsx
<PanelCard
  ref={tableRef}
  className={`${pageEntryTableClassName} flex min-h-0 flex-1 flex-col overflow-hidden`}
>
```

Change the table body div — remove `overflow-y-auto modal-scroll`:
```tsx
<div className="flex-1 overflow-hidden">
```

- [ ] **Step 7: Add fade gradient indicator**

Inside the table container div, after the row list and before the closing `</div>`, add:

```tsx
{totalPages > page + 1 && (
  <div className="pointer-events-none sticky bottom-0 z-10 h-8 w-full bg-gradient-to-b from-transparent to-[#F3F4F6]" />
)}
```

This should be right after the `clients.map(...)` block closes and before the `</div>` that wraps the overflow-hidden container.

- [ ] **Step 8: Update the "Showing X of Y" text**

Replace:
```tsx
Mostrando {clients.length} de {total} clientes
```

With:
```tsx
Mostrando {clients.length} de {total} cliente{total !== 1 ? 's' : ''}
```

(Minor i18n fix, optional but nice)

- [ ] **Step 9: Add `forwardRef` to `PanelCard`**

Since we need to pass a ref, convert `PanelCard` to use `forwardRef`:

Replace:
```tsx
function PanelCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border-soft bg-card shadow-card ${className}`}>
      {children}
    </section>
  );
}
```

With:
```tsx
const PanelCard = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => {
    return (
      <section
        ref={ref}
        className={`rounded-2xl border border-border-soft bg-card shadow-card ${className}`}
      >
        {children}
      </section>
    );
  },
);
```

Add `forwardRef` to the React import:
```tsx
import { useCallback, useEffect, useRef, useState, forwardRef, type ReactNode } from 'react';
```

- [ ] **Step 10: Build and verify**

Run:
```bash
cd apps/frontend && pnpm build
```

Expected: Build succeeds without errors.

- [ ] **Step 11: Run tests**

Run:
```bash
cd apps/frontend && pnpm test -- --related=src/components/clients/
```

Expected: All existing tests pass.

- [ ] **Step 12: Commit**

```bash
git add apps/frontend/src/components/clients/clients-panel.tsx docs/superpowers/plans/2026-07-12-clients-panel-dynamic-pagination.md
git commit -m "feat: viewport-fit pagination en panel de clientes"
```
