import './globals.css';
import type { Metadata } from 'next';
import { LayoutShell } from '@/components/layout-shell';

export const metadata: Metadata = {
  title: 'Perros App',
  description: 'Gestión para cuidador de perros'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
