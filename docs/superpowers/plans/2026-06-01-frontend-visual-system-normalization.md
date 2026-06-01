# Frontend Visual System Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize the full frontend visual system while preserving every existing route, navigation order, panel composition, field order, and business flow.

**Architecture:** Introduce semantic CSS tokens and small reusable UI primitives, then migrate existing panels incrementally. Preserve intentional density differences through `compact`, `default`, and `comfortable` variants instead of flattening every screen into one layout. Keep chart-series, task-category, and portfolio colors local when they encode domain meaning.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React, Node test runner, ESLint

---

## File Structure

Create focused visual-system modules:

- `apps/frontend/src/components/ui/visual-system.ts`: testable class mappings and navigation metadata.
- `apps/frontend/src/components/ui/visual-system.test.ts`: Node tests for variants, density, tones, and sidebar order.
- `apps/frontend/src/components/ui/select.tsx`: shared select field.
- `apps/frontend/src/components/ui/textarea.tsx`: shared textarea field.
- `apps/frontend/src/components/ui/panel-header.tsx`: standard panel heading and actions.
- `apps/frontend/src/components/ui/stat-card.tsx`: summary card primitive.
- `apps/frontend/src/components/ui/tabs.tsx`: pill tabs.
- `apps/frontend/src/components/ui/table-shell.tsx`: bordered horizontal-scroll table container.
- `apps/frontend/src/components/ui/modal-shell.tsx`: modal structure with overlay, header, body, and footer.

Modify existing files in place. Do not reorder routes, fields, tabs, cards, or table columns.

## Phase 1: Foundation And Layout

### Task 1: Add Testable Visual Mappings

**Files:**
- Create: `apps/frontend/src/components/ui/visual-system.test.ts`
- Create: `apps/frontend/src/components/ui/visual-system.ts`

- [ ] **Step 1: Write the failing Node tests**

Create `apps/frontend/src/components/ui/visual-system.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buttonSizes,
  buttonVariants,
  controlDensities,
  navItems,
  statusTones,
} from './visual-system.ts';

test('exposes the supported button variants', () => {
  assert.deepEqual(Object.keys(buttonVariants), ['primary', 'secondary', 'outline', 'ghost', 'danger', 'soft']);
});

test('keeps explicit density variants for compact default and comfortable screens', () => {
  assert.match(controlDensities.compact, /h-\[42px\]/);
  assert.match(controlDensities.default, /h-11/);
  assert.match(controlDensities.comfortable, /h-\[52px\]/);
  assert.match(buttonSizes.default, /h-11/);
});

test('maps semantic states to tokenized classes', () => {
  assert.match(statusTones.success, /bg-state-success-bg/);
  assert.match(statusTones.warning, /bg-state-warning-bg/);
  assert.match(statusTones.danger, /bg-state-danger-bg/);
  assert.match(statusTones.info, /bg-state-info-bg/);
  assert.match(statusTones.neutral, /bg-state-neutral-bg/);
});

test('keeps sidebar order and includes reminders before settings', () => {
  assert.deepEqual(
    navItems.map((item) => item.href),
    ['/inicio', '/clientes', '/prestamos', '/solicitudes', '/agenda', '/caja', '/inversionistas', '/documentos', '/recordatorios', '/configuracion'],
  );
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts
```

Expected: FAIL because `visual-system.ts` does not exist.

- [ ] **Step 3: Add the minimal mappings**

Create `apps/frontend/src/components/ui/visual-system.ts`:

