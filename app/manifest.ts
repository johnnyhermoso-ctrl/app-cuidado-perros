import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Perros App',
    short_name: 'Perros',
    description: 'Gestión del alojamiento y cuidado de perros',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f7fb',
    theme_color: '#101828',
    orientation: 'portrait-primary',
    icons: [{ src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
