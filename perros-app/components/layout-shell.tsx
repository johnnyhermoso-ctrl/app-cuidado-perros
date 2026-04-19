'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/utils';
import type { ReactNode } from 'react';

const items = [
  { href: '/', label: 'Inicio' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/reservas', label: 'Reservas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/perros', label: 'Perros' }
];

export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/" className="brand">Perros App</Link>
          <p className="brand-subtitle">Gestión para cuidador de perros</p>
        </div>
        <nav className="nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('nav-link', pathname === item.href && 'nav-link-active')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
