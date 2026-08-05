import './globals.css';
import { AppShell } from '@/components/AppShell';
import { AuthGate } from '@/components/AuthGate';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Perros App',
  description: 'Gestión de clientes, perros y reservas',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Perros App' },
  icons: { icon: '/app-icon.svg', apple: '/app-icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#101828',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
