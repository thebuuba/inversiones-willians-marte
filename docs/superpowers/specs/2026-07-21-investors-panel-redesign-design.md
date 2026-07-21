# Investors Panel Redesign

## Objective

Align the investors panel (`/inversionistas`) visual design with the clients panel (`/clientes`) design language established in the latest frontend visual system normalization.

## Changes

### Layout

- Change from `min-h-screen` to `h-screen flex flex-col overflow-hidden` so the panel fills the viewport and scrolls only the table body.
- Remove the outer scrolling container (`min-h-screen bg-page p-5`); replace with the same structure used in `clients-panel.tsx`.

### Header

- Remove the "CAPITAL" eyebrow text.
- Use `pageEntryHeaderClassName` (`animate-fade-in-up`) for the header.
- Keep title "Inversionistas" with `text-[26px] font-bold`.
- Keep subtitle "Administra tu cartera de capital — X inversionistas registrados."
- Keep Exportar and Agregar inversionista buttons with the same styling as clients panel (`transition-colors duration-150 hover:bg-surface-subtle` etc.).

### Stats Cards

- Replace the custom colored stat cards with the `Card` component from `@/components/ui/card`.
- Use `pageEntryStatCardClassName(index)` for staggered fade-in animation.
- Use consistent icon background classes (`bg-primary-soft text-primary-accent`) instead of inline hex colors.
- Keep metrics: Total inversionistas, Activos, Capital total, Tasa promedio.

### Table Card

- Move everything into a single `Card` component with `pageEntryTableClassName` and `flex min-h-0 flex-1 flex-col overflow-x-auto`.
- **Search**: Move inside the table card in a `p-4 border-b border-border-soft` section with the same search bar style (rounded-xl, border-transparent, focus-within effects, bg-page).
- **Status filters**: Keep the existing filter buttons (Todos, Activos, Pausados, Retirados) placed below the search bar inside the table card, with simpler styling matching the rest of the design.
- **Table header**: `bg-surface-subtle`, `text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary`, `px-6 py-3.5`.
- **Table rows**:
  - `min-h-[64px]`, `bg-card`, `border-b border-border-soft`, `hover:bg-surface-subtle`.
  - No per-row framer-motion animations.
  - Avatar: simpler (9x9, rounded-full, no border/shadow, no status dot).
  - Status: use the `Badge` component with `dot` prop or simple text styled with the same pattern as clients.
  - Actions: `MoreHorizontal` icon-only button, `opacity-0 group-hover:opacity-100`.
  - Remove the "Acciones" text label; use only the icon.
- **Footer**: "Mostrando X de Y inversionistas" left side, pagination with `ChevronLeft`/`ChevronRight` buttons right side (if > 1 page).

### Dependencies to Remove

- `framer-motion` imports and `motion` usage (framer-motion is still a dependency but unused in this component).
- `getStaggerDelay` from `@/lib/animation`.
- `PanelCard` local component — replace with `Card` from `@/components/ui/card`.
- All per-row animation logic.

## Non-Goals

- No changes to the backend or API contracts.
- No changes to the investor detail page, payment pages, or investment pages.
- No new features (export, bulk actions, etc.) — only visual alignment.

## Files Changed

- `apps/frontend/src/components/investors/investors-panel.tsx` — full rewrite of the component structure.
- `apps/frontend/src/components/investors/investors-panel.helpers.ts` — unchanged (formatInvestorCurrency still used).
