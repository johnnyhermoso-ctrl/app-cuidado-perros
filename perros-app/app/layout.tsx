import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Perros App',
  description: 'Gestión para cuidador de perros'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="header">
          <div className="container row-between">
            <div>
              <strong>Perros App</strong>
              <div className="muted">Gestión para cuidador de perros</div>
            </div>
            <nav className="nav">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/calendario">Calendario</Link>
              <Link href="/reservas">Reservas</Link>
              <Link href="/clientes">Clientes</Link>
              <Link href="/perros">Perros</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  )
}
