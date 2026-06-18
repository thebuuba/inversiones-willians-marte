import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inversiones Willians Marte',
    short_name: 'Inversiones',
    description: 'Sistema de gestión de préstamos, caja e inversionistas.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    background_color: '#F3F4F6',
    theme_color: '#2f7654',
    orientation: 'portrait',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
