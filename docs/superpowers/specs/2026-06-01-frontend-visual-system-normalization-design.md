# Frontend Visual System Normalization Design

## Objective

Normalize the frontend visual system across all existing panels without changing
the application structure, navigation order, routes, data flows, or business
behavior. Preserve the current green visual identity while replacing duplicated
local styling with shared tokens and small reusable UI primitives.

## Scope

This change covers:

- Global visual tokens and shared UI primitives.
- Login, dashboard, clients, loans, cash, agenda, requests, investors,
  documents, reminders, and settings.
- The application shell and sidebar.
- Shared button, badge, card, input, select, textarea, tabs, table-shell, modal,
  and panel-header patterns.
- Responsive sidebar behavior and horizontal overflow protection for wide
  tables.
- Consistent hover, focus, and disabled states.

This change does not cover:

- Route renames or navigation reordering.
- Business logic changes.
- Backend changes.
- API contract changes.
- Replacing existing panel layouts with new layouts.
- Removing domain-specific chart colors, category colors, or portfolio colors
  where those colors encode meaning.

## Existing Direction To Preserve

The frontend already has a recognizable design language:

- Soft gray page backgrounds.
- White cards with light borders and restrained shadows.
- Dark green primary text.
- Green pill-shaped primary actions.
- Pastel semantic states.
- Compact panel headers and summary cards.

The implementation must preserve that language. The goal is normalization, not
a redesign.

## Token Model

Extend `apps/frontend/src/app/globals.css` so the tokens match the colors already
used by the dominant panel family.

Define semantic tokens for:

- Page, card, subtle, muted, and elevated surfaces.
- Primary, primary-hover, primary-soft, and primary-border colors.
- Primary, secondary, muted, subtle, and inverse text colors.
- Default, soft, and strong borders.
- Success, warning, danger, info, and neutral state foreground/background/dot
  colors.
- Card, control, panel, and modal radii.
- Soft, card, raised-action, and modal shadows.

Keep existing `brand-*`, `surface-*`, `ink-*`, and semantic state variables as
compatibility aliases during migration. New panel code should consume semantic
tokens instead of adding new hardcoded hex values.

## Shared UI Primitives

Evolve the existing `apps/frontend/src/components/ui` layer and add focused
primitives. Shared components must accept `className` overrides so existing
panel composition remains intact.

Required primitives:

- `Button`: primary, secondary, outline, ghost, danger, and soft variants;
  compact, default, and comfortable sizes; consistent focus and disabled states.
- `Badge`: semantic status tones with optional dot and optional icon.
- `Card`: standard panel card plus padding and radius overrides.
- `Input`, `Select`, and `Textarea`: compact, default, and comfortable density
  variants with unified label, placeholder, focus, and error treatment.
- `PanelHeader`: optional eyebrow/status pill, title, description, and actions.
- `StatCard`: icon, label, value, optional detail, and semantic or custom accent.
- `Tabs`: pill-tab container and active/inactive states.
- `TableShell`: bordered card container with horizontal overflow support.
- `ModalShell`: overlay, elevated container, header, scroll body, and footer.

Do not create a large framework. Each primitive should remain small and
composable.

## Density Rules

Use explicit density variants instead of forcing every screen into the same
height:

- `compact`: loan creation and information-dense cards. Control height around
  `42px`.
- `default`: settings, documents, requests, and cash modals. Control height
  around `44px`.
- `comfortable`: client creation and login. Control height around `52px` to
  `54px`.

This preserves the established hierarchy while making the differences
intentional and reusable.

## Panel Migration

### Layout And Sidebar

- Preserve the existing sidebar navigation order.
- Add `Recordatorios` without moving existing entries.
- Keep the desktop sidebar at `260px`.
- Add a mobile top bar and drawer behavior below the desktop breakpoint.
- Remove the fixed desktop content offset on small screens.
- Preserve pending-request badge behavior and profile actions.

### Login

- Preserve the centered authentication card and comfortable controls.
- Replace local color values with tokens.
- Keep the existing gradient primary action as a supported login-specific
  treatment.

### Dashboard

- Preserve dashboard composition and charts.
- Migrate cards, actions, text, borders, and state surfaces to shared tokens.
- Keep chart-series colors local because they encode data-series identity.

### Listings

Apply the shared panel header, summary cards, filter controls, status badges, and
table shell to:

- Clients.
- Loans.
- Investors.

Preserve column order, actions, filters, and displayed data. Add horizontal
overflow protection to clients and investors as already implemented for loans.

### Forms

Apply shared form controls while preserving field order and layout to:

- New client.
- New loan.
- New investor.
- New request modal.
- Cash movement modal.
- Document upload modal.
- Settings forms and user modal.

### Detail Panels

Apply shared cards, tabs, status badges, action buttons, and table shell while
preserving the current tab order and content to:

- Client detail.
- Investor detail.
- Request detail drawer.

### Remaining Panels

- Preserve cash grouping and category tags while migrating shared surfaces and
  controls.
- Preserve agenda layout, category colors, calendar, and task interactions while
  migrating shared surfaces and controls.
- Preserve documents list behavior while migrating upload and action controls.
- Replace the reminders placeholder with the standard panel shell and a
  deliberate empty-state card. No new reminder business behavior is introduced.
- Preserve settings tab order and functional structure.

## Interaction States

Every shared interactive primitive must define:

- Hover feedback.
- Keyboard-visible focus ring.
- Disabled opacity and pointer behavior.
- Error border and focus treatment for form controls.

Panel-specific controls that cannot use a shared primitive must follow the same
tokenized states.

## Responsive Behavior

- Sidebar must not permanently consume `260px` on narrow screens.
- Wide tables must scroll horizontally inside their card instead of overflowing
  the viewport.
- Existing responsive grid breakpoints in forms and dashboards remain in place
  unless a token migration exposes an actual overflow defect.

## Testing And Verification

Add focused frontend tests for shared visual mappings that can be tested without
a browser:

- Status tone mapping.
- Button variant and density mapping.
- Form-control density mapping.
- Sidebar navigation order including reminders.

Verify with:

- Frontend unit tests.
- `pnpm --filter @inversiones/frontend lint`.
- `pnpm --filter @inversiones/frontend build`.
- Manual browser review at `http://localhost:3001` for login and every sidebar
  route at desktop and narrow viewport widths.

## Implementation Order

1. Add tests for tokens and shared mapping behavior.
2. Add semantic tokens and shared primitives.
3. Migrate shell and sidebar.
4. Migrate listing panels.
5. Migrate forms and modals.
6. Migrate detail panels.
7. Migrate dashboard, agenda, documents, cash, reminders, and settings.
8. Run lint, build, tests, and browser verification.

Each step should keep the application buildable. Avoid broad mechanical
replacement of hexadecimal values without reviewing their semantic role.
