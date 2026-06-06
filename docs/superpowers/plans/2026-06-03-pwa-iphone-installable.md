# PWA iPhone Installable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Next.js frontend into an installable PWA for iPhone, usable from the home screen without App Store publication or Apple Developer fees.

**Architecture:** Keep the app as a web app and add the PWA shell around it: manifest, icons, mobile metadata, service worker registration, and mobile viewport polish. The backend remains API-based and must be deployed behind HTTPS; the PWA only caches static app shell assets and never caches authenticated API responses by default.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, Tailwind CSS, browser Web App Manifest, vanilla service worker.

---

## File Structure

- Modify: `apps/frontend/src/app/layout.tsx`
  Add PWA metadata, theme colors, viewport config, Apple web app hints, and manifest link metadata using Next Metadata APIs.

- Create: `apps/frontend/src/app/manifest.ts`
  Generate the Web App Manifest from Next using typed metadata instead of a static JSON file.

- Create: `apps/frontend/src/app/offline/page.tsx`
  Lightweight offline fallback page for Safari/Chrome when navigation is unavailable.

- Create: `apps/frontend/src/components/pwa/service-worker-register.tsx`
  Client component that registers `/sw.js` only in production-capable browser contexts.

- Create: `apps/frontend/public/sw.js`
  Service worker that precaches a small app shell and uses network-first navigation fallback.

- Create: `apps/frontend/public/icons/icon.svg`
  Source icon for the PWA.

- Create: `apps/frontend/public/icons/icon-192.png`
  192x192 install icon generated from source.

- Create: `apps/frontend/public/icons/icon-512.png`
  512x512 install icon generated from source.

- Create: `apps/frontend/public/icons/apple-touch-icon.png`
  180x180 iOS home screen icon generated from source.

- Modify: `apps/frontend/src/components/layout/app-shell.tsx`
  Check mobile layout only if current shell has desktop-only assumptions; keep changes minimal.

- Create: `apps/frontend/src/lib/pwa.test.ts`
  Unit tests for manifest and service worker constants that can be run with `tsx --test`.

---

### Task 1: Add PWA Manifest

**Files:**
- Create: `apps/frontend/src/app/manifest.ts`
- Test: `apps/frontend/src/lib/pwa.test.ts`

- [ ] **Step 1: Write the failing manifest test**

Create `apps/frontend/src/lib/pwa.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import manifest from '../app/manifest.ts';

test('pwa manifest uses installable standalone settings', () => {
  const data = manifest();

  assert.equal(data.name, 'Inversiones Willians Marte');
  assert.equal(data.short_name, 'Inversiones');
  assert.equal(data.start_url, '/inicio');
  assert.equal(data.display, 'standalone');
  assert.equal(data.background_color, '#F3F4F6');
  assert.equal(data.theme_color, '#5a9a7a');
  assert.equal(data.icons?.some((icon) => icon.src === '/icons/icon-192.png' && icon.sizes === '192x192'), true);
  assert.equal(data.icons?.some((icon) => icon.src === '/icons/icon-512.png' && icon.sizes === '512x512'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @inversiones/database exec tsx --test ../../apps/frontend/src/lib/pwa.test.ts
```

Expected: FAIL because `apps/frontend/src/app/manifest.ts` does not exist.

- [ ] **Step 3: Implement manifest**

Create `apps/frontend/src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inversiones Willians Marte',
    short_name: 'Inversiones',
    description: 'Sistema de gestión de préstamos, caja e inversionistas.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    background_color: '#F3F4F6',
    theme_color: '#5a9a7a',
    orientation: 'portrait',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @inversiones/database exec tsx --test ../../apps/frontend/src/lib/pwa.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/manifest.ts apps/frontend/src/lib/pwa.test.ts
git commit -m "Agrega manifiesto PWA"
```

---

### Task 2: Add App Icons

**Files:**
- Create: `apps/frontend/public/icons/icon.svg`
- Create: `apps/frontend/public/icons/icon-192.png`
- Create: `apps/frontend/public/icons/icon-512.png`
- Create: `apps/frontend/public/icons/apple-touch-icon.png`

- [ ] **Step 1: Create SVG source icon**

