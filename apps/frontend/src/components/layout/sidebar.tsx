'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Calendar,
  FileText,
  Home,
  Inbox,
  Landmark,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getRequestsCount } from '@/lib/api/requests';
import { getTasksCount } from '@/lib/api/tasks';
import { navItems } from '@/components/ui/visual-system';
import { canRefreshSidebarCounters, SIDEBAR_COUNTER_REFRESH_MS } from './sidebar-refresh';

const navIconMap = {
  briefcase: Briefcase,
  calendar: Calendar,
  'file-text': FileText,
  home: Home,
  inbox: Inbox,
  landmark: Landmark,
  settings: Settings,
  'trending-up': TrendingUp,
  users: Users,
  wallet: Wallet,
} satisfies Record<(typeof navItems)[number]['icon'], LucideIcon>;

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: () => void;
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const initial = user?.name?.charAt(0) ?? 'A';

  useEffect(() => {
    function refresh() {
      if (!canRefreshSidebarCounters(document.visibilityState)) return;
      getRequestsCount('PENDING').then(setPendingRequests).catch(() => {});
      getTasksCount('PENDING').then(setPendingTasks).catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, SIDEBAR_COUNTER_REFRESH_MS);
    addEventListener('visibilitychange', refresh);
    addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      removeEventListener('visibilitychange', refresh);
      removeEventListener('focus', refresh);
    };
  }, []);

  const sidebarContent = (compact = false) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex pb-7 pt-7',
          compact ? 'flex-col items-center gap-3 px-3' : 'items-center gap-3.5 px-6',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8DCC5] text-sm font-bold text-[#285C43]">
          WM
        </div>
        <div className={cn('min-w-0 flex-1', compact && 'hidden')}>
          <h1 className="truncate text-[15px] font-bold leading-tight text-[#285C43]">Willians Marte</h1>
          <p className="mt-1 truncate text-[13px] leading-tight text-[#5C6D63]">
            Sistema de Préstamos
          </p>
        </div>
        <button
          aria-label={collapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          className={cn(
            'flex items-center justify-center rounded-full border border-[#DDEBE3] bg-[#F8FBF9] opacity-80 transition hover:bg-[#EEF3EF] hover:opacity-100',
            compact ? 'h-7 w-7' : 'h-7 w-7 shrink-0',
          )}
          onClick={onCollapsedChange}
          type="button"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="h-4 w-4 opacity-70 grayscale"
            height={16}
            src={collapsed ? '/icons/sidebar-derecho.png' : '/icons/sidebar-izquierdo.png'}
            width={16}
          />
        </button>
      </div>

      <nav className={cn('flex-1 overflow-hidden', compact ? 'px-3' : 'px-4')}>
        <p className={cn('mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#A9B8AE]', compact && 'sr-only')}>
          MENÚ
        </p>
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = navIconMap[item.icon];
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={compact ? item.label : undefined}
                className={cn(
                  'relative flex h-10 items-center rounded-[16px] text-[15px] font-medium transition-colors',
                  compact ? 'justify-center px-0' : 'gap-3.5 px-3',
                  active
                    ? 'bg-[#E7F4EC] text-[#285C43]'
                    : 'text-[#5C6D63] hover:bg-[#F3FAF6]',
                )}
              >
                <Icon
                  className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-[#2F7654]' : 'text-[#5C6D63]')}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className={cn('min-w-0 flex-1 truncate', compact && 'sr-only')}>{item.label}</span>
                {(item.href === '/solicitudes' && pendingRequests > 0) ||
                (item.href === '/agenda' && pendingTasks > 0) ? (
                  <span
                    className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                      item.href === '/solicitudes' ? 'bg-[#FFE3D2] text-[#9F3F25]' : 'bg-[#E4F0FF] text-[#2F5F91]',
                      compact && 'absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]',
                    )}
                  >
                    {item.href === '/solicitudes' ? pendingRequests : pendingTasks}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn('relative border-t border-[#DDEBE3] py-5', compact ? 'px-3' : 'px-6')}>
        {profileOpen && (
          <div
            className={cn(
              'absolute rounded-[16px] border border-[#DDEBE3] bg-white p-2 shadow-[0_14px_34px_rgba(40,92,67,0.12)]',
              compact ? 'bottom-5 left-[calc(100%+8px)] w-44' : 'bottom-[78px] left-6 right-6',
            )}
          >
            <button
              onClick={logout}
              className="flex h-10 w-full items-center gap-2.5 rounded-[12px] px-3 text-left text-sm font-semibold text-[#2F7654] transition-colors hover:bg-[#F3FAF6] hover:text-[#285C43]"
              type="button"
            >
              <LogOut className="h-4 w-4 text-[#5C6D63]" strokeWidth={2} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
        <button
          onClick={() => setProfileOpen((open) => !open)}
          className={cn(
            'flex w-full items-center rounded-[18px] text-left transition-opacity hover:opacity-90',
            compact ? 'justify-center' : 'gap-3 px-0 py-0',
          )}
          title={compact ? user?.name ?? 'Administrador' : undefined}
          type="button"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4EC] text-sm font-bold text-[#285C43]">
            {initial}
          </div>
          <div className={cn('min-w-0 flex-1', compact && 'hidden')}>
            <p className="truncate text-[15px] font-bold leading-tight text-[#285C43]">
              {user?.name ?? 'Administrador'}
            </p>
            <p className="mt-1 truncate text-[13px] leading-tight text-[#5C6D63]">
              {user?.username ?? user?.email ?? 'admin'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-end justify-between border-b border-[#DDEBE3] bg-white px-4 pb-3 pt-[env(safe-area-inset-top)] text-[#285C43] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8DCC5] text-xs font-bold">
            WM
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Willians Marte</p>
            <p className="text-xs leading-tight text-[#5C6D63]">Sistema de Préstamos</p>
          </div>
        </div>
        <button
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#285C43] transition-colors hover:bg-[#F3FAF6]"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative h-dvh w-[260px] rounded-r-lg border border-l-0 border-[#DDEBE3] bg-white text-[#285C43]">
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-dvh rounded-r-lg border border-l-0 border-[#DDEBE3] bg-white text-[#285C43] transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[76px]' : 'w-[260px]',
        )}
      >
        {sidebarContent(collapsed)}
      </aside>
    </>
  );
}
