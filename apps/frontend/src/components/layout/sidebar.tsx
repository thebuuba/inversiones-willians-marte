'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'MANAGER', 'COLLECTOR', 'VIEWER'] },
  { href: '/clients', label: 'Clientes', icon: '👥', roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/loans', label: 'Préstamos', icon: '💰', roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/payments', label: 'Cobros', icon: '💵', roles: ['ADMIN', 'MANAGER', 'COLLECTOR'] },
  { href: '/users', label: 'Usuarios', icon: '🔐', roles: ['ADMIN'] },
  { href: '/reports', label: 'Reportes', icon: '📈', roles: ['ADMIN', 'MANAGER'] },
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
            .map((item) => (
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
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
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