Create `apps/frontend/public/icons/icon.svg`:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#5A9A7A"/>
  <rect x="96" y="118" width="320" height="276" rx="48" fill="#F3FAF6"/>
  <path d="M154 320L222 252L272 302L360 214" stroke="#173D2C" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M314 214H360V260" stroke="#173D2C" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="154" cy="190" r="22" fill="#7CC99B"/>
  <circle cx="222" cy="190" r="22" fill="#7CC99B"/>
  <circle cx="290" cy="190" r="22" fill="#7CC99B"/>
</svg>
```

- [ ] **Step 2: Generate PNG icons**

Use macOS `sips` if available:

```bash
mkdir -p apps/frontend/public/icons
sips -s format png apps/frontend/public/icons/icon.svg --out apps/frontend/public/icons/icon-512.png
sips -z 192 192 apps/frontend/public/icons/icon-512.png --out apps/frontend/public/icons/icon-192.png
sips -z 180 180 apps/frontend/public/icons/icon-512.png --out apps/frontend/public/icons/apple-touch-icon.png
```

If `sips` cannot render SVG on this machine, use a temporary Node/canvas or ImageMagick flow only if already available. Do not add a permanent dependency just to generate icons.

- [ ] **Step 3: Verify files exist**

Run:

```bash
test -f apps/frontend/public/icons/icon-192.png
test -f apps/frontend/public/icons/icon-512.png
test -f apps/frontend/public/icons/apple-touch-icon.png
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/public/icons
git commit -m "Agrega iconos PWA"
```

---

### Task 3: Add iPhone Metadata and Service Worker Registration

**Files:**
- Modify: `apps/frontend/src/app/layout.tsx`
- Create: `apps/frontend/src/components/pwa/service-worker-register.tsx`

- [ ] **Step 1: Modify metadata and viewport**

Update `apps/frontend/src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inversiones Willians Marte',
  description: 'Sistema de Gestión de Préstamos',
  applicationName: 'Inversiones',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Inversiones',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#5a9a7a',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add service worker registration component**

Create `apps/frontend/src/components/pwa/service-worker-register.tsx`:

