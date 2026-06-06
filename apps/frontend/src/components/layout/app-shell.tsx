'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth-context';

const publicRoutes = ['/login'];
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthenticated = Boolean(user && token);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && pathname === '/login') {
      router.replace('/inicio');
    }
  }, [isAuthenticated, isPublicRoute, loading, pathname, router]);

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

  if (isPublicRoute) {
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
      <main
        className={`min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] transition-[margin] duration-200 ease-out lg:pt-0 ${
          sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'
        }`}
      >
        {children}
      </main>
    </>
  );
}
