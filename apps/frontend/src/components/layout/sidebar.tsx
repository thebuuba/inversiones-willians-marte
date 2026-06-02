'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
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
import { navItems } from '@/components/ui/visual-system';

const navIconMap = {
  bell: Bell,
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const initial = user?.name?.charAt(0) ?? 'A';

  useEffect(() => {
    getRequestsCount('PENDING').then(setPendingCount).catch(() => {});
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3.5 px-6 pb-7 pt-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8DCC5] text-sm font-bold text-[#285C43]">
          WM
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-tight text-[#285C43]">Willians Marte</h1>
          <p className="mt-1 truncate text-[13px] leading-tight text-[#6F8076]">
            Sistema de Préstamos
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-hidden px-4">
        <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.32em] text-[#A9B8AE]">
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
                className={cn(
                  'relative flex h-10 items-center gap-3.5 rounded-[16px] px-3 text-[15px] font-medium transition-colors',
                  active
                    ? 'bg-[#E7F4EC] text-[#285C43]'
                    : 'text-[#5C6D63] hover:bg-[#F3FAF6]',
                )}
              >
                <Icon
                  className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-[#5FA37D]' : 'text-[#8CA096]')}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.href === '/solicitudes' && pendingCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FFE3D2] px-1.5 text-xs font-bold text-[#C96F4A]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative border-t border-[#DDEBE3] px-6 py-5">
        {profileOpen && (
          <div className="absolute bottom-[78px] left-6 right-6 rounded-[16px] border border-[#DDEBE3] bg-white p-2 shadow-[0_14px_34px_rgba(40,92,67,0.12)]">
            <button
              onClick={logout}
              className="flex h-10 w-full items-center gap-2.5 rounded-[12px] px-3 text-left text-sm font-semibold text-[#5FA37D] transition-colors hover:bg-[#F3FAF6] hover:text-[#285C43]"
              type="button"
            >
              <LogOut className="h-4 w-4 text-[#8CA096]" strokeWidth={2} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
        <button
          onClick={() => setProfileOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-[18px] px-0 py-0 text-left transition-opacity hover:opacity-90"
          type="button"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4EC] text-sm font-bold text-[#285C43]">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight text-[#285C43]">
              {user?.name ?? 'Administrador'}
            </p>
            <p className="mt-1 truncate text-[13px] leading-tight text-[#7E9086]">
              {user?.username ?? user?.email ?? 'admin'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#DDEBE3] bg-white px-4 text-[#285C43] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8DCC5] text-xs font-bold">
            WM
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Willians Marte</p>
            <p className="text-xs leading-tight text-[#6F8076]">Sistema de Préstamos</p>
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
          <aside className="relative h-screen w-[260px] rounded-r-lg border border-l-0 border-[#DDEBE3] bg-white text-[#285C43]">
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] rounded-r-lg border border-l-0 border-[#DDEBE3] bg-white text-[#285C43] lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
