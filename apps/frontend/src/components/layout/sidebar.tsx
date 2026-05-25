'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BriefcaseBusiness,
  FileText,
  FilePlus,
  HandCoins,
  Home,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: Home, roles: ['ADMIN', 'MANAGER', 'COLLECTOR', 'VIEWER'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/solicitudes', label: 'Solicitudes', icon: FilePlus, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/prestamos', label: 'Préstamos', icon: HandCoins, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/caja', label: 'Caja', icon: Banknote, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/inversionistas', label: 'Inversionistas', icon: BriefcaseBusiness, roles: ['ADMIN', 'MANAGER'] },
  { href: '/documentos', label: 'Documentos', icon: FileText, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-brand-950 text-ink-inverse shadow-xl shadow-brand-950/20">
      <div className="flex h-full flex-col">
        <div className="border-b border-brand-900 px-6 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-700">
            WM
          </div>
          <h1 className="text-lg font-bold">Willians Marte</h1>
          <p className="text-sm text-brand-200">Sistema de Préstamos</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.roles.includes(user?.role ?? ''))
            .map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-brand-600 text-ink-inverse'
                      : 'text-brand-100 hover:bg-brand-900 hover:text-ink-inverse',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="border-t border-brand-900 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="truncate text-xs text-brand-200">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-brand-200 transition-colors hover:text-ink-inverse"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
