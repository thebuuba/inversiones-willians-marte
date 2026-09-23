'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { NetworkStatusBanner } from '@/components/layout/network-status-banner';
import { GlobalSearch } from '@/components/layout/global-search';
import { useAuth } from '@/lib/auth-context';
import { NotificationCenter } from '@/components/layout/notification-center';
import { IosInstallHint } from '@/components/pwa/ios-install-hint';

const publicRoutes = ['/login'];
const publicRoutePrefixes = ['/captura-documento/', '/captura-foto-cliente/'];
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicRoutePrefix = publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthenticated = Boolean(user && token);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublicRoute && !isPublicRoutePrefix) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && pathname === '/login') {
      router.replace('/inicio');
    }
  }, [isAuthenticated, isPublicRoute, isPublicRoutePrefix, loading, pathname, router]);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    queueMicrotask(() => setSidebarCollapsed(stored === 'true'));
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  if (isPublicRoute || isPublicRoutePrefix) {
    return <>{children}</>;
  }

  if (loading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Cargando...
      </main>
    );
  }

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={toggleSidebarCollapsed} />
      <header
        className={`fixed right-0 top-0 z-30 hidden h-20 items-center bg-page px-8 pt-3 transition-[left] duration-200 ease-out lg:flex ${
          sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
        }`}
      >
        <div className="flex w-full items-center gap-4">
          <GlobalSearch />
          <NotificationCenter />
          <span className="whitespace-nowrap text-sm font-bold text-text-primary">
            Hola, {user?.name ?? 'Usuario'}
          </span>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-[#4b3a91] text-sm font-bold text-white shadow-card"
          >
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </span>
        </div>
      </header>
      <main
        className={`min-h-screen pb-[env(safe-area-inset-bottom)] pt-[calc(4rem+env(safe-area-inset-top))] transition-[margin] duration-200 ease-out lg:pt-20 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {children}
      </main>
      <NetworkStatusBanner />
      <IosInstallHint />
    </>
  );
}
