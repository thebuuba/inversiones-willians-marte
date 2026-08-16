'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Calendar,
  ChevronsUpDown,
  FileText,
  Home,
  Inbox,
  Landmark,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { navItems } from '@/components/ui/visual-system';
import { NotificationCenter } from '@/components/layout/notification-center';

const navIconMap = {
  briefcase: Briefcase,
  calendar: Calendar,
  'file-text': FileText,
  home: Home,
  inbox: Inbox,
  landmark: Landmark,
  'receipt-text': ReceiptText,
  settings: Settings,
  'trending-up': TrendingUp,
  users: Users,
  wallet: Wallet,
} satisfies Record<(typeof navItems)[number]['icon'], LucideIcon>;

const navGroups = [
  { label: 'OPERACIÓN', hrefs: ['/inicio', '/clientes', '/prestamos', '/solicitudes'] },
  { label: 'FINANZAS', hrefs: ['/caja', '/inversionistas', '/carteras'] },
  { label: 'GENERAL', hrefs: ['/agenda', '/recibos', '/documentos'] },
] as const;

const settingsItem = navItems.find((item) => item.href === '/configuracion');

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: () => void;
}

function getNavItem(href: string) {
  return navItems.find((item) => item.href === href);
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'N';

  function NavLink({
    href,
    label,
    icon,
    compact,
    onClick,
  }: {
    href: string;
    label: string;
    icon: (typeof navItems)[number]['icon'];
    compact: boolean;
    onClick?: () => void;
  }) {
    const Icon = navIconMap[icon];
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        aria-label={compact ? label : undefined}
        className={cn(
          'group/sidebar-item relative flex items-center rounded-[12px] transition-colors duration-150',
          compact ? 'mx-auto h-10 w-10 justify-center p-0' : 'gap-3 px-3 py-2.5 text-sm',
          active
            ? 'bg-primary-soft font-bold text-text-primary'
            : 'text-text-secondary hover:bg-page hover:text-text-primary',
        )}
        href={href}
        onClick={onClick}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
            active ? 'text-primary' : 'text-current',
          )}
          strokeWidth={2}
        />
        <span
          className={cn(
            'min-w-0 truncate transition-opacity duration-150',
            compact ? 'pointer-events-none absolute opacity-0' : 'opacity-100',
          )}
        >
          {label}
        </span>
        {compact && (
          <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 -translate-x-1 rounded-[8px] border border-border-soft bg-surface-elevated px-2.5 py-1.5 text-xs font-semibold text-text-primary opacity-0 shadow-card transition duration-100 ease-out group-hover/sidebar-item:translate-x-0 group-hover/sidebar-item:opacity-100">
            {label}
          </span>
        )}
      </Link>
    );
  }

  const sidebarContent = (compact = false) => (
    <div className="flex h-full flex-col bg-card font-sans text-text-primary">
      <header
        className={cn(
          'flex shrink-0',
          compact ? 'flex-col items-center gap-3 px-3 py-5' : 'items-center gap-3 px-5 py-5',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          WM
        </div>
        <div
          className={cn(
            'min-w-0 flex-1 transition-opacity duration-150',
            compact && 'hidden opacity-0',
          )}
        >
          <h1 className="whitespace-nowrap text-base font-bold leading-tight text-text-primary">
            Willians Marte
          </h1>
          <p className="mt-0.5 whitespace-nowrap text-xs leading-tight text-text-secondary">
            Sistema de Préstamos
          </p>
        </div>
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-text-secondary transition-colors duration-150 hover:bg-page hover:text-text-primary"
          onClick={onCollapsedChange}
          type="button"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="sidebar-toggle-icon h-4 w-4 opacity-80 grayscale"
            height={16}
            src={collapsed ? '/icons/sidebar-derecho.png' : '/icons/sidebar-izquierdo.png'}
            width={16}
          />
        </button>
      </header>

      <nav
        className={cn('flex-1 pb-5', compact ? 'overflow-visible px-3' : 'overflow-y-auto px-4')}
        aria-label="Navegación principal"
      >
        {navGroups.map((group, groupIndex) => (
          <section key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
            {compact ? (
              groupIndex > 0 && <div className="mx-auto mb-4 h-px w-6 bg-border-soft" />
            ) : (
              <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.14em] text-text-secondary/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.hrefs.map((href) => {
                const item = getNavItem(href);
                if (!item) return null;
                return (
                  <NavLink
                    key={item.href}
                    compact={compact}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => setMobileOpen(false)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <footer
        className={cn('shrink-0 border-t border-border-soft py-4', compact ? 'px-3' : 'px-4')}
      >
        {settingsItem && (
          <NavLink
            compact={compact}
            href={settingsItem.href}
            icon={settingsItem.icon}
            label={settingsItem.label}
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="relative mt-4">
          {profileOpen && (
            <div
              className={cn(
                'absolute rounded-[12px] border border-border-soft bg-card p-2 shadow-[0_14px_34px_rgba(40,92,67,0.12)]',
                compact ? 'bottom-0 left-[calc(100%+10px)] w-44' : 'bottom-[58px] left-0 right-0',
              )}
            >
              <button
                className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-sm font-semibold text-text-secondary transition-colors duration-150 hover:bg-page hover:text-text-primary"
                onClick={logout}
                type="button"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          )}
          <button
            aria-label={compact ? `Perfil de ${user?.name ?? 'Nata'}` : undefined}
            className={cn(
              'flex w-full items-center rounded-[12px] text-left transition-colors duration-150 hover:bg-page',
              compact ? 'h-10 justify-center p-0' : 'gap-3 p-2',
            )}
            onClick={() => setProfileOpen((open) => !open)}
            type="button"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-sm font-bold text-white">
              {initial}
            </div>
            <div
              className={cn(
                'min-w-0 flex-1 transition-opacity duration-150',
                compact && 'hidden opacity-0',
              )}
            >
              <p className="truncate text-sm font-bold leading-tight text-text-primary">
                {user?.name ?? 'Nata'}
              </p>
              <p className="mt-0.5 truncate text-xs leading-tight text-text-secondary">
                {user?.username ?? user?.email ?? 'nata'}
              </p>
            </div>
            <ChevronsUpDown
              aria-hidden="true"
              className={cn(
                'h-4 w-4 shrink-0 text-text-secondary transition-opacity duration-150',
                compact && 'hidden opacity-0',
              )}
              strokeWidth={2}
            />
          </button>
        </div>
      </footer>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] items-end justify-between border-b border-border-soft bg-card px-4 pb-3 pt-[env(safe-area-inset-top)] text-text-primary lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            WM
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Willians Marte</p>
            <p className="text-xs leading-tight text-text-secondary">Sistema de Préstamos</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationCenter />
          <button
            aria-label="Abrir menú"
            className="flex h-11 w-11 items-center justify-center rounded-[8px] text-text-secondary transition-colors duration-150 hover:bg-page hover:text-text-primary"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative h-dvh w-[260px] border-r border-border-soft bg-card pb-[env(safe-area-inset-bottom)]">
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-dvh overflow-visible border-r border-border-soft bg-card transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {sidebarContent(collapsed)}
      </aside>
    </>
  );
}
