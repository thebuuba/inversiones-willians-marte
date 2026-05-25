'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BriefcaseBusiness,
  FileText,
  HandCoins,
  Home,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: Home, roles: ['ADMIN', 'MANAGER', 'COLLECTOR', 'VIEWER'] },
  { href: '/inversionistas', label: 'Inversionistas', icon: BriefcaseBusiness, roles: ['ADMIN', 'MANAGER'] },
  { href: '/caja', label: 'Caja', icon: Banknote, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/prestamos', label: 'Préstamos', icon: HandCoins, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/documentos', label: 'Documentos', icon: FileText, roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white">
      <div className="flex h-full flex-col">
        <div className="px-6 py-6 border-b border-gray-800">
          <h1 className="text-lg font-bold">Willians Marte</h1>
          <p className="text-sm text-gray-400">Sistema de Préstamos</p>
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
