'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth-context';

const publicRoutes = ['/login'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthenticated = Boolean(user && token);

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
      <Sidebar />
      <main className="min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] lg:ml-[260px] lg:pt-0">
        {children}
      </main>
    </>
  );
}