```ts
export const buttonVariants = {
  primary: 'bg-primary text-text-inverse hover:bg-primary-hover',
  secondary: 'bg-surface-muted text-text-primary hover:bg-primary-soft',
  outline: 'border border-border text-text-primary hover:bg-primary-soft',
  ghost: 'text-text-secondary hover:bg-primary-soft',
  danger: 'bg-state-danger text-text-inverse hover:opacity-90',
  soft: 'border border-primary-border bg-primary-soft text-primary hover:bg-primary-border',
} as const;

export const buttonSizes = {
  compact: 'h-9 px-4 text-xs',
  default: 'h-11 px-6 text-sm',
  comfortable: 'h-12 px-7 text-sm',
} as const;

export const controlDensities = {
  compact: 'h-[42px] rounded-control-compact px-3 text-sm',
  default: 'h-11 rounded-control px-4 text-sm',
  comfortable: 'h-[52px] rounded-control-comfortable px-4 text-sm',
} as const;

export const statusTones = {
  success: 'bg-state-success-bg text-state-success',
  warning: 'bg-state-warning-bg text-state-warning',
  danger: 'bg-state-danger-bg text-state-danger',
  info: 'bg-state-info-bg text-state-info',
  neutral: 'bg-state-neutral-bg text-state-neutral',
} as const;

export const navItems = [
  { href: '/inicio', label: 'Inicio', icon: 'home' },
  { href: '/clientes', label: 'Clientes', icon: 'users' },
  { href: '/prestamos', label: 'Préstamos', icon: 'landmark' },
  { href: '/solicitudes', label: 'Solicitudes', icon: 'inbox' },
  { href: '/agenda', label: 'Agenda', icon: 'calendar' },
  { href: '/caja', label: 'Caja', icon: 'wallet' },
  { href: '/inversionistas', label: 'Inversionistas', icon: 'trending-up' },
  { href: '/documentos', label: 'Documentos', icon: 'file-text' },
  { href: '/recordatorios', label: 'Recordatorios', icon: 'bell' },
  { href: '/configuracion', label: 'Configuración', icon: 'settings' },
] as const;
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run:

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts
```

Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/ui/visual-system.ts apps/frontend/src/components/ui/visual-system.test.ts
git commit -m "test: define frontend visual system mappings"
```

### Task 2: Add Semantic CSS Tokens

**Files:**
- Modify: `apps/frontend/src/app/globals.css:3-121`

- [ ] **Step 1: Add semantic variables under `:root`**

Add:

```css
  --page: #f3f4f6;
  --card: #ffffff;
  --surface-subtle: #f8fbf9;
  --surface-muted-ui: #f3faf6;
  --surface-elevated: #ffffff;
  --primary: #285c43;
  --primary-hover: #1f4a36;
  --primary-accent: #5fa37d;
  --primary-soft: #e7f4ec;
  --primary-border: #ddebe3;
  --text-primary: #173d2c;
  --text-secondary: #5c6d63;
  --text-muted: #7a8a80;
  --text-subtle: #a9cdbb;
  --text-inverse: #ffffff;
  --border-soft: #edf2ef;
  --border-strong-ui: #b8dcc5;
  --state-success: #2f7654;
  --state-success-bg: #e7f4ec;
  --state-success-dot: #5fa37d;
  --state-warning: #a98219;
  --state-warning-bg: #fff4c8;
  --state-warning-dot: #e2c64f;
  --state-danger: #c96f4a;
  --state-danger-bg: #ffe8d8;
  --state-danger-dot: #e6a07a;
  --state-info: #5c82b7;
  --state-info-bg: #e4f0ff;
  --state-info-dot: #6ea8e8;
  --state-neutral: #5c6d63;
  --state-neutral-bg: #eef3ef;
  --state-neutral-dot: #a9cdbb;
  --shadow-soft: 0 3px 8px rgba(40, 92, 67, 0.06);
  --shadow-card: 0 1px 3px rgba(40, 92, 67, 0.08);
  --shadow-action: 0 12px 22px rgba(40, 92, 67, 0.2);
  --shadow-modal: 0 24px 60px rgba(0, 0, 0, 0.22);
```

- [ ] **Step 2: Expose variables in `@theme inline`**

Add `--color-*` aliases for every semantic variable and radius variables:

```css
  --radius-panel: 1rem;
  --radius-control-compact: 0.5rem;
  --radius-control: 0.625rem;
  --radius-control-comfortable: 0.875rem;
