import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inversiones Willians Marte',
    short_name: 'Inversiones',
    description: 'Sistema de gestión de préstamos, caja e inversionistas.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#0d7d55',
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
