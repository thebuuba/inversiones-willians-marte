'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Home,
  Landmark,
  LogOut,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/prestamos', label: 'Préstamos', icon: Landmark },
  { href: '/caja', label: 'Caja', icon: Wallet },
  { href: '/inversionistas', label: 'Inversionistas', icon: TrendingUp },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initial = user?.name?.charAt(0) ?? 'A';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[300px] rounded-bl-lg border-r border-[#DDEBE3] bg-white text-[#285C43]">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-[#DDEBE3] px-6 pb-5 pt-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A9CDBB] text-lg font-bold text-white shadow-[0_10px_22px_rgba(169,205,187,0.32)]">
            WM
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold leading-tight text-[#285C43]">Willians Marte</h1>
            <p className="mt-1 truncate text-[15px] font-medium leading-tight text-[#5FA37D]">
              Sistema de Préstamos
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-hidden px-4 py-6">
          <p className="mb-4 px-4 text-xs font-bold uppercase tracking-wide text-[#A9CDBB]">
            Menú
          </p>
          <div className="space-y-2.5">
            {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex h-11 items-center gap-4 rounded-full px-4 text-[17px] font-medium transition-colors',
                      active
                        ? 'bg-[#E2F3E8] text-[#285C43]'
                        : 'text-[#5FA37D] hover:bg-[#F3FAF6]',
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#5FA37D]" />
                    )}
                    <Icon
                      className={cn('h-5 w-5 shrink-0', active ? 'text-[#285C43]' : 'text-[#A9CDBB]')}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                );
              })}
          </div>
        </nav>

        <div className="border-t border-[#DDEBE3] px-4 pb-5 pt-4">
          <div className="mb-4 flex items-center gap-4 rounded-[24px] bg-[#F3FAF6] px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A9CDBB] text-base font-bold text-white shadow-[0_8px_18px_rgba(169,205,187,0.3)]">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold leading-tight text-[#285C43]">
                {user?.name ?? 'Administrador'}
              </p>
              <p className="mt-1 truncate text-[14px] leading-tight text-[#A9CDBB]">
                {user?.email ?? 'admin@empresa.com'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex h-10 w-full items-center gap-4 px-4 text-left text-[17px] font-medium text-[#5FA37D] transition-colors hover:text-[#285C43]"
          >
            <LogOut className="h-5 w-5 text-[#A9CDBB]" strokeWidth={2} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