```

Expose them as `--color-page`, `--color-card`, `--color-surface-subtle`,
`--color-surface-muted-ui`, `--color-surface-elevated`, `--color-primary`,
`--color-primary-hover`, `--color-primary-accent`, `--color-primary-soft`,
`--color-primary-border`, `--color-text-primary`, `--color-text-secondary`,
`--color-text-muted`, `--color-text-subtle`, `--color-text-inverse`,
`--color-border-soft`, `--color-border-strong-ui`, `--color-state-*`,
`--shadow-soft`, `--shadow-card`, `--shadow-action`, `--shadow-modal`, and
`--radius-*`.

- [ ] **Step 3: Normalize body font**

Keep the existing sans-serif fallback deliberately:

```css
body {
  background: var(--page);
  color: var(--text-primary);
  font-family: Arial, Helvetica, sans-serif;
}
```

Remove `--font-sans: var(--font-geist-sans)` and
`--font-mono: var(--font-geist-mono)` because no Geist font is loaded.

- [ ] **Step 4: Run lint**

```bash
pnpm --filter @inversiones/frontend lint
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/globals.css
git commit -m "style: add semantic frontend visual tokens"
```

### Task 3: Build Shared UI Primitives

**Files:**
- Modify: `apps/frontend/src/components/ui/button.tsx`
- Modify: `apps/frontend/src/components/ui/badge.tsx`
- Modify: `apps/frontend/src/components/ui/card.tsx`
- Modify: `apps/frontend/src/components/ui/input.tsx`
- Create: `apps/frontend/src/components/ui/select.tsx`
- Create: `apps/frontend/src/components/ui/textarea.tsx`
- Create: `apps/frontend/src/components/ui/panel-header.tsx`
- Create: `apps/frontend/src/components/ui/stat-card.tsx`
- Create: `apps/frontend/src/components/ui/tabs.tsx`
- Create: `apps/frontend/src/components/ui/table-shell.tsx`
- Create: `apps/frontend/src/components/ui/modal-shell.tsx`

- [ ] **Step 1: Refactor `Button` to consume visual mappings**

Import `buttonSizes` and `buttonVariants`, rename the default variant to
`primary`, add `pill?: boolean`, and use:

```ts
cn(
  'inline-flex items-center justify-center gap-2 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  pill ? 'rounded-full' : 'rounded-control',
  buttonVariants[variant],
  buttonSizes[size],
  className,
)
```

- [ ] **Step 2: Refactor `Badge` to semantic tones**

Export `BadgeTone = keyof typeof statusTones`. Accept `tone`, `dot`, and
`icon`. Render the optional dot with matching `bg-state-*-dot`.

- [ ] **Step 3: Refactor card and form primitives**

Use `rounded-panel border border-border-soft bg-card shadow-card` for cards.
Use `controlDensities[density]` in `Input`, `Select`, and `Textarea`. Apply:

```ts
'border border-primary-border bg-white font-medium text-text-primary shadow-sm outline-none transition placeholder:text-text-subtle focus:border-primary-accent focus:ring-2 focus:ring-primary-soft'
```

- [ ] **Step 4: Add layout primitives**

Implement:

```ts
PanelHeader({ eyebrow, title, description, actions })
StatCard({ icon, label, value, detail, accentClassName })
Tabs({ items, active, onChange })
TableShell({ children, minWidthClassName })
ModalShell({ open, onClose, title, description, icon, children, footer })
```

`TableShell` must render an outer card and inner `overflow-x-auto`.
`ModalShell` must render `fixed inset-0 z-50`, a dark overlay, white card,
scrollable body, and optional footer.

- [ ] **Step 5: Run tests and lint**

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts
pnpm --filter @inversiones/frontend lint
```

Expected: all tests pass and lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/ui
git commit -m "feat: add shared frontend visual primitives"
```

### Task 4: Make Sidebar Responsive And Add Reminders

**Files:**
- Modify: `apps/frontend/src/components/layout/app-shell.tsx:42-47`
- Modify: `apps/frontend/src/components/layout/sidebar.tsx:6-131`
- Modify: `apps/frontend/src/app/recordatorios/page.tsx:1-10`

- [ ] **Step 1: Replace sidebar-local nav metadata**

Import `navItems` from `@/components/ui/visual-system`, map its `icon` strings to
Lucide components, and add `Bell` and `Menu`. Preserve the existing item order.

- [ ] **Step 2: Add mobile drawer behavior**

In `Sidebar`, add:

```ts
const [mobileOpen, setMobileOpen] = useState(false);
```

Render a mobile top bar with `lg:hidden`, render the drawer overlay only when
`mobileOpen`, close the drawer after navigation, and keep the existing sidebar
content in a shared inner block. Use `hidden lg:block` for the fixed desktop
sidebar and `lg:hidden` for mobile elements.

- [ ] **Step 3: Remove the narrow-screen offset**

Change the shell main element to:

```tsx
<main className="min-h-screen pt-16 lg:ml-[260px] lg:pt-0">{children}</main>
```

- [ ] **Step 4: Replace reminders placeholder**

Render the standard page surface, `PanelHeader`, and one empty-state `Card`
containing a `Bell` icon, `Recordatorios`, and
`No hay recordatorios configurados todavía.` Do not add API calls.

- [ ] **Step 5: Run tests, lint, and build**

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: tests pass, lint exits 0, and build exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/layout apps/frontend/src/app/recordatorios/page.tsx
git commit -m "feat: add responsive sidebar and reminders panel"
```

## Phase 2: Standard Panels

### Task 5: Normalize Listing Panels

**Files:**
- Modify: `apps/frontend/src/components/clients/clients-panel.tsx`
- Modify: `apps/frontend/src/components/loans/loans-page.tsx`
- Modify: `apps/frontend/src/components/investors/investors-panel.tsx`

