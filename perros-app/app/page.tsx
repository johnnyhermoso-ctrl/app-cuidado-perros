import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export default function HomePage() {
  return (
    <div>
      <PageHeader title="Inicio" description="Base de la aplicación de gestión para cuidador de perros." />
      <section className="hero">
        <h1>Fase 2: reservas reales conectadas a Supabase</h1>
        <p>
          Esta versión ya permite gestionar clientes, perros con foto y reservas reales. El siguiente bloque natural será
          añadir cálculo económico de alojamiento, check-in/check-out y cobros conectados.
        </p>
        <div className="quickLinks">
          <Link className="quickLink" href="/dashboard">Ir al dashboard</Link>
          <Link className="quickLink" href="/clientes">Gestionar clientes</Link>
          <Link className="quickLink" href="/perros">Gestionar perros</Link>
          <Link className="quickLink" href="/reservas">Crear reservas</Link>
        </div>
      </section>
    </div>
  );
}
