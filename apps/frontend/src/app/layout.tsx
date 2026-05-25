import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inversiones Willians Marte',
  description: 'Sistema de Gestión de Préstamos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </>
  );
}