- [ ] **Step 1: Replace local panel-card wrappers**

Use shared `Card`, `PanelHeader`, `StatCard`, `Badge`, `Button`, and
`TableShell`. Preserve Framer Motion wrappers where animation already exists by
wrapping shared cards instead of removing animation.

- [ ] **Step 2: Normalize primary and secondary actions**

Use `<Button pill>` for creation actions and `<Button pill variant="outline">`
for exports. Preserve labels and links.

- [ ] **Step 3: Normalize statuses**

Map:

```ts
ACTIVE -> success
OVERDUE -> danger
PENDING -> warning
PAID -> neutral
PAUSED -> warning
WITHDRAWN -> neutral
```

Keep type badges in loans as local category accents.

- [ ] **Step 4: Protect wide tables**

Wrap clients and investors tables in `TableShell`. Give their table grids an
explicit `min-w-[900px]`. Keep the existing loans `min-w-[1180px]`.

- [ ] **Step 5: Run lint and build**

```bash
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: exit 0 for both commands.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/clients/clients-panel.tsx apps/frontend/src/components/loans/loans-page.tsx apps/frontend/src/components/investors/investors-panel.tsx
git commit -m "refactor: normalize listing panel visuals"
```

### Task 6: Normalize Requests, Cash, And Documents

**Files:**
- Modify: `apps/frontend/src/components/requests/requests-panel.tsx`
- Modify: `apps/frontend/src/components/requests/new-request-modal.tsx`
- Modify: `apps/frontend/src/components/requests/request-detail-drawer.tsx`
- Modify: `apps/frontend/src/components/cash/cash-panel.tsx`
- Modify: `apps/frontend/src/components/cash/movement-modal.tsx`
- Modify: `apps/frontend/src/app/documentos/page.tsx`

- [ ] **Step 1: Extract shared request status tones**

Keep one request map in `requests-panel.tsx` or a new
`apps/frontend/src/components/requests/request-status.ts`, and import it in the
drawer. Map pending to warning, review to info, approved to success, and rejected
to danger.

- [ ] **Step 2: Migrate shared surfaces and actions**

Use shared cards, header, button, badge, default-density controls, and modal
shell. Preserve cash category tags and request drawer layout.

- [ ] **Step 3: Normalize interaction states**

Ensure creation, cancel, reject, approve, upload, and close buttons use shared
hover, focus-visible, and disabled rules. Preserve destructive orange treatment
for rejection.

- [ ] **Step 4: Run lint and build**

```bash
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: exit 0 for both commands.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/requests apps/frontend/src/components/cash apps/frontend/src/app/documentos/page.tsx
git commit -m "refactor: normalize operational panel visuals"
```

## Phase 3: Forms, Details, And Specialized Panels

### Task 7: Normalize Client And Investor Flows

**Files:**
- Modify: `apps/frontend/src/components/clients/add-client-page.tsx`
- Modify: `apps/frontend/src/components/clients/client-detail-page.tsx`
- Modify: `apps/frontend/src/app/inversionistas/nuevo/page.tsx`
- Modify: `apps/frontend/src/components/investors/investor-detail-page.tsx`

- [ ] **Step 1: Migrate creation forms**

Use comfortable controls for client creation and default controls for investor
creation. Preserve field order, cards, photo upload areas, and existing save
flows.

- [ ] **Step 2: Migrate detail cards and tabs**

Use shared `Card`, `StatCard`, `Tabs`, `Badge`, and `Button`. Preserve client
detail tab order and investor detail tab order.

- [ ] **Step 3: Normalize matching status semantics**

Use success for active and paid states, warning for pending, danger for overdue,
and neutral for inactive or withdrawn. Keep document category badges local.

- [ ] **Step 4: Run lint and build**

```bash
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: exit 0 for both commands.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/clients apps/frontend/src/app/inversionistas/nuevo/page.tsx apps/frontend/src/components/investors/investor-detail-page.tsx
git commit -m "refactor: normalize client and investor flows"
```

### Task 8: Normalize Loan Creation Without Disturbing Its Compact Layout

**Files:**
- Modify: `apps/frontend/src/components/loans/new-loan-page.tsx`
- Modify: `apps/frontend/src/components/loans/carteras-card.tsx`
- Test: `apps/frontend/src/components/loans/new-loan-form.helpers.test.ts`

- [ ] **Step 1: Run existing loan helper tests before editing**

```bash
node --test apps/frontend/src/components/loans/new-loan-form.helpers.test.ts
```

Expected: existing tests pass.