```tsx
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
```

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm --filter @inversiones/frontend exec eslint src/app/layout.tsx src/components/pwa/service-worker-register.tsx
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/layout.tsx apps/frontend/src/components/pwa/service-worker-register.tsx
git commit -m "Registra PWA en frontend"
```

---

### Task 4: Add Offline Fallback and Service Worker

**Files:**
- Create: `apps/frontend/src/app/offline/page.tsx`
- Create: `apps/frontend/public/sw.js`

- [ ] **Step 1: Add offline page**

Create `apps/frontend/src/app/offline/page.tsx`:

```tsx
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-5 font-sans text-[#173D2C]">
      <section className="w-full max-w-[420px] rounded-2xl border border-neutral-100 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F4EC] text-[#5A9A7A]">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Sin conexión</h1>
        <p className="mt-2 text-sm leading-6 text-[#6F8076]">
          No pudimos cargar esta pantalla. Revisa tu conexión e intenta de nuevo.
        </p>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#5A9A7A] px-6 text-sm font-bold text-white"
          href="/inicio"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add service worker**

Create `apps/frontend/public/sw.js`:

```js
const CACHE_NAME = 'inversiones-shell-v1';
const APP_SHELL = ['/', '/inicio', '/offline', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match('/offline')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
```

- [ ] **Step 3: Verify service worker syntax**

Run:

```bash
node --check apps/frontend/public/sw.js
```

Expected: no syntax errors.

- [ ] **Step 4: Run frontend build**

Run:

```bash
pnpm --filter @inversiones/frontend build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/offline/page.tsx apps/frontend/public/sw.js
git commit -m "Agrega soporte offline basico PWA"
```

---

### Task 5: Mobile Usability Pass for iPhone

**Files:**
- Modify only files with visible mobile defects after inspection:
  - `apps/frontend/src/components/layout/app-shell.tsx`
  - `apps/frontend/src/components/ui/visual-system.ts`
  - route/page components where text overlaps or horizontal scrolling breaks core workflows.

- [ ] **Step 1: Start local frontend**

Run:

```bash
pnpm --filter @inversiones/frontend dev
```

If port `3001` is occupied by the same frontend, use the existing server at `http://localhost:3001`.

- [ ] **Step 2: Inspect core pages at iPhone width**

Use browser automation or manual browser device emulation at `390x844`.

Check:

```text
/login
/inicio
/clientes
/prestamos
/prestamos/nuevo
/inversionistas
/inversionistas/nuevo
/inversionistas/pago
/caja
/solicitudes
```

Expected:
- Primary actions are visible.
- No button text overlaps.
- Tables either scroll intentionally or convert to usable mobile layout.
- Inputs are at least 42px high.
- Bottom/safe-area spacing does not hide controls.

- [ ] **Step 3: Apply minimal responsive fixes**

If `AppShell` sidebar is desktop-only, add a mobile top bar and off-canvas menu. Use existing nav items from the current shell; do not redesign the whole application.

Example responsive class rule for route containers:

```tsx
<div className="min-h-screen bg-[#F3F4F6] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans text-[#173D2C] sm:p-5">
  {children}
</div>
```

- [ ] **Step 4: Verify mobile pages**

Run:

```bash
pnpm --filter @inversiones/frontend exec eslint src/components/layout/app-shell.tsx
pnpm --filter @inversiones/frontend build
```

Expected: lint and build pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/layout/app-shell.tsx apps/frontend/src/app apps/frontend/src/components
git commit -m "Ajusta experiencia movil para PWA"
```

---

### Task 6: Deployment Requirements

**Files:**
- Create: `docs/pwa-deployment.md`
- Modify environment configuration only if deployment target is known.

- [ ] **Step 1: Document production requirements**

Create `docs/pwa-deployment.md`:

```md
# PWA Deployment Requirements

## Required

- Public HTTPS URL for frontend.
- Public HTTPS URL for backend API.
- `NEXT_PUBLIC_API_URL` must point to the backend HTTPS API, for example:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

- Backend CORS `FRONTEND_URL` must match the frontend HTTPS origin, for example:

```bash
FRONTEND_URL=https://app.example.com
```

## iPhone Install Steps

1. Open the frontend URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open from the installed icon.
5. Log in normally.

## Verification

- `/manifest.webmanifest` returns JSON.
- `/sw.js` returns JavaScript.
- Icons load:
  - `/icons/icon-192.png`
  - `/icons/icon-512.png`
  - `/icons/apple-touch-icon.png`
- App opens in standalone mode after installation.
```

- [ ] **Step 2: Commit**

```bash
git add docs/pwa-deployment.md
git commit -m "Documenta despliegue PWA"
```

---

### Task 7: Final Verification

**Files:**
- No code changes unless verification finds defects.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @inversiones/database exec tsx --test ../../apps/frontend/src/lib/pwa.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm --filter @inversiones/frontend lint
```

Expected: exit 0 or only pre-existing unrelated failures explicitly documented. Fix PWA-related lint failures.

- [ ] **Step 3: Run frontend build**

Run:

```bash
pnpm --filter @inversiones/frontend build
```

Expected: build succeeds and includes `/offline`.

- [ ] **Step 4: Verify installability assets locally**

Run:

```bash
curl -I http://localhost:3001/manifest.webmanifest
curl -I http://localhost:3001/sw.js
curl -I http://localhost:3001/icons/icon-192.png
curl -I http://localhost:3001/icons/apple-touch-icon.png
```

Expected: each returns `HTTP/1.1 200 OK`.

- [ ] **Step 5: iPhone manual verification**

On iPhone Safari with the deployed HTTPS URL:

```text
1. Open app URL.
2. Add to Home Screen.
3. Launch installed app.
4. Confirm it opens without Safari address bar.
5. Log in.
6. Open Inicio, Clientes, Préstamos, Inversionistas, Caja.
7. Create or view a non-production test record.
8. Temporarily disable network and confirm offline page appears for uncached navigation.
```

- [ ] **Step 6: Final commit if verification fixes were needed**

```bash
git add apps/frontend docs
git commit -m "Finaliza PWA instalable"
```

---

## Agent Strategy

Recommended: use subagents only after Task 1 and Task 2 are complete.

- Agent A: implement Tasks 1-4 because they are isolated PWA infrastructure.
- Agent B: inspect mobile UI in Task 5 and report exact files/defects only.
- Main agent: apply mobile fixes, run final verification, and keep commits coherent.

Do not split service worker and metadata between separate agents; those files are coupled through installability behavior.

---

## Self-Review

- Spec coverage: Plan covers installability, iPhone metadata, icons, service worker, offline fallback, mobile usability, deployment HTTPS requirements, and verification.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type consistency: `manifest()` returns `MetadataRoute.Manifest`; `ServiceWorkerRegister` is a client component; `format` and paths match existing Next app-router layout.
