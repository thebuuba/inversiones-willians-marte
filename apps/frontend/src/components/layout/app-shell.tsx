'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth-context';

const publicRoutes = ['/login'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthenticated = Boolean(user && token);

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && pathname === '/login') {
      router.replace('/inicio');
    }
  }, [isAuthenticated, isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Cargando...
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="ml-[300px] min-h-screen">{children}</main>
    </>
  );
}