- [ ] **Step 2: Migrate controls with `compact` density**

Replace repeated input, select, button, and card classes with shared primitives
or `controlDensities.compact`. Preserve the current compact layout, field order,
calculation behavior, installment table, and portfolio card placement.

- [ ] **Step 3: Keep portfolio colors local**

Do not convert `PRESET_COLORS` or user-selected portfolio colors into semantic
tokens. Only migrate surrounding surfaces, borders, labels, and actions.

- [ ] **Step 4: Run helper tests, lint, and build**

```bash
node --test apps/frontend/src/components/loans/new-loan-form.helpers.test.ts
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: tests pass and both checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/loans/new-loan-page.tsx apps/frontend/src/components/loans/carteras-card.tsx
git commit -m "refactor: normalize compact loan creation visuals"
```

### Task 9: Normalize Dashboard, Agenda, Settings, And Login

**Files:**
- Modify: `apps/frontend/src/components/dashboard/dashboard-home.tsx`
- Modify: `apps/frontend/src/app/agenda/page.tsx`
- Modify: `apps/frontend/src/components/settings/settings-page.tsx`
- Modify: `apps/frontend/src/app/login/page.tsx`

- [ ] **Step 1: Migrate dashboard structural styles**

Use shared cards, buttons, stat cards, and semantic surfaces. Keep Recharts
series colors local.

- [ ] **Step 2: Migrate agenda structural styles**

Use shared surfaces, buttons, default-density controls, and modal structure.
Keep category and priority colors local because they encode task meaning.

- [ ] **Step 3: Migrate settings structural styles**

Use shared cards, tabs, buttons, inputs, selects, and modal shell. Preserve all
settings tab order and toggle behavior.

- [ ] **Step 4: Migrate login token usage**

Keep the centered card, comfortable controls, and gradient login CTA. Replace
local border, text, and surface colors with semantic classes.

- [ ] **Step 5: Run lint and build**

```bash
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
```

Expected: exit 0 for both commands.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/dashboard/dashboard-home.tsx apps/frontend/src/app/agenda/page.tsx apps/frontend/src/components/settings/settings-page.tsx apps/frontend/src/app/login/page.tsx
git commit -m "refactor: normalize specialized frontend panels"
```

## Phase 4: Verification

### Task 10: Run Full Automated Verification

**Files:**
- Modify only if verification exposes a regression.

- [ ] **Step 1: Run all frontend Node tests**

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts apps/frontend/src/components/loans/new-loan-form.helpers.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run frontend lint**

```bash
pnpm --filter @inversiones/frontend lint
```

Expected: exit 0.

- [ ] **Step 3: Run frontend build**

```bash
pnpm --filter @inversiones/frontend build
```

Expected: exit 0.

- [ ] **Step 4: Inspect the final diff**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional frontend changes remain.

### Task 11: Run Browser Verification

**Files:**
- Modify only if browser review exposes a regression.

- [ ] **Step 1: Start the frontend**

```bash
pnpm --filter @inversiones/frontend dev
```

Expected: frontend available at `http://localhost:3001`.

- [ ] **Step 2: Verify desktop layout**

Use the Browser plugin at desktop width. Inspect:

```text
/login
/inicio
/clientes
/clientes/nuevo
/prestamos
/prestamos/nuevo
/caja
/agenda
/solicitudes
/inversionistas
/inversionistas/nuevo
/documentos
/recordatorios
/configuracion
```

Confirm sidebar order, cards, buttons, tables, hover states, focus states, and
empty states. Open a client detail and investor detail when test data exists.

- [ ] **Step 3: Verify narrow layout**

Repeat the sidebar and wide-table checks at a narrow viewport. Confirm the
desktop sidebar no longer consumes `260px`, the mobile drawer opens and closes,
and clients, loans, and investors tables scroll inside their cards.

- [ ] **Step 4: Stop the development server**

Stop the active dev session after browser verification.

### Task 12: Final Review Commit

**Files:**
- Modify only if final review exposes a regression.

- [ ] **Step 1: Confirm clean verification**

Re-run:

```bash
node --test apps/frontend/src/components/ui/visual-system.test.ts apps/frontend/src/components/loans/new-loan-form.helpers.test.ts
pnpm --filter @inversiones/frontend lint
pnpm --filter @inversiones/frontend build
git diff --check
```

Expected: tests pass, lint and build exit 0, and no whitespace errors appear.

- [ ] **Step 2: Commit final regression fixes if any**

```bash
git add apps/frontend
git commit -m "fix: resolve frontend visual normalization regressions"
```

Skip this commit if browser review required no fixes.
