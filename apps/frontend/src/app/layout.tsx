import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inversiones Willians Marte',
  description: 'Sistema de Gestión de Préstamos',
  applicationName: 'Inversiones',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Inversiones',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2f7654',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
