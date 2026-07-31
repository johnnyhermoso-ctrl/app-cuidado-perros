import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export default function HomePage() {
  return (
    <div>
      <PageHeader title="Inicio" description="Gestión diaria del servicio de cuidado canino." />
      <section className="hero">
        <h1>Todo el negocio en un mismo lugar</h1>
        <p>
          Consulta la actividad, registra clientes y perros, y organiza las próximas reservas desde un panel sencillo.
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
